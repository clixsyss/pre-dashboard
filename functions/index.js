/**
 * Firebase Cloud Functions for Push Notifications
 * This file contains the backend functions needed to send actual push notifications
 * to mobile devices using Firebase Admin SDK
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Process push notification queue
 * This function processes pending push notifications and sends them via FCM
 */
exports.processPushNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Processing push notification queue...');
    
    try {
      // Get pending push notifications
      const pendingNotifications = await db
        .collection('pushNotifications')
        .where('status', '==', 'pending')
        .limit(100)
        .get();

      if (pendingNotifications.empty) {
        console.log('No pending notifications to process');
        return null;
      }

      console.log(`Processing ${pendingNotifications.size} pending notifications`);

      const batch = db.batch();
      const results = [];

      for (const doc of pendingNotifications.docs) {
        const notification = doc.data();
        
        try {
          // Send FCM message
          const message = {
            token: notification.token,
            notification: {
              title: notification.title,
              body: notification.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              image: notification.imageUrl || undefined,
              click_action: notification.actionUrl || undefined
            },
            data: {
              actionType: notification.actionType || 'general',
              projectId: notification.projectId || '',
              userId: notification.userId || '',
              category: notification.category || 'general',
              priority: notification.priority || 'normal',
              requiresAction: notification.requiresAction ? 'true' : 'false',
              actionUrl: notification.actionUrl || '',
              actionText: notification.actionText || '',
              ...notification.metadata
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: notification.actionUrl || undefined
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'content-available': 1
                }
              }
            }
          };

          // Send the message
          const response = await admin.messaging().send(message);
          
          console.log('Successfully sent message:', response);
          
          // Update notification status to sent
          batch.update(doc.ref, {
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            fcmMessageId: response,
            retryCount: admin.firestore.FieldValue.increment(1)
          });

          results.push({
            id: doc.id,
            status: 'sent',
            fcmMessageId: response
          });

        } catch (error) {
          console.error(`Error sending notification ${doc.id}:`, error);
          
          const retryCount = (notification.retryCount || 0) + 1;
          const maxRetries = notification.maxRetries || 3;
          
          if (retryCount >= maxRetries) {
            // Mark as failed after max retries
            batch.update(doc.ref, {
              status: 'failed',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              error: error.message,
              retryCount: retryCount
            });
            
            results.push({
              id: doc.id,
              status: 'failed',
              error: error.message
            });
          } else {
            // Schedule for retry
            batch.update(doc.ref, {
              status: 'retry',
              scheduledFor: admin.firestore.FieldValue.serverTimestamp(),
              retryCount: retryCount,
              lastError: error.message
            });
            
            results.push({
              id: doc.id,
              status: 'retry',
              retryCount: retryCount
            });
          }
        }
      }

      // Commit all updates
      await batch.commit();
      
      console.log('Push notification processing completed:', results);
      return results;

    } catch (error) {
      console.error('Error processing push notifications:', error);
      throw error;
    }
  });

/**
 * Send immediate push notification
 * This function can be called directly to send a push notification immediately
 */
exports.sendImmediatePushNotification = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, projectId, title, message, actionType, actionUrl, actionText } = data;

  if (!userId || !projectId || !title || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Get user's FCM tokens
    const tokensSnapshot = await db
      .collection(`users/${userId}/tokens`)
      .where('isActive', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      return {
        success: false,
        message: 'No FCM tokens found for user',
        tokensFound: 0
      };
    }

    const results = [];
    
    for (const tokenDoc of tokensSnapshot.docs) {
      const tokenData = tokenDoc.data();
      
      try {
        const message = {
          token: tokenData.token,
          notification: {
            title: title,
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            click_action: actionUrl || undefined
          },
          data: {
            actionType: actionType || 'general',
            projectId: projectId,
            userId: userId,
            actionUrl: actionUrl || '',
            actionText: actionText || ''
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: actionUrl || undefined
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                'content-available': 1
              }
            }
          }
        };

        const response = await admin.messaging().send(message);
        
        results.push({
          token: tokenData.token,
          success: true,
          fcmMessageId: response
        });

      } catch (error) {
        console.error(`Error sending to token ${tokenData.token}:`, error);
        results.push({
          token: tokenData.token,
          success: false,
          error: error.message
        });
      }
    }

    const successfulSends = results.filter(r => r.success).length;
    
    return {
      success: successfulSends > 0,
      results,
      totalTokens: tokensSnapshot.size,
      successfulSends,
      message: `Sent to ${successfulSends}/${tokensSnapshot.size} devices`
    };

  } catch (error) {
    console.error('Error sending immediate push notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send push notification');
  }
});

/**
 * Clean up old push notification records
 * This function runs daily to clean up old notification records
 */
exports.cleanupPushNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Cleaning up old push notification records...');
    
    try {
      // Delete notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldNotifications = await db
        .collection('pushNotifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .limit(500)
        .get();

      if (oldNotifications.empty) {
        console.log('No old notifications to clean up');
        return null;
      }

      const batch = db.batch();
      oldNotifications.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Cleaned up ${oldNotifications.size} old notification records`);
      return { cleaned: oldNotifications.size };

    } catch (error) {
      console.error('Error cleaning up push notifications:', error);
      throw error;
    }
  });

/**
 * Get push notification statistics
 * This function provides statistics about push notifications
 */
exports.getPushNotificationStats = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { projectId } = data;

  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'Project ID is required');
  }

  try {
    // Count total users in project
    const usersSnapshot = await db
      .collection('users')
      .where('projects', 'array-contains', { projectId: projectId })
      .get();

    const totalUsers = usersSnapshot.size;

    // Count users with FCM tokens
    let usersWithTokens = 0;
    for (const userDoc of usersSnapshot.docs) {
      const tokensSnapshot = await db
        .collection(`users/${userDoc.id}/tokens`)
        .where('isActive', '==', true)
        .get();
      
      if (tokensSnapshot.size > 0) {
        usersWithTokens++;
      }
    }

    // Count notifications sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notificationsSnapshot = await db
      .collection('pushNotifications')
      .where('projectId', '==', projectId)
      .where('createdAt', '>=', today)
      .get();

    const sentToday = notificationsSnapshot.size;

    return {
      totalUsers,
      usersWithTokens,
      sentToday,
      tokenCoverage: totalUsers > 0 ? (usersWithTokens / totalUsers * 100).toFixed(1) : 0
    };

  } catch (error) {
    console.error('Error getting push notification stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get statistics');
  }
});
