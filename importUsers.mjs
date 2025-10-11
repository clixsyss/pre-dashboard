// node importUsers.mjs

import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURATION ====================

// Project ID Mapping: Old names → Firestore IDs
const PROJECT_MAPPING = {
  stone_residence: 'BiHENuiMdDrivwbPccNE',
  the_brooks: '3OcGvjzt8lPCNG4PB812',
  brookview: 'I3taP0crSITF2iqpBUfO',
  hadaba: 'IzN8JxYC1wl21EuUwtC5',
  ivoire_east: 'VtOV8ZzMQqUCGitQlLjR',
  brooks_ville: 'dQ7daaLWN0OSGOppEan7',
  jebal: 'gffEmqBOveWUOxzARNaX',
  crimson_heights: 'u3drPih6Hf6vOFX8savu',
};

// ==================== INITIALIZE FIREBASE ====================

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  await readFile(join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// ==================== HELPER FUNCTIONS ====================

/**
 * Converts date from DD-MM-YYYY to YYYY-MM-DD
 * @param {string} dateString - Date in DD-MM-YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
function convertDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Converts timestamp (seconds, milliseconds, or ISO string) to Firestore Timestamp
 * @param {number|string} timestamp - Unix timestamp or ISO date string
 * @returns {admin.firestore.Timestamp} Firestore Timestamp
 */
function toFirestoreTimestamp(timestamp) {
  if (!timestamp) return admin.firestore.Timestamp.now();
  
  // If it's a string (ISO date), parse it
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return admin.firestore.Timestamp.fromDate(date);
  }
  
  // If timestamp is in milliseconds (13 digits), convert to seconds
  const seconds = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
  return admin.firestore.Timestamp.fromMillis(seconds * 1000);
}

/**
 * Transforms old units structure to new projects array
 * @param {Object} units - Old units object (maps project name to array of unit strings)
 * @param {string} userRole - User's primary role
 * @returns {Array} Array of project objects
 */
function transformUnitsToProjects(units, userRole = 'resident') {
  if (!units || typeof units !== 'object') return [];
  
  const projects = [];
  
  for (const [projectName, unitArray] of Object.entries(units)) {
    const projectId = PROJECT_MAPPING[projectName];
    
    if (!projectId) {
      console.warn(`⚠️  Unknown project skipped: ${projectName}`);
      continue;
    }
    
    // Handle units as array of strings
    if (Array.isArray(unitArray) && unitArray.length > 0) {
      // Create a project entry for each unit
      for (const unitString of unitArray) {
        projects.push({
          projectId,
          role: userRole || 'resident',
          unit: unitString || '',
        });
      }
    } else {
      // If no units, still add the project
      projects.push({
        projectId,
        role: userRole || 'resident',
        unit: '',
      });
    }
  }
  
  return projects;
}

/**
 * Transforms old user data to new Firestore schema
 * @param {Object} oldUser - Old user object
 * @returns {Object} Transformed user object
 */
function transformUser(oldUser) {
  const firstName = oldUser.firstName || '';
  const lastName = oldUser.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const confirmed = oldUser.confirmed === true;
  
  return {
    // Basic info
    firstName,
    lastName,
    fullName,
    email: oldUser.email || '',
    mobile: oldUser.mobile || '',
    nationalId: oldUser.nationalId || '',
    gender: oldUser.gender || '',
    dateOfBirth: convertDateFormat(oldUser.dateOfBirth) || '',
    
    // Role and status
    role: oldUser.role || 'resident',
    registrationStatus: confirmed ? 'completed' : 'pending',
    approvalStatus: confirmed ? 'approved' : 'pending',
    isProfileComplete: confirmed,
    isSuspended: oldUser.suspended === true,
    emailVerified: oldUser.verified === true,
    
    // Approval info
    approvedBy: confirmed ? 'system' : '',
    approvedAt: oldUser.confirmedat 
      ? toFirestoreTimestamp(oldUser.confirmedat) 
      : null,
    
    // Projects (transformed from units)
    projects: transformUnitsToProjects(oldUser.units, oldUser.role),
    
    // Timestamps
    createdAt: oldUser.createdAt 
      ? toFirestoreTimestamp(oldUser.createdAt) 
      : admin.firestore.Timestamp.now(),
    updatedAt: oldUser.updatedAt 
      ? toFirestoreTimestamp(oldUser.updatedAt) 
      : admin.firestore.Timestamp.now(),
    
    // Keep old ID for reference
    oldId: oldUser._id || '',
  };
}

/**
 * Checks if a user already exists in Firestore
 * @param {string} email - User email
 * @param {string} nationalId - User national ID
 * @returns {Promise<boolean>} True if user exists
 */
async function userExists(email, nationalId) {
  if (!email && !nationalId) return false;
  
  try {
    // Check by email
    if (email) {
      const emailQuery = await usersCollection
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) return true;
    }
    
    // Check by nationalId
    if (nationalId) {
      const nationalIdQuery = await usersCollection
        .where('nationalId', '==', nationalId)
        .limit(1)
        .get();
      
      if (!nationalIdQuery.empty) return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking user existence:`, error);
    return false;
  }
}

// ==================== MAIN IMPORT FUNCTION ====================

/**
 * Main function to import users from JSON file
 */
async function importUsers() {
  console.log('🚀 Starting user import process...\n');
  
  try {
    // Read old users JSON file
    const jsonData = await readFile(
      join(__dirname, 'users05.json'),
      'utf-8'
    );
    const parsedData = JSON.parse(jsonData);
    
    // Handle both direct array and wrapped object structure
    const oldUsers = Array.isArray(parsedData) 
      ? parsedData 
      : (parsedData.data || parsedData.users || []);
    
    console.log(`📊 Found ${oldUsers.length} users in old data\n`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each user
    for (let i = 0; i < oldUsers.length; i++) {
      const oldUser = oldUsers[i];
      
      try {
        // Check for duplicates
        const exists = await userExists(oldUser.email, oldUser.nationalId);
        
        if (exists) {
          console.log(`⚠️  Skipped duplicate: ${oldUser.email || oldUser.nationalId}`);
          skipped++;
          continue;
        }
        
        // Transform user data
        const newUser = transformUser(oldUser);
        
        // Validate required fields
        if (!newUser.email && !newUser.nationalId) {
          console.log(`⚠️  Skipped user with no email or nationalId (oldId: ${oldUser._id})`);
          skipped++;
          continue;
        }
        
        // Import to Firestore
        await usersCollection.add(newUser);
        
        console.log(`✅ Imported: ${newUser.fullName} (${newUser.email})`);
        imported++;
        
        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`\n📈 Progress: ${i + 1}/${oldUsers.length} processed\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing user ${oldUser.email}:`, error.message);
        errors++;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⚠️  Skipped (duplicates): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total processed: ${oldUsers.length}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    // Clean up
    await admin.app().delete();
    console.log('🏁 Import process completed');
  }
}

// ==================== RUN ====================

// Execute the import
importUsers().catch(console.error);

