/**
 * Dashboard Notification Integration Example
 * Shows how to integrate user-friendly notifications when users accept/approve actions
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, User, Bell } from 'lucide-react';
import DashboardAcceptanceNotification, { useQuickNotifications } from './DashboardAcceptanceNotification';

const DashboardNotificationExample = ({ projectId, currentAdmin }) => {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // Use the quick notification functions
  const { quickSendApproval, quickSendMaintenanceApproval, quickSendBookingConfirmation } = 
    useQuickNotifications(projectId, currentAdmin);

  // Mock data for demonstration
  const pendingRequests = [
    {
      id: 'req1',
      userId: 'user123',
      userName: 'John Doe',
      type: 'maintenance',
      description: 'Fix leaky faucet in kitchen',
      status: 'pending',
      submittedAt: new Date()
    },
    {
      id: 'req2',
      userId: 'user456',
      userName: 'Jane Smith',
      type: 'booking',
      description: 'Tennis court booking for Saturday',
      status: 'pending',
      submittedAt: new Date()
    },
    {
      id: 'req3',
      userId: 'user789',
      userName: 'Ahmed Al-Rashid',
      type: 'gate_access',
      description: 'Request for guest access',
      status: 'pending',
      submittedAt: new Date()
    }
  ];

  // Handle approving a request
  const handleApproveRequest = async (request) => {
    try {
      // Your existing approval logic here
      console.log(`Approving request ${request.id} for user ${request.userId}`);
      
      // Send appropriate notification based on request type
      switch (request.type) {
        case 'maintenance':
          await quickSendMaintenanceApproval(
            request.userId, 
            `Your maintenance request "${request.description}" has been approved and scheduled. Our team will contact you soon.`
          );
          break;
        case 'booking':
          await quickSendBookingConfirmation(
            request.userId,
            `Your booking request "${request.description}" has been confirmed. Please arrive 10 minutes early.`
          );
          break;
        case 'gate_access':
          await quickSendApproval(
            request.userId,
            `Your gate access request has been approved. You can now use the main gate with your access card.`
          );
          break;
        default:
          await quickSendApproval(
            request.userId,
            `Your request "${request.description}" has been approved. You can now proceed.`
          );
      }
      
      // Update UI or refresh data
      console.log('Request approved and notification sent');
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  // Handle rejecting a request
  const handleRejectRequest = async (request) => {
    try {
      // Your existing rejection logic here
      console.log(`Rejecting request ${request.id} for user ${request.userId}`);
      
      // Send rejection notification
      await quickSendApproval(
        request.userId,
        `Your request "${request.description}" has been reviewed but cannot be approved at this time. Please contact the management office for more information.`
      );
      
      console.log('Request rejected and notification sent');
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Notifications Demo</h1>
          </div>
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showNotificationPanel ? 'Hide' : 'Show'} Notification Panel
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          This demonstrates how to send user-friendly notifications when users accept or approve actions from the dashboard.
        </p>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div className="mb-6">
            <DashboardAcceptanceNotification
              projectId={projectId}
              currentAdmin={currentAdmin}
              onNotificationSent={(data) => {
                console.log('Notification sent:', data);
              }}
            />
          </div>
        )}
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 text-orange-600 mr-2" />
          Pending Requests
        </h2>

        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium text-gray-900">{request.userName}</span>
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {request.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{request.description}</p>
                  <p className="text-sm text-gray-500">
                    Submitted: {request.submittedAt.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleApproveRequest(request)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Guide */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Integration Guide</h3>
        <div className="text-blue-800 text-sm space-y-2">
          <p><strong>1. Import the hook:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            import {`{ useQuickNotifications }`} from './DashboardAcceptanceNotification';
          </code>
          
          <p><strong>2. Use in your component:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            const {`{ quickSendApproval, quickSendMaintenanceApproval }`} = useQuickNotifications(projectId, currentAdmin);
          </code>
          
          <p><strong>3. Send notifications after actions:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            await quickSendApproval(userId, 'Your request has been approved!');
          </code>
        </div>
      </div>
    </div>
  );
};

export default DashboardNotificationExample;
