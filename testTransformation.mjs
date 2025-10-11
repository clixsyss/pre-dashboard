import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURATION ====================

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

// ==================== HELPER FUNCTIONS ====================

function convertDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Current timestamp';
  
  // If it's a string (ISO date), return as-is
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  const seconds = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
  return new Date(seconds * 1000).toISOString();
}

function transformUnitsToProjects(units, userRole = 'resident') {
  if (!units || typeof units !== 'object') return [];
  
  const projects = [];
  
  for (const [projectName, unitArray] of Object.entries(units)) {
    const projectId = PROJECT_MAPPING[projectName];
    
    if (!projectId) {
      console.warn(`⚠️  Unknown project: ${projectName}`);
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

function transformUser(oldUser) {
  const firstName = oldUser.firstName || '';
  const lastName = oldUser.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const confirmed = oldUser.confirmed === true;
  
  return {
    firstName,
    lastName,
    fullName,
    email: oldUser.email || '',
    mobile: oldUser.mobile || '',
    nationalId: oldUser.nationalId || '',
    gender: oldUser.gender || '',
    dateOfBirth: convertDateFormat(oldUser.dateOfBirth) || '',
    role: oldUser.role || 'resident',
    registrationStatus: confirmed ? 'completed' : 'pending',
    approvalStatus: confirmed ? 'approved' : 'pending',
    isProfileComplete: confirmed,
    isSuspended: oldUser.suspended === true,
    emailVerified: oldUser.verified === true,
    approvedBy: confirmed ? 'system' : '',
    approvedAt: formatTimestamp(oldUser.confirmedat),
    projects: transformUnitsToProjects(oldUser.units, oldUser.role),
    createdAt: formatTimestamp(oldUser.createdAt),
    updatedAt: formatTimestamp(oldUser.updatedAt),
    oldId: oldUser._id || '',
  };
}

// ==================== TEST FUNCTION ====================

async function testTransformation() {
  console.log('🧪 Testing User Data Transformation (Dry Run)\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    // Read old users JSON file
    const jsonData = await readFile(join(__dirname, 'users.json'), 'utf-8');
    const parsedData = JSON.parse(jsonData);
    
    // Handle both direct array and wrapped object structure
    const oldUsers = Array.isArray(parsedData) 
      ? parsedData 
      : (parsedData.data || parsedData.users || []);
    
    console.log(`📊 Found ${oldUsers.length} users in old data\n`);
    
    // Get first 5 users for testing
    const sampleSize = Math.min(5, oldUsers.length);
    const sampleUsers = oldUsers.slice(0, sampleSize);
    
    console.log(`📋 Showing transformation for first ${sampleSize} users:\n`);
    
    for (let i = 0; i < sampleUsers.length; i++) {
      const oldUser = sampleUsers[i];
      const newUser = transformUser(oldUser);
      
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`User ${i + 1}: ${newUser.fullName || 'No Name'}`);
      console.log(`${'─'.repeat(60)}`);
      
      console.log('\n📥 OLD DATA:');
      console.log(JSON.stringify({
        _id: oldUser._id,
        firstName: oldUser.firstName,
        lastName: oldUser.lastName,
        email: oldUser.email,
        mobile: oldUser.mobile,
        nationalId: oldUser.nationalId,
        dateOfBirth: oldUser.dateOfBirth,
        confirmed: oldUser.confirmed,
        verified: oldUser.verified,
        units: oldUser.units,
      }, null, 2));
      
      console.log('\n📤 NEW DATA (transformed):');
      console.log(JSON.stringify(newUser, null, 2));
    }
    
    // Summary statistics
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TRANSFORMATION ANALYSIS');
    console.log('='.repeat(60));
    
    let validUsers = 0;
    let missingEmail = 0;
    let missingNationalId = 0;
    let confirmedUsers = 0;
    let projectStats = {};
    
    for (const oldUser of oldUsers) {
      const newUser = transformUser(oldUser);
      
      if (newUser.email || newUser.nationalId) validUsers++;
      if (!newUser.email) missingEmail++;
      if (!newUser.nationalId) missingNationalId++;
      if (newUser.registrationStatus === 'completed') confirmedUsers++;
      
      // Count projects
      for (const project of newUser.projects) {
        projectStats[project.projectId] = (projectStats[project.projectId] || 0) + 1;
      }
    }
    
    console.log(`\n✅ Valid users (have email or nationalId): ${validUsers}`);
    console.log(`⚠️  Users missing email: ${missingEmail}`);
    console.log(`⚠️  Users missing nationalId: ${missingNationalId}`);
    console.log(`👤 Confirmed users: ${confirmedUsers}`);
    console.log(`👥 Pending users: ${oldUsers.length - confirmedUsers}`);
    
    console.log('\n📊 Project Distribution:');
    const sortedProjects = Object.entries(projectStats).sort((a, b) => b[1] - a[1]);
    for (const [projectId, count] of sortedProjects) {
      const projectName = Object.entries(PROJECT_MAPPING)
        .find(([_, id]) => id === projectId)?.[0] || 'Unknown';
      console.log(`   ${projectName}: ${count} users`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Transformation test completed successfully!');
    console.log('='.repeat(60) + '\n');
    
    console.log('💡 TIP: Review the transformed data above to ensure it matches');
    console.log('   your expected Firestore schema before running the actual import.\n');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

// ==================== RUN ====================

testTransformation().catch(console.error);

