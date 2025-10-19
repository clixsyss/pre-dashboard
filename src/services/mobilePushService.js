/**
 * Mobile Push Notification Service
 * Sends actual push notifications to mobile devices using Firebase Cloud Messaging
 * This service integrates with the existing notification system
 */

import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

class MobilePushService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendPushNotification(userId, projectId, notificationData) {
    try {
      // Instead of trying to access user tokens directly (which requires permissions),
      // we'll create a push notification record that will be processed by Cloud Functions
      // The Cloud Functions have admin privileges and can access user tokens
      
      const pushNotificationRecord = {
        userId: userId,
        projectId: projectId,
        title: notificationData.title,
        message: notificationData.message,
        actionType: notificationData.actionType || 'general',
        category: notificationData.category || 'general',
        priority: notificationData.priority || 'normal',
        requiresAction: notificationData.requiresAction || false,
        actionUrl: notificationData.actionUrl || null,
        actionText: notificationData.actionText || null,
        imageUrl: notificationData.imageUrl || null,
        metadata: notificationData.metadata || {},
        status: 'pending',
        createdAt: serverTimestamp(),
        scheduledFor: null,
        retryCount: 0,
        maxRetries: 3
      };

      // Add to push notifications queue
      const docRef = await addDoc(collection(db, 'pushNotifications'), pushNotificationRecord);
      
      console.log('Push notification queued for delivery:', docRef.id);
      
      return {
        success: true,
        messageId: docRef.id,
        message: 'Push notification queued for delivery',
        totalTokens: 'unknown', // Will be determined by Cloud Functions
        successfulSends: 'pending' // Will be determined by Cloud Functions
      };
    } catch (error) {
      console.error('Error queuing push notification:', error);
      throw error;
    }
  }

  /**
   * Get all FCM tokens for a user in a project
   * Note: This function requires admin privileges and should only be used in Cloud Functions
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of tokens
   */
  async getUserTokens(userId, projectId) {
    try {
      const tokensQuery = query(
        collection(db, `users/${userId}/tokens`),
        where('isActive', '==', true)
      );

      const tokensSnapshot = await getDocs(tokensQuery);
      return tokensSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.warn('Cannot access user tokens from client (requires admin privileges):', error.message);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Send notification to a specific device token
   * This would typically call a backend API that uses Firebase Admin SDK
   * For now, we'll create a notification record that can be processed by a backend service
   * @param {Object} tokenData - Token data
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(tokenData, notificationData) {
    try {
      // Create a push notification record in Firestore
      // This will be processed by a backend service or Cloud Function
      const pushNotificationRecord = {
        userId: tokenData.userId,
        projectId: tokenData.projectId,
        token: tokenData.token,
        platform: tokenData.platform || 'unknown',
        title: notificationData.title,
        message: notificationData.message,
        actionType: notificationData.actionType,
        category: notificationData.category || 'general',
        priority: notificationData.priority || 'normal',
        requiresAction: notificationData.requiresAction || false,
        actionUrl: notificationData.actionUrl || null,
        actionText: notificationData.actionText || null,
        imageUrl: notificationData.imageUrl || null,
        metadata: notificationData.metadata || {},
        status: 'pending',
        createdAt: serverTimestamp(),
        scheduledFor: null,
        retryCount: 0,
        maxRetries: 3
      };

      // Add to push notifications queue
      const docRef = await addDoc(collection(db, 'pushNotifications'), pushNotificationRecord);
      
      console.log('Push notification queued:', docRef.id);
      
      return {
        success: true,
        messageId: docRef.id,
        message: 'Push notification queued for delivery'
      };
    } catch (error) {
      console.error('Error queuing push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {string} projectId - Project ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send results
   */
  async sendBulkPushNotification(userIds, projectId, notificationData) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.sendPushNotification(userId, projectId, notificationData);
          results.push({ userId, ...result });
        } catch (error) {
          console.error(`Error queuing notification for user ${userId}:`, error);
          results.push({ 
            userId, 
            success: false, 
            error: error.message 
          });
        }
      }

      return {
        success: results.some(r => r.success),
        results,
        totalUsers: userIds.length,
        successfulSends: results.filter(r => r.success).length
      };
    } catch (error) {
      console.error('Error sending bulk push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all users in a project
   * @param {string} projectId - Project ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send results
   */
  async sendProjectWidePushNotification(projectId, notificationData) {
    try {
      // Create a project-wide notification record
      // The Cloud Functions will handle getting all users and their tokens
      const pushNotificationRecord = {
        projectId: projectId,
        title: notificationData.title,
        message: notificationData.message,
        actionType: notificationData.actionType || 'project_announcement',
        category: notificationData.category || 'general',
        priority: notificationData.priority || 'normal',
        requiresAction: notificationData.requiresAction || false,
        actionUrl: notificationData.actionUrl || null,
        actionText: notificationData.actionText || null,
        imageUrl: notificationData.imageUrl || null,
        metadata: {
          ...notificationData.metadata,
          isProjectWide: true
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        scheduledFor: null,
        retryCount: 0,
        maxRetries: 3
      };

      // Add to push notifications queue
      const docRef = await addDoc(collection(db, 'pushNotifications'), pushNotificationRecord);
      
      console.log('Project-wide push notification queued for delivery:', docRef.id);
      
      return {
        success: true,
        messageId: docRef.id,
        message: 'Project-wide push notification queued for delivery',
        totalUsers: 'unknown', // Will be determined by Cloud Functions
        successfulSends: 'pending' // Will be determined by Cloud Functions
      };
    } catch (error) {
      console.error('Error queuing project-wide push notification:', error);
      throw error;
    }
  }

  /**
   * Get push notification statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Statistics
   */
  async getPushNotificationStats(projectId) {
    try {
      // Count notifications sent today (this we can access)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const notificationsQuery = query(
        collection(db, 'pushNotifications'),
        where('projectId', '==', projectId),
        where('createdAt', '>=', today)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const sentToday = notificationsSnapshot.size;

      // For user and token statistics, we'll return basic info
      // Detailed stats would require admin privileges or Cloud Functions
      return {
        totalUsers: 'requires_admin_access',
        usersWithTokens: 'requires_admin_access',
        sentToday,
        tokenCoverage: 'requires_admin_access',
        message: 'Detailed statistics require admin privileges. Use Cloud Functions for full stats.'
      };
    } catch (error) {
      console.error('Error getting push notification stats:', error);
      return {
        totalUsers: 0,
        usersWithTokens: 0,
        sentToday: 0,
        tokenCoverage: 0,
        message: 'Error retrieving statistics'
      };
    }
  }
}

// Create and export singleton instance
const mobilePushService = new MobilePushService();
export default mobilePushService;
