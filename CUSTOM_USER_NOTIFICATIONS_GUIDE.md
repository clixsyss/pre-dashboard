# Custom User Notifications System

This guide explains how to use the new user-specific notification system that extends the existing global notification functionality.

## Overview

The Custom User Notifications system allows you to send targeted notifications to individual users for specific actions like maintenance requests, gate access approvals, bookings, payments, and more. It maintains full compatibility with the existing notification architecture while providing a clean, reusable interface.

## Key Features

- ✅ **Non-breaking**: Extends existing system without modifying current functionality
- ✅ **Modular**: Clean, reusable functions for different notification types
- ✅ **Scalable**: Easy to add new action types without touching core logic
- ✅ **Consistent**: Follows existing coding style and patterns
- ✅ **Type-safe**: Comprehensive parameter validation and error handling
- ✅ **UI Integration**: Automatic UI notifications for success/error feedback

## Architecture

```
src/
├── services/
│   └── customUserNotificationService.js    # Core service
├── hooks/
│   └── useCustomUserNotifications.js       # React hook
├── components/
│   └── CustomUserNotificationExample.js    # Demo component
└── stores/
    ├── notificationStore.js                # Existing store (unchanged)
    └── uiNotificationStore.js              # Existing UI store (unchanged)
```

## Quick Start

### 1. Basic Usage

```javascript
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const MyComponent = () => {
  const { sendCustomUserNotification } = useCustomUserNotifications();

  const handleSendNotification = async () => {
    try {
      await sendCustomUserNotification({
        userId: 'user123',
        projectId: 'project456',
        actionType: 'maintenance_request',
        message: 'Your maintenance request has been submitted successfully.',
        options: {
          type: 'info',
          priority: 'normal',
          requiresAction: false
        }
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return (
    <button onClick={handleSendNotification}>
      Send Notification
    </button>
  );
};
```

### 2. Using Convenience Methods

```javascript
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const MyComponent = () => {
  const { 
    sendMaintenanceRequestNotification,
    sendBookingConfirmationNotification,
    sendGateAccessNotification 
  } = useCustomUserNotifications();

  const handleMaintenanceRequest = async () => {
    await sendMaintenanceRequestNotification({
      userId: 'user123',
      projectId: 'project456',
      message: 'Your maintenance request #MR-2024-001 has been received.',
      options: {
        requiresAction: false,
        actionUrl: '/maintenance/requests'
      }
    });
  };

  const handleBookingConfirmation = async () => {
    await sendBookingConfirmationNotification({
      userId: 'user123',
      projectId: 'project456',
      message: 'Your tennis court booking for March 15th at 2:00 PM is confirmed.',
      options: {
        actionUrl: '/bookings',
        actionText: 'View Booking'
      }
    });
  };

  const handleGateAccess = async () => {
    await sendGateAccessNotification({
      userId: 'user123',
      projectId: 'project456',
      message: 'Your gate access request has been approved.',
      approved: true,
      options: {
        actionUrl: '/access'
      }
    });
  };
};
```

## API Reference

### Core Function: `sendCustomUserNotification`

```javascript
sendCustomUserNotification({
  userId: string | Object,        // Required: User ID or user object
  projectId: string,             // Required: Project ID
  actionType: string,            // Required: Type of action
  message: string,               // Required: Notification message
  options?: {                    // Optional: Additional options
    title?: string,              // Custom title (auto-generated if not provided)
    type?: string,               // 'info', 'success', 'warning', 'error'
    category?: string,           // Notification category
    priority?: string,           // 'low', 'normal', 'high', 'urgent'
    requiresAction?: boolean,    // Whether user action is required
    actionUrl?: string,          // URL for action button
    actionText?: string,         // Text for action button
    imageUrl?: string,           // Image URL
    metadata?: Object            // Additional metadata
  }
})
```

### Convenience Methods

#### Maintenance Request
```javascript
sendMaintenanceRequestNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  options?: Object
})
```

#### Booking Confirmation
```javascript
sendBookingConfirmationNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  options?: Object
})
```

#### Gate Access
```javascript
sendGateAccessNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  approved: boolean,
  options?: Object
})
```

