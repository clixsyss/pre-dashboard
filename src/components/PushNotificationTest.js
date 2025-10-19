/**
 * Push Notification Test Component
 * Allows testing of the mobile push notification system
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Send, CheckCircle, AlertTriangle, RefreshCw, Users } from 'lucide-react';
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const PushNotificationTest = ({ projectId, currentAdmin }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [userTokens, setUserTokens] = useState([]);

  const { sendCustomUserNotification } = useCustomUserNotifications();

  // Mock users for testing
  const mockUsers = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user3', name: 'Ahmed Al-Rashid', email: 'ahmed@example.com' }
  ];

  // Load user tokens when user is selected
  useEffect(() => {
    if (selectedUserId) {
      loadUserTokens(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUserTokens = async (userId) => {
    try {
      // This would normally fetch from Firestore
      // For demo purposes, we'll simulate some tokens
      const mockTokens = [
        {
          id: 'token1',
          token: 'fcm_token_123456789',
          platform: 'android',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: 'token2', 
          token: 'fcm_token_987654321',
          platform: 'ios',
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      setUserTokens(mockTokens);
    } catch (error) {
      console.error('Error loading user tokens:', error);
      setUserTokens([]);
    }
  };

  const handleSendTestNotification = async () => {
    if (!selectedUserId || !testMessage.trim()) {
      alert('Please select a user and enter a test message');
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      const result = await sendCustomUserNotification({
        userId: selectedUserId,
        projectId: projectId,
        actionType: 'test_notification',
        message: testMessage,
        options: {
          title: 'Test Notification',
          type: 'info',
          category: 'test',
          priority: 'normal',
          requiresAction: false,
          actionUrl: '/test',
          actionText: 'View Test',
          metadata: {
            sentFrom: 'dashboard_test',
            adminId: currentAdmin?.id || 'unknown',
            adminName: currentAdmin?.name || 'Admin',
            timestamp: new Date().toISOString()
          }
        }
      });

      setTestResults({
        success: true,
        notificationId: result,
        message: 'Test notification sent successfully!',
        tokensFound: userTokens.length
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResults({
        success: false,
        error: error.message,
        message: 'Failed to send test notification'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendApprovalNotification = async () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      await sendCustomUserNotification({
        userId: selectedUserId,
        projectId: projectId,
        actionType: 'approval_confirmed',
        message: 'Your request has been approved! You can now proceed with your request.',
        options: {
          title: 'Request Approved!',
          type: 'success',
          category: 'dashboard_approval',
          priority: 'normal',
          requiresAction: true,
          actionUrl: '/requests',
          actionText: 'View Request',
          metadata: {
            sentFrom: 'dashboard',
            adminId: currentAdmin?.id || 'unknown',
            adminName: currentAdmin?.name || 'Admin',
            timestamp: new Date().toISOString()
          }
        }
      });

      setTestResults({
        success: true,
        message: 'Approval notification sent successfully!',
        tokensFound: userTokens.length
      });

    } catch (error) {
      console.error('Error sending approval notification:', error);
      setTestResults({
        success: false,
        error: error.message,
        message: 'Failed to send approval notification'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Push Notification Test</h1>
            <p className="text-gray-600">Test mobile push notifications for dashboard actions</p>
          </div>
        </div>

        {/* Test Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
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
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test message for push notification..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSendTestNotification}
              disabled={!selectedUserId || !testMessage.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </button>

            <button
              onClick={handleSendApprovalNotification}
              disabled={!selectedUserId || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Send Approval
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className={`p-4 rounded-lg border ${
            testResults.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              )}
              <div>
                <h3 className={`font-medium ${
                  testResults.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResults.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm mt-1 ${
                  testResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResults.message}
                </p>
                {testResults.notificationId && (
                  <p className="text-xs text-green-700 mt-1">
                    Notification ID: {testResults.notificationId}
                  </p>
                )}
                {testResults.tokensFound !== undefined && (
                  <p className="text-xs text-green-700 mt-1">
                    FCM Tokens Found: {testResults.tokensFound}
                  </p>
                )}
                {testResults.error && (
                  <p className="text-xs text-red-700 mt-1">
                    Error: {testResults.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Tokens Display */}
      {selectedUserId && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            User FCM Tokens
          </h2>
          
          {userTokens.length > 0 ? (
            <div className="space-y-3">
              {userTokens.map((token, index) => (
                <div key={token.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Token {index + 1}
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {token.token}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        token.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {token.platform}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No FCM tokens found for this user</p>
              <p className="text-sm text-gray-400 mt-1">
                The user needs to open the mobile app to register their FCM token
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test</h3>
        <div className="text-blue-800 text-sm space-y-2">
          <p><strong>1. Mobile App Setup:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Install the mobile app on a device</li>
            <li>Log in with a user account</li>
            <li>Ensure the app registers FCM tokens (check console logs)</li>
          </ul>
          
          <p><strong>2. Test Notifications:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Select a user from the dropdown above</li>
            <li>Enter a test message</li>
            <li>Click "Send Test Notification"</li>
            <li>Check the mobile device for the notification</li>
          </ul>
          
          <p><strong>3. Check Results:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Look for success/error messages above</li>
            <li>Check Firebase Console → Cloud Messaging for delivery reports</li>
            <li>Check Cloud Functions logs for processing status</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationTest;
