// node importStoneParkUnits.mjs

import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURATION ====================

// Project ID for Stone Park
const PROJECT_ID = 'Ab1suKN0KufKmseFBqgY';

// Excel file name (place it in the same directory as this script)
const EXCEL_FILE_NAME = 'telal_units.xlsx';

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
 * For stonePark_units.xlsx: columns are "developer", "unit", and "building"
 * @param {Object} row - Excel row object
 * @returns {Object} Transformed document
 */
function transformUnit(row) {
  // Get the unit value (try different column name variations)
  const unitNum = String(row['unit'] || row['Unit'] || row['UNIT'] || '').trim();
  
  // Get the building value (try different column name variations)
  const buildingNum = String(row['building'] || row['Building'] || row['BUILDING'] || '').trim();
  
  // Get developer (try different column name variations)
  const developer = row['developer'] || row['Developer'] || row['DEVELOPER'] || '';
  
  return {
    buildingNum: buildingNum,
    unitNum: unitNum,
    floor: null,
    developer: developer,
  };
}

/**
 * Checks if a unit already exists in Firestore by buildingNum and unitNum
 * @param {Object} unitData - Unit data with buildingNum, unitNum, floor, developer
 * @returns {Promise<Object|null>} Existing document or null
 */
async function getExistingUnit(unitData) {
  try {
    const query = await unitsCollection
      .where('buildingNum', '==', unitData.buildingNum)
      .where('unitNum', '==', unitData.unitNum)
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
  console.log('🚀 Starting Stone Park units import process...\n');
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
        
        // Validate required fields (only unitNum is required)
        if (!unitData.unitNum) {
          console.log(`⚠️  Skipped row ${i + 1}: Missing unit number`);
          skipped++;
          continue;
        }
        
        // Check if unit already exists (by buildingNum and unitNum)
        const existingUnit = await getExistingUnit(unitData);
        
        // Create display name for unit
        const unitDisplay = unitData.buildingNum 
          ? `${unitData.buildingNum}-${unitData.unitNum}` 
          : unitData.unitNum;
        
        if (existingUnit) {
          // Update existing unit
          await unitsCollection.doc(existingUnit.id).update(unitData);
          console.log(
            `🔁 Updated unit ${unitDisplay} (Developer: ${unitData.developer})`
          );
          updated++;
        } else {
          // Add new unit
          await unitsCollection.add(unitData);
          console.log(
            `✅ Added unit ${unitDisplay} (Developer: ${unitData.developer})`
          );
          added++;
        }
        
        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`\n📈 Progress: ${i + 1}/${excelData.length} processed\n`);
        }
        
      } catch (error) {
        console.error(
          `❌ Error processing unit ${row['unit'] || row['Unit']}:`,
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

