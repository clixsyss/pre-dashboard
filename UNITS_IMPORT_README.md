# Units Import Script

This script imports units from an Excel file into Firestore subcollection `project/BiHENuiMdDrivwbPccNE/units`.

## 📋 Prerequisites

1. **Excel File Format**: Your Excel file must have the following columns:
   - `Building Num` - Building number (e.g., 1, 2, 3)
   - `Unit Num` - Unit number (e.g., "7R", "12A", "101")
   - `Floor` - Floor identifier (e.g., "TF", "GF", "1F")
   - `Owner` - Developer/Owner name (will be renamed to "developer" in Firestore)

2. **Required Files**:
   - `serviceAccountKey.json` - Firebase Admin SDK service account key (already in this directory)
   - Excel file with units data (e.g., `stone_units.xlsx`)

## 🚀 Usage

### Step 1: Install Dependencies

```bash
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard
npm install
```

### Step 2: Prepare Your Excel File

1. Place your Excel file in the `pre-dashboard` directory
2. Make sure it has the required columns: `Building Num`, `Unit Num`, `Floor`, `Owner`
3. Update the `EXCEL_FILE_NAME` constant in `importUnits.mjs` if your file has a different name

### Step 3: Run the Import

```bash
npm run import-units
```

Or directly:

```bash
node importUnits.mjs
```

## 📊 Expected Output

```
🚀 Starting units import process...

📁 Project ID: BiHENuiMdDrivwbPccNE
📊 Reading from: stone_units.xlsx

📊 Found 150 units in Excel file

✅ Added unit 7R in building 2
✅ Added unit 12A in building 2
🔁 Updated unit 101 in building 3
✅ Added unit 205 in building 3

📈 Progress: 50/150 processed

============================================================
📊 IMPORT SUMMARY
============================================================
✅ Successfully added: 145
🔁 Successfully updated: 3
⚠️  Skipped: 2
❌ Errors: 0
📁 Total processed: 150
============================================================

🏁 Import process completed
```

## 🔧 Configuration

To change the target project or Excel file, edit these constants in `importUnits.mjs`:

```javascript
// Project ID for Stone Residence
const PROJECT_ID = 'BiHENuiMdDrivwbPccNE';

// Excel file name
const EXCEL_FILE_NAME = 'stone_units.xlsx';
```

## 📝 Firestore Document Structure

Each unit document will have the following structure:

```json
{
  "buildingNum": 2,
  "unitNum": "7R",
  "floor": "TF",
  "developer": "Pre"
}
```

## ⚙️ Features

- ✅ **Duplicate Prevention**: Uses `unitNum` as unique identifier
- 🔁 **Smart Updates**: Updates existing units instead of creating duplicates
- 📊 **Progress Tracking**: Shows real-time progress every 50 units
- ❌ **Error Handling**: Gracefully handles errors and continues processing
- 📈 **Detailed Logging**: Clear logs with emojis for easy tracking
- 🧹 **Clean Validation**: Skips rows with missing unit numbers

## 🐛 Troubleshooting

### Error: "Cannot find module 'xlsx'"
Run `npm install` to install dependencies.

### Error: "ENOENT: no such file or directory"
Make sure your Excel file exists in the `pre-dashboard` directory and the filename matches `EXCEL_FILE_NAME` in the script.

### Error: "Failed to load service account"
Ensure `serviceAccountKey.json` exists in the `pre-dashboard` directory.

### Wrong column names
The script accepts both formats:
- Excel format: `Building Num`, `Unit Num`, `Floor`, `Owner`
- Camel case: `buildingNum`, `unitNum`, `floor`, `developer`

## 📖 Example Excel File

| Building Num | Unit Num | Floor | Owner |
|--------------|----------|-------|-------|
| 2            | 7R       | TF    | Pre   |
| 2            | 12A      | GF    | Pre   |
| 3            | 101      | 1F    | Pre   |
| 3            | 205      | 2F    | Pre   |

## 🔐 Security Note

Make sure `serviceAccountKey.json` is **never** committed to Git. It's already in `.gitignore`.

