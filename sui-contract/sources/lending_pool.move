module sui_lending_protocol::lending_pool_simple {
    use sui::object::{UID, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};

    // Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_INVALID_AMOUNT: u64 = 2;
    const E_LOAN_EXCEEDS_LTV: u64 = 3;
    const E_INSUFFICIENT_COLLATERAL: u64 = 4;
    const E_NO_POSITION: u64 = 5;

    // Constants
    const MAX_LTV: u64 = 50; // 50%
    const LIQUIDATION_THRESHOLD: u64 = 75; // 75%
    const PRECISION: u64 = 10000;

    // Shared lending pool
    public struct LendingPool has key {
        id: UID,
        total_deposits: u64,
        total_borrows: u64,
        sui_balance: Balance<SUI>,
        positions: Table<address, Position>
    }

    // User position
    public struct Position has store, drop {
        deposited_amount: u64,
        borrowed_amount: u64,
        last_update_timestamp: u64
    }

    fun init(ctx: &mut TxContext) {
        let pool = LendingPool {
            id: object::new(ctx),
            total_deposits: 0,
            total_borrows: 0,
            sui_balance: balance::zero<SUI>(),
            positions: table::new<address, Position>(ctx)
        };
        transfer::share_object(pool);
    }

    // Deposit SUI as collateral
    public entry fun deposit_sui(
        pool: &mut LendingPool,
        deposit: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&deposit);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let sender = tx_context::sender(ctx);

        // Update or create position
        if (!table::contains(&pool.positions, sender)) {
            table::add(&mut pool.positions, sender, Position {
                deposited_amount: 0,
                borrowed_amount: 0,
                last_update_timestamp: 0
            });
        };

        let position = table::borrow_mut(&mut pool.positions, sender);
        position.deposited_amount = position.deposited_amount + amount;

        // Add to pool balance
        let deposit_balance = coin::into_balance(deposit);
        balance::join(&mut pool.sui_balance, deposit_balance);
        pool.total_deposits = pool.total_deposits + amount;
    }

    // Withdraw SUI collateral
    public entry fun withdraw_sui(
        pool: &mut LendingPool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, E_INVALID_AMOUNT);

        let sender = tx_context::sender(ctx);
        assert!(table::contains(&pool.positions, sender), E_NO_POSITION);

        let position = table::borrow_mut(&mut pool.positions, sender);
        assert!(position.deposited_amount >= amount, E_INSUFFICIENT_BALANCE);

        // Check health factor after withdrawal
        let new_deposited = position.deposited_amount - amount;
        if (position.borrowed_amount > 0) {
            let max_borrow = (new_deposited * MAX_LTV) / PRECISION;
            assert!(position.borrowed_amount <= max_borrow, E_INSUFFICIENT_COLLATERAL);
        };

        position.deposited_amount = new_deposited;
        pool.total_deposits = pool.total_deposits - amount;

        // Transfer SUI to user
        let withdrawn = coin::take(&mut pool.sui_balance, amount, ctx);
        transfer::public_transfer(withdrawn, sender);
    }

    // Get user position
    public fun get_position(pool: &LendingPool, user: address): (u64, u64) {
        if (table::contains(&pool.positions, user)) {
            let position = table::borrow(&pool.positions, user);
            (position.deposited_amount, position.borrowed_amount)
        } else {
            (0, 0)
        }
    }

    // Get pool stats
    public fun get_pool_stats(pool: &LendingPool): (u64, u64) {
        (pool.total_deposits, pool.total_borrows)
    }
}