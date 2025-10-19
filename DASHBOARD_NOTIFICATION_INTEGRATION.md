# Dashboard Notification Integration Guide

This guide explains how to send user-friendly notifications when users accept or approve actions from the dashboard.

## Overview

The system extends the existing custom user notification functionality to provide easy-to-use functions for sending notifications when dashboard actions are completed (approvals, confirmations, etc.).

## Quick Start

### 1. Import the Hook

```javascript
import { useQuickNotifications } from './components/DashboardAcceptanceNotification';
```

### 2. Use in Your Component

```javascript
const MyDashboardComponent = ({ projectId, currentAdmin }) => {
  const { quickSendApproval, quickSendMaintenanceApproval, quickSendBookingConfirmation } = 
    useQuickNotifications(projectId, currentAdmin);

  // Your component logic...
};
```

### 3. Send Notifications After Actions

```javascript
// When approving a request
const handleApproveRequest = async (request) => {
  try {
    // Your existing approval logic
    await approveRequest(request.id);
    
    // Send notification
    await quickSendApproval(
      request.userId, 
      'Your request has been approved! You can now proceed.'
    );
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// When approving maintenance
const handleApproveMaintenance = async (maintenanceRequest) => {
  try {
    await approveMaintenance(maintenanceRequest.id);
    
    await quickSendMaintenanceApproval(
      maintenanceRequest.userId,
      'Your maintenance request has been approved and scheduled. Our team will contact you soon.'
    );
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Available Functions

### `quickSendApproval(userId, customMessage)`
Sends a general approval notification.

**Parameters:**
- `userId` (string): The user ID to send notification to
- `customMessage` (string, optional): Custom message. Uses default if not provided.

**Example:**
```javascript
await quickSendApproval('user123', 'Your request has been approved!');
```

### `quickSendMaintenanceApproval(userId, customMessage)`
Sends a maintenance-specific approval notification.

**Example:**
```javascript
await quickSendMaintenanceApproval('user123', 'Your maintenance request has been scheduled for tomorrow.');
```

### `quickSendBookingConfirmation(userId, customMessage)`
Sends a booking confirmation notification.

**Example:**
```javascript
await quickSendBookingConfirmation('user123', 'Your tennis court booking is confirmed for Saturday at 2 PM.');
```

## Predefined Notification Types

The system includes predefined templates for common dashboard actions:

- **approval_confirmed**: General request approval
- **maintenance_approved**: Maintenance request approval
- **booking_confirmed**: Booking confirmation
- **payment_approved**: Payment approval
- **gate_access_approved**: Gate access approval
- **complaint_resolved**: Complaint resolution
- **fine_paid**: Fine payment confirmation
- **service_scheduled**: Service scheduling

## Integration Examples

### Example 1: User Management Component

```javascript
import { useQuickNotifications } from './DashboardAcceptanceNotification';

const UserManagement = ({ projectId, currentAdmin }) => {
  const { quickSendApproval } = useQuickNotifications(projectId, currentAdmin);

  const handleApproveUser = async (userId) => {
    try {
      // Approve user
      await approveUser(userId);
      
      // Send notification
      await quickSendApproval(
        userId,
        'Your account has been approved! You can now access all features.'
      );
      
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  return (
    // Your component JSX
  );
};
```

### Example 2: Booking Management Component

```javascript
import { useQuickNotifications } from './DashboardAcceptanceNotification';

const BookingManagement = ({ projectId, currentAdmin }) => {
  const { quickSendBookingConfirmation } = useQuickNotifications(projectId, currentAdmin);

  const handleConfirmBooking = async (booking) => {
    try {
      // Confirm booking
      await confirmBooking(booking.id);
      
      // Send notification
      await quickSendBookingConfirmation(
        booking.userId,
        `Your booking for ${booking.facility} on ${booking.date} at ${booking.time} has been confirmed.`
      );
      
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  return (
    // Your component JSX
  );
};
```

### Example 3: Maintenance Management Component

```javascript
import { useQuickNotifications } from './DashboardAcceptanceNotification';

const MaintenanceManagement = ({ projectId, currentAdmin }) => {
  const { quickSendMaintenanceApproval } = useQuickNotifications(projectId, currentAdmin);

  const handleScheduleMaintenance = async (request) => {
    try {
      // Schedule maintenance
      const schedule = await scheduleMaintenance(request.id);
      
      // Send notification
      await quickSendMaintenanceApproval(
        request.userId,
        `Your maintenance request has been scheduled for ${schedule.date} at ${schedule.time}. Our team will arrive at your unit.`
      );
      
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    }
  };

  return (
    // Your component JSX
  );
};
```

## Advanced Usage

### Custom Notifications

For more control, you can use the full `sendCustomUserNotification` function:

```javascript
import useCustomUserNotifications from './hooks/useCustomUserNotifications';

const MyComponent = ({ projectId }) => {
  const { sendCustomUserNotification } = useCustomUserNotifications();

  const handleCustomAction = async (userId) => {
    await sendCustomUserNotification({
      userId: userId,
      projectId: projectId,
      actionType: 'custom_action',
      message: 'Your custom action has been completed!',
      options: {
        title: 'Custom Action Complete',
        type: 'success',
        category: 'custom',
        priority: 'normal',
        requiresAction: true,
        actionUrl: '/custom-action',
        actionText: 'View Details',
        metadata: {
          customData: 'some value',
          timestamp: new Date().toISOString()
        }
      }
    });
  };
};
```

## Notification Panel Component

You can also use the `DashboardAcceptanceNotification` component directly in your dashboard:

```javascript
import DashboardAcceptanceNotification from './components/DashboardAcceptanceNotification';

const AdminDashboard = ({ projectId, currentAdmin }) => {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      <DashboardAcceptanceNotification
        projectId={projectId}
        currentAdmin={currentAdmin}
        onNotificationSent={(data) => {
          console.log('Notification sent:', data);
        }}
      />
    </div>
  );
};
```

## Error Handling

All notification functions include built-in error handling and will show UI notifications for success/failure:

```javascript
try {
  await quickSendApproval(userId, message);
  // Success notification shown automatically
} catch (error) {
  // Error notification shown automatically
  console.error('Failed to send notification:', error);
}
```

## Best Practices

1. **Always handle errors**: Wrap notification calls in try-catch blocks
2. **Use appropriate functions**: Choose the most specific function for your use case
3. **Provide meaningful messages**: Write clear, user-friendly notification messages
4. **Test thoroughly**: Use the example component to test different scenarios
5. **Monitor logs**: Check console logs for any issues

## Troubleshooting

### Common Issues

1. **"Project ID is required"**: Make sure you're passing the projectId to the hook
2. **"User ID is required"**: Ensure you have a valid user ID
3. **Notifications not appearing**: Check that the user has notifications enabled

### Debug Mode

Enable debug logging by checking the browser console. All notification attempts are logged with detailed information.

## Support

For questions or issues:

1. Check the console logs for error messages
2. Verify that all required parameters are provided
3. Ensure the user and project IDs are valid
4. Test with the provided example component

The system is designed to be robust and user-friendly, with comprehensive error handling and clear feedback mechanisms.
