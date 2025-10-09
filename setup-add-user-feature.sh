#!/bin/bash

# Setup script for Add User Feature
# This script installs dependencies and deploys the necessary Cloud Functions

echo "====================================="
echo "Add User Feature - Setup Script"
echo "====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
echo -n "Checking Firebase CLI installation... "
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}NOT FOUND${NC}"
    echo ""
    echo "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
else
    echo -e "${GREEN}OK${NC}"
fi

# Navigate to functions directory
echo ""
echo "Navigating to functions directory..."
cd "$(dirname "$0")/functions" || exit 1

# Install dependencies
echo ""
echo -e "${YELLOW}Installing Cloud Functions dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Go back to project root
cd ..

# Check if user is logged in to Firebase
echo ""
echo -n "Checking Firebase login status... "
firebase projects:list &> /dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}NOT LOGGED IN${NC}"
    echo ""
    echo -e "${YELLOW}Please login to Firebase:${NC}"
    firebase login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Firebase login failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}OK${NC}"
fi

# Deploy functions
echo ""
echo -e "${YELLOW}Deploying Cloud Functions to Firebase...${NC}"
echo "This may take a few minutes..."
echo ""

firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Cloud Functions deployed successfully${NC}"
    echo ""
    echo "====================================="
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "====================================="
    echo ""
    echo "The following functions have been deployed:"
    echo "  1. createUser - Creates new users"
    echo "  2. checkTemporaryUsers - Daily check for expired users"
    echo "  3. validateUserAccess - Validates user access"
    echo ""
    echo "Next steps:"
    echo "  1. Start your dashboard: npm start"
    echo "  2. Navigate to Users section"
    echo "  3. Click 'Add User' button"
    echo "  4. Fill in the form and create a user"
    echo ""
    echo "For more information, see ADD_USER_FEATURE_README.md"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Failed to deploy Cloud Functions${NC}"
    echo ""
    echo "Please check the error messages above and try again."
    echo "Common issues:"
    echo "  - Make sure you're logged in to Firebase"
    echo "  - Verify your Firebase project is set up correctly"
    echo "  - Check that you have proper permissions"
    exit 1
fi

