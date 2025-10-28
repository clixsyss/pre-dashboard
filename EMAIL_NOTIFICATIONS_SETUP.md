# Email Notifications Setup Guide

This guide will help you configure automated email notifications for device key reset requests in the PRE Group dashboard.

## Overview

The system automatically sends professional, branded emails to users when their device key reset requests are approved or rejected by administrators. The emails include:

- **PRE Group branding** with logo
- **Original request details** (request ID, submission date, user's reason)
- **Admin decision** (approved/rejected) with admin notes
- **Next steps** for the user
- **Security notices**

## Features

✅ Automated email sending via Firestore triggers
✅ Professional HTML email templates with PRE Group branding
✅ Both approval and rejection emails
✅ Includes user's original request and admin notes
✅ Audit trail in Firestore (emailLogs collection)
✅ Fallback plain-text emails
✅ Mobile-responsive design

---

## Setup Instructions

### 1. Install Dependencies

Navigate to the functions directory and install the required packages:

```bash
cd functions
npm install
```

This will install `nodemailer` along with other dependencies.

### 2. Configure Email Service (Gmail Example)

#### Option A: Using Gmail (Recommended for Development/Small Scale)

1. **Create a Gmail account** (or use an existing one) for sending emails
   - Example: `pre-group-notifications@gmail.com`

2. **Enable 2-Factor Authentication** on your Google Account
   - Go to: https://myaccount.google.com/security
   - Click on "2-Step Verification" and follow the setup

3. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "PRE Group Dashboard"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again)

4. **Set Firebase Function Environment Variables**

```bash
# Navigate to your dashboard directory
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard

# Set the email configuration
firebase functions:config:set email.user="pre-group-notifications@gmail.com"
firebase functions:config:set email.password="xxxx xxxx xxxx xxxx"  # Replace with your app password
```

5. **Verify the configuration**

```bash
firebase functions:config:get
```

You should see:
```json
{
  "email": {
    "user": "pre-group-notifications@gmail.com",
    "password": "xxxx xxxx xxxx xxxx"
  }
}
```

#### Option B: Using Other Email Providers

For **Outlook/Office 365**:
```javascript
// In functions/index.js, update EMAIL_CONFIG:
const EMAIL_CONFIG = {
  service: 'outlook',
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
};
```

For **SendGrid** (Recommended for Production):
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: 'YOUR_SENDGRID_API_KEY'
  }
};
```

For **Custom SMTP**:
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.yourcompany.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@yourcompany.com',
    pass: 'your-password'
  }
};
```

### 3. Update Company Information

Edit `functions/index.js` and update the company branding constants:

```javascript
// Company branding
const COMPANY_NAME = 'PRE Group';
const COMPANY_LOGO_URL = 'https://pre-group.web.app/logo512.png'; // Update with your hosted logo URL
const COMPANY_EMAIL = EMAIL_CONFIG.auth.user;
const COMPANY_WEBSITE = 'https://pre-group.web.app'; // Update with your actual website
```

**Important:** Make sure the `COMPANY_LOGO_URL` points to a publicly accessible image URL. You can:
- Use Firebase Hosting: Upload your logo to `public/` folder
- Use Firebase Storage: Upload to Storage and get public URL
- Use external CDN

### 4. Deploy Functions

Deploy the Cloud Functions to Firebase:

```bash
# Make sure you're in the dashboard directory
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard

# Deploy all functions (or just the new one)
firebase deploy --only functions

# Or deploy just the email function:
firebase deploy --only functions:onDeviceKeyResetRequestUpdate
```

### 5. Test the Email System

#### Test Email Sending:

1. **Log in to the dashboard** as an admin
2. Navigate to **Device Keys Management**
3. Find a **pending device key reset request** (or create one from the mobile app)
4. **Approve or reject** the request
5. Check the user's email inbox for the notification

#### Check Function Logs:

```bash
# View real-time logs
firebase functions:log --only onDeviceKeyResetRequestUpdate

# Or view in Firebase Console
# https://console.firebase.google.com/project/pre-group/functions/logs
```

#### Check Email Logs in Firestore:

The system creates an audit trail in the `emailLogs` collection:

```javascript
// Each sent email creates a document with:
{
  type: 'device_key_reset_notification',
  requestId: 'xxx',
  projectId: 'xxx',
  userId: 'xxx',
  userEmail: 'user@example.com',
  status: 'approved' or 'rejected',
  sentAt: Timestamp,
  messageId: 'xxx',
  success: true/false,
  error: 'error message' // if failed
}
```

