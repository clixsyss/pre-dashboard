# 📝 User Data Migration Notes

## Overview

This document describes the data migration from the old user system (JSON) to the new Firebase Firestore schema.

**Date Created**: October 2025  
**Migration Type**: One-time import with transformation  
**Source**: `users.json` (old system)  
**Destination**: Firestore `users` collection (production)

---

## Schema Changes

### New Fields Added

These fields don't exist in the old data and are computed or set to defaults:

| Field | Value | Logic |
|-------|-------|-------|
| `fullName` | Computed | `firstName + " " + lastName` |
| `approvalStatus` | Computed | `"approved"` if confirmed, else `"pending"` |
| `approvedBy` | `"system"` | Set to "system" for migrated users |
| `isProfileComplete` | Computed | Same as `confirmed` status |

### Renamed Fields

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `confirmed` | `registrationStatus` | Boolean → String enum |
| `suspended` | `isSuspended` | Direct mapping |
| `confirmedat` | `approvedAt` | Unix timestamp → Firestore Timestamp |
| `verified` | `emailVerified` | Direct mapping |
| `units` | `projects` | Object → Array transformation |
| `_id` | `oldId` | Preserved as reference |

### Date Format Changes

| Field | Old Format | New Format |
|-------|------------|------------|
| `dateOfBirth` | `DD-MM-YYYY` | `YYYY-MM-DD` |
| `createdAt` | Unix timestamp | Firestore Timestamp |
| `updatedAt` | Unix timestamp | Firestore Timestamp |
| `approvedAt` | Unix timestamp | Firestore Timestamp |

---

## Projects Transformation

### Old Structure (units)
```json
{
  "units": {
    "stone_residence": ["111-1", "A-101"],
    "the_brooks": ["B-202"]
  },
  "role": "owner"
}
```

### New Structure (projects)
```json
{
  "projects": [
    {
      "projectId": "BiHENuiMdDrivwbPccNE",
      "role": "owner",
      "unit": "111-1"
    },
    {
      "projectId": "BiHENuiMdDrivwbPccNE",
      "role": "owner",
      "unit": "A-101"
    },
    {
      "projectId": "3OcGvjzt8lPCNG4PB812",
      "role": "owner",
      "unit": "B-202"
    }
  ]
}
```

**Note**: Each unit in the old system becomes a separate project entry in the new system. The role is taken from the user's primary `role` field.

### Project ID Mapping

The migration maps old project slug names to new Firestore document IDs:

| Old Slug | New Firestore ID | Project Name |
|----------|------------------|--------------|
| `stone_residence` | `BiHENuiMdDrivwbPccNE` | Stone Residence |
| `the_brooks` | `3OcGvjzt8lPCNG4PB812` | The Brooks |
| `brookview` | `I3taP0crSITF2iqpBUfO` | Brookview |
| `hadaba` | `IzN8JxYC1wl21EuUwtC5` | Hadaba |
| `ivoire_east` | `VtOV8ZzMQqUCGitQlLjR` | Ivoire East |
| `brooks_ville` | `dQ7daaLWN0OSGOppEan7` | Brooks Ville |
| `jebal` | `gffEmqBOveWUOxzARNaX` | Jebal |
| `crimson_heights` | `u3drPih6Hf6vOFX8savu` | Crimson Heights |

---

## Duplicate Handling

### Detection Strategy

Users are considered duplicates if:
- **Email matches** an existing user, OR
- **National ID matches** an existing user

### Behavior

- ✅ Duplicates are **skipped** (not imported)
- ✅ Original Firestore users are **never modified**
- ✅ Each skip is **logged** with the matching email/nationalId

### Example Log Output
```
⚠️  Skipped duplicate: john.doe@example.com
⚠️  Skipped duplicate: 29001011234567
```

---

## Data Validation

### Required Fields

The import script validates:
- Users must have **either** email **or** nationalId
- Users without both are skipped with a warning

### Optional Fields

