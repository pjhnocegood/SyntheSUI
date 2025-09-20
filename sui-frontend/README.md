# SUI Lending Protocol Frontend

Next.js frontend application for the SUI Lending Protocol.

## Features

- 💰 **Deposit SUI**: Deposit SUI as collateral (automatically split 50/50 for staking and shorting)
- 🏦 **Borrow Stablecoins**: Borrow up to 50% of collateral value in SUSD
- 💳 **Repay Loans**: Repay borrowed stablecoins to unlock collateral
- 📤 **Withdraw**: Withdraw collateral after loan repayment
- 📊 **Position Dashboard**: Real-time position monitoring with health factor
- 🔗 **Wallet Integration**: Seamless SUI wallet connection

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **@mysten/dapp-kit**: SUI wallet integration
- **@mysten/sui**: SUI SDK for blockchain interaction

## Getting Started

### Prerequisites

- Node.js 18+ installed
- SUI wallet extension (Sui Wallet, Suiet, etc.)
- Deployed SUI lending protocol contracts

### Installation

1. Install dependencies:
```bash
npm install
```

2. Update contract addresses in `lib/constants.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  PACKAGE_ID: 'YOUR_PACKAGE_ID',
  LENDING_POOL: 'YOUR_LENDING_POOL_ID',
  // ... other addresses
}
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
sui-lending-frontend/
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Main lending interface
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── DepositPanel.tsx
│   ├── BorrowPanel.tsx
│   ├── RepayPanel.tsx
│   ├── WithdrawPanel.tsx
│   ├── PositionDashboard.tsx
│   └── WalletButton.tsx
├── hooks/           # Custom React hooks
│   └── useLendingProtocol.ts
└── lib/             # Utilities and constants
    ├── constants.ts
    └── sui-client.ts
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your SUI wallet
2. **Deposit**: Enter amount of SUI to deposit as collateral
3. **Borrow**: Borrow up to 50% of collateral value in stablecoins
4. **Monitor**: Watch your position health in the dashboard
5. **Repay**: Repay borrowed stablecoins when ready
6. **Withdraw**: Withdraw collateral after full repayment

## Key Features

### Automatic Asset Management
- **50% Staking**: Half of deposits automatically staked for 5% APY
- **50% Shorting**: Half used for short positions (hedging)

### Risk Management
- **Max LTV**: 50% maximum loan-to-value ratio
- **Health Factor**: Real-time position health monitoring
- **Liquidation**: Automatic liquidation at 75% threshold

### User Interface
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Position data refreshes automatically
- **Tab Navigation**: Easy switching between actions
- **Status Indicators**: Visual health factor indicators

## Security

- All transactions require wallet signature
- Smart contract interactions are type-safe
- Input validation on all forms
- Error handling with user feedback

## Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

## Environment Variables

Create `.env.local` for environment-specific settings:

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://fullnode.testnet.sui.io:443
```

## Contract Integration

The frontend interacts with these smart contracts:
- `lending_pool`: Main lending protocol
- `stablecoin`: SUSD stablecoin
- `price_oracle`: SUI price feed
- `staking_manager`: Staking rewards
- `short_position`: Short position management

## Testing

1. Deploy contracts to testnet
2. Update contract addresses
3. Request test SUI from faucet
4. Test all functions:
   - Deposit flow
   - Borrow flow
   - Repay flow
   - Withdraw flow

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/sui-lending-frontend)

1. Push to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy

## License

MIT