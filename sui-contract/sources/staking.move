module sui_lending_protocol::staking_simple {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::table::{Self, Table};

    // Constants
    const APY: u64 = 500; // 5%
    const PRECISION: u64 = 10000;

    // Shared staking manager
    public struct StakingManager has key {
        id: UID,
        total_staked: u64,
        staked_balance: Balance<SUI>,
        total_rewards: u64,
        stakes: Table<address, StakeInfo>
    }

    public struct StakeInfo has store, drop {
        amount: u64,
        reward_debt: u64,
        last_stake_time: u64
    }

    fun init(ctx: &mut TxContext) {
        let manager = StakingManager {
            id: object::new(ctx),
            total_staked: 0,
            staked_balance: balance::zero<SUI>(),
            total_rewards: 0,
            stakes: table::new<address, StakeInfo>(ctx)
        };
        transfer::share_object(manager);
    }

    // Stake SUI
    public entry fun stake_sui(
        manager: &mut StakingManager,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&stake);
        let sender = tx_context::sender(ctx);

        if (!table::contains(&manager.stakes, sender)) {
            table::add(&mut manager.stakes, sender, StakeInfo {
                amount: 0,
                reward_debt: 0,
                last_stake_time: 0
            });
        };

        let stake_info = table::borrow_mut(&mut manager.stakes, sender);
        stake_info.amount = stake_info.amount + amount;

        let stake_balance = coin::into_balance(stake);
        balance::join(&mut manager.staked_balance, stake_balance);
        manager.total_staked = manager.total_staked + amount;
    }

    // Unstake SUI
    public entry fun unstake_sui(
        manager: &mut StakingManager,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&manager.stakes, sender), 1);

        let stake_info = table::borrow_mut(&mut manager.stakes, sender);
        assert!(stake_info.amount >= amount, 2);

        stake_info.amount = stake_info.amount - amount;
        manager.total_staked = manager.total_staked - amount;

        let withdrawn = coin::take(&mut manager.staked_balance, amount, ctx);
        transfer::public_transfer(withdrawn, sender);
    }

    // Get staked amount
    public fun get_staked_amount(manager: &StakingManager, user: address): u64 {
        if (table::contains(&manager.stakes, user)) {
            let stake_info = table::borrow(&manager.stakes, user);
            stake_info.amount
        } else {
            0
        }
    }

    // Get total staked
    public fun get_total_staked(manager: &StakingManager): u64 {
        manager.total_staked
    }
}