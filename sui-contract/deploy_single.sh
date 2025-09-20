#!/bin/bash

# Deploy single module at a time
echo "Deploying Price Oracle..."

# Create temporary Move.toml with only price_oracle
cat > Move_temp.toml << EOF
[package]
name = "price_oracle"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
sui_lending_protocol = "0x0"
EOF

# Create temp sources directory
mkdir -p temp_sources
cp sources/price_oracle.move temp_sources/

# Backup original files
mv Move.toml Move_backup.toml
mv sources sources_backup

# Use temp files
mv Move_temp.toml Move.toml
mv temp_sources sources

# Build and deploy
echo "Building price_oracle..."
sui move build

echo "Publishing price_oracle..."
sui client publish --gas-budget 300000000

# Restore original files
mv Move_backup.toml Move.toml
rm -rf sources
mv sources_backup sources

echo "Deployment complete!"