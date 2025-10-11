# User Import Script

A Node.js script to import and transform old user data from JSON into Firebase Firestore, maintaining the current production schema.

## 📋 Prerequisites

Before running this script, ensure you have:

1. **Node.js 18+** installed
2. **Firebase Admin SDK service account key** (`serviceAccountKey.json`)
3. **Old users data** file (`users.json`)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install `firebase-admin` along with other dependencies.

### 2. Prepare Required Files

Make sure these files are in the same directory as `importUsers.mjs`:

- `serviceAccountKey.json` - Your Firebase Admin SDK credentials
- `users.json` - Your old user data to import

**Note**: The script automatically handles JSON structures with wrapper objects. Both formats work:
- Direct array: `[{user1}, {user2}, ...]`
- Wrapped object: `{"result": "success", "data": [{user1}, {user2}, ...]}`

#### Getting Service Account Key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

### 3. Test the Transformation (Recommended)

Before importing to production, test the data transformation:

```bash
npm run test-transform
```

This will:
- Show how the first 5 users will be transformed
- Display statistics about your data
- Help you verify the transformation is correct
- **Does NOT write to Firestore**

### 4. Run the Import

Once you've verified the transformation looks correct:

```bash
npm run import-users
```

Or directly:

```bash
node importUsers.js
```

## 📊 What It Does

The script performs the following operations:

1. **Reads** old user data from `users.json`
2. **Transforms** each user record according to the schema mapping
3. **Checks** for duplicates (by email or nationalId)
4. **Converts** date formats and timestamps
5. **Maps** old project names to Firestore project IDs
6. **Imports** new users into the `users` collection
7. **Logs** detailed progress and summary

## 🔄 Field Transformations

### Date Format Conversion
- **Old format**: `DD-MM-YYYY`
- **New format**: `YYYY-MM-DD`

### Project Mapping

The script automatically maps old project names to Firestore IDs:

| Old Project Name | Firestore Project ID |
|------------------|---------------------|
| `stone_residence` | `BiHENuiMdDrivwbPccNE` |
| `the_brooks` | `3OcGvjzt8lPCNG4PB812` |
| `brookview` | `I3taP0crSITF2iqpBUfO` |
| `hadaba` | `IzN8JxYC1wl21EuUwtC5` |
| `ivoire_east` | `VtOV8ZzMQqUCGitQlLjR` |
| `brooks_ville` | `dQ7daaLWN0OSGOppEan7` |
| `jebal` | `gffEmqBOveWUOxzARNaX` |
| `crimson_heights` | `u3drPih6Hf6vOFX8savu` |

### Field Mapping

| Old JSON Field | New Firestore Field | Transformation |
|----------------|---------------------|----------------|
| `firstName` | `firstName` | Direct copy |
| `lastName` | `lastName` | Direct copy |
| `email` | `email` | Direct copy |
| `mobile` | `mobile` | Direct copy |
| `nationalId` | `nationalId` | Direct copy |
| `gender` | `gender` | Direct copy |
| `dateOfBirth` | `dateOfBirth` | `DD-MM-YYYY` → `YYYY-MM-DD` |
| `role` | `role` | Direct copy |
| `confirmed` | `registrationStatus` | `true` → `"completed"`, `false` → `"pending"` |
| `suspended` | `isSuspended` | Direct copy |
| `confirmedat` | `approvedAt` | Convert to Firestore Timestamp |
| `verified` | `emailVerified` | Direct copy |
| `createdAt` | `createdAt` | Convert to Firestore Timestamp |
| `updatedAt` | `updatedAt` | Convert to Firestore Timestamp |
| `units` | `projects[]` | Transform to array of `{projectId, role, unit}` |
| `_id` | `oldId` | Keep as reference |
| — | `fullName` | Generate from `firstName + " " + lastName` |
| — | `approvalStatus` | `"approved"` if confirmed, else `"pending"` |
| — | `approvedBy` | Set to `"system"` |
| — | `isProfileComplete` | Set based on `confirmed` status |

## 📝 Output Examples

### Success Messages
```
✅ Imported: John Smith (john.smith@email.com)
✅ Imported: Jane Doe (jane.doe@email.com)
```

### Warnings
```
⚠️  Skipped duplicate: user@email.com
⚠️  Unknown project skipped: old_project_name
⚠️  Skipped user with no email or nationalId (oldId: 123456)
```

### Progress Indicators
```
📈 Progress: 100/500 processed
📈 Progress: 200/500 processed
```

### Final Summary
```
==================================================
📊 IMPORT SUMMARY
==================================================
✅ Successfully imported: 450
⚠️  Skipped (duplicates): 48
❌ Errors: 2
📁 Total processed: 500
==================================================
```

## 🛡️ Safety Features

- **Duplicate Detection**: Checks both email and nationalId before inserting
- **Data Validation**: Skips users without email or nationalId
- **Error Handling**: Continues processing even if individual records fail
- **Unknown Projects**: Logs warnings for unmapped project names
- **Timestamp Validation**: Handles both seconds and milliseconds timestamps
- **Non-Destructive**: Only adds new users, never modifies existing data

## ⚙️ Customization

### Adding New Project Mappings

Edit the `PROJECT_MAPPING` object in `importUsers.js`:

```javascript
const PROJECT_MAPPING = {
  // ... existing mappings
  your_new_project: 'FirestoreProjectId123',
};
```

### Modifying Field Transformations

Update the `transformUser()` function to adjust how fields are mapped.

## 🐛 Troubleshooting

### Error: Cannot find module 'firebase-admin'
**Solution**: Run `npm install` to install dependencies

### Error: ENOENT: no such file or directory
**Solution**: Ensure `serviceAccountKey.json` and `users.json` are in the correct directory

### Error: Permission denied
**Solution**: Verify your Firebase service account has Firestore write permissions

### Script hangs or runs slowly
**Solution**: Normal for large datasets. The script processes users sequentially to avoid rate limits.

## ⚠️ Important Notes

1. **Backup First**: Always backup your Firestore data before running imports
2. **Test Environment**: Consider running on a test project first
3. **Rate Limits**: The script respects Firestore rate limits by processing sequentially
4. **Duplicate Logic**: Users are considered duplicates if they share email OR nationalId
5. **Service Account**: Keep `serviceAccountKey.json` secure and never commit it to version control

## 📄 License

Internal use only - PRE Project

---

**Questions or Issues?** Contact your Firebase administrator.