#### Payment
```javascript
sendPaymentNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  success: boolean,
  options?: Object
})
```

#### Service
```javascript
sendServiceNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  status: 'scheduled' | 'completed' | 'cancelled',
  options?: Object
})
```

#### Complaint
```javascript
sendComplaintNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  status: 'received' | 'resolved',
  options?: Object
})
```

#### Fine
```javascript
sendFineNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  paid: boolean,
  options?: Object
})
```

#### Welcome
```javascript
sendWelcomeNotification({
  userId: string | Object,
  projectId: string,
  message: string,
  options?: Object
})
```

## Available Action Types

The system supports the following predefined action types:

- `maintenance_request` - Maintenance request updates
- `booking_confirmed` - Booking confirmations
- `booking_cancelled` - Booking cancellations
- `gate_access_approved` - Gate access approvals
- `gate_access_denied` - Gate access denials
- `payment_received` - Payment confirmations
- `payment_failed` - Payment failures
- `service_completed` - Service completions
- `service_scheduled` - Service scheduling
- `complaint_received` - Complaint submissions
- `complaint_resolved` - Complaint resolutions
- `fine_issued` - Fine notifications
- `fine_paid` - Fine payments
- `news_comment` - News comment notifications
- `event_reminder` - Event reminders
- `announcement` - General announcements
- `system_alert` - System alerts
- `welcome` - Welcome messages
- `account_updated` - Account updates
- `password_reset` - Password reset notifications

## Examples

### Example 1: Maintenance Request Workflow

