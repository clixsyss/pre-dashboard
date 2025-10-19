/**
 * React Hook for Custom User Notifications
 * Provides an easy-to-use interface for sending user-specific notifications
 * from React components
 */

import { useCallback } from 'react';
import customUserNotificationService from '../services/customUserNotificationService';
import { useUINotificationStore } from '../stores/uiNotificationStore';

/**
 * Custom hook for sending user-specific notifications
 * @returns {Object} Hook interface with notification methods
 */
export const useCustomUserNotifications = () => {
  const { addNotification: addUINotification } = useUINotificationStore();

  /**
   * Send a custom user notification
   * @param {Object} params - Notification parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendCustomUserNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendCustomUserNotification(params);
      
      // Show success UI notification
      addUINotification(
        `Notification sent successfully to user`,
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending custom user notification:', error);
      
      // Show error UI notification
      addUINotification(
        `Failed to send notification: ${error.message}`,
        'error',
        5000
      );
      
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send maintenance request notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendMaintenanceRequestNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendMaintenanceRequestNotification(params);
      
      addUINotification(
        'Maintenance request notification sent',
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending maintenance request notification:', error);
      addUINotification(
        `Failed to send maintenance notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send booking confirmation notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendBookingConfirmationNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendBookingConfirmationNotification(params);
      
      addUINotification(
        'Booking confirmation sent',
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending booking confirmation notification:', error);
      addUINotification(
        `Failed to send booking confirmation: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send gate access notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendGateAccessNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendGateAccessNotification(params);
      
      addUINotification(
        `Gate access ${params.approved ? 'approval' : 'denial'} sent`,
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending gate access notification:', error);
      addUINotification(
        `Failed to send gate access notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send payment notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendPaymentNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendPaymentNotification(params);
      
      addUINotification(
        `Payment ${params.success ? 'success' : 'failure'} notification sent`,
        params.success ? 'success' : 'warning',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending payment notification:', error);
      addUINotification(
        `Failed to send payment notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send service notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendServiceNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendServiceNotification(params);
      
      addUINotification(
        `Service ${params.status} notification sent`,
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending service notification:', error);
      addUINotification(
        `Failed to send service notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send complaint notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendComplaintNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendComplaintNotification(params);
      
      addUINotification(
        `Complaint ${params.status} notification sent`,
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending complaint notification:', error);
      addUINotification(
        `Failed to send complaint notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send fine notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendFineNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendFineNotification(params);
      
      addUINotification(
        `Fine ${params.paid ? 'payment' : 'issued'} notification sent`,
        params.paid ? 'success' : 'warning',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending fine notification:', error);
      addUINotification(
        `Failed to send fine notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Send welcome notification
   * @param {Object} params - Parameters
   * @returns {Promise<string>} Notification ID
   */
  const sendWelcomeNotification = useCallback(async (params) => {
    try {
      const notificationId = await customUserNotificationService.sendWelcomeNotification(params);
      
      addUINotification(
        'Welcome notification sent',
        'success',
        3000
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error sending welcome notification:', error);
      addUINotification(
        `Failed to send welcome notification: ${error.message}`,
        'error',
        5000
      );
      throw error;
    }
  }, [addUINotification]);

  /**
   * Get available action types
   * @returns {Array<string>} Available action types
   */
  const getAvailableActionTypes = useCallback(() => {
    return customUserNotificationService.getAvailableActionTypes();
  }, []);

  return {
    // Main function
    sendCustomUserNotification,
    
    // Convenience methods
    sendMaintenanceRequestNotification,
    sendBookingConfirmationNotification,
    sendGateAccessNotification,
    sendPaymentNotification,
    sendServiceNotification,
    sendComplaintNotification,
    sendFineNotification,
    sendWelcomeNotification,
    
    // Utility methods
    getAvailableActionTypes
  };
};

export default useCustomUserNotifications;
