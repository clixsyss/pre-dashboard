# Mobile FCM Integration Guide

This guide explains how to integrate Firebase Cloud Messaging (FCM) with your mobile app to receive push notifications when users accept or approve actions from the dashboard.

## Overview

The system now supports sending actual push notifications to mobile devices. When a user accepts or approves something from the dashboard, a push notification will be sent to their mobile device.

## Mobile App Setup

### 1. Install Firebase SDK

Add Firebase to your mobile app project:

**Android (build.gradle):**
```gradle
implementation 'com.google.firebase:firebase-messaging:23.1.2'
implementation 'com.google.firebase:firebase-analytics:21.2.0'
```

**iOS (Podfile):**
```ruby
pod 'Firebase/Messaging'
pod 'Firebase/Analytics'
```

### 2. Configure FCM

**Android (AndroidManifest.xml):**
```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

**iOS (AppDelegate.swift):**
```swift
import Firebase
import FirebaseMessaging

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    
    // Set messaging delegate
    Messaging.messaging().delegate = self
    
    // Request notification permission
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
    )
    
    application.registerForRemoteNotifications()
    return true
}
```

### 3. Register FCM Token

When the user logs in to your mobile app, register their FCM token:

**Android (Kotlin/Java):**
```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get FCM token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }

            // Get new FCM registration token
            val token = task.result
            Log.d(TAG, "FCM Token: $token")
            
            // Send token to your backend
            sendTokenToServer(token)
        }
    }
    
    private fun sendTokenToServer(token: String) {
        // Send token to Firebase Firestore
        val tokenData = hashMapOf(
            "token" to token,
            "platform" to "android",
            "isActive" to true,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        
        // Add to user's tokens collection
        FirebaseFirestore.getInstance()
            .collection("users")
            .document(userId)
            .collection("tokens")
            .add(tokenData)
            .addOnSuccessListener { 
                Log.d(TAG, "Token registered successfully")
            }
            .addOnFailureListener { e ->
                Log.w(TAG, "Error registering token", e)
            }
    }
}
```

**iOS (Swift):**
```swift
import Firebase
import FirebaseMessaging

class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        
        Messaging.messaging().delegate = self
        
        // Request notification permission
        UNUserNotificationCenter.current().delegate = self
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
        )
        
        application.registerForRemoteNotifications()
        return true
    }
    
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        let dataDict: [String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: dataDict
        )
        
        // Send token to server
        sendTokenToServer(fcmToken)
    }
    
    private func sendTokenToServer(_ token: String?) {
        guard let token = token else { return }
        
        let db = Firestore.firestore()
        let tokenData: [String: Any] = [
            "token": token,
            "platform": "ios",
            "isActive": true,
            "createdAt": FieldValue.serverTimestamp(),
            "updatedAt": FieldValue.serverTimestamp()
        ]
        
        db.collection("users").document(userId).collection("tokens").addDocument(data: tokenData) { error in
            if let error = error {
                print("Error registering token: \(error)")
            } else {
                print("Token registered successfully")
            }
        }
    }
}
```

### 4. Handle Incoming Notifications

**Android (MyFirebaseMessagingService.java):**
```java
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMsgService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            
            // Handle the data payload
            String actionType = remoteMessage.getData().get("actionType");
            String actionUrl = remoteMessage.getData().get("actionUrl");
            String actionText = remoteMessage.getData().get("actionText");
            
            // Show notification
            showNotification(remoteMessage.getNotification().getTitle(),
                           remoteMessage.getNotification().getBody(),
                           actionUrl, actionText);
        }

        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
        }
    }

    private void showNotification(String title, String body, String actionUrl, String actionText) {
        Intent intent = new Intent(this, MainActivity.class);
        if (actionUrl != null && !actionUrl.isEmpty()) {
            intent.putExtra("actionUrl", actionUrl);
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, "default")
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);
        
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(0, notificationBuilder.build());
    }
}
```

**iOS (AppDelegate.swift):**
```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    // Handle notification when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Print message ID
        if let messageID = userInfo["gcm.message_id"] {
            print("Message ID: \(messageID)")
        }
        
        // Print full message
        print(userInfo)
        
        // Show notification even when app is in foreground
        completionHandler([.alert, .badge, .sound])
    }
    
    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle action URL if present
        if let actionUrl = userInfo["actionUrl"] as? String {
            // Navigate to the specified URL
            handleActionUrl(actionUrl)
        }
        
        completionHandler()
    }
    
    private func handleActionUrl(_ url: String) {
        // Implement navigation logic based on the action URL
        // This could open a specific screen in your app
        print("Action URL: \(url)")
    }
}
```

## Testing Push Notifications

### 1. Test from Dashboard

Use the dashboard notification system to send test notifications:

```javascript
// In your dashboard component
import { useQuickNotifications } from './components/DashboardAcceptanceNotification';

const MyComponent = ({ projectId, currentAdmin }) => {
  const { quickSendApproval } = useQuickNotifications(projectId, currentAdmin);

  const handleTestNotification = async () => {
    await quickSendApproval(
      'user123', // Replace with actual user ID
      'This is a test notification from the dashboard!'
    );
  };

  return (
    <button onClick={handleTestNotification}>
      Send Test Notification
    </button>
  );
};
```

### 2. Test from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select your app
5. Click "Send test message"
6. Enter the FCM token from your mobile app logs

## Troubleshooting

### Common Issues

1. **No notifications received:**
   - Check if FCM token is properly registered
   - Verify notification permissions are granted
   - Check device notification settings

2. **Token registration fails:**
   - Ensure Firebase is properly configured
   - Check internet connection
   - Verify Firestore security rules allow token creation

3. **Notifications not showing:**
   - Check if app is in background (notifications only show when app is backgrounded)
   - Verify notification channel setup (Android)
   - Check notification settings in device settings

### Debug Steps

1. **Check token registration:**
   ```javascript
   // In Firebase Console → Firestore
   // Look for: users/{userId}/tokens/{tokenId}
   ```

2. **Check push notification queue:**
   ```javascript
   // In Firebase Console → Firestore
   // Look for: pushNotifications collection
   ```

3. **Check Cloud Functions logs:**
   ```bash
   firebase functions:log
   ```

## Security Rules

Make sure your Firestore security rules allow token registration:

```javascript
// In firestore.rules
match /users/{userId}/tokens/{tokenId} {
  allow read, write, delete: if request.auth != null && request.auth.uid == userId;
}
```

## Deployment

1. **Deploy Cloud Functions:**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

2. **Update mobile app:**
   - Deploy your mobile app with FCM integration
   - Test notifications end-to-end

## Support

For issues with push notifications:

1. Check Firebase Console → Cloud Messaging for delivery reports
2. Check Cloud Functions logs for processing errors
3. Verify FCM token registration in Firestore
4. Test with Firebase Console first, then dashboard

The system is now set up to send actual push notifications to mobile devices when users accept or approve actions from the dashboard!
