module simple_oracle::simple_oracle {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;

    public struct Oracle has key {
        id: UID,
        price: u64,
    }

    fun init(ctx: &mut TxContext) {
        let oracle = Oracle {
            id: object::new(ctx),
            price: 500, // $5.00 initial price
        };
        transfer::share_object(oracle);
    }

    public fun get_price(oracle: &Oracle): u64 {
        oracle.price
    }

    public entry fun update_price(oracle: &mut Oracle, new_price: u64, _ctx: &mut TxContext) {
        oracle.price = new_price;
    }
}