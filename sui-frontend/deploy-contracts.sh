#!/bin/bash

echo "🚀 Sui Lending Protocol - Contract Deployment Script"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if sui is installed
if ! command -v sui &> /dev/null; then
    echo -e "${RED}❌ Sui CLI not found!${NC}"
    echo "Please install Sui CLI first:"
    echo "  brew install sui"
    echo "  or"
    echo "  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui"
    exit 1
fi

echo -e "${GREEN}✅ Sui CLI found${NC}"
sui --version

# Check current environment
echo -e "\n${YELLOW}Current Sui Environment:${NC}"
sui client envs

# Switch to testnet
echo -e "\n${YELLOW}Switching to testnet...${NC}"
sui client switch --env testnet 2>/dev/null || {
    echo "Creating testnet environment..."
    sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
    sui client switch --env testnet
}

# Get current address
echo -e "\n${YELLOW}Current Address:${NC}"
CURRENT_ADDRESS=$(sui client active-address)
echo $CURRENT_ADDRESS

# Check balance
echo -e "\n${YELLOW}Current Balance:${NC}"
sui client gas

# Ask if user needs testnet SUI
read -p "Do you need testnet SUI from faucet? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Requesting SUI from faucet...${NC}"
    sui client faucet
    sleep 2
    echo "New balance:"
    sui client gas
fi

# Build contracts
echo -e "\n${YELLOW}Building smart contracts...${NC}"
cd sui
sui move build || {
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Please check the error messages above."
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"

# Deploy contracts
echo -e "\n${YELLOW}Deploying contracts to testnet...${NC}"
echo "This will cost gas fees. Proceeding..."

DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract important addresses
echo -e "\n${YELLOW}Extracting deployment addresses...${NC}"

PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE "0x[a-f0-9]{64}" | head -1)
echo "Package ID: $PACKAGE_ID"

# Parse object IDs (these would be the shared objects created)
echo -e "\n${YELLOW}Created Objects:${NC}"
echo "$DEPLOY_OUTPUT" | grep -A 10 "Created Objects"

# Create .env.local file
cd ..
echo -e "\n${YELLOW}Creating .env.local file...${NC}"

cat > .env.local << EOF
# Sui Lending Protocol Environment Variables
# Generated on $(date)

# Network Configuration
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_FULLNODE_URL=https://fullnode.testnet.sui.io:443

# Deployed Contract Addresses
NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID

# IMPORTANT: Please manually update these addresses from the deployment output above
NEXT_PUBLIC_LENDING_POOL=0x_REPLACE_WITH_ACTUAL_ADDRESS
NEXT_PUBLIC_STAKING_MANAGER=0x_REPLACE_WITH_ACTUAL_ADDRESS
NEXT_PUBLIC_SHORT_POSITION_MANAGER=0x_REPLACE_WITH_ACTUAL_ADDRESS
NEXT_PUBLIC_PRICE_ORACLE=0x_REPLACE_WITH_ACTUAL_ADDRESS
NEXT_PUBLIC_STABLECOIN_TREASURY=0x_REPLACE_WITH_ACTUAL_ADDRESS

# Protocol Configuration
NEXT_PUBLIC_MAX_LTV=50
NEXT_PUBLIC_LIQUIDATION_THRESHOLD=75
NEXT_PUBLIC_STAKING_APY=5
NEXT_PUBLIC_MIN_DEPOSIT_SUI=0.001
NEXT_PUBLIC_MIN_BORROW_SUSD=0.01
NEXT_PUBLIC_GAS_RESERVE_SUI=0.01

# Oracle Configuration
NEXT_PUBLIC_PRICE_REFRESH_INTERVAL=10000
NEXT_PUBLIC_POSITION_REFRESH_INTERVAL=5000

# Slippage Configuration (in basis points, 100 = 1%)
NEXT_PUBLIC_DEFAULT_SLIPPAGE=100
NEXT_PUBLIC_MAX_SLIPPAGE=500

# Feature Flags
NEXT_PUBLIC_ENABLE_LIQUIDATION_UI=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_TRANSACTION_SIMULATION=true
EOF

echo -e "${GREEN}✅ .env.local created${NC}"

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}📝 IMPORTANT: Manual Steps Required${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "1. Look at the deployment output above and find the Object IDs for:"
echo "   - LendingPool"
echo "   - StakingManager"
echo "   - ShortPositionManager"
echo "   - PriceOracle"
echo "   - StablecoinTreasury"
echo ""
echo "2. Edit .env.local and replace the placeholder addresses"
echo ""
echo "3. Restart the development server:"
echo "   npm run dev"
echo ""
echo "4. The application should now be fully functional with blockchain!"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo ""
echo "Package ID saved: $PACKAGE_ID"
echo "Please update the other addresses in .env.local manually."