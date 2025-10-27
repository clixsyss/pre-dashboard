# Jebal Units Import Script

This script imports unit data from `jebal_units.json` into Firestore.

## Prerequisites

1. Node.js installed
2. Firebase service account JSON file
3. `jebal_units.json` file with unit data

## Setup

1. Make sure you have the `firebase-service-account.json` file in the same directory as the script
2. Make sure you have the `jebal_units.json` file in the same directory

## Installation

```bash
npm install firebase-admin
# or if already installed
npm install
```

## Usage

```bash
node importJebalUnits.mjs
```

## Input JSON Format

The script expects a JSON file with the following structure:

```json
[
  {
    "_id": "66bccf41aa7b9563d7e4c7ec",
    "unit": "D1A-1",
    "building": "D1A",
    "company": "jebal"
  }
]
```

## Transformation Logic

Each record is transformed as follows:

**Input:**
```json
{
  "unit": "D1A-1",
  "building": "D1A",
  "company": "jebal"
}
```

**Output (Firestore document):**
```json
{
  "buildingNum": "D1A",
  "unitNum": "1",
  "developer": "jebal",
  "floor": null
}
```

### Field Mapping:
- `building` → `buildingNum` (renamed)
- `unit` → `unitNum` - extracts the part after the dash (e.g., "D1A-1" → "1")
- `company` → `developer` (renamed)
- `floor` → set to `null`

## Firestore Location

Documents are added to:
```
projects/gffEmqBOveWUOxzARNaX/units/{auto-generated-id}
```

## Duplicate Handling

The script checks for existing units by matching both `buildingNum` AND `unitNum` fields:
- If a match is found → **Updates** the existing document
- If no match is found → **Creates** a new document

## Example Output

```
🚀 Starting Jebal units import...

📂 Reading file: /path/to/jebal_units.json
✅ Found 150 units in JSON file

✅ Added unit 1 in building D1A
✅ Added unit 2 in building D1A
🔁 Updated unit 3 in building D1A

📊 Progress: Processing record 100/150...

============================================================
📈 IMPORT SUMMARY
============================================================
✅ Added:   148 units
🔁 Updated: 2 units
⚠️  Skipped: 0 units
❌ Errors:  0 units
📊 Total:   150 units successfully imported
============================================================

🎉 All units imported successfully!

👋 Firebase connection closed.
```

## Error Handling

The script includes:
- ✅ Validation for required fields (building, unit)
- ✅ Try/catch blocks for each unit
- ✅ Graceful error messages with context
- ✅ Summary statistics at the end

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "ENOENT: no such file or directory"
- Make sure `jebal_units.json` exists in the same directory
- Check that `firebase-service-account.json` exists

### Error: "Permission denied"
- Verify your Firebase service account has write access
- Check Firestore security rules for the `projects/{projectId}/units` collection

## Notes

- The script processes units sequentially to avoid rate limiting
- Progress is logged every 100 records
- The Firebase connection is properly closed after completion
- All units are validated before being uploaded
- Field names match the dashboard expectations: `buildingNum` and `unitNum`

