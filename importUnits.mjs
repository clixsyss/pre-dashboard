// node importUnits.mjs

import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURATION ====================

// Project ID for Stone Residence
const PROJECT_ID = 'BiHENuiMdDrivwbPccNE';

// Excel file name (place it in the same directory as this script)
const EXCEL_FILE_NAME = 'stone_units.xlsx'; // Change this to your Excel file name

// ==================== INITIALIZE FIREBASE ====================

// Initialize Firebase Admin SDK with service account
// Make sure serviceAccountKey.json exists in the same directory
const serviceAccount = JSON.parse(
  await readFile(join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Reference to the units subcollection
const unitsCollection = db.collection('projects').doc(PROJECT_ID).collection('units');

// ==================== HELPER FUNCTIONS ====================

/**
 * Reads an Excel file and converts it to JSON
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} Array of row objects
 */
function readExcelFile(filePath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return jsonData;
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    throw error;
  }
}

/**
 * Transforms Excel row to Firestore document format
 * @param {Object} row - Excel row object
 * @returns {Object} Transformed document
 */
function transformUnit(row) {
  return {
    buildingNum: row['Building Num'] || row.buildingNum || '',
    unitNum: String(row['Unit Num'] || row.unitNum || '').trim(),
    floor: row['Floor'] || row.floor || '',
    developer: row['Owner'] || row.developer || row.owner || '',
  };
}

/**
 * Checks if a unit already exists in Firestore by all fields
 * @param {Object} unitData - Unit data with buildingNum, unitNum, floor, developer
 * @returns {Promise<Object|null>} Existing document or null
 */
async function getExistingUnit(unitData) {
  try {
    const query = await unitsCollection
      .where('buildingNum', '==', unitData.buildingNum)
      .where('unitNum', '==', unitData.unitNum)
      .where('floor', '==', unitData.floor)
      .where('developer', '==', unitData.developer)
      .limit(1)
      .get();
    
    if (!query.empty) {
      return { id: query.docs[0].id, data: query.docs[0].data() };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error checking unit existence:`, error.message);
    return null;
  }
}

// ==================== MAIN IMPORT FUNCTION ====================

/**
 * Main function to import units from Excel file
 */
async function importUnits() {
  console.log('🚀 Starting units import process...\n');
  console.log(`📁 Project ID: ${PROJECT_ID}`);
  console.log(`📊 Reading from: ${EXCEL_FILE_NAME}\n`);
  
  try {
    // Read Excel file
    const excelPath = join(__dirname, EXCEL_FILE_NAME);
    const excelData = readExcelFile(excelPath);
    
    console.log(`📊 Found ${excelData.length} units in Excel file\n`);
    
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each row
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      
      try {
        // Transform data
        const unitData = transformUnit(row);
        
        // Validate required fields
        if (!unitData.unitNum) {
          console.log(`⚠️  Skipped row ${i + 1}: Missing unit number`);
          skipped++;
          continue;
        }
        
        // Check if unit already exists (by all fields combination)
        const existingUnit = await getExistingUnit(unitData);
        
        if (existingUnit) {
          // Update existing unit
          await unitsCollection.doc(existingUnit.id).update(unitData);
          console.log(
            `🔁 Updated unit ${unitData.unitNum} in building ${unitData.buildingNum}, floor ${unitData.floor}`
          );
          updated++;
        } else {
          // Add new unit
          await unitsCollection.add(unitData);
          console.log(
            `✅ Added unit ${unitData.unitNum} in building ${unitData.buildingNum}, floor ${unitData.floor}`
          );
          added++;
        }
        
        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`\n📈 Progress: ${i + 1}/${excelData.length} processed\n`);
        }
        
      } catch (error) {
        console.error(
          `❌ Error processing unit ${row['Unit Num'] || row.unitNum}:`,
          error.message
        );
        errors++;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added: ${added}`);
    console.log(`🔁 Successfully updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total processed: ${excelData.length}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    // Clean up Firebase connection
    await admin.app().delete();
    console.log('🏁 Import process completed');
  }
}

// ==================== RUN ====================

// Execute the import
importUnits().catch(console.error);