All other fields are optional:
- Missing fields default to empty strings (`""`)
- Missing booleans default to `false`
- Missing timestamps default to current time

---

## Status Mapping

### Registration Status

| Old Value | New Value |
|-----------|-----------|
| `confirmed: true` | `registrationStatus: "completed"` |
| `confirmed: false` | `registrationStatus: "pending"` |

### Approval Status

| Old Value | New Value |
|-----------|-----------|
| `confirmed: true` | `approvalStatus: "approved"` |
| `confirmed: false` | `approvalStatus: "pending"` |

---

## Migration Process

### Phase 1: Preparation
1. Backup existing Firestore data
2. Download old users data as `users.json`
3. Obtain Firebase Admin SDK credentials
4. Install dependencies (`npm install`)

### Phase 2: Testing
1. Run dry-run test: `npm run test-transform`
2. Review sample transformations
3. Check statistics and warnings
4. Verify field mappings

### Phase 3: Execution
1. Run import: `npm run import-users`
2. Monitor console output
3. Review import summary
4. Verify in Firestore console

### Phase 4: Validation
1. Spot-check imported users in Firestore
2. Verify project assignments
3. Check timestamp conversions
4. Confirm no data loss

---

## Known Limitations

### 1. One-Way Migration
- This is an **import only** script
- Does not sync changes back to old system
- Run only once per dataset

### 2. Project Mapping
- Only handles projects in the `PROJECT_MAPPING` object
- Unknown projects are skipped with warnings
- Update mapping before running if new projects exist

### 3. Sequential Processing
- Processes users one at a time
- Large datasets may take time
- Designed to respect Firestore rate limits

### 4. No Rollback
- Once imported, manual cleanup required
- Always test on staging first
- Keep backups of Firestore data

---

## Troubleshooting Common Issues

### Issue: Some users not imported

**Check:**
- Do they have email or nationalId?
- Are they duplicates?
- Review console warnings

### Issue: Projects not showing

**Check:**
- Is the project in `PROJECT_MAPPING`?
- Does the old project name match exactly?
- Review "Unknown project skipped" warnings

### Issue: Dates look wrong

**Check:**
- Original format was `DD-MM-YYYY`?
- Verify conversion to `YYYY-MM-DD`
- Check sample output from test script

### Issue: Script fails with authentication error

**Check:**
- Is `serviceAccountKey.json` present?
- Is it valid JSON?
- Does service account have Firestore write permissions?

---

## Post-Migration Tasks

### Recommended Actions

1. **Verify Data**
   - Spot-check random users
   - Verify user counts match expectations
   - Check project assignments

2. **Update Indexes**
   - Ensure Firestore indexes exist for queries
   - Test common queries (by email, nationalId, project)

3. **Test Application**
   - Login with migrated users
   - Verify app functionality
   - Check project access

4. **Document**
   - Record import date
   - Note any skipped users
   - Save import logs

5. **Cleanup**
   - Secure `serviceAccountKey.json`
   - Archive `users.json`
   - Remove sensitive files from local system

---

## Security Considerations

### Sensitive Files

**Never commit these files:**
- ❌ `serviceAccountKey.json` - Firebase credentials
- ❌ `users.json` - Contains PII
- ❌ `users*.json` - Any user data exports

**These are safe to commit:**
- ✅ `importUsers.js` - Import script
- ✅ `testTransformation.js` - Test script
- ✅ `serviceAccountKey.example.json` - Template only
- ✅ `*.md` - Documentation

### Access Control

- Limit who can run this script
- Use service account with minimal required permissions
- Audit Firestore access logs after migration
- Revoke/rotate service account key after migration

---

## Support & Questions

For issues or questions about this migration:

1. Check `IMPORT_USERS_README.md` for detailed documentation
2. Review `QUICK_START.md` for commands
3. Run `npm run test-transform` to debug transformations
4. Contact your Firebase administrator

---

**Last Updated**: October 11, 2025  
**Script Version**: 1.0  
**Firebase Admin SDK**: v12.0.0

