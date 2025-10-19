/**
 * Dashboard Acceptance Notification Component
 * Sends user-friendly notifications when users accept or approve something from the dashboard
 * Integrates with the existing custom user notification system
 */

import React, { useState } from 'react';
import { CheckCircle, Send, User, MessageSquare, AlertCircle } from 'lucide-react';
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const DashboardAcceptanceNotification = ({ 
  projectId, 
  currentAdmin, 
  onNotificationSent 
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [actionType, setActionType] = useState('approval_confirmed');
  const [isLoading, setIsLoading] = useState(false);

  const { sendCustomUserNotification } = useCustomUserNotifications();

  // Load template when action type changes
  React.useEffect(() => {
    const template = notificationTemplates[actionType];
    if (template) {
      setNotificationMessage(template.message);
    }
  }, [actionType]);

  // Handle sending notification
  const handleSendNotification = async () => {
    if (!selectedUserId || !notificationMessage.trim()) {
      alert('Please select a user and enter a message');
      return;
    }

    if (!projectId) {
      alert('Project ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const template = notificationTemplates[actionType];
      
      await sendCustomUserNotification({
        userId: selectedUserId,
        projectId: projectId,
        actionType: actionType,
        message: notificationMessage,
        options: {
          title: template.title,
          type: template.type,
          category: 'dashboard_approval',
          priority: template.priority,
          requiresAction: template.requiresAction,
          actionUrl: template.actionUrl,
          actionText: template.actionText,
          metadata: {
            sentFrom: 'dashboard',
            adminId: currentAdmin?.id || 'unknown',
            adminName: currentAdmin?.name || 'Admin',
            adminEmail: currentAdmin?.email || 'unknown@example.com',
            timestamp: new Date().toISOString()
          }
        }
      });

      // Call callback if provided
      if (onNotificationSent) {
        onNotificationSent({
          userId: selectedUserId,
          actionType: actionType,
          message: notificationMessage
        });
      }

      // Reset form
      setSelectedUserId('');
      setNotificationMessage('');
      setActionType('approval_confirmed');

    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick send functions for common actions
  const quickSendApproval = async (userId, customMessage = null) => {
    const template = notificationTemplates.approval_confirmed;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'approval_confirmed',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'dashboard_approval',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  const quickSendMaintenanceApproval = async (userId, customMessage = null) => {
    const template = notificationTemplates.maintenance_approved;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'maintenance_approved',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'maintenance',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  const quickSendBookingConfirmation = async (userId, customMessage = null) => {
    const template = notificationTemplates.booking_confirmed;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'booking_confirmed',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'booking',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Send Approval Notification</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Type
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(notificationTemplates).map(([key, template]) => (
              <option key={key} value={key}>
                {template.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notification message"
          />
        </div>

        <button
          onClick={handleSendNotification}
          disabled={!selectedUserId || !notificationMessage.trim() || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </>
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(notificationTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => {
                setActionType(key);
                setNotificationMessage(template.message);
              }}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{template.title}</p>
                  <p className="text-xs text-gray-600 line-clamp-1">{template.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Predefined notification templates for common dashboard actions
const notificationTemplates = {
  approval_confirmed: {
    title: 'Request Approved!',
    message: 'Your request has been approved by the admin. You can now proceed with your request.',
    actionUrl: '/requests',
    actionText: 'View Request',
    requiresAction: true,
    type: 'success',
    priority: 'normal'
  },
  maintenance_approved: {
    title: 'Maintenance Request Approved',
    message: 'Your maintenance request has been approved and scheduled. Our team will contact you soon.',
    actionUrl: '/maintenance',
    actionText: 'View Details',
    requiresAction: false,
    type: 'success',
    priority: 'normal'
  },
  booking_confirmed: {
    title: 'Booking Confirmed',
    message: 'Your booking has been confirmed by the admin. Please arrive 10 minutes early.',
    actionUrl: '/bookings',
    actionText: 'View Booking',
    requiresAction: false,
    type: 'success',
    priority: 'normal'
  },
  payment_approved: {
    title: 'Payment Approved',
    message: 'Your payment has been approved and processed successfully. Thank you for your payment.',
    actionUrl: '/payments',
    actionText: 'View Receipt',
    requiresAction: false,
    type: 'success',
    priority: 'normal'
  },
  gate_access_approved: {
    title: 'Gate Access Approved',
    message: 'Your gate access request has been approved. You can now use the main gate with your access card.',
    actionUrl: '/access',
    actionText: 'View Access',
    requiresAction: true,
    type: 'success',
    priority: 'high'
  },
  complaint_resolved: {
    title: 'Complaint Resolved',
    message: 'Your complaint has been reviewed and resolved by our team. Thank you for your feedback.',
    actionUrl: '/complaints',
    actionText: 'View Resolution',
    requiresAction: false,
    type: 'success',
    priority: 'normal'
  },
  fine_paid: {
    title: 'Fine Payment Confirmed',
    message: 'Your fine payment has been confirmed and processed. The fine has been cleared from your account.',
    actionUrl: '/fines',
    actionText: 'View Receipt',
    requiresAction: false,
    type: 'success',
    priority: 'normal'
  },
  service_scheduled: {
    title: 'Service Scheduled',
    message: 'Your service request has been approved and scheduled. Our team will arrive at the specified time.',
    actionUrl: '/services',
    actionText: 'View Schedule',
    requiresAction: false,
    type: 'info',
    priority: 'normal'
  }
};

// Export the quick send functions for use in other components
export const useQuickNotifications = (projectId, currentAdmin) => {
  const { sendCustomUserNotification } = useCustomUserNotifications();

  const quickSendApproval = async (userId, customMessage = null) => {
    const template = notificationTemplates.approval_confirmed;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'approval_confirmed',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'dashboard_approval',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  const quickSendMaintenanceApproval = async (userId, customMessage = null) => {
    const template = notificationTemplates.maintenance_approved;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'maintenance_approved',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'maintenance',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  const quickSendBookingConfirmation = async (userId, customMessage = null) => {
    const template = notificationTemplates.booking_confirmed;
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'booking_confirmed',
      message: customMessage || template.message,
      options: {
        title: template.title,
        type: template.type,
        category: 'booking',
        priority: template.priority,
        requiresAction: template.requiresAction,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
        metadata: {
          sentFrom: 'dashboard',
          adminId: currentAdmin?.id || 'unknown',
          adminName: currentAdmin?.name || 'Admin',
          timestamp: new Date().toISOString()
        }
      }
    });
  };

  return {
    quickSendApproval,
    quickSendMaintenanceApproval,
    quickSendBookingConfirmation
  };
};

export default DashboardAcceptanceNotification;
