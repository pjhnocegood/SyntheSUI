module sui_lending_protocol::short_position_simple {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::table::{Self, Table};

    // Shared short position manager
    public struct ShortPositionManager has key {
        id: UID,
        total_shorted: u64,
        short_balance: Balance<SUI>,
        positions: Table<address, ShortPosition>
    }

    public struct ShortPosition has store, drop {
        amount: u64,
        entry_price: u64,
        pnl: u64, // profit and loss
        is_profit: bool
    }

    fun init(ctx: &mut TxContext) {
        let manager = ShortPositionManager {
            id: object::new(ctx),
            total_shorted: 0,
            short_balance: balance::zero<SUI>(),
            positions: table::new<address, ShortPosition>(ctx)
        };
        transfer::share_object(manager);
    }

    // Open short position
    public entry fun open_short(
        manager: &mut ShortPositionManager,
        collateral: Coin<SUI>,
        entry_price: u64,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&collateral);
        let sender = tx_context::sender(ctx);

        if (!table::contains(&manager.positions, sender)) {
            table::add(&mut manager.positions, sender, ShortPosition {
                amount: 0,
                entry_price: 0,
                pnl: 0,
                is_profit: true
            });
        };

        let position = table::borrow_mut(&mut manager.positions, sender);
        position.amount = position.amount + amount;
        position.entry_price = entry_price;

        let collateral_balance = coin::into_balance(collateral);
        balance::join(&mut manager.short_balance, collateral_balance);
        manager.total_shorted = manager.total_shorted + amount;
    }

    // Close short position
    public entry fun close_short(
        manager: &mut ShortPositionManager,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&manager.positions, sender), 1);

        let position = table::borrow_mut(&mut manager.positions, sender);
        assert!(position.amount >= amount, 2);

        position.amount = position.amount - amount;
        manager.total_shorted = manager.total_shorted - amount;

        let withdrawn = coin::take(&mut manager.short_balance, amount, ctx);
        transfer::public_transfer(withdrawn, sender);
    }

    // Get position info
    public fun get_position(manager: &ShortPositionManager, user: address): (u64, u64) {
        if (table::contains(&manager.positions, user)) {
            let position = table::borrow(&manager.positions, user);
            (position.amount, position.entry_price)
        } else {
            (0, 0)
        }
    }

    // Get total shorted
    public fun get_total_shorted(manager: &ShortPositionManager): u64 {
        manager.total_shorted
    }
}