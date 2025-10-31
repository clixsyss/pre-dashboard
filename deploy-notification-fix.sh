#!/bin/bash

# Notification Bug Fix Deployment Script
# This script deploys the missing sendNotificationOnCreate Cloud Function

echo "=========================================="
echo "📢 Notification Bug Fix Deployment"
echo "=========================================="
echo ""
echo "This will deploy the sendNotificationOnCreate function"
echo "to fix the issue where notifications were sent to all users"
echo "instead of just the intended recipient."
echo ""

# Check if we're in the right directory
if [ ! -f "functions/index.js" ]; then
    echo "❌ Error: functions/index.js not found"
    echo "Please run this script from the pre-dashboard directory"
    exit 1
fi

echo "✅ Found functions directory"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI is installed"
echo ""

# Navigate to functions directory to check dependencies
cd functions

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing function dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

cd ..

# Ask for confirmation
echo ""
read -p "🚀 Ready to deploy? This will update your Cloud Functions. (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying Cloud Functions..."
echo ""

# Deploy all functions (includes the new sendNotificationOnCreate function)
firebase deploy --only functions

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Deployment Successful!"
    echo "=========================================="
    echo ""
    echo "The notification bug fix has been deployed."
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test by updating a booking status for one user"
    echo "2. Verify only that user receives the notification"
    echo "3. Check Firebase Console → Functions for logs"
    echo ""
    echo "📖 See NOTIFICATION_BUG_FIX.md for more details"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Deployment Failed"
    echo "=========================================="
    echo ""
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "- Not logged in to Firebase (run: firebase login)"
    echo "- Wrong Firebase project selected (run: firebase use)"
    echo "- Insufficient permissions"
    echo ""
fi

