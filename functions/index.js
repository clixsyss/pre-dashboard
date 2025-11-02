/**
 * Firebase Cloud Functions for Push Notifications
 * This file contains the backend functions needed to send actual push notifications
 * to mobile devices using Firebase Admin SDK
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================
// Configure your email service here
// For Gmail: You need to enable "App Passwords" in your Google Account settings
// Go to: https://myaccount.google.com/apppasswords
// Create an app password and use it below

const EMAIL_CONFIG = {
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: functions.config().email?.user || 'your-email@gmail.com', // Set via: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email?.password || 'your-app-password' // Set via: firebase functions:config:set email.password="your-app-password"
  }
};

// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Company branding
const COMPANY_NAME = 'PRE Group';
const COMPANY_LOGO_URL = 'https://pre-group.web.app/logo-email.png'; // PRE Group logo for emails
const COMPANY_EMAIL = EMAIL_CONFIG.auth.user;
const COMPANY_WEBSITE = 'https://pre-group.web.app'; // Update with your actual website

/**
 * Process push notification queue
 * This function processes pending push notifications and sends them via FCM
 */
exports.processPushNotifications = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Processing push notification queue...');
    
    try {
      // Get pending and retry push notifications
      const pendingNotifications = await db
        .collection('pushNotifications')
        .where('status', 'in', ['pending', 'retry'])
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
          // Get user's FCM tokens
          const tokensSnapshot = await db
            .collection(`users/${notification.userId}/tokens`)
            .where('isActive', '==', true)
            .get();

          if (tokensSnapshot.empty) {
            console.log(`No active FCM tokens found for user ${notification.userId}`);
            
            // Mark notification as failed - no tokens available
            batch.update(doc.ref, {
              status: 'failed',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
              error: 'No active FCM tokens found for user',
              retryCount: admin.firestore.FieldValue.increment(1)
            });

            results.push({
              id: doc.id,
              status: 'failed',
              error: 'No active FCM tokens found'
            });
            
            continue; // Skip to next notification
          }

          // Send to all user's tokens
          let successCount = 0;
          let failCount = 0;
          const tokenResults = [];

          for (const tokenDoc of tokensSnapshot.docs) {
            const tokenData = tokenDoc.data();
            
            try {
              // Send FCM message
              const message = {
                token: tokenData.token,
                notification: {
                  title: notification.title,
                  body: notification.message,
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
                  imageUrl: notification.imageUrl || '',
                  ...notification.metadata
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    icon: 'notification_icon',
                    imageUrl: notification.imageUrl || undefined,
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: 1,
                      'content-available': 1,
                      'mutable-content': 1,
                    }
                  },
                  fcm_options: notification.imageUrl ? {
                    image: notification.imageUrl
                  } : undefined
                }
              };

              // Send the message
              const response = await admin.messaging().send(message);
              
              console.log(`Successfully sent message to token ${tokenData.token.substring(0, 20)}...`, response);
              successCount++;
              
              tokenResults.push({
                token: tokenData.token.substring(0, 20) + '...',
                success: true,
                fcmMessageId: response
              });

            } catch (tokenError) {
              console.error(`Error sending to token ${tokenData.token.substring(0, 20)}...:`, tokenError);
              failCount++;
              
              tokenResults.push({
                token: tokenData.token.substring(0, 20) + '...',
                success: false,
                error: tokenError.message
              });

              // If token is invalid, mark it as inactive
              if (tokenError.code === 'messaging/invalid-registration-token' || 
                  tokenError.code === 'messaging/registration-token-not-registered') {
                await tokenDoc.ref.update({
                  isActive: false,
                  deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  deactivationReason: tokenError.message
                });
                console.log(`Marked token as inactive: ${tokenData.token.substring(0, 20)}...`);
              }
            }
          }

          // Update notification status based on results
          if (successCount > 0) {
            // At least one token received the notification
            batch.update(doc.ref, {
              status: 'sent',
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              tokensAttempted: tokensSnapshot.size,
              tokensSucceeded: successCount,
              tokensFailed: failCount,
              tokenResults: tokenResults,
              retryCount: admin.firestore.FieldValue.increment(1)
            });

            results.push({
              id: doc.id,
              status: 'sent',
              tokensSucceeded: successCount,
              tokensFailed: failCount
            });
          } else {
            // All tokens failed
            throw new Error(`Failed to send to all ${tokensSnapshot.size} tokens`);
          }

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
              icon: 'notification_icon',
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                'content-available': 1,
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
 * Process project notifications when created
 * This function triggers when a notification document is created in projects/{projectId}/notifications
 * It handles sending push notifications to the specified audience (all users, specific users, units, buildings, or topic)
 */
