/**
 * Example Component: Custom User Notification Demo
 * Demonstrates how to use the new user-specific notification system
 * This component shows various ways to send notifications to individual users
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  User, 
  Building2, 
  Wrench, 
  Calendar, 
  Shield, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const CustomUserNotificationExample = () => {
  const [selectedUser, setSelectedUser] = setState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    sendCustomUserNotification,
    sendMaintenanceRequestNotification,
    sendBookingConfirmationNotification,
    sendGateAccessNotification,
    sendPaymentNotification,
    sendServiceNotification,
    sendComplaintNotification,
    sendFineNotification,
    sendWelcomeNotification,
    getAvailableActionTypes
  } = useCustomUserNotifications();

  // Mock data - in real app, this would come from your data source
  const mockUsers = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user3', name: 'Ahmed Al-Rashid', email: 'ahmed@example.com' }
  ];

  const mockProjects = [
    { id: 'project1', name: 'Downtown Complex' },
    { id: 'project2', name: 'Garden Villas' },
    { id: 'project3', name: 'Business Center' }
  ];

  const handleSendCustomNotification = async () => {
    if (!selectedUser || !selectedProject || !customMessage) {
      alert('Please select a user, project, and enter a message');
      return;
    }

    setLoading(true);
    try {
      await sendCustomUserNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        actionType: 'custom_message',
        message: customMessage,
        options: {
          type: 'info',
          category: 'custom',
          priority: 'normal'
        }
      });
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending custom notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMaintenanceNotification = async () => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendMaintenanceRequestNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: 'Your maintenance request #MR-2024-001 has been received and is being processed. We will update you on the progress.',
        options: {
          requiresAction: false,
          actionUrl: '/maintenance/requests',
          actionText: 'View Request'
        }
      });
    } catch (error) {
      console.error('Error sending maintenance notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBookingNotification = async () => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendBookingConfirmationNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: 'Your booking for the tennis court on March 15th at 2:00 PM has been confirmed. Please arrive 10 minutes early.',
        options: {
          requiresAction: false,
          actionUrl: '/bookings',
          actionText: 'View Booking'
        }
      });
    } catch (error) {
      console.error('Error sending booking notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendGateAccessNotification = async (approved = true) => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendGateAccessNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: approved 
          ? 'Your gate access request has been approved. You can now use the main gate with your access card.'
          : 'Your gate access request has been denied. Please contact the management office for more information.',
        approved,
        options: {
          requiresAction: !approved,
          actionUrl: approved ? '/access' : '/contact',
          actionText: approved ? 'View Access' : 'Contact Support'
        }
      });
    } catch (error) {
      console.error('Error sending gate access notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentNotification = async (success = true) => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendPaymentNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: success
          ? 'Your payment of $150.00 has been successfully processed. Thank you for your payment.'
          : 'Your payment of $150.00 could not be processed. Please check your payment method and try again.',
        success,
        options: {
          requiresAction: !success,
          actionUrl: success ? '/payments' : '/payments/retry',
          actionText: success ? 'View Receipt' : 'Retry Payment'
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendServiceNotification = async (status = 'scheduled') => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendServiceNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: status === 'scheduled'
          ? 'Your cleaning service has been scheduled for tomorrow at 10:00 AM. Our team will arrive at your unit.'
          : status === 'completed'
          ? 'Your cleaning service has been completed. Please check your unit and let us know if you need anything else.'
          : 'Your cleaning service scheduled for tomorrow has been cancelled. We will contact you to reschedule.',
        status,
        options: {
          requiresAction: status === 'completed',
          actionUrl: '/services',
          actionText: status === 'completed' ? 'Rate Service' : 'View Services'
        }
      });
    } catch (error) {
      console.error('Error sending service notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComplaintNotification = async (status = 'received') => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendComplaintNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: status === 'received'
          ? 'We have received your complaint about the noise issue. Our team is investigating and will get back to you within 24 hours.'
          : 'Your complaint about the noise issue has been resolved. The management has addressed the problem with the neighbor.',
        status,
        options: {
          requiresAction: status === 'received',
          actionUrl: '/complaints',
          actionText: status === 'received' ? 'View Complaint' : 'Close Complaint'
        }
      });
    } catch (error) {
      console.error('Error sending complaint notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFineNotification = async (paid = false) => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendFineNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: paid
          ? 'Your fine of $50.00 has been paid successfully. Thank you for your payment.'
          : 'A fine of $50.00 has been issued for parking violation. Please pay within 7 days to avoid additional charges.',
        paid,
        options: {
          requiresAction: !paid,
          actionUrl: paid ? '/fines' : '/fines/pay',
          actionText: paid ? 'View Receipt' : 'Pay Fine'
        }
      });
    } catch (error) {
      console.error('Error sending fine notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeNotification = async () => {
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await sendWelcomeNotification({
        userId: selectedUser,
        projectId: selectedProject.id,
        message: `Welcome to ${selectedProject.name}! We're excited to have you as part of our community. Please explore the app to discover all available services and features.`,
        options: {
          requiresAction: true,
          actionUrl: '/welcome',
          actionText: 'Get Started'
        }
      });
    } catch (error) {
      console.error('Error sending welcome notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <Bell className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom User Notifications Demo</h1>
            <p className="text-gray-600">Test the new user-specific notification system</p>
          </div>
        </div>

        {/* User and Project Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = mockUsers.find(u => u.id === e.target.value);
                setSelectedUser(user);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {mockUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = mockProjects.find(p => p.id === e.target.value);
                setSelectedProject(project);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a project...</option>
              {mockProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter a custom message for the notification..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      {/* Notification Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Maintenance Request */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <Wrench className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Maintenance Request</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send a maintenance request notification to the user
          </p>
          <button
            onClick={handleSendMaintenanceNotification}
            disabled={!selectedUser || !selectedProject || loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Maintenance Notification
          </button>
        </div>

        {/* Booking Confirmation */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Booking Confirmation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send a booking confirmation notification
          </p>
          <button
            onClick={handleSendBookingNotification}
            disabled={!selectedUser || !selectedProject || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Booking Notification
          </button>
        </div>

        {/* Gate Access */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Gate Access</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send gate access approval/denial notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSendGateAccessNotification(true)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Send Approval
            </button>
            <button
              onClick={() => handleSendGateAccessNotification(false)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Send Denial
            </button>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Payment</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send payment success/failure notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSendPaymentNotification(true)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Payment Success
            </button>
            <button
              onClick={() => handleSendPaymentNotification(false)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Payment Failed
            </button>
          </div>
        </div>

        {/* Service */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Service</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send service status notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSendServiceNotification('scheduled')}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Service Scheduled
            </button>
            <button
              onClick={() => handleSendServiceNotification('completed')}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Service Completed
            </button>
          </div>
        </div>

        {/* Complaint */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Complaint</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send complaint status notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSendComplaintNotification('received')}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Complaint Received
            </button>
            <button
              onClick={() => handleSendComplaintNotification('resolved')}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Complaint Resolved
            </button>
          </div>
        </div>

        {/* Fine */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Fine</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send fine issued/paid notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSendFineNotification(false)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Fine Issued
            </button>
            <button
              onClick={() => handleSendFineNotification(true)}
              disabled={!selectedUser || !selectedProject || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Fine Paid
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Welcome</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send a welcome notification to new users
          </p>
          <button
            onClick={handleSendWelcomeNotification}
            disabled={!selectedUser || !selectedProject || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Welcome Notification
          </button>
        </div>

        {/* Custom Notification */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-3">
            <Send className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Custom Message</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send a custom notification with your own message
          </p>
          <button
            onClick={handleSendCustomNotification}
            disabled={!selectedUser || !selectedProject || !customMessage || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Custom Notification
          </button>
        </div>
      </div>

      {/* Available Action Types */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-2" />
          Available Action Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {getAvailableActionTypes().map(actionType => (
            <span
              key={actionType}
              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {actionType.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomUserNotificationExample;
