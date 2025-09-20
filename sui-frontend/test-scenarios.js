// Test scenarios for Sui Lending Protocol

// Test 1: Decimal precision validation
console.log("=== Test 1: Decimal Precision ===");

// Import decimal utils
const { TokenAmount, suiToMist, mistToSui, susdToSmallest, calculateMaxWithGasReserve } = require('./lib/decimal-utils');

// Test SUI to MIST conversion
const testAmounts = ['0.001', '0.123456789', '1000.999999999', '0.000000001'];

testAmounts.forEach(amount => {
  const mist = suiToMist(amount);
  const backToSui = mistToSui(mist);
  console.log(`SUI: ${amount} -> MIST: ${mist} -> Back: ${backToSui}`);

  // Verify precision preserved
  const original = new TokenAmount(amount, 9);
  const converted = new TokenAmount(mist, 9);
  console.log(`Precision check: ${original.toDecimal()} === ${converted.toDecimal()}`);
});

// Test 2: Gas reserve calculation
console.log("\n=== Test 2: Gas Reserve ===");

const balances = ['0.005', '0.01', '0.5', '1', '100'];
const gasReserve = '0.01';

balances.forEach(balance => {
  const maxAmount = calculateMaxWithGasReserve(balance, gasReserve);
  console.log(`Balance: ${balance} SUI -> Max after gas: ${maxAmount} SUI`);
});

// Test 3: LTV and Health Factor calculations
console.log("\n=== Test 3: LTV and Health Factor ===");

const scenarios = [
  { collateral: 100, collateralValue: 50, debt: 0 },
  { collateral: 100, collateralValue: 50, debt: 10 },
  { collateral: 100, collateralValue: 50, debt: 25 },
  { collateral: 100, collateralValue: 50, debt: 37.5 },
  { collateral: 100, collateralValue: 50, debt: 40 },
];

scenarios.forEach(({ collateral, collateralValue, debt }) => {
  const ltv = collateralValue > 0 ? (debt / collateralValue) * 100 : 0;
  const healthFactor = debt > 0 ? (collateralValue * 100) / debt : 100;
  const maxBorrow = Math.max(0, (collateralValue * 0.5) - debt);

  console.log(`Collateral: ${collateral} SUI ($${collateralValue}), Debt: $${debt}`);
  console.log(`  LTV: ${ltv.toFixed(1)}%, Health: ${healthFactor.toFixed(0)}%, Max Borrow: $${maxBorrow}`);
  console.log(`  Status: ${healthFactor < 75 ? '🔴 LIQUIDATABLE' : healthFactor < 100 ? '🟡 AT RISK' : '🟢 HEALTHY'}`);
});

// Test 4: Edge cases
console.log("\n=== Test 4: Edge Cases ===");

// Test very small amounts
try {
  const tinyAmount = new TokenAmount('0.000000001', 9);
  console.log(`Tiny amount: ${tinyAmount.toDecimal()} SUI = ${tinyAmount.toSmallestUnit()} MIST`);
} catch (e) {
  console.error(`Tiny amount error: ${e.message}`);
}

// Test very large amounts
try {
  const hugeAmount = new TokenAmount('999999999.999999999', 9);
  console.log(`Huge amount: ${hugeAmount.toDecimal()} SUI = ${hugeAmount.toSmallestUnit()} MIST`);
} catch (e) {
  console.error(`Huge amount error: ${e.message}`);
}

// Test zero
try {
  const zero = new TokenAmount('0', 9);
  console.log(`Zero: ${zero.isZero()} (should be true)`);
} catch (e) {
  console.error(`Zero test error: ${e.message}`);
}

// Test negative (should fail)
try {
  const negative = new TokenAmount('-1', 9);
  console.log(`Negative: ${negative.toDecimal()} (should not reach here)`);
} catch (e) {
  console.log(`Negative correctly rejected: ${e.message}`);
}

console.log("\n=== All Tests Completed ===");