---

## Email Template Preview

### Approval Email
The approval email includes:
- ✅ Green "APPROVED" badge
- User's original request details
- Instructions for next steps
- Access button to the app

### Rejection Email
The rejection email includes:
- ❌ Red "REJECTED" badge
- User's original request details
- Admin's rejection notes (if provided)
- Contact support button

Both emails feature:
- PRE Group logo and branding
- Professional gradient header
- Responsive design (mobile-friendly)
- Security notice
- Company footer

---

## Troubleshooting

### Issue: Emails not being sent

**Check 1: Function Configuration**
```bash
firebase functions:config:get
```
Make sure email credentials are set correctly.

**Check 2: Function Logs**
```bash
firebase functions:log --only onDeviceKeyResetRequestUpdate
```
Look for error messages.

**Check 3: Gmail Security**
- Make sure you're using an App Password, not your regular password
- Check if Gmail blocked the login attempt: https://myaccount.google.com/notifications

**Check 4: Test Email Configuration Locally**
Create a test file `functions/test-email.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test-recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email from PRE Group'
}, (error, info) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Email sent:', info.messageId);
  }
});
```

Run: `node test-email.js`

### Issue: Email goes to spam

1. **Set up SPF record** for your domain
2. **Set up DKIM** for authentication
3. **Use a professional email service** (SendGrid, AWS SES, etc.) for production
4. **Add a reply-to address** in the email configuration

### Issue: Logo not showing in email

1. Make sure the logo URL is **publicly accessible**
2. Use **absolute URLs** (not relative paths)
3. Test the URL in a browser
4. Consider using **inline base64 images** for better compatibility

---

## Production Recommendations

### 1. Use a Professional Email Service

For production, switch from Gmail to a dedicated email service:

- **SendGrid** (Free tier: 100 emails/day)
- **AWS SES** (Very cheap, $0.10 per 1000 emails)
- **Mailgun** (Free tier: 5000 emails/month)
- **Postmark** (Focus on transactional emails)

### 2. Set Up Email Monitoring

Monitor email deliverability:
- Track bounce rates
- Monitor spam complaints
- Check delivery rates
- Set up alerts for failed emails

### 3. Implement Rate Limiting

Add rate limiting to prevent abuse:
```javascript
// Check if user has received too many emails recently
const recentEmails = await db.collection('emailLogs')
  .where('userEmail', '==', userEmail)
  .where('sentAt', '>', oneHourAgo)
  .get();

if (recentEmails.size > 5) {
  console.warn('Rate limit exceeded for user:', userEmail);
  return null;
}
```

### 4. Add Email Templates Management

Consider storing email templates in Firestore for easy updates without redeploying functions.

### 5. Localization

Add support for multiple languages based on user preferences.

---

## Testing Checklist

- [ ] Email credentials configured in Firebase Functions
- [ ] Functions deployed successfully
- [ ] Test approval email sends correctly
- [ ] Test rejection email sends correctly
- [ ] Logo displays correctly in email
- [ ] Links in email work correctly
- [ ] Email looks good on mobile devices
- [ ] Email looks good in Gmail, Outlook, Apple Mail
- [ ] Plain text fallback works
- [ ] Email logs are created in Firestore
- [ ] User receives email within 1-2 minutes of admin action

---

## Support

If you need help:
1. Check the Firebase Functions logs
2. Check the emailLogs collection in Firestore
3. Review the troubleshooting section above
4. Contact the development team

---

## File Structure

```
pre-dashboard/
├── functions/
│   ├── index.js                          # Main functions file (includes email logic)
│   ├── package.json                      # Dependencies (includes nodemailer)
│   └── node_modules/                     # Installed packages
├── EMAIL_NOTIFICATIONS_SETUP.md          # This file
└── src/
    └── components/
        └── DeviceKeysManagement.js       # Admin UI for managing requests
```

---

## Security Notes

⚠️ **Never commit email credentials to version control**
⚠️ **Use environment variables for sensitive data**
⚠️ **Enable 2FA on email accounts**
⚠️ **Use App Passwords instead of regular passwords**
⚠️ **Monitor email logs for suspicious activity**
⚠️ **Implement rate limiting in production**

---

## Next Steps

1. Configure email credentials
2. Deploy functions
3. Test the system
4. Monitor email delivery
5. Consider upgrading to a professional email service for production

---

**Last Updated:** October 28, 2025
**Version:** 1.0.0
**Author:** PRE Group Development Team

