module sui_lending_protocol::lending_pool_with_staking {
    use sui::object::{UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui_system::sui_system::{Self, SuiSystemState};
    use sui_system::staking_pool::StakedSui;
    use sui_lending_protocol::stablecoin_simple::{Self, Treasury, SUSD};
    use sui_lending_protocol::oracle_simple::{Self, PriceOracle};

    // Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_INVALID_AMOUNT: u64 = 2;
    const E_LOAN_EXCEEDS_LTV: u64 = 3;
    const E_INSUFFICIENT_COLLATERAL: u64 = 4;
    const E_NO_POSITION: u64 = 5;
    const E_NO_VALIDATOR: u64 = 6;

    // Constants
    const MAX_LTV: u64 = 50; // 50%
    const LIQUIDATION_THRESHOLD: u64 = 75; // 75%
    const PRECISION: u64 = 10000;
    const PROTOCOL_FEE_RATE: u64 = 1000; // 10% of staking rewards
    const DEFAULT_LONG_RATIO: u64 = 9000; // 90% long, 10% short

    // Enhanced lending pool with validator staking
    public struct LendingPoolWithStaking has key {
        id: UID,
        validator_address: address,
        total_deposits: u64,
        total_borrows: u64,
        staked_sui_objects: Table<address, StakedSui>, // user -> StakedSui object
        positions: Table<address, Position>,
        protocol_earnings: Balance<SUI>,
        long_ratio: u64, // Percentage allocated to long position (out of 10000)
        short_ratio: u64, // Percentage allocated to short position (out of 10000)
    }

    public struct Position has store, drop {
        deposited_amount: u64,
        borrowed_amount: u64,
        staking_start_epoch: u64,
        last_reward_epoch: u64,
    }

    // Pool creation event
    public struct PoolCreated has copy, drop {
        pool_id: ID,
        validator_address: address,
    }

    // Staking events
    public struct StakeDeposited has copy, drop {
        user: address,
        amount: u64,
        validator: address,
        epoch: u64,
    }

    public struct StakeWithdrawn has copy, drop {
        user: address,
        amount: u64,
        rewards: u64,
        epoch: u64,
    }

    // Initialize the lending pool with a default validator
    fun init(ctx: &mut TxContext) {
        // Using actual testnet validator address
        let default_validator = @0x44b1b319e23495995fc837dafd28fc6af8b645edddff0fc1467f1ad631362c23;

        let pool = LendingPoolWithStaking {
            id: sui::object::new(ctx),
            validator_address: default_validator,
            total_deposits: 0,
            total_borrows: 0,
            staked_sui_objects: table::new<address, StakedSui>(ctx),
            positions: table::new<address, Position>(ctx),
            protocol_earnings: balance::zero<SUI>(),
            long_ratio: DEFAULT_LONG_RATIO, // 90% long
            short_ratio: PRECISION - DEFAULT_LONG_RATIO, // 10% short
        };

        let pool_id = sui::object::id(&pool);

        sui::event::emit(PoolCreated {
            pool_id,
            validator_address: default_validator,
        });

        transfer::share_object(pool);
    }

    // Deposit SUI and allocate according to long/short ratio
    public entry fun deposit_and_stake_sui(
        pool: &mut LendingPoolWithStaking,
        treasury: &mut Treasury,
        oracle: &PriceOracle,
        sui_system: &mut SuiSystemState,
        deposit: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&deposit);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let sender = tx_context::sender(ctx);
        let current_epoch = tx_context::epoch(ctx);

        // Calculate allocation based on long/short ratio
        let long_amount = (amount * pool.long_ratio) / PRECISION;
        let _short_amount = amount - long_amount;

        // Split the deposit coin
        let mut deposit_balance = coin::into_balance(deposit);
        let long_balance = balance::split(&mut deposit_balance, long_amount);
        let short_balance = deposit_balance; // remaining amount for short

        // Create coin for long position staking
        let long_coin = coin::from_balance(long_balance, ctx);

        // Stake the long portion with the validator
        let staked_sui = sui_system::request_add_stake_non_entry(
            sui_system,
            long_coin,
            pool.validator_address,
            ctx
        );

        // Store the StakedSui object
        if (table::contains(&pool.staked_sui_objects, sender)) {
            // If user already has staked SUI, transfer existing stake back to user
            // and replace with new stake (simplified approach)
            let existing_staked = table::remove(&mut pool.staked_sui_objects, sender);
            transfer::public_transfer(existing_staked, sender);
        };

        // Store the new stake
        table::add(&mut pool.staked_sui_objects, sender, staked_sui);

        // Store short balance in protocol earnings for now (simplified)
        // In a real implementation, this would go to a separate short position manager
        balance::join(&mut pool.protocol_earnings, short_balance);

        // Update or create position
        if (!table::contains(&pool.positions, sender)) {
            table::add(&mut pool.positions, sender, Position {
                deposited_amount: 0,
                borrowed_amount: 0,
                staking_start_epoch: current_epoch,
                last_reward_epoch: current_epoch,
            });
        };

        let position = table::borrow_mut(&mut pool.positions, sender);
        position.deposited_amount = position.deposited_amount + amount;
        position.staking_start_epoch = current_epoch;

        // Calculate USD value of deposited SUI using oracle price
        let usd_value_cents = oracle_simple::calculate_usd_value(oracle, amount);
        // Convert cents to MIST (SUSD units) - 1 USD = 1,000,000,000 MIST
        let susd_amount = (usd_value_cents * 1_000_000_000) / 100;

        // Mint SUSD equivalent to the USD value of deposited SUI
        let susd_coin = stablecoin_simple::mint(treasury, susd_amount, ctx);

        // Transfer SUSD to user
        transfer::public_transfer(susd_coin, sender);

        // Update pool totals
        pool.total_deposits = pool.total_deposits + amount;

        sui::event::emit(StakeDeposited {
            user: sender,
            amount,
            validator: pool.validator_address,
            epoch: current_epoch,
        });
    }