exports.sendNotificationOnCreate = functions.firestore
  .document('projects/{projectId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();
    const { projectId, notificationId } = context.params;

    console.log(`🚀 Cloud Function triggered: Processing notification ${notificationId} for project ${projectId}`);
    console.log(`📋 Notification data:`, JSON.stringify(notification, null, 2));

    try {
      // Check if notification should be sent now
      if (!notification.sendNow) {
        console.log('⏰ Notification is scheduled for later, skipping');
        await snapshot.ref.update({
          status: 'scheduled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return null;
      }

      console.log('✅ sendNow is true, proceeding with delivery...');

      // Determine which users should receive this notification
      const userIds = [];
      const audience = notification.audience || {};

      if (audience.all) {
        // Send to all users in the project
        console.log('Sending to all users in project');
        const usersSnapshot = await db
          .collection('users')
          .where('projects', 'array-contains-any', [
            { projectId: projectId },
            // Also check for string format
          ])
          .get();

        // Filter users who have this project
        usersSnapshot.docs.forEach(userDoc => {
          const userData = userDoc.data();
          const hasProject = userData.projects?.some(p => 
            (typeof p === 'string' ? p : p.projectId) === projectId
          );
          if (hasProject) {
            userIds.push(userDoc.id);
          }
        });

        console.log(`Found ${userIds.length} users in project`);
      } else if (audience.uids && audience.uids.length > 0) {
        // Send to specific users
        console.log(`Sending to specific users: ${audience.uids.join(', ')}`);
        userIds.push(...audience.uids);
      } else if (audience.units && audience.units.length > 0) {
        // Send to specific units
        console.log(`Sending to units: ${audience.units.join(', ')}`);
        const usersSnapshot = await db.collection('users').get();
        
        usersSnapshot.docs.forEach(userDoc => {
          const userData = userDoc.data();
          const userProject = userData.projects?.find(p => 
            (typeof p === 'string' ? p : p.projectId) === projectId
          );
          
          if (userProject && audience.units.includes(userProject.unit)) {
            userIds.push(userDoc.id);
          }
        });

        console.log(`Found ${userIds.length} users in specified units`);
      } else if (audience.buildings && audience.buildings.length > 0) {
        // Send to specific buildings
        console.log(`Sending to buildings: ${audience.buildings.join(', ')}`);
        const usersSnapshot = await db.collection('users').get();
        
        usersSnapshot.docs.forEach(userDoc => {
          const userData = userDoc.data();
          const userProject = userData.projects?.find(p => 
            (typeof p === 'string' ? p : p.projectId) === projectId
          );
          
          if (userProject && userProject.unit) {
            const [building] = userProject.unit.split('-');
            if (audience.buildings.includes(building)) {
              userIds.push(userDoc.id);
            }
          }
        });

        console.log(`Found ${userIds.length} users in specified buildings`);
      } else if (audience.topic) {
        // Topic-based notifications are handled by FCM directly
        console.log(`Sending to topic: ${audience.topic}`);
        
        const title = notification.title_en || 'Notification';
        const body = notification.body_en || '';
        
        const message = {
          topic: audience.topic,
          notification: {
            title: title,
            body: body,
          },
          data: {
            projectId: projectId,
            type: notification.type || 'general',
            deepLink: notification.meta?.deepLink || '',
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              icon: 'notification_icon', // Android only
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                'content-available': 1,
              }
            }
          }
        };

        const response = await admin.messaging().send(message);
        console.log('Topic notification sent:', response);

        // Update notification status
        await snapshot.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, topic: audience.topic };
      } else {
        console.log('No valid audience specified');
        await snapshot.ref.update({
          status: 'failed',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          error: 'No valid audience specified'
        });
        return null;
      }

      if (userIds.length === 0) {
        console.log('No users found to send notification to');
        await snapshot.ref.update({
          status: 'failed',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          error: 'No users found in specified audience'
        });
        return null;
      }

      // Send notifications to each user
      let successCount = 0;
      let failCount = 0;
      const results = [];

      // Use user's preferred language if available, default to English
      const title = notification.title_en || 'Notification';
      const body = notification.body_en || '';

      for (const userId of userIds) {
        try {
          // Get user document first (for language preference and flat fcmToken fallback)
          const userDoc = await db.collection('users').doc(userId).get();
          if (!userDoc.exists) {
            console.log(`User ${userId} not found`);
            failCount++;
            results.push({
              userId: userId,
              success: false,
              error: 'User not found'
            });
            continue;
          }

          const userData = userDoc.data();
          const userLang = userData.preferredLanguage || 'en';
          const finalTitle = userLang === 'ar' && notification.title_ar ? notification.title_ar : title;
          const finalBody = userLang === 'ar' && notification.body_ar ? notification.body_ar : body;

          // Try to get tokens from subcollection first (preferred)
          const tokensSnapshot = await db
            .collection(`users/${userId}/tokens`)
            .where('isActive', '==', true)
            .get();

          // Collect all tokens (subcollection + flat field fallback)
          const tokens = [];
          
          // Add tokens from subcollection
          tokensSnapshot.docs.forEach(tokenDoc => {
            const tokenData = tokenDoc.data();
            if (tokenData.token) {
              tokens.push(tokenData.token);
            }
          });

          // Fallback: If no subcollection tokens, try flat fcmToken field
          if (tokens.length === 0 && userData.fcmToken) {
            console.log(`Using flat fcmToken field for user ${userId}`);
            tokens.push(userData.fcmToken);
          }

          if (tokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            failCount++;
            results.push({
              userId: userId,
              success: false,
              error: 'No FCM tokens'
            });
            continue;
          }

          // Send to all user's tokens
          let userSuccess = false;
          for (const token of tokens) {
            try {

              const message = {
                token: token,
                notification: {
                  title: finalTitle,
                  body: finalBody,
                },
                data: {
                  projectId: projectId,
                  notificationId: notificationId,
                  type: notification.type || 'general',
                  deepLink: notification.meta?.deepLink || '',
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    icon: 'notification_icon', // Android only
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: 1,
                      'content-available': 1,
                    }
                  }
                }
              };

              const response = await admin.messaging().send(message);
              console.log(`✅ Sent push notification to user ${userId} token ${token.substring(0, 20)}...`);
              userSuccess = true;

            } catch (tokenError) {
              console.error(`❌ Error sending to token ${token.substring(0, 20)}...:`, tokenError.message);
              
              // If token is invalid and it's from subcollection, mark as inactive
              if (tokenError.code === 'messaging/invalid-registration-token' || 
                  tokenError.code === 'messaging/registration-token-not-registered') {
                // Find the token document in subcollection to mark as inactive
                const tokenDocSnapshot = await db
                  .collection(`users/${userId}/tokens`)
                  .where('token', '==', token)
                  .limit(1)
                  .get();
                
                if (!tokenDocSnapshot.empty) {
                  await tokenDocSnapshot.docs[0].ref.update({
                    isActive: false,
                    deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    deactivationReason: tokenError.message
                  });
                  console.log(`Marked token as inactive: ${token.substring(0, 20)}...`);
                }
              }
            }
          }

          if (userSuccess) {
            successCount++;
            results.push({
              userId: userId,
              success: true
            });
          } else {
            failCount++;
            results.push({
              userId: userId,
              success: false,
              error: 'Failed to send to any device'
            });
          }

        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
          failCount++;
          results.push({
            userId: userId,
            success: false,
            error: userError.message
          });
        }
      }

      // Update notification status
      console.log(`📊 Final results: ${successCount} successful, ${failCount} failed out of ${userIds.length} users`);
      
      const finalStatus = successCount > 0 ? 'sent' : 'failed';
      console.log(`📝 Updating notification document with status: ${finalStatus}`);
      
      await snapshot.ref.update({
        status: finalStatus,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sendResults: {
          totalUsers: userIds.length,
          successCount: successCount,
          failCount: failCount,
        }
      });

      console.log(`✅ Notification processing complete: ${successCount} success, ${failCount} failed`);
      return { 
        success: successCount > 0, 
        totalUsers: userIds.length,
        successCount: successCount,
        failCount: failCount 
      };

    } catch (error) {
      console.error('❌ Critical error processing notification:', error);
      console.error('Error stack:', error.stack);
      
      // Update notification status to failed
      try {
        await snapshot.ref.update({
          status: 'failed',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          error: error.message || 'Unknown error',
          errorStack: error.stack || ''
        });
        console.log('📝 Updated notification status to failed');
      } catch (updateError) {
        console.error('❌ Failed to update notification status:', updateError);
      }

      throw error;
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

// ============================================================================
// DEVICE KEY RESET REQUEST EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Generate HTML email template for device key reset requests
 */
function generateDeviceKeyResetEmail(requestData, userDetails, status) {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#10b981' : '#ef4444';
  const statusText = isApproved ? 'APPROVED' : 'REJECTED';
  const statusIcon = isApproved ? '✓' : '✗';
  
  const formattedRequestDate = requestData.requestedAt 
    ? new Date(requestData.requestedAt.toDate()).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  const formattedResolvedDate = requestData.resolvedAt
    ? new Date(requestData.resolvedAt.toDate()).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Device Key Reset Request ${statusText}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', 'Helvetica', sans-serif;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
        }
        .company-name {
          color: #ffffff;
          font-size: 32px;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .content {
          padding: 40px 30px;
        }
        .status-badge {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${statusColor};
          color: #ffffff;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-icon {
          font-size: 24px;
          margin-right: 8px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid ${statusColor};
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .info-title {
          font-size: 14px;
          font-weight: bold;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        .info-value {
          color: #6b7280;
          text-align: right;
        }
        .reason-box {
          background-color: #fef3c7;
          border: 2px solid #fbbf24;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .reason-title {
          font-size: 14px;
          font-weight: bold;
          color: #92400e;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .reason-text {
          color: #78350f;
          font-size: 15px;
          line-height: 1.5;
        }
        .admin-notes-box {
          background-color: #fee2e2;
          border: 2px solid #ef4444;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .admin-notes-title {
          font-size: 14px;
          font-weight: bold;
          color: #991b1b;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .admin-notes-text {
          color: #7f1d1d;
          font-size: 15px;
          line-height: 1.5;
        }
        .next-steps {
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .next-steps-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
        }
        .next-steps-list {
          margin: 0;
          padding-left: 20px;
          color: #1e3a8a;
        }
        .next-steps-list li {
          margin-bottom: 10px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 14px;
          margin: 5px 0;
        }
        .footer-link {
          color: #dc2626;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
          }
          .header, .content, .footer {
            padding: 20px !important;
          }
          .company-name {
            font-size: 24px !important;
          }
          .info-row {
            flex-direction: column;
          }
          .info-value {
            text-align: left;
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="${COMPANY_LOGO_URL}" alt="${COMPANY_NAME} Logo" class="logo">
          <h1 class="company-name">${COMPANY_NAME}</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Status Badge -->
          <div style="text-align: center;">
            <div class="status-badge">
              <span class="status-icon">${statusIcon}</span>
              Request ${statusText}
            </div>
          </div>

          <!-- Greeting -->
          <p class="greeting">Dear ${userDetails.firstName} ${userDetails.lastName},</p>

          <!-- Message -->
          <div class="message">
            ${isApproved 
              ? `
                <p>We are pleased to inform you that your device key reset request has been <strong>approved</strong> by our administrative team.</p>
                <p>Your device key has been successfully cleared from our system, and you can now register a new device on your next login.</p>
              `
              : `
                <p>After careful review, we regret to inform you that your device key reset request has been <strong>rejected</strong> by our administrative team.</p>
                <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team.</p>
              `
            }
          </div>

          <!-- Original Request Details -->
          <div class="info-box">
            <div class="info-title">📋 Original Request Details</div>
            <div class="info-row">
              <span class="info-label">Request ID:</span>
              <span class="info-value">${requestData.id || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Submitted On:</span>
              <span class="info-value">${formattedRequestDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Resolved On:</span>
              <span class="info-value">${formattedResolvedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
            </div>
          </div>

          <!-- User's Original Reason -->
          <div class="reason-box">
            <div class="reason-title">🔍 Your Original Request Reason</div>
            <div class="reason-text">${requestData.reason || 'No reason provided'}</div>
          </div>

          ${requestData.adminNotes ? `
            <!-- Admin Notes -->
            <div class="admin-notes-box">
              <div class="admin-notes-title">💬 Admin Comments</div>
              <div class="admin-notes-text">${requestData.adminNotes}</div>
            </div>
          ` : ''}

          ${isApproved ? `
            <!-- Next Steps for Approved -->
            <div class="next-steps">
              <div class="next-steps-title">✨ Next Steps</div>
              <ul class="next-steps-list">
                <li><strong>Login to your account</strong> on the new device you wish to use</li>
                <li>A new device key will be <strong>automatically generated</strong> upon login</li>
                <li>Your previous device will <strong>no longer have access</strong> to your account</li>
                <li>If you need to use multiple devices, please contact support</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${COMPANY_WEBSITE}" class="button">Access Your Account</a>
            </div>
          ` : `
            <!-- Next Steps for Rejected -->
            <div class="next-steps">
              <div class="next-steps-title">📞 Need Assistance?</div>
              <ul class="next-steps-list">
                <li>If you have questions about this decision, please <strong>contact our support team</strong></li>
                <li>You may submit a <strong>new request</strong> with additional information</li>
                <li>For security-related concerns, we recommend <strong>contacting us directly</strong></li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${COMPANY_WEBSITE}" class="button">Contact Support</a>
            </div>
          `}

          <div class="divider"></div>

          <!-- Security Notice -->
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>🔒 Security Notice:</strong> This email contains information about your account security. 
              If you did not submit this request, please contact our support team immediately at 
              <a href="mailto:${COMPANY_EMAIL}" style="color: #dc2626;">${COMPANY_EMAIL}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text"><strong>${COMPANY_NAME}</strong></p>
          <p class="footer-text">
            <a href="${COMPANY_WEBSITE}" class="footer-link">${COMPANY_WEBSITE}</a>
          </p>
          <p class="footer-text">
            <a href="mailto:${COMPANY_EMAIL}" class="footer-link">${COMPANY_EMAIL}</a>
          </p>
          <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
            © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
          </p>
          <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Firestore Trigger: Send email when device key reset request is approved or rejected
 * This triggers whenever a document in projects/{projectId}/deviceKeyResetRequests is updated
 */
exports.onDeviceKeyResetRequestUpdate = functions.firestore
  .document('projects/{projectId}/deviceKeyResetRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { projectId, requestId } = context.params;

    console.log(`Device key reset request updated: ${requestId} in project ${projectId}`);
    console.log('Before status:', before.status);
    console.log('After status:', after.status);

    // Only send email if status changed from 'pending' to 'approved' or 'rejected'
    if (before.status === 'pending' && (after.status === 'approved' || after.status === 'rejected')) {
      try {
        // Get user details
        const userDoc = await db.collection('users').doc(after.userId).get();
        
        if (!userDoc.exists) {
          console.error('User not found:', after.userId);
          return null;
        }

        const userData = userDoc.data();
        const userEmail = userData.email;

        if (!userEmail) {
          console.error('User email not found for user:', after.userId);
          return null;
        }

        // Get project details
        const projectDoc = await db.collection('projects').doc(projectId).get();
        const projectName = projectDoc.exists ? projectDoc.data().name : 'Your Project';

        // Prepare request data with ID
        const requestData = {
          id: requestId,
          ...after
        };

        // Generate email HTML
        const emailHtml = generateDeviceKeyResetEmail(requestData, userData, after.status);

        // Prepare email
        const mailOptions = {
          from: `${COMPANY_NAME} <${COMPANY_EMAIL}>`,
          to: userEmail,
          subject: `Device Key Reset Request ${after.status === 'approved' ? 'Approved' : 'Rejected'} - ${COMPANY_NAME}`,
          html: emailHtml,
          text: `
Dear ${userData.firstName} ${userData.lastName},

Your device key reset request has been ${after.status === 'approved' ? 'approved' : 'rejected'}.

Request Details:
- Request ID: ${requestId}
- Project: ${projectName}
- Status: ${after.status.toUpperCase()}
- Your Reason: ${after.reason || 'N/A'}
${after.adminNotes ? `- Admin Notes: ${after.adminNotes}` : ''}

${after.status === 'approved' 
  ? 'You can now login to your account on a new device. Your device key has been cleared.'
  : 'If you have questions about this decision, please contact our support team.'
}

Best regards,
${COMPANY_NAME} Team

---
This is an automated message. Please do not reply directly to this email.
          `.trim()
        };

        // Send email
        console.log(`Sending email to ${userEmail}...`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', info.messageId);
        console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));

        // Log the email send in a subcollection for audit trail
        await db.collection('emailLogs').add({
          type: 'device_key_reset_notification',
          requestId: requestId,
          projectId: projectId,
          userId: after.userId,
          userEmail: userEmail,
          status: after.status,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: info.messageId,
          success: true
        });

        return { success: true, messageId: info.messageId };

      } catch (error) {
        console.error('Error sending email:', error);
        
        // Log the error
        await db.collection('emailLogs').add({
          type: 'device_key_reset_notification',
          requestId: requestId,
          projectId: projectId,
          userId: after.userId,
          status: after.status,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          success: false,
          error: error.message
        });

        // Don't throw error - we don't want to fail the function
        return { success: false, error: error.message };
      }
    } else {
      console.log('Status change does not require email notification');
      return null;
    }
  });

// ============================================================================
// USER ACCOUNT APPROVAL/REJECTION EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Generate HTML email template for user account approval/rejection
 */
function generateUserApprovalEmail(userData, status) {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#10b981' : '#ef4444';
  const statusText = isApproved ? 'APPROVED' : 'REJECTED';
  const statusIcon = isApproved ? '✓' : '✗';
  
  const formattedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get user's projects info
  const userProjects = userData.projects || [];
  const projectsList = userProjects.map(p => `${p.projectName || 'Project'} - Unit ${p.unit || 'N/A'}`).join(', ') || 'No projects assigned';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Registration ${statusText}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', 'Helvetica', sans-serif;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
        }
        .company-name {
          color: #ffffff;
          font-size: 32px;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .content {
          padding: 40px 30px;
        }
        .status-badge {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${statusColor};
          color: #ffffff;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-icon {
          font-size: 24px;
          margin-right: 8px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid ${statusColor};
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .info-title {
          font-size: 14px;
          font-weight: bold;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        .info-value {
          color: #6b7280;
          text-align: right;
        }
        .rejection-box {
          background-color: #fee2e2;
          border: 2px solid #ef4444;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .rejection-title {
          font-size: 14px;
          font-weight: bold;
          color: #991b1b;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .rejection-text {
          color: #7f1d1d;
          font-size: 15px;
          line-height: 1.5;
        }
        .next-steps {
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .next-steps-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
        }
        .next-steps-list {
          margin: 0;
          padding-left: 20px;
          color: #1e3a8a;
        }
        .next-steps-list li {
          margin-bottom: 10px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        .welcome-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .welcome-banner h2 {
          color: #ffffff;
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        .welcome-banner p {
          color: #d1fae5;
          margin: 0;
          font-size: 16px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 14px;
          margin: 5px 0;
        }
        .footer-link {
          color: #dc2626;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
          }
          .header, .content, .footer {
            padding: 20px !important;
          }
          .company-name {
            font-size: 24px !important;
          }
          .info-row {
            flex-direction: column;
          }
          .info-value {
            text-align: left;
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="${COMPANY_LOGO_URL}" alt="${COMPANY_NAME} Logo" class="logo">
          <h1 class="company-name">${COMPANY_NAME}</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Status Badge -->
          <div style="text-align: center;">
            <div class="status-badge">
              <span class="status-icon">${statusIcon}</span>
              Account Registration ${statusText}
            </div>
          </div>

          ${isApproved ? `
            <!-- Welcome Banner for Approved Users -->
            <div class="welcome-banner">
              <h2>🎉 Welcome to ${COMPANY_NAME}!</h2>
              <p>Your account has been successfully activated</p>
            </div>
          ` : ''}

          <!-- Greeting -->
          <p class="greeting">Dear ${userData.firstName} ${userData.lastName},</p>

          <!-- Message -->
          <div class="message">
            ${isApproved 
              ? `
                <p>We are delighted to inform you that your account registration has been <strong>approved</strong> by our administrative team!</p>
                <p>You now have full access to all ${COMPANY_NAME} services and features. We're excited to have you as part of our community.</p>
              `
              : `
                <p>Thank you for your interest in joining ${COMPANY_NAME}. After careful review, we regret to inform you that your account registration has been <strong>declined</strong> at this time.</p>
                <p>If you have any questions or believe this decision was made in error, please don't hesitate to contact our support team.</p>
              `
            }
          </div>

          <!-- Account Details -->
          <div class="info-box">
            <div class="info-title">👤 Your Account Information</div>
            <div class="info-row">
              <span class="info-label">Full Name:</span>
              <span class="info-value">${userData.firstName} ${userData.lastName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${userData.email}</span>
            </div>
            ${userData.mobile ? `
              <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${userData.mobile}</span>
              </div>
            ` : ''}
            ${userProjects.length > 0 ? `
              <div class="info-row">
                <span class="info-label">Projects:</span>
                <span class="info-value">${projectsList}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Decision Date:</span>
              <span class="info-value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
            </div>
          </div>

          ${!isApproved && userData.rejectionReason ? `
            <!-- Rejection Reason -->
            <div class="rejection-box">
              <div class="rejection-title">📋 Reason for Rejection</div>
              <div class="rejection-text">${userData.rejectionReason}</div>
            </div>
          ` : ''}

          ${isApproved ? `
            <!-- Next Steps for Approved Users -->
            <div class="next-steps">
              <div class="next-steps-title">🚀 Getting Started</div>
              <ul class="next-steps-list">
                <li><strong>Download the app</strong> if you haven't already (available on iOS and Android)</li>
                <li><strong>Log in</strong> using your registered email address and password</li>
                <li><strong>Complete your profile</strong> to access all features</li>
                <li><strong>Explore services</strong> available in your community</li>
                <li><strong>Contact support</strong> if you need any assistance</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${COMPANY_WEBSITE}" class="button">Access Your Account</a>
            </div>

            <!-- Helpful Tips -->
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Pro Tip:</strong> Make sure to enable push notifications to receive important updates 
                about your community, service requests, and announcements!
              </p>
            </div>
          ` : `
            <!-- Next Steps for Rejected Users -->
            <div class="next-steps">
              <div class="next-steps-title">📞 Need Assistance?</div>
              <ul class="next-steps-list">
                <li>If you have <strong>questions about this decision</strong>, please contact our support team</li>
                <li>You may <strong>submit additional documentation</strong> or information for reconsideration</li>
                <li>For <strong>urgent matters</strong>, please reach out to us directly via phone or email</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${COMPANY_WEBSITE}" class="button">Contact Support</a>
            </div>

            <!-- Help Notice -->
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>ℹ️ We're Here to Help:</strong> Our support team is available to answer any questions 
                you may have about this decision. Please email us at 
                <a href="mailto:${COMPANY_EMAIL}" style="color: #dc2626;">${COMPANY_EMAIL}</a>
              </p>
            </div>
          `}

          <div class="divider"></div>

          <!-- Security Notice -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>🔒 Security Note:</strong> This email contains information about your account registration. 
              If you did not register for a ${COMPANY_NAME} account, please contact us immediately at 
              <a href="mailto:${COMPANY_EMAIL}" style="color: #dc2626;">${COMPANY_EMAIL}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text"><strong>${COMPANY_NAME}</strong></p>
          <p class="footer-text">
            <a href="${COMPANY_WEBSITE}" class="footer-link">${COMPANY_WEBSITE}</a>
          </p>
          <p class="footer-text">
            <a href="mailto:${COMPANY_EMAIL}" class="footer-link">${COMPANY_EMAIL}</a>
          </p>
          <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
            © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
          </p>
          <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Firestore Trigger: Send email when user account is approved or rejected
 * This triggers whenever a user document in the 'users' collection is updated
 */
exports.onUserApprovalStatusChange = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { userId } = context.params;

    console.log(`User document updated: ${userId}`);
    console.log('Before approvalStatus:', before.approvalStatus);
    console.log('After approvalStatus:', after.approvalStatus);

    // Only send email if approvalStatus changed from 'pending' to 'approved' or 'rejected'
    if (before.approvalStatus === 'pending' && (after.approvalStatus === 'approved' || after.approvalStatus === 'rejected')) {
      try {
        const userEmail = after.email;

        if (!userEmail) {
          console.error('User email not found for user:', userId);
          return null;
        }

        // Generate email HTML
        const emailHtml = generateUserApprovalEmail(after, after.approvalStatus);

        const isApproved = after.approvalStatus === 'approved';

        // Prepare email
        const mailOptions = {
          from: `${COMPANY_NAME} <${COMPANY_EMAIL}>`,
          to: userEmail,
          subject: isApproved 
            ? `🎉 Welcome to ${COMPANY_NAME} - Your Account Has Been Approved!`
            : `Account Registration Update - ${COMPANY_NAME}`,
          html: emailHtml,
          text: `
Dear ${after.firstName} ${after.lastName},

Your account registration has been ${isApproved ? 'approved' : 'rejected'}.

Account Details:
- Name: ${after.firstName} ${after.lastName}
- Email: ${after.email}
- Status: ${after.approvalStatus.toUpperCase()}
- Decision Date: ${new Date().toLocaleDateString()}
${!isApproved && after.rejectionReason ? `- Reason: ${after.rejectionReason}` : ''}

${isApproved 
  ? `Welcome to ${COMPANY_NAME}! You can now access your account and enjoy all our services. Download our app and log in with your credentials to get started.`
  : `We regret to inform you that your account registration could not be approved at this time. If you have questions, please contact our support team at ${COMPANY_EMAIL}.`
}

Best regards,
${COMPANY_NAME} Team

---
This is an automated message. Please do not reply directly to this email.
For support, contact us at ${COMPANY_EMAIL}
          `.trim()
        };

        // Send email
        console.log(`Sending account ${after.approvalStatus} email to ${userEmail}...`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', info.messageId);
        console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));

        // Log the email send in a subcollection for audit trail
        await db.collection('emailLogs').add({
          type: 'user_account_approval',
          userId: userId,
          userEmail: userEmail,
          approvalStatus: after.approvalStatus,
          rejectionReason: after.rejectionReason || null,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: info.messageId,
          success: true
        });

        return { success: true, messageId: info.messageId };

      } catch (error) {
        console.error('Error sending account approval email:', error);
        
        // Log the error
        await db.collection('emailLogs').add({
          type: 'user_account_approval',
          userId: userId,
          userEmail: after.email,
          approvalStatus: after.approvalStatus,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          success: false,
          error: error.message
        });

        // Don't throw error - we don't want to fail the function
        return { success: false, error: error.message };
      }
    } else {
      console.log('Approval status change does not require email notification');
      return null;
    }
  });
