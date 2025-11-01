# ⚠️ Notifications Not Working - Troubleshooting Guide

## 🔍 **What's Happening**

Your Cloud Functions **ARE working correctly**! The logs show:

```
✅ sendNotificationOnCreate: Processing notification bFYCqxpfjBhyVzPiTr53
✅ sendNotificationOnCreate: Sending to specific users: EZIzd7Csc3Y9gPBKUedKAwVYuY73
❌ sendNotificationOnCreate: No active tokens for user EZIzd7Csc3Y9gPBKUedKAwVYuY73
```

**The Problem:** Users have **NO active FCM tokens** registered in Firestore.

## 📱 **What are FCM Tokens?**

FCM (Firebase Cloud Messaging) tokens are unique identifiers for each device that wants to receive push notifications. They're stored in:

```
Firestore → users/{userId}/tokens/{tokenId}
```

**Without tokens, notifications cannot be delivered** - it's like trying to send a text message without a phone number.

## 🔍 **Why Don't Users Have Tokens?**

### Common Reasons:

1. **User hasn't opened the mobile app** (or not recently)
2. **Notification permissions not granted** on their device
3. **FCM not properly configured** in the mobile app
4. **Tokens expired or were marked inactive** (invalid/unregistered)
5. **Mobile app not properly registering tokens** with Firestore

## 🛠️ **How to Fix This**

### Step 1: Check if a User Has Tokens

Run this diagnostic script:

```bash
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard
node check-user-tokens.js EZIzd7Csc3Y9gPBKUedKAwVYuY73
```

Replace `EZIzd7Csc3Y9gPBKUedKAwVYuY73` with any user ID you want to check.

**Output will show:**
- ✅ If user has active tokens
- ❌ If user has no tokens or only inactive tokens
- 📊 Details about each token (device, platform, status)

### Step 2: Verify FCM is Working in Mobile App

Check your mobile app code to ensure it:

1. **Requests notification permissions:**
   ```javascript
   // iOS & Android
   await FCM.requestPermissions();
   ```

2. **Registers FCM token with Firestore:**
   ```javascript
   const token = await FCM.getToken();
   
   // Save to Firestore
   await db.collection(`users/${userId}/tokens`).add({
     token: token,
     isActive: true,
     deviceType: 'mobile',
     platform: Platform.OS,
     createdAt: new Date()
   });
   ```

3. **Handles token refresh:**
   ```javascript
   FCM.onTokenRefresh((newToken) => {
     // Update Firestore with new token
   });
   ```

### Step 3: Test with a Fresh User

1. **Install the mobile app** on a test device
2. **Login with a user account**
3. **Grant notification permissions** when prompted
4. **Check Firestore** to see if token was created:
   ```
   Firestore → users/{userId}/tokens
   ```
5. **Send a test notification** from dashboard
6. **Check Cloud Functions logs** to verify token was found

### Step 4: Verify App Configuration

Check your mobile app's Firebase configuration:

**iOS (`ios/App/App/GoogleService-Info.plist`):**
- Ensure you have the correct `GoogleService-Info.plist`
- Verify APNs auth key is configured in Firebase Console

**Android (`android/app/google-services.json`):**
- Ensure you have the correct `google-services.json`
- Verify Cloud Messaging is enabled in Firebase Console

## 📊 **Quick Diagnosis Commands**

### Check all users without tokens:
```bash
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard
firebase firestore:indexes > /dev/null 2>&1 && echo "✅ Firebase connected"
```

### View recent notification attempts:
```bash
firebase functions:log | grep sendNotificationOnCreate | head -20
```

### Check if function is processing:
```bash
firebase functions:log | grep "Processing notification"
```

## 🔧 **Manual Token Registration (Temporary Fix)**

If you need to test notifications immediately, you can manually add a test token:

1. Get an FCM token from a mobile device
2. Add it to Firestore manually:

```javascript
// In Firebase Console → Firestore
users/{userId}/tokens/{randomId}:
{
  token: "your-fcm-token-here",
  isActive: true,
  deviceType: "mobile",
  platform: "ios", // or "android"
  createdAt: timestamp
}
```

3. Try sending a notification again

## ✅ **Expected Behavior (When Working)**

When everything is configured correctly, logs should show:

```
✅ sendNotificationOnCreate: Processing notification ABC123
✅ sendNotificationOnCreate: Sending to specific users: userId123
✅ sendNotificationOnCreate: Sent to user userId123 token abc...
✅ sendNotificationOnCreate: Notification processing complete: 1 success, 0 failed
```

## 🆘 **Still Not Working?**

### Check These Common Issues:

1. **Mobile App Issues:**
   - [ ] FCM plugin installed and configured
   - [ ] Notification permissions requested
   - [ ] Token registration code implemented
   - [ ] App updates Firestore with tokens

2. **Firebase Configuration:**
   - [ ] Cloud Messaging enabled in Firebase Console
   - [ ] APNs auth key configured (iOS)
   - [ ] Server key configured (Android)
   - [ ] Correct `google-services.json` and `GoogleService-Info.plist`

3. **Firestore Rules:**
   - [ ] Users can write to `users/{userId}/tokens`
   - [ ] Cloud Functions can read `users/{userId}/tokens`

4. **Device Settings:**
   - [ ] Notifications enabled in device settings
   - [ ] App has notification permissions
   - [ ] Device is connected to internet

## 📱 **Next Steps**

1. **Run the token checker script** on the user from the logs:
   ```bash
   node check-user-tokens.js EZIzd7Csc3Y9gPBKUedKAwVYuY73
   ```

2. **Check your mobile app** to ensure FCM token registration is implemented

3. **Test with a fresh device** that hasn't used the app before

4. **Monitor the logs** after making changes:
   ```bash
   firebase functions:log | grep sendNotificationOnCreate
   ```

---

**TL;DR:** Your Cloud Functions work perfectly. Users just need to open the mobile app and grant notification permissions so FCM tokens can be registered in Firestore.


