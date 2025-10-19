/**
 * Integration Example: Adding Custom User Notifications to Existing Components
 * This shows how to integrate the new notification system into existing components
 * without breaking existing functionality
 */

import React, { useState } from 'react';
import { Send, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

// Example: Existing component that handles maintenance requests
const MaintenanceRequestForm = () => {
  const [formData, setFormData] = useState({
    userId: '',
    projectId: '',
    issue: '',
    description: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Add the custom notification hook
  const { sendMaintenanceRequestNotification } = useCustomUserNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Simulate API call to submit maintenance request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate request ID (in real app, this would come from API)
      const requestId = `MR-${Date.now()}`;
      
      // Send notification to user about their request
      await sendMaintenanceRequestNotification({
        userId: formData.userId,
        projectId: formData.projectId,
        message: `Your maintenance request #${requestId} has been submitted successfully. We will review it and contact you within 24 hours.`,
        options: {
          requiresAction: false,
          actionUrl: `/maintenance/requests/${requestId}`,
          actionText: 'View Request',
          metadata: {
            requestId,
            issue: formData.issue,
            priority: formData.priority
          }
        }
      });

      setSuccess(true);
      setFormData({ userId: '', projectId: '', issue: '', description: '', priority: 'normal' });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
        Maintenance Request
      </h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">Request submitted successfully! Check your notifications.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Type
          </label>
          <select
            value={formData.issue}
            onChange={(e) => setFormData(prev => ({ ...prev, issue: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select issue type</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="appliance">Appliance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the issue in detail"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// Example: Existing component that handles booking confirmations
const BookingConfirmation = () => {
  const [bookingData, setBookingData] = useState({
    userId: '',
    projectId: '',
    facility: '',
    date: '',
    time: ''
  });
  const [loading, setLoading] = useState(false);

  const { sendBookingConfirmationNotification } = useCustomUserNotifications();

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Simulate booking confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send confirmation notification
      await sendBookingConfirmationNotification({
        userId: bookingData.userId,
        projectId: bookingData.projectId,
        message: `Your booking for ${bookingData.facility} on ${bookingData.date} at ${bookingData.time} has been confirmed. Please arrive 10 minutes early.`,
        options: {
          requiresAction: false,
          actionUrl: `/bookings`,
          actionText: 'View Bookings',
          metadata: {
            facility: bookingData.facility,
            date: bookingData.date,
            time: bookingData.time
          }
        }
      });
      
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        Booking Confirmation
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            type="text"
            value={bookingData.userId}
            onChange={(e) => setBookingData(prev => ({ ...prev, userId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={bookingData.projectId}
            onChange={(e) => setBookingData(prev => ({ ...prev, projectId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facility
          </label>
          <input
            type="text"
            value={bookingData.facility}
            onChange={(e) => setBookingData(prev => ({ ...prev, facility: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Tennis Court, Swimming Pool"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={bookingData.date}
            onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <input
            type="time"
            value={bookingData.time}
            onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={loading || !bookingData.userId || !bookingData.projectId || !bookingData.facility}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main integration example component
const NotificationIntegrationExample = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Integration Examples
        </h1>
        <p className="text-gray-600">
          Examples of how to integrate custom user notifications into existing components
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MaintenanceRequestForm />
        <BookingConfirmation />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Integration Notes
        </h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• The notification system integrates seamlessly with existing components</li>
          <li>• No changes needed to existing notification functionality</li>
          <li>• Simply import the hook and add notification calls after successful actions</li>
          <li>• All error handling and UI feedback is handled automatically</li>
          <li>• Notifications are stored in the same database as existing notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationIntegrationExample;
