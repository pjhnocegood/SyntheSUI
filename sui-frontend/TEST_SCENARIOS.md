# Sui Lending Protocol - Test Scenarios

## Current Status
- ✅ Frontend running at http://localhost:3001
- ✅ Mock contract addresses configured
- ⏳ Awaiting testnet SUI from faucet for actual deployment
- ✅ UI components ready for testing

## Mock Contract Addresses (Configured)
```
PACKAGE_ID: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
LENDING_POOL: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
STABLECOIN_TREASURY: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
PRICE_ORACLE: 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
STAKING_MANAGER: 0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
SHORT_POSITION_MANAGER: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
```

## UI Test Scenarios (Can Test Now)

### 1. Wallet Connection
- Open http://localhost:3001
- Click "Connect Wallet" button
- Verify Sui Wallet extension opens
- Check wallet address displays correctly after connection

### 2. Deposit Panel
- ✅ Input validation (min 0.001 SUI)
- ✅ MAX button reserves 0.01 SUI for gas
- ✅ Real-time collateral value calculation
- ✅ BigInt precision for all calculations
- ⚠️ Transaction will fail without deployed contracts

### 3. Borrow Panel
- ✅ Borrow limit calculation (50% LTV)
- ✅ Health factor display
- ✅ Input validation (min 0.01 SUSD)
- ✅ Available to borrow updates based on deposits
- ⚠️ Transaction will fail without deployed contracts

### 4. Repay Panel
- ✅ Outstanding loan display
- ✅ Interest calculation visualization
- ✅ MAX button functionality
- ✅ Loan reduction calculation
- ⚠️ Transaction will fail without deployed contracts

### 5. Withdraw Panel
- ✅ Available to withdraw calculation
- ✅ Health factor protection
- ✅ MAX button with safety checks
- ✅ Withdrawal limit based on loans
- ⚠️ Transaction will fail without deployed contracts

## Critical Issues Fixed
1. ✅ Contract address configuration centralized
2. ✅ Precision loss eliminated with BigInt utilities
3. ✅ Environment variables unified
4. ✅ Gas reserve implemented (0.01 SUI)

## Remaining Issues to Address
1. ⚠️ Slippage protection not implemented
2. ⚠️ Interest rate calculation needs verification
3. ⚠️ Liquidation mechanics UI missing
4. ⚠️ Error boundaries not comprehensive

## Once Testnet SUI Available

### Deployment Steps
```bash
# 1. Build contracts
cd /Users/noname/WebstormProjects/sui
sui move build

# 2. Deploy (once faucet accessible)
sui client publish --gas-budget 100000000

# 3. Update .env with actual addresses
# Copy deployed addresses to /Users/noname/WebstormProjects/sui-lending-frontend/.env

# 4. Restart Next.js server
cd /Users/noname/WebstormProjects/sui-lending-frontend
npm run dev
```

### End-to-End Test Flow
1. **Deposit Test**
   - Deposit 1 SUI
   - Verify pool balance update
   - Check 50% to staking, 50% to shorts

2. **Borrow Test**
   - Borrow 250 SUSD (50% of 500 SUSD collateral value)
   - Verify loan position creation
   - Check health factor calculation

3. **Repay Test**
   - Repay 100 SUSD
   - Verify loan reduction
   - Check updated borrowing capacity

4. **Withdraw Test**
   - Withdraw 0.5 SUI
   - Verify health factor maintenance
   - Check position updates

## Monitoring Points
- Gas usage per transaction type
- Transaction confirmation times
- Error handling for failed transactions
- State synchronization delays

## Current Blockers
1. Faucet rate limiting (429 errors)
   - Tried addresses:
     - 0xa6d8a16671ab9ca6a8845e774aa65408ac48c8c45640dca7af3160505c62c263
     - 0x5706cf7879c8dfe4bee60d87245287e7a9e97cc38bc18817ddc05dca5d86ac6c
   - Need to wait for rate limit reset or use web UI

## Next Steps
1. Wait for faucet access (rate limit reset)
2. Deploy smart contracts to testnet
3. Update frontend with actual contract addresses
4. Execute full end-to-end testing
5. Document any new issues found during testing