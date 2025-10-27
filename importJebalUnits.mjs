/**
 * Import Jebal Units to Firestore
 * 
 * This script reads units from jebal_units.json and imports them into Firestore
 * under projects/gffEmqBOveWUOxzARNaX/units
 * 
 * Usage: node importJebalUnits.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
// Option 1: Use service account JSON file
// Option 2: Use GOOGLE_APPLICATION_CREDENTIALS environment variable
try {
  let credential;
  
  // Try to load from file first
  const serviceAccountPath = join(__dirname, 'firebase-service-account.json');
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Using firebase-service-account.json\n');
  } catch (fileError) {
    // Try using application default credentials (works if GOOGLE_APPLICATION_CREDENTIALS is set)
    console.log('⚠️  firebase-service-account.json not found');
    console.log('📝 To get your service account:');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Click "Generate New Private Key"');
    console.log('   3. Save the file as "firebase-service-account.json" in this directory\n');
    
    credential = admin.credential.applicationDefault();
    console.log('✅ Using application default credentials\n');
  }
  
  admin.initializeApp({
    credential: credential
  });
} catch (error) {
  console.error('\n❌ Failed to initialize Firebase Admin:');
  console.error(error.message);
  console.error('\n📝 Please ensure you have either:');
  console.error('   1. firebase-service-account.json in this directory, OR');
  console.error('   2. GOOGLE_APPLICATION_CREDENTIALS environment variable set\n');
  process.exit(1);
}

const db = admin.firestore();

// Project ID and collection reference
const PROJECT_ID = 'gffEmqBOveWUOxzARNaX';
const unitsCollection = db.collection('projects').doc(PROJECT_ID).collection('units');

/**
 * Extract unit number from full unit string (e.g., "D1A-1" → "1")
 */
function extractUnitNumber(unitString) {
  if (!unitString) return null;
  
  const parts = unitString.split('-');
  if (parts.length > 1) {
    return parts[1].trim();
  }
  
  return unitString.trim();
}

/**
 * Transform raw JSON data to Firestore document format
 */
function transformUnit(rawUnit) {
  return {
    buildingNum: rawUnit.building || null,
    unitNum: extractUnitNumber(rawUnit.unit),
    developer: rawUnit.company || null,
    floor: null
  };
}

/**
 * Check if a unit already exists (by building + unit combination)
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

/**
 * Main import function
 */
async function importUnits() {
  try {
    console.log('🚀 Starting Jebal units import...\n');
    
    // Read JSON file
    const jsonPath = join(__dirname, 'jebal_units.json');
    console.log(`📂 Reading file: ${jsonPath}`);
    
    const jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'));
    console.log(`✅ Found ${jsonData.length} units in JSON file\n`);
    
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each unit
    for (let i = 0; i < jsonData.length; i++) {
      const rawUnit = jsonData[i];
      
      try {
        // Transform the data
        const unitData = transformUnit(rawUnit);
        
        // Validate required fields
        if (!unitData.buildingNum || !unitData.unitNum) {
          console.warn(`⚠️  Skipping record ${i + 1}: Missing building or unit`);
          console.warn(`   Raw data:`, rawUnit);
          skipped++;
          continue;
        }
        
        // Log the transformation
        if ((i + 1) % 100 === 0) {
          console.log(`\n📊 Progress: Processing record ${i + 1}/${jsonData.length}...`);
        }
        
        // Check if unit already exists
        const existingUnit = await getExistingUnit(unitData);
        
        if (existingUnit) {
          // Update existing unit
          await unitsCollection.doc(existingUnit.id).update(unitData);
          console.log(
            `🔁 Updated unit ${unitData.unitNum} in building ${unitData.buildingNum}`
          );
          updated++;
        } else {
          // Add new unit
          await unitsCollection.add(unitData);
          console.log(
            `✅ Added unit ${unitData.unitNum} in building ${unitData.buildingNum}`
          );
          added++;
        }
        
      } catch (error) {
        console.error(
          `❌ Error processing record ${i + 1} (${rawUnit.unit}):`,
          error.message
        );
        errors++;
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Added:   ${added} units`);
    console.log(`🔁 Updated: ${updated} units`);
    console.log(`⚠️  Skipped: ${skipped} units`);
    console.log(`❌ Errors:  ${errors} units`);
    console.log(`📊 Total:   ${added + updated} units successfully imported`);
    console.log('='.repeat(60));
    
    if (errors > 0) {
      console.log('\n⚠️  Some units had errors. Please review the logs above.');
    } else {
      console.log('\n🎉 All units imported successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    // Close the Firebase connection
    await admin.app().delete();
    console.log('\n👋 Firebase connection closed.');
  }
}

// Run the import
importUnits();