```javascript
// When a user submits a maintenance request
const handleMaintenanceSubmission = async (requestData) => {
  try {
    // Process the request...
    const requestId = await processMaintenanceRequest(requestData);
    
    // Send notification to user
    await sendMaintenanceRequestNotification({
      userId: requestData.userId,
      projectId: requestData.projectId,
      message: `Your maintenance request #${requestId} has been received and is being processed. We will update you on the progress.`,
      options: {
        requiresAction: false,
        actionUrl: `/maintenance/requests/${requestId}`,
        actionText: 'View Request'
      }
    });
    
    // Send notification to admin
    await sendCustomUserNotification({
      userId: requestData.adminId,
      projectId: requestData.projectId,
      actionType: 'maintenance_request',
      message: `New maintenance request #${requestId} submitted by ${requestData.userName}`,
      options: {
        type: 'info',
        priority: 'normal',
        requiresAction: true,
        actionUrl: `/admin/maintenance/requests/${requestId}`,
        actionText: 'Review Request'
      }
    });
  } catch (error) {
    console.error('Error processing maintenance request:', error);
  }
};
```

### Example 2: Booking System Integration

```javascript
// When a booking is confirmed
const handleBookingConfirmation = async (bookingData) => {
  try {
    await sendBookingConfirmationNotification({
      userId: bookingData.userId,
      projectId: bookingData.projectId,
      message: `Your booking for ${bookingData.facility} on ${bookingData.date} at ${bookingData.time} has been confirmed. Please arrive 10 minutes early.`,
      options: {
        requiresAction: false,
        actionUrl: `/bookings/${bookingData.id}`,
        actionText: 'View Booking',
        metadata: {
          bookingId: bookingData.id,
          facility: bookingData.facility,
          date: bookingData.date,
          time: bookingData.time
        }
      }
    });
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
};
```

### Example 3: Payment Processing

```javascript
// When processing a payment
const handlePaymentProcessing = async (paymentData) => {
  try {
    const paymentResult = await processPayment(paymentData);
    
    if (paymentResult.success) {
      await sendPaymentNotification({
        userId: paymentData.userId,
        projectId: paymentData.projectId,
        message: `Your payment of $${paymentData.amount} has been successfully processed. Thank you for your payment.`,
        success: true,
        options: {
          requiresAction: false,
          actionUrl: `/payments/${paymentResult.transactionId}`,
          actionText: 'View Receipt',
          metadata: {
            transactionId: paymentResult.transactionId,
            amount: paymentData.amount,
            paymentMethod: paymentData.method
          }
        }
      });
    } else {
      await sendPaymentNotification({
        userId: paymentData.userId,
        projectId: paymentData.projectId,
        message: `Your payment of $${paymentData.amount} could not be processed. Please check your payment method and try again.`,
        success: false,
        options: {
          requiresAction: true,
          actionUrl: `/payments/retry/${paymentData.id}`,
          actionText: 'Retry Payment'
        }
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
  }
};
```

## Integration with Existing Components

### Adding to Existing Forms

```javascript
// In your existing form component
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const ExistingForm = () => {
  const { sendCustomUserNotification } = useCustomUserNotifications();
  
  const handleFormSubmit = async (formData) => {
    try {
      // Your existing form processing logic
      const result = await submitForm(formData);
      
      // Add notification after successful submission
      await sendCustomUserNotification({
        userId: formData.userId,
        projectId: formData.projectId,
        actionType: 'form_submitted',
        message: 'Your form has been submitted successfully. We will review it and get back to you soon.',
        options: {
          type: 'success',
          requiresAction: false
        }
      });
      
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  // ... rest of your component
};
```

### Adding to Admin Actions

```javascript
// In your admin management component
import useCustomUserNotifications from '../hooks/useCustomUserNotifications';

const AdminManagement = () => {
  const { sendCustomUserNotification } = useCustomUserNotifications();
  
  const handleApproveRequest = async (requestData) => {
    try {
      // Your existing approval logic
      await approveRequest(requestData.id);
      
      // Notify the user
      await sendCustomUserNotification({
        userId: requestData.userId,
        projectId: requestData.projectId,
        actionType: 'request_approved',
        message: `Your ${requestData.type} request has been approved. You can now proceed with your request.`,
        options: {
          type: 'success',
          requiresAction: true,
          actionUrl: `/requests/${requestData.id}`,
          actionText: 'View Request'
        }
      });
      
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };
  
  // ... rest of your component
};
```

## Error Handling

The system includes comprehensive error handling:

```javascript
const handleNotification = async () => {
  try {
    await sendCustomUserNotification({
      userId: 'user123',
      projectId: 'project456',
      actionType: 'test',
      message: 'Test message'
    });
  } catch (error) {
    // Error is automatically logged to console
    // UI notification is automatically shown
    // You can add additional error handling here
    console.error('Custom error handling:', error);
  }
};
```

## Testing

Use the provided example component to test the notification system:

```javascript
import CustomUserNotificationExample from '../components/CustomUserNotificationExample';

// Add to your routes or render directly
<CustomUserNotificationExample />
```

## Best Practices

1. **Always handle errors**: Wrap notification calls in try-catch blocks
2. **Use appropriate action types**: Choose the most specific action type for your use case
3. **Provide meaningful messages**: Write clear, user-friendly notification messages
4. **Set appropriate priorities**: Use 'high' or 'urgent' only when necessary
5. **Include action URLs**: When users need to take action, provide relevant URLs
6. **Test thoroughly**: Use the example component to test different scenarios
7. **Monitor performance**: Check console logs for any issues

## Troubleshooting

### Common Issues

1. **"userId is required" error**: Make sure you're passing a valid user ID or user object
2. **"projectId is required" error**: Ensure the project ID is valid and exists
3. **"actionType is required" error**: Provide a valid action type from the available list
4. **"message is required" error**: Include a non-empty message string

### Debug Mode

Enable debug logging by checking the browser console. All notification attempts are logged with detailed information.

## Migration from Global Notifications

If you're currently using global notifications and want to add user-specific notifications:

1. **Keep existing code unchanged**: The global notification system remains fully functional
2. **Add user-specific notifications**: Use the new system alongside existing notifications
3. **Gradual migration**: You can gradually replace global notifications with user-specific ones where appropriate
4. **No breaking changes**: All existing functionality continues to work as before

## Support

For questions or issues with the custom user notification system:

1. Check the console logs for error messages
2. Verify that all required parameters are provided
3. Ensure the user and project IDs are valid
4. Test with the provided example component
5. Review this documentation for usage examples

The system is designed to be robust and user-friendly, with comprehensive error handling and clear feedback mechanisms.
