# Email Newsletter System - Setup & Usage Guide

## Overview

The Email Newsletter system allows admins to send professional, branded email campaigns to project members. The system includes:

- **Email Groups**: Organize recipients into reusable groups
- **Campaign Management**: Create, preview, and send email campaigns
- **App-like Design**: Emails match the mobile app's branding (red color scheme)
- **Flexible Recipients**: Send to all users, specific groups, or custom email lists
- **Excel Export**: Export campaign data with date range filtering
- **Permission Control**: Full integration with admin permission system

---

## Features

### ✅ Email Groups
- Create reusable email groups
- **Smart user search** - Search by email, name, user ID, unit, or building
- Only requires 2+ characters to search (doesn't load all users)
- Shows user details: name, email, unit, building
- Manual email entry also available
- View member counts
- Edit and delete groups

### ✅ Campaigns
- Draft campaigns before sending
- Rich text content
- Custom branding (color, logo, header image)
- Multiple recipient options:
  - All project users
  - Specific email groups
  - Custom email list
- Campaign preview before sending
- Track sent/failed counts

### ✅ Email Design
- Matches mobile app design (red/dark theme)
- Responsive HTML emails
- **Fixed PRE Group branding** (logo and colors cannot be changed)
- Optional header banner images
- Professional footer with project info

### ✅ Fixed Brand Colors
- **Primary Red**: #AF1E23
- **Dark Black**: #231F20  
- **White**: #FFFFFF

---

## Setup Instructions

### 1. Configure Email Service (Firebase Functions)

The email sending is handled by Firebase Cloud Functions using Nodemailer.

#### Option A: Using Gmail

1. Go to your Google Account: https://myaccount.google.com/apppasswords
2. Create an App Password for "Mail"
3. Save the generated password

4. Set Firebase config:
```bash
cd functions
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

#### Option B: Using Other Email Services

Edit `functions/index.js` and update `EMAIL_CONFIG`:

```javascript
const EMAIL_CONFIG = {
  service: 'outlook', // or 'yahoo', 'hotmail', etc.
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
};
```

### 2. Deploy Firebase Functions

```bash
cd functions
npm install  # If not already installed
firebase deploy --only functions:sendEmailCampaign
```

### 3. Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Email Groups
match /projects/{projectId}/emailGroups/{groupId} {
  allow read: if isProjectAdmin(projectId);
  allow write: if isProjectAdmin(projectId) && 
                  hasPermission(projectId, 'email_newsletter', 'write');
  allow delete: if isProjectAdmin(projectId) && 
                   hasPermission(projectId, 'email_newsletter', 'delete');
}

// Email Campaigns
match /projects/{projectId}/emailCampaigns/{campaignId} {
  allow read: if isProjectAdmin(projectId);
  allow create: if isProjectAdmin(projectId) && 
                   hasPermission(projectId, 'email_newsletter', 'write');
  allow update: if isProjectAdmin(projectId) && 
                   hasPermission(projectId, 'email_newsletter', 'write');
  allow delete: if isProjectAdmin(projectId) && 
                   hasPermission(projectId, 'email_newsletter', 'delete');
}
```

### 4. Grant Permissions to Admins

Super admins can grant newsletter permissions to other admins:

1. Go to **Admin Accounts** tab
2. Edit an admin account
3. For **Custom** admins, enable:
   - ✅ Email Newsletter - Read
   - ✅ Email Newsletter - Write
   - ✅ Email Newsletter - Delete
   - ✅ Email Newsletter - Send

**Full Access** and **Super Admin** accounts have all permissions by default.

---

## Usage Guide

### Creating Email Groups

1. Navigate to **Email Newsletter** tab in the sidebar
2. Click **Groups** tab
3. Click **Create Group**
4. Fill in:
   - **Group Name** (e.g., "Premium Members", "Building A Residents")
   - **Description**
   - **Search & Add Users**:
     - Type at least 2 characters in the search box
     - Search works across:
       - User name
       - Email address
       - User ID
       - Unit number
       - Building name
     - Click on a user from results to add them
     - Or manually enter an email address
5. Click **Create Group**

**Search Examples:**
- Type "12" - Shows units 12, 120, 312, etc.
- Type "build" - Shows all users in buildings matching "build"
- Type "john" - Shows all users named John
- Type "@gmail" - Shows all Gmail users

**Tip**: Search results are limited to 50 users for performance.

### Creating a Campaign

1. Go to **Email Newsletter** > **Campaigns** tab
2. Click **Create Campaign**
3. Fill in the form:

#### Left Column - Campaign Settings:
- **Subject**: Email subject line
- **Email Content**: Your message (supports line breaks)
- **Recipients**: Choose from:
  - **All Project Users** - Automatically includes all users in the project
  - **Email Groups** - Select one or more pre-created groups
  - **Custom Emails** - Search and add specific users:
    - Type 2+ characters to search
    - Search by name, email, unit, building, or user ID
    - Click users from search results to add
    - View selected recipients with remove option

#### Right Column - Design Preview:
- **Brand Identity**: Shows fixed PRE Group colors and logo
- **Header Image**: Optional - URL to banner image (displays **inside the dark header** below the logo)

4. Click **Save as Draft**

### Previewing a Campaign

1. In the Campaigns list, click the **Eye icon** (Preview)
2. Review the email design and content
3. Close when satisfied

### Sending a Campaign

1. Find your draft campaign in the list
2. Click the **Send icon** (paper plane)
3. Confirm the send action
4. The campaign status will change to **Sending**
5. Firebase Function will process and send emails
6. Status will update to **Sent** when complete

**Note**: Once sent, campaigns cannot be edited or re-sent.

### Monitoring Campaign Status

Campaign statuses:
- **Draft**: Saved but not sent
- **Sending**: Currently being processed
- **Sent**: Successfully delivered
- **Failed**: Delivery failed

View sent/failed counts in the campaigns table.

### Exporting Campaign Data

1. Go to Campaigns tab
2. Click **Export Excel**
3. Select date range or leave empty for all data
4. Click **Export**
5. Excel file will download with campaign stats

---

## Email Template Design

The email template is designed to match the mobile app:

### Visual Elements:
- **Header**: Dark black (#231F20) background containing:
  - PRE Group logo (white, always shown)
  - Optional header image (shows below logo within dark header)
- **Body**: Pure white (#FFFFFF) background with content
- **Title**: Red (#AF1E23) for email subject
- **Content**: Dark black (#231F20) text
- **Divider**: Red (#AF1E23) accent line
- **Footer**: Dark black (#231F20) background with white PRE Group branding

### Fixed Branding:
- ✅ PRE Group logo (automatically included)
- ✅ Brand colors (#AF1E23, #231F20, white)
- ✅ Consistent design across all emails
- ⚙️ Only header banner image is customizable

---

## Best Practices

### 1. Test Before Sending
- Always preview campaigns before sending
- Send a test to yourself first using "Custom Emails"

### 2. Organize with Groups
- Create groups for different user segments
- Examples: "Owners", "Tenants", "Premium Members", "Building A"

### 3. Content Guidelines
- Keep subject lines clear and concise (under 50 characters)
- Use proper formatting and spacing in content
- Include a clear call-to-action
- Proofread before sending

### 4. Timing
- Avoid sending during late hours
- Space out campaigns (don't spam users)
- Use meaningful subject lines

### 5. Compliance
- Only send to users who are members of the project
- Include unsubscribe information if required
- Follow email marketing regulations

---

## Troubleshooting

### Emails Not Sending

1. **Check Firebase Function Logs**:
   ```bash
   firebase functions:log --only sendEmailCampaign
   ```

2. **Verify Email Configuration**:
   ```bash
   firebase functions:config:get
   ```

3. **Check Gmail App Password**:
   - Ensure 2-factor authentication is enabled
   - Regenerate app password if needed

### Campaign Stuck in "Sending"

- Check Firebase Function logs for errors
- Verify recipients list is valid
- Check email service quotas (Gmail: 500/day for free accounts)

### Emails Going to Spam

- Use a custom domain email address
- Avoid spam trigger words in subject/content
- Include project name in sender name
- Test with different email providers

---

## Technical Details

### Firebase Collections

```
projects/{projectId}/
  ├── emailGroups/
  │   └── {groupId}
  │       ├── name: string
  │       ├── description: string
  │       ├── emails: string[]
  │       ├── createdAt: timestamp
  │       └── updatedAt: timestamp
  │
  └── emailCampaigns/
      └── {campaignId}
          ├── subject: string
          ├── content: string
          ├── recipientType: 'all' | 'group' | 'custom'
          ├── selectedGroups: string[]
          ├── customEmails: string[]
          ├── recipients: string[]
          ├── recipientCount: number
          ├── brandColor: string
          ├── logoUrl: string
          ├── headerImage: string
          ├── status: 'draft' | 'sending' | 'sent' | 'failed'
          ├── sentCount: number
          ├── failedCount: number
          ├── createdAt: timestamp
          ├── sentAt: timestamp
          └── completedAt: timestamp
```

### Permission Entity

- **Entity**: `email_newsletter`
- **Actions**: `read`, `write`, `delete`, `send`

### Cloud Function

- **Function**: `sendEmailCampaign`
- **Trigger**: Firestore `onUpdate` when campaign status changes to 'sending'
- **Email Service**: Nodemailer with Gmail/SMTP

---

## Future Enhancements

Potential improvements:
- [ ] Email templates library
- [ ] Scheduled sending
- [ ] A/B testing
- [ ] Click tracking
- [ ] Unsubscribe management
- [ ] Email delivery analytics
- [ ] Attachment support
- [ ] Rich text editor (WYSIWYG)

---

## Support

For issues or questions:
1. Check Firebase Function logs
2. Review this documentation
3. Contact system administrator

---

**Last Updated**: November 2025
**Version**: 1.0

