# Guest Passes Management System

A comprehensive React-based admin dashboard feature for managing digital guest passes with per-project data, admin controls, and usage analytics.

## 🚀 Feature Overview

The Guest Passes system allows administrators to:

- Generate and track digital guest passes with unique IDs
- Enforce monthly limits per user and globally
- Block/unblock users and manage individual limits
- Monitor usage analytics and pass completion rates
- Track all passes per project with "sent" status logging

## 📁 File Structure

```
src/
├── pages/
│   └── GuestPasses.js              # Main guest passes management page
├── components/
│   ├── PassTable.js                # Table component for pass logs
│   ├── PassAnalytics.js            # Analytics charts and metrics
│   └── AdminControls.js            # Admin settings and user management
├── stores/
│   └── guestPassStore.js           # Zustand store for state management
├── services/
│   └── guestPassesService.js       # Firebase API service
└── utils/
    └── guestPassAPI.js             # External API helpers
```

## 🛠️ Implementation Details

### 1. Database Structure

#### Users Collection (`guestPassUsers`)
```javascript
{
  id: "userId",
  projectId: "projectId",
  name: "User Name",
  email: "user@example.com",
  monthlyLimit: 100,
  usedThisMonth: 3,
  blocked: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Passes Collection (`guestPasses`)
```javascript
{
  id: "passId",
  projectId: "projectId",
  userId: "userId",
  userName: "User Name",
  passId: "GP-ABC123-DEF456", // Unique pass identifier
  createdAt: timestamp,
  sentStatus: false,
  sentAt: null, // timestamp when marked as sent
  qrCodeUrl: null, // Set by external app
  updatedAt: timestamp
}
```

#### Settings Collection (`guestPassSettings`)
```javascript
{
  id: "projectId",
  monthlyLimit: 100, // Global default limit
  autoReset: true,
  allowOverrides: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Key Features

#### Admin Controls
- **Global Settings**: Set default monthly limits for all users
- **User Management**: Block/unblock users, override individual limits
- **Bulk Actions**: Reset monthly usage, export data, send reminders

#### Analytics & Monitoring
- **Real-time Stats**: Total passes, sent passes, completion rates
- **Usage Charts**: Daily/weekly/monthly trends
- **User Analytics**: Top users, usage distribution
- **Status Tracking**: Sent vs pending pass monitoring

#### Pass Management
- **Unique IDs**: Auto-generated pass identifiers
- **Status Tracking**: Monitor sent status (handled by external app)
- **Search & Filter**: Find passes by ID, user, status, date
- **Export Capability**: Download pass logs and analytics

### 3. Mobile App Integration

The dashboard and mobile app share the same Firebase database. The mobile app should:

1. **Check User Eligibility**: Query Firebase to verify user can generate passes
2. **Generate Pass ID**: Create unique identifier for the pass
3. **Create Pass Record**: Write pass data directly to Firebase
4. **Generate QR Code**: Handle QR generation in mobile app
5. **Send via WhatsApp**: Use mobile app's WhatsApp integration
6. **Update Status**: Mark pass as sent in Firebase

#### Firebase Integration

```javascript
// Mobile app creates pass record in Firebase
const passRef = await addDoc(collection(db, 'guestPasses'), {
  id: passId,
  projectId: 'project123',
  userId: 'user456',
  userName: 'John Doe',
  createdAt: serverTimestamp(),
  sentStatus: false,
  sentAt: null,
  qrCodeUrl: 'data:image/png;base64,...',
  updatedAt: serverTimestamp()
});

// After sending via WhatsApp, update status
await updateDoc(passRef, {
  sentStatus: true,
  sentAt: serverTimestamp()
});
```

### 4. Monthly Reset Automation

The system includes automatic monthly reset functionality:

- **Auto Reset**: Usage counters reset on the 1st of each month
- **Manual Reset**: Admins can manually reset usage at any time
- **Notification**: Users can be notified before limits reset

### 5. Security & Permissions

- **Project Scoping**: All data is scoped to specific projects
- **Admin Controls**: Only super admins can access global settings
- **User Blocking**: Admins can block users from generating passes
- **Limit Overrides**: Admins can override individual user limits

## 🎯 Usage Instructions

### For Administrators

1. **Navigate to Guest Passes**: Click "Guest Passes" in the sidebar
2. **View Overview**: Check statistics and analytics
3. **Manage Users**: Block/unblock users, adjust limits
4. **Monitor Activity**: Review pass logs and completion rates
5. **Configure Settings**: Set global limits and preferences

### For Mobile Applications

1. **Initialize User**: Create user record in Firebase when user first accesses guest passes
2. **Check Eligibility**: Query Firebase to verify user can generate passes
3. **Generate Pass**: Create pass record directly in Firebase with unique ID
4. **Handle QR Generation**: Generate QR codes in mobile app
5. **Send via WhatsApp**: Use mobile app's WhatsApp integration
6. **Update Status**: Mark pass as sent in Firebase (dashboard updates automatically)

## 📊 Analytics & Reporting

### Dashboard Metrics
- **Total Passes**: Monthly pass generation count
- **Completion Rate**: Percentage of passes marked as sent
- **Active Users**: Number of non-blocked users
- **Usage Trends**: Daily, weekly, monthly analytics

### Charts & Visualizations
- **Daily Generation**: Area chart showing pass creation trends
- **Status Distribution**: Pie chart of sent vs pending passes
- **Top Users**: Bar chart of most active users
- **Usage Progress**: Progress bars for individual user limits

## 🔧 Configuration

### Environment Variables
No additional environment variables required. Uses existing Firebase configuration.

### Firebase Rules
Ensure Firestore security rules allow read/write access for admin users:

```javascript
// Firestore Rules Example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestPassUsers/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    match /guestPasses/{passId} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    match /guestPassSettings/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## 🚀 Deployment Notes

1. **No Additional Dependencies**: Uses existing project dependencies
2. **Firebase Integration**: Leverages existing Firebase setup
3. **Responsive Design**: Works on desktop, tablet, and mobile
4. **Project Scoped**: All data isolated per project

## 🐛 Troubleshooting

### Common Issues

**Users not showing up**
- Ensure users are initialized with `initializeUser()`
- Check if user belongs to the selected project

**Passes not updating**
- Verify Firebase rules allow write access
- Check console for API errors

**Analytics not loading**
- Ensure sufficient data exists for time period
- Check Firebase query permissions

**Mobile app integration issues**
- Verify Firebase security rules allow read/write access
- Check pass ID format validation
- Ensure proper error handling in mobile app

## 📝 Future Enhancements

- **Email Notifications**: Send alerts when users approach limits
- **Advanced Analytics**: More detailed reporting and insights
- **Bulk Import**: Import user data from CSV files
- **Firebase Rate Limiting**: Implement rate limiting for Firebase operations
- **Audit Logs**: Track all admin actions and changes

## 🤝 Contributing

When adding new features:

1. Update the Zustand store for new state management
2. Add corresponding service methods for API calls
3. Create/update components with consistent styling
4. Update this documentation
5. Test with different project configurations

---

**Built with React, Firebase, and Tailwind CSS for the PRE sports platform**
