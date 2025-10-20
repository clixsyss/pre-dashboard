/**
 * Custom User-Specific Notification Service
 * Extends the existing notification system to support targeted user notifications
 * for specific actions like maintenance requests, gate access approvals, bookings, etc.
 * 
 * This service maintains compatibility with the existing notification architecture
 * while providing a clean, reusable interface for user-specific notifications.
 */

import { serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
import notificationService from './notificationService';
import mobilePushService from './mobilePushService';

class CustomUserNotificationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize the base notification service
      await notificationService.initialize();
      
      // Initialize mobile push service
      await mobilePushService.initialize();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing custom user notification service:', error);
      throw error;
    }
  }

  /**
   * Send a custom notification to a specific user
   * 
   * @param {Object} params - Notification parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.actionType - Type of action (e.g., 'maintenance_request', 'booking_confirmed')
   * @param {string} params.message - Notification message
   * @param {Object} params.options - Additional options
   * @param {string} params.options.title - Custom title (optional)
   * @param {string} params.options.type - Notification type (default: 'info')
   * @param {string} params.options.category - Notification category (default: 'user_action')
   * @param {string} params.options.priority - Priority level (default: 'normal')
   * @param {boolean} params.options.requiresAction - Whether user action is required (default: false)
   * @param {string} params.options.actionUrl - URL for action (optional)
   * @param {string} params.options.actionText - Text for action button (optional)
   * @param {string} params.options.imageUrl - Image URL (optional)
   * @param {Object} params.options.metadata - Additional metadata (optional)
   * @returns {Promise<string>} Notification ID
   */
  async sendCustomUserNotification({
    userId,
    projectId,
    actionType,
    message,
    options = {}
  }) {
    try {
      // Validate required parameters
      if (!userId) {
        throw new Error('userId is required');
      }
      if (!projectId) {
        throw new Error('projectId is required');
      }
      if (!actionType) {
        throw new Error('actionType is required');
      }
      if (!message) {
        throw new Error('message is required');
      }

      // Initialize if not already done
      await this.initialize();

      // Extract user ID if user object is provided
      const targetUserId = typeof userId === 'string' ? userId : userId.id || userId.uid;

      // Get user information if user object is provided
      let userInfo = {};
      if (typeof userId === 'object' && userId !== null) {
        userInfo = {
          userName: userId.name || userId.firstName + ' ' + userId.lastName || 'User',
          userEmail: userId.email || null,
          userPhone: userId.phone || null
        };
      }

      // Generate title based on action type if not provided
      const title = options.title || this.generateTitleFromActionType(actionType);

      // Prepare notification data
      const notificationData = {
        title: title,
        message: message,
        type: options.type || 'info',
        category: options.category || 'user_action',
        priority: options.priority || 'normal',
        userId: targetUserId,
        projectId: projectId,
        read: false,
        actionType: actionType,
        requiresAction: options.requiresAction || false,
        actionUrl: options.actionUrl || null,
        actionText: options.actionText || null,
        imageUrl: options.imageUrl || null,
        metadata: {
          ...userInfo,
          ...options.metadata,
          sentAt: new Date().toISOString(),
          source: 'custom_user_notification'
        },
        createdAt: serverTimestamp()
      };

      // Use the existing notification service to send the notification
      const notificationId = await notificationService.sendNotification(projectId, notificationData);

      // Send mobile push notification
      try {
        const pushResult = await mobilePushService.sendPushNotification(
          targetUserId,
          projectId,
          {
            title: title,
            message: message,
            actionType: actionType,
            projectId: projectId,
            userId: targetUserId,
            category: notificationData.category,
            priority: notificationData.priority,
            requiresAction: notificationData.requiresAction,
            actionUrl: notificationData.actionUrl,
            actionText: notificationData.actionText,
            imageUrl: notificationData.imageUrl,
            metadata: notificationData.metadata
          }
        );

        console.log('Mobile push notification result:', pushResult);
      } catch (pushError) {
        console.warn('Failed to send mobile push notification:', pushError);
        // Don't throw error - in-app notification was successful
      }

      // Log the notification for debugging
      console.log(`Custom user notification sent:`, {
        notificationId,
        userId: targetUserId,
        projectId,
        actionType,
        message: message.substring(0, 50) + '...'
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending custom user notification:', error);
      throw error;
    }
  }

  /**
   * Generate a user-friendly title based on action type
   * @param {string} actionType - The action type
   * @returns {string} Generated title
   */
  generateTitleFromActionType(actionType) {
    const titleMap = {
      'maintenance_request': 'Maintenance Request Update',
      'booking_confirmed': 'Booking Confirmed',
      'booking_cancelled': 'Booking Cancelled',
      'gate_access_approved': 'Gate Access Approved',
      'gate_access_denied': 'Gate Access Denied',
      'payment_received': 'Payment Received',
      'payment_failed': 'Payment Failed',
      'service_completed': 'Service Completed',
      'service_scheduled': 'Service Scheduled',
      'complaint_received': 'Complaint Received',
      'complaint_resolved': 'Complaint Resolved',
      'fine_issued': 'Fine Issued',
      'fine_paid': 'Fine Paid',
      'news_comment': 'New Comment on News',
      'event_reminder': 'Event Reminder',
      'announcement': 'New Announcement',
      'system_alert': 'System Alert',
      'welcome': 'Welcome!',
      'account_updated': 'Account Updated',
      'password_reset': 'Password Reset'
    };

    return titleMap[actionType] || 'Notification';
  }

  /**
   * Send a maintenance request notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendMaintenanceRequestNotification({ userId, projectId, message, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: 'maintenance_request',
      message,
      options: {
        type: 'info',
        category: 'maintenance',
        priority: 'normal',
        ...options
      }
    });
  }

  /**
   * Send a booking confirmation notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendBookingConfirmationNotification({ userId, projectId, message, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: 'booking_confirmed',
      message,
      options: {
        type: 'success',
        category: 'booking',
        priority: 'normal',
        ...options
      }
    });
  }

  /**
   * Send a gate access approval notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendGateAccessNotification({ userId, projectId, message, approved = true, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: approved ? 'gate_access_approved' : 'gate_access_denied',
      message,
      options: {
        type: approved ? 'success' : 'warning',
        category: 'access',
        priority: 'high',
        ...options
      }
    });
  }

  /**
   * Send a payment notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {boolean} params.success - Whether payment was successful
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendPaymentNotification({ userId, projectId, message, success = true, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: success ? 'payment_received' : 'payment_failed',
      message,
      options: {
        type: success ? 'success' : 'error',
        category: 'payment',
        priority: success ? 'normal' : 'high',
        ...options
      }
    });
  }

  /**
   * Send a service notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {string} params.status - Service status ('scheduled', 'completed', 'cancelled')
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendServiceNotification({ userId, projectId, message, status = 'scheduled', options = {} }) {
    const actionTypeMap = {
      'scheduled': 'service_scheduled',
      'completed': 'service_completed',
      'cancelled': 'service_cancelled'
    };

    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: actionTypeMap[status] || 'service_scheduled',
      message,
      options: {
        type: status === 'completed' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
        category: 'service',
        priority: 'normal',
        ...options
      }
    });
  }

  /**
   * Send a complaint notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {string} params.status - Complaint status ('received', 'resolved')
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendComplaintNotification({ userId, projectId, message, status = 'received', options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: status === 'received' ? 'complaint_received' : 'complaint_resolved',
      message,
      options: {
        type: status === 'resolved' ? 'success' : 'info',
        category: 'complaint',
        priority: 'normal',
        ...options
      }
    });
  }

  /**
   * Send a fine notification
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {boolean} params.paid - Whether fine is paid
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendFineNotification({ userId, projectId, message, paid = false, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: paid ? 'fine_paid' : 'fine_issued',
      message,
      options: {
        type: paid ? 'success' : 'warning',
        category: 'fine',
        priority: paid ? 'normal' : 'high',
        requiresAction: !paid,
        ...options
      }
    });
  }

  /**
   * Send a welcome notification for new users
   * @param {Object} params - Parameters
   * @param {string|Object} params.userId - User ID or user object
   * @param {string} params.projectId - Project ID
   * @param {string} params.message - Message
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Notification ID
   */
  async sendWelcomeNotification({ userId, projectId, message, options = {} }) {
    return this.sendCustomUserNotification({
      userId,
      projectId,
      actionType: 'welcome',
      message,
      options: {
        type: 'success',
        category: 'welcome',
        priority: 'normal',
        ...options
      }
    });
  }

  /**
   * Get all available action types
   * @returns {Array<string>} Array of action types
   */
  getAvailableActionTypes() {
    return [
      'maintenance_request',
      'booking_confirmed',
      'booking_cancelled',
      'gate_access_approved',
      'gate_access_denied',
      'payment_received',
      'payment_failed',
      'service_completed',
      'service_scheduled',
      'complaint_received',
      'complaint_resolved',
      'fine_issued',
      'fine_paid',
      'news_comment',
      'event_reminder',
      'announcement',
      'system_alert',
      'welcome',
      'account_updated',
      'password_reset'
    ];
  }
}

// Create and export a singleton instance
const customUserNotificationService = new CustomUserNotificationService();
export default customUserNotificationService;
