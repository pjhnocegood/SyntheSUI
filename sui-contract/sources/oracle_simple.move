module sui_lending_protocol::oracle_simple {
    use sui::object::{UID};
    use sui::tx_context::{TxContext};
    use sui::transfer;

    // Fixed SUI price in USD cents (128.11 USD = 12811 cents)
    const FIXED_SUI_PRICE_CENTS: u64 = 12811;

    // Price precision (2 decimal places)
    const PRICE_PRECISION: u64 = 100;

    // Oracle struct to store price data
    public struct PriceOracle has key {
        id: UID,
        sui_price_cents: u64, // Price in cents for precision
        last_updated: u64,
    }

    // Initialize oracle with fixed SUI price
    fun init(ctx: &mut TxContext) {
        let oracle = PriceOracle {
            id: sui::object::new(ctx),
            sui_price_cents: FIXED_SUI_PRICE_CENTS,
            last_updated: 0, // Will be set when first accessed
        };

        transfer::share_object(oracle);
    }

    // Get SUI price in USD cents
    public fun get_sui_price_cents(oracle: &PriceOracle): u64 {
        oracle.sui_price_cents
    }

    // Get SUI price in USD (with 2 decimal precision)
    public fun get_sui_price_usd(oracle: &PriceOracle): u64 {
        oracle.sui_price_cents / PRICE_PRECISION
    }

    // Get price precision constant
    public fun get_price_precision(): u64 {
        PRICE_PRECISION
    }

    // Calculate USD value for given SUI amount (in MIST)
    public fun calculate_usd_value(oracle: &PriceOracle, sui_amount_mist: u64): u64 {
        // Convert SUI MIST to SUI (divide by 1_000_000_000)
        // Then multiply by price in cents
        (sui_amount_mist * oracle.sui_price_cents) / 1_000_000_000
    }

    // Calculate USD value with decimals for given SUI amount (in MIST)
    public fun calculate_usd_value_with_decimals(oracle: &PriceOracle, sui_amount_mist: u64): (u64, u64) {
        let total_cents = calculate_usd_value(oracle, sui_amount_mist);
        let dollars = total_cents / PRICE_PRECISION;
        let cents = total_cents % PRICE_PRECISION;
        (dollars, cents)
    }

    // Admin function to update price (though we keep it fixed)
    public entry fun update_price(
        _oracle: &mut PriceOracle,
        _new_price_cents: u64,
        _ctx: &mut TxContext
    ) {
        // Keep price fixed - no actual update
        // This function exists for interface compatibility but doesn't change the price
    }

    // Calculate SUI amount for given USD value (in SUSD MIST units)
    public fun calculate_sui_amount_from_usd(oracle: &PriceOracle, usd_amount_mist: u64): u64 {
        // Convert SUSD MIST to USD cents: usd_amount_mist / 1_000_000_000 * 100
        let usd_cents = (usd_amount_mist * 100) / 1_000_000_000;
        // Convert USD cents to SUI MIST: usd_cents / price_cents * 1_000_000_000
        (usd_cents * 1_000_000_000) / oracle.sui_price_cents
    }

    // Get oracle info
    public fun get_oracle_info(oracle: &PriceOracle): (u64, u64) {
        (oracle.sui_price_cents, oracle.last_updated)
    }
}