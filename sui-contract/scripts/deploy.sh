#!/bin/bash

# SUI Lending Protocol Deployment Script

echo "========================================="
echo "SUI Lending Protocol Deployment"
echo "========================================="

# Check if sui CLI is installed
if ! command -v sui &> /dev/null
then
    echo "Error: sui CLI is not installed"
    echo "Please install it using: brew install sui"
    exit 1
fi

# Get active address
ACTIVE_ADDRESS=$(sui client active-address)
echo "Deploying with address: $ACTIVE_ADDRESS"

# Build the project
echo ""
echo "Building the project..."
sui move build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Run tests
echo ""
echo "Running tests..."
sui move test

if [ $? -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi

# Deploy the package
echo ""
echo "Deploying the package..."
DEPLOY_RESULT=$(sui client publish --gas-budget 100000000 2>&1)

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    echo ""
    echo "Deployment details:"
    echo "$DEPLOY_RESULT"

    # Extract package ID
    PACKAGE_ID=$(echo "$DEPLOY_RESULT" | grep "Published Objects" -A 5 | grep "PackageID" | awk '{print $2}')

    if [ ! -z "$PACKAGE_ID" ]; then
        echo ""
        echo "Package ID: $PACKAGE_ID"
        echo ""
        echo "Saving deployment info..."

        # Save deployment info
        cat > deployment.json << EOF
{
    "package_id": "$PACKAGE_ID",
    "deployer": "$ACTIVE_ADDRESS",
    "network": "$(sui client active-env)",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

        echo "Deployment info saved to deployment.json"
    fi
else
    echo "Deployment failed!"
    echo "$DEPLOY_RESULT"
    exit 1
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Initialize the protocol components"
echo "2. Set up price oracle"
echo "3. Create lending pool"
echo "4. Start accepting deposits"