    // Withdraw SUI by burning SUSD and unstaking from validator
    public entry fun unstake_and_withdraw_sui(
        pool: &mut LendingPoolWithStaking,
        treasury: &mut Treasury,
        oracle: &PriceOracle,
        sui_system: &mut SuiSystemState,
        susd_payment: Coin<SUSD>,
        ctx: &mut TxContext
    ) {
        let susd_amount = coin::value(&susd_payment);
        assert!(susd_amount > 0, E_INVALID_AMOUNT);

        let sender = tx_context::sender(ctx);

        // Burn the SUSD payment first
        stablecoin_simple::burn(treasury, susd_payment);
        let current_epoch = tx_context::epoch(ctx);

        assert!(table::contains(&pool.positions, sender), E_NO_POSITION);
        assert!(table::contains(&pool.staked_sui_objects, sender), E_NO_POSITION);

        let position = table::borrow_mut(&mut pool.positions, sender);

        // Get the user's original deposited amount (full withdrawal)
        let deposited_amount = position.deposited_amount;
        assert!(deposited_amount > 0, E_INSUFFICIENT_BALANCE);

        // For full withdrawal, check if user has any borrows (should be 0 for full withdrawal)
        assert!(position.borrowed_amount == 0, E_INSUFFICIENT_COLLATERAL);

        // Remove and unstake the StakedSui object
        let staked_sui = table::remove(&mut pool.staked_sui_objects, sender);

        // Request withdrawal from the validator
        let mut withdrawal_balance = sui_system::request_withdraw_stake_non_entry(
            sui_system,
            staked_sui,
            ctx
        );

        let total_withdrawn = balance::value(&withdrawal_balance);
        let original_stake = position.deposited_amount;
        let rewards = if (total_withdrawn > original_stake) {
            total_withdrawn - original_stake
        } else {
            0
        };

        // Calculate protocol fee from rewards
        let protocol_fee = (rewards * PROTOCOL_FEE_RATE) / PRECISION;
        let user_rewards = rewards - protocol_fee;

        // Split the balance
        if (protocol_fee > 0) {
            let protocol_balance = balance::split(&mut withdrawal_balance, protocol_fee);
            balance::join(&mut pool.protocol_earnings, protocol_balance);
        };

        // Remove position completely (full withdrawal)
        table::remove(&mut pool.positions, sender);
        pool.total_deposits = pool.total_deposits - deposited_amount;

        // Transfer the withdrawn SUI to user
        let withdrawn_coin = coin::from_balance(withdrawal_balance, ctx);
        transfer::public_transfer(withdrawn_coin, sender);

        sui::event::emit(StakeWithdrawn {
            user: sender,
            amount: deposited_amount,
            rewards: user_rewards,
            epoch: current_epoch,
        });
    }

    // Set validator address (admin function)
    public entry fun set_validator(
        pool: &mut LendingPoolWithStaking,
        validator_address: address,
        _ctx: &mut TxContext
    ) {
        pool.validator_address = validator_address;
    }

    // Set long/short ratio (admin function)
    public entry fun set_long_short_ratio(
        pool: &mut LendingPoolWithStaking,
        long_ratio: u64,
        _ctx: &mut TxContext
    ) {
        assert!(long_ratio <= PRECISION, E_INVALID_AMOUNT);
        pool.long_ratio = long_ratio;
        pool.short_ratio = PRECISION - long_ratio;
    }

    // Get user position including staking rewards estimation
    public fun get_position_with_rewards(
        pool: &LendingPoolWithStaking,
        user: address
    ): (u64, u64, u64, u64) {
        if (table::contains(&pool.positions, user)) {
            let position = table::borrow(&pool.positions, user);
            let estimated_rewards = estimate_staking_rewards(pool, user);
            (
                position.deposited_amount,
                position.borrowed_amount,
                position.staking_start_epoch,
                estimated_rewards
            )
        } else {
            (0, 0, 0, 0)
        }
    }

    // Estimate staking rewards (simplified calculation)
    fun estimate_staking_rewards(
        pool: &LendingPoolWithStaking,
        user: address
    ): u64 {
        if (!table::contains(&pool.staked_sui_objects, user)) {
            return 0
        };

        // This is a simplified estimation
        // In reality, you'd query the actual StakedSui object for current value
        // and compare it with the original stake amount
        0 // Placeholder
    }

    // Get pool statistics
    public fun get_pool_stats(pool: &LendingPoolWithStaking): (u64, u64, address, u64) {
        (
            pool.total_deposits,
            pool.total_borrows,
            pool.validator_address,
            balance::value(&pool.protocol_earnings)
        )
    }

    // Withdraw protocol earnings (admin function)
    public entry fun withdraw_protocol_earnings(
        pool: &mut LendingPoolWithStaking,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount <= balance::value(&pool.protocol_earnings), E_INSUFFICIENT_BALANCE);

        let earnings = coin::take(&mut pool.protocol_earnings, amount, ctx);
        transfer::public_transfer(earnings, recipient);
    }
}