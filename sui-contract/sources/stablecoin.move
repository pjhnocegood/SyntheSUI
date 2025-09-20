module sui_lending_protocol::stablecoin_simple {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Supply};

    // One-time witness - must match module name in uppercase
    public struct STABLECOIN_SIMPLE has drop {}

    // The stablecoin type
    public struct SUSD has drop {}

    // Shared treasury for minting/burning
    public struct Treasury has key {
        id: UID,
        supply: Supply<SUSD>
    }

    fun init(_witness: STABLECOIN_SIMPLE, ctx: &mut TxContext) {
        // Create supply for SUSD
        let susd_witness = SUSD {};

        // Create treasury
        let treasury = Treasury {
            id: object::new(ctx),
            supply: balance::create_supply(susd_witness)
        };

        transfer::share_object(treasury);
    }

    // Mint new SUSD
    public fun mint(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUSD> {
        let balance = balance::increase_supply(&mut treasury.supply, amount);
        coin::from_balance(balance, ctx)
    }

    // Burn SUSD
    public fun burn(
        treasury: &mut Treasury,
        coin: Coin<SUSD>
    ) {
        let balance = coin::into_balance(coin);
        balance::decrease_supply(&mut treasury.supply, balance);
    }

    // Get total supply
    public fun total_supply(treasury: &Treasury): u64 {
        balance::supply_value(&treasury.supply)
    }

    // Transfer helper
    public entry fun transfer(
        coin: Coin<SUSD>,
        recipient: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(coin, recipient);
    }
}