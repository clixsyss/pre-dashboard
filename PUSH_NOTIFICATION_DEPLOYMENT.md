# Push Notification Deployment Guide

This guide explains how to deploy the mobile push notification system to send actual notifications to phones when users accept or approve actions from the dashboard.

## Overview

The system now includes:
- **Mobile Push Service**: Queues push notifications for delivery
- **Cloud Functions**: Processes the queue and sends actual FCM messages
- **Mobile App Integration**: Registers FCM tokens and receives notifications
- **Dashboard Integration**: Sends notifications when users accept/approve actions

## Deployment Steps

### 1. Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
```

### 2. Update Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Allow push notification queue access
match /pushNotifications/{notificationId} {
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// Allow listing push notifications
match /pushNotifications {
  allow list: if request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Configure Firebase Cloud Messaging

1. **Enable Cloud Messaging API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Enable "Cloud Messaging API"

2. **Set up FCM for your mobile app:**
   - Follow the [Mobile FCM Integration Guide](MOBILE_FCM_INTEGRATION.md)
   - Configure Android and iOS apps
   - Test token registration

### 4. Test the System

1. **Test from Dashboard:**
   ```javascript
   // Use the PushNotificationTest component
   import PushNotificationTest from './components/PushNotificationTest';
   
   <PushNotificationTest 
     projectId={projectId} 
     currentAdmin={currentAdmin} 
   />
   ```

2. **Test with Mobile App:**
   - Install mobile app on device
   - Log in with user account
   - Send test notification from dashboard
   - Verify notification appears on device

## How It Works

### 1. Dashboard Action
When a user accepts/approves something from the dashboard:

```javascript
// Dashboard component
const { quickSendApproval } = useQuickNotifications(projectId, currentAdmin);

const handleApproveRequest = async (request) => {
  // Your approval logic
  await approveRequest(request.id);
  
  // Send notification (includes both in-app and push)
  await quickSendApproval(
    request.userId, 
    'Your request has been approved!'
  );
};
```

### 2. Notification Processing
1. **In-App Notification**: Stored in Firestore and shown in browser
2. **Push Notification**: Queued in `pushNotifications` collection
3. **Cloud Function**: Processes queue every minute and sends FCM messages
4. **Mobile Device**: Receives and displays the notification

### 3. Mobile App Integration
The mobile app must:
1. Register FCM tokens when user logs in
2. Handle incoming notifications
3. Show notifications when app is in background
4. Navigate to appropriate screens when tapped

## Monitoring and Debugging

### 1. Check Push Notification Queue
```javascript
// In Firebase Console → Firestore
// Look for: pushNotifications collection
// Check status: pending, sent, failed, retry
```

### 2. Check Cloud Functions Logs
```bash
firebase functions:log
```

### 3. Check FCM Delivery Reports
- Go to Firebase Console → Cloud Messaging
- View delivery reports and analytics

### 4. Test Token Registration
```javascript
// In Firebase Console → Firestore
// Look for: users/{userId}/tokens/{tokenId}
// Verify tokens are being registered
```

## Troubleshooting

### Common Issues

1. **No notifications received:**
   - Check if FCM tokens are registered
   - Verify Cloud Functions are deployed
   - Check notification permissions on device

2. **Notifications stuck in pending:**
   - Check Cloud Functions logs
   - Verify FCM API is enabled
   - Check Firebase project configuration

3. **Token registration fails:**
   - Check Firestore security rules
   - Verify Firebase configuration in mobile app
   - Check internet connection

### Debug Commands

```bash
# Check function status
firebase functions:list

# View function logs
firebase functions:log --only processPushNotifications

# Test function locally
firebase emulators:start --only functions
```

## Production Considerations

### 1. Rate Limiting
The system includes built-in rate limiting:
- Processes 100 notifications per minute
- Retries failed notifications up to 3 times
- Cleans up old notifications after 30 days

### 2. Error Handling
- Failed notifications are marked and logged
- Retry mechanism for temporary failures
- Dead letter queue for permanently failed notifications

### 3. Monitoring
- Cloud Functions provide detailed logs
- FCM delivery reports show success rates
- Firestore tracks notification status

## Security

### 1. Authentication
- Only authenticated admins can send notifications
- Users can only manage their own FCM tokens
- Cloud Functions verify authentication

### 2. Data Privacy
- FCM tokens are stored securely
- No sensitive data in notification payload
- Notifications are project-scoped

## Support

For issues with push notifications:

1. **Check logs**: Cloud Functions and FCM delivery reports
2. **Test components**: Use PushNotificationTest component
3. **Verify setup**: Ensure all services are properly configured
4. **Mobile app**: Follow the mobile integration guide

The system is now ready to send actual push notifications to mobile devices when users accept or approve actions from the dashboard!
