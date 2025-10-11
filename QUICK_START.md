# 🚀 Quick Start Guide - User Import

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] `serviceAccountKey.json` (Firebase Admin SDK credentials)
- [ ] `users.json` (old user data)

## Commands

```bash
# 1. Install dependencies
npm install

# 2. Test transformation (dry run - safe to run)
npm run test-transform

# 3. Import users (writes to Firestore)
npm run import-users
```

## File Structure

```
pre-dashboard/
├── importUsers.mjs             # Main import script (ES module)
├── testTransformation.mjs      # Dry-run test script (ES module)
├── serviceAccountKey.json      # Your Firebase credentials (DO NOT COMMIT)
├── users.json                  # Your old user data (DO NOT COMMIT)
├── serviceAccountKey.example.json  # Template for credentials
└── IMPORT_USERS_README.md      # Detailed documentation
```

## What Happens During Import?

1. ✅ Reads `users.json`
2. ✅ Transforms each record to match Firestore schema
3. ✅ Checks for duplicates (email or nationalId)
4. ✅ Converts dates from `DD-MM-YYYY` to `YYYY-MM-DD`
5. ✅ Maps old project names to Firestore project IDs
6. ✅ Imports to Firestore `users` collection
7. ✅ Shows detailed progress and summary

## Project Mappings

| Old Name | Firestore ID |
|----------|--------------|
| `stone_residence` | `BiHENuiMdDrivwbPccNE` |
| `the_brooks` | `3OcGvjzt8lPCNG4PB812` |
| `brookview` | `I3taP0crSITF2iqpBUfO` |
| `hadaba` | `IzN8JxYC1wl21EuUwtC5` |
| `ivoire_east` | `VtOV8ZzMQqUCGitQlLjR` |
| `brooks_ville` | `dQ7daaLWN0OSGOppEan7` |
| `jebal` | `gffEmqBOveWUOxzARNaX` |
| `crimson_heights` | `u3drPih6Hf6vOFX8savu` |

## Safety Features

- ✅ Skips duplicates (won't overwrite existing users)
- ✅ Validates data before importing
- ✅ Detailed logging of all operations
- ✅ Graceful error handling
- ✅ Test mode available (`test-transform`)

## Getting serviceAccountKey.json

1. [Firebase Console](https://console.firebase.google.com/) → Your Project
2. **Project Settings** → **Service Accounts**
3. **Generate New Private Key**
4. Save as `serviceAccountKey.json` in this directory

## Need Help?

📖 See `IMPORT_USERS_README.md` for detailed documentation

---

**⚠️ IMPORTANT**: Always test on a development/staging environment first!

