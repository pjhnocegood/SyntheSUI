# Sui Oracle Lending Frontend

A Next.js frontend for a decentralized lending protocol built on the Sui blockchain.

## Features

### Core Functionality
- **Oracle Price Display**: Real-time price information from the oracle contract
- **Lending Operations**: Deposit SUI tokens to earn interest
- **Borrowing Operations**: Borrow against SUI collateral with 70% LTV
- **Withdrawal Operations**: Withdraw deposits and manage positions
- **Repayment Operations**: Repay loans and improve health factors

### User Interface
- **Wallet Integration**: Connect and manage Sui wallets
- **Position Monitoring**: View deposits, borrows, and health factors
- **Real-time Updates**: Automatic data refresh after transactions
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the contract addresses after deploying the lending oracle contract.

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contract Integration

### Prerequisites
1. Deploy the `lending_oracle` contract to Sui devnet
2. Update environment variables with the contract addresses:
   - `NEXT_PUBLIC_ORACLE_PACKAGE_ID`: The package ID from deployment
   - `NEXT_PUBLIC_ORACLE_OBJECT_ID`: The oracle object ID from deployment

### Contract Functions Used
- **Read-only functions**:
  - `get_price()`: Current oracle price
  - `get_total_deposits()`: Total deposits in the pool
  - `get_total_borrowed()`: Total borrowed amount
  - `get_user_deposit()`: User's deposit amount
  - `get_user_borrowed()`: User's borrowed amount

- **Transaction functions**:
  - `deposit()`: Deposit SUI to earn interest
  - `withdraw()`: Withdraw deposited SUI
  - `borrow()`: Borrow SUI against collateral
  - `repay()`: Repay borrowed amount

## Architecture

### Components
- `WalletButton`: Wallet connection and management
- `OracleDisplay`: Shows oracle and pool information
- `UserPositions`: Displays user's lending/borrowing positions
- `LendingActions`: Deposit and borrow functionality
- `WithdrawActions`: Withdraw and repay functionality

### Hooks
- `useOracle`: Fetches and manages oracle contract data
- Wallet hooks from `@mysten/wallet-adapter-react`

### Utilities
- `suiClient`: Configured Sui client for devnet
- `OracleTransactions`: Helper for building transactions

## Security Considerations

- **Collateral Ratio**: 70% LTV (Loan-to-Value) ratio enforced
- **Health Factor**: Monitors liquidation risk
- **Input Validation**: Client-side validation for all user inputs
- **Error Handling**: Comprehensive error handling for all operations

## Development

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Blockchain**: Sui SDK (@mysten/sui.js)
- **Wallet**: Sui Wallet Adapter
- **TypeScript**: Full type safety

### Project Structure
```
sui-frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers/
│       └── WalletProvider.tsx
├── components/
│   ├── WalletButton.tsx
│   ├── OracleDisplay.tsx
│   ├── UserPositions.tsx
│   ├── LendingActions.tsx
│   └── WithdrawActions.tsx
├── hooks/
│   └── useOracle.ts
└── lib/
    └── suiClient.ts
```

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel, Netlify, or similar platform**

3. **Update environment variables** in production with mainnet contract addresses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.