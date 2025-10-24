import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Migration Script: Move from per-user to per-project guest pass settings
 * 
 * OLD STRUCTURE:
 * users/{userId}/guestPassData {
 *   blocked: boolean,
 *   monthlyLimit: number,
 *   usedThisMonth: number
 * }
 * 
 * NEW STRUCTURE:
 * projects/{projectId}/userGuestPassSettings/{userId} {
 *   blocked: boolean,
 *   monthlyLimit: number,
 *   usedThisMonth: number
 * }
 * 
 * This allows the same user to have different settings per project.
 */

/**
 * Migrate guest pass data for a specific project
 * @param {string} projectId - The project ID to migrate data for
 * @param {boolean} dryRun - If true, only log what would be migrated without making changes
 * @returns {Promise<Object>} Migration results
 */
export const migrateProjectGuestPassSettings = async (projectId, dryRun = true) => {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 Starting migration for project: ${projectId}`);
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
    console.log(`${'='.repeat(80)}\n`);

    const results = {
      totalUsers: 0,
      usersWithGuestPassData: 0,
      usersMigratedSuccessfully: 0,
      usersMigrationFailed: 0,
      usersSkipped: 0,
      errors: []
    };

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    results.totalUsers = usersSnapshot.size;

    console.log(`📊 Found ${results.totalUsers} total users in system\n`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Check if user belongs to this project
      if (!userData.projects || !Array.isArray(userData.projects)) {
        continue;
      }

      const projectInfo = userData.projects.find(p => p.projectId === projectId);
      if (!projectInfo) {
        continue; // User doesn't belong to this project
      }

      // Check if user has old guestPassData
      const guestPassData = userData.guestPassData;
      if (!guestPassData || typeof guestPassData !== 'object') {
        console.log(`⏭️  User ${userId} (${userData.email}): No guest pass data to migrate`);
        results.usersSkipped++;
        continue;
      }

      results.usersWithGuestPassData++;

      // Extract settings from old structure
      const settingsToMigrate = {
        blocked: guestPassData.blocked ?? false,
        usedThisMonth: guestPassData.usedThisMonth ?? 0,
        // Only migrate monthlyLimit if explicitly set (not using global)
        ...(guestPassData.monthlyLimit !== undefined && guestPassData.monthlyLimit !== null 
          ? { monthlyLimit: guestPassData.monthlyLimit } 
          : {}),
        // Preserve timestamps if available
        ...(guestPassData.blockedAt ? { blockedAt: guestPassData.blockedAt } : {}),
        ...(guestPassData.unblockedAt ? { unblockedAt: guestPassData.unblockedAt } : {}),
        ...(guestPassData.limitUpdatedAt ? { limitUpdatedAt: guestPassData.limitUpdatedAt } : {}),
        updatedAt: serverTimestamp(),
        migratedAt: serverTimestamp(),
        migratedFrom: 'user.guestPassData'
      };

      console.log(`\n📦 User ${userId} (${userData.email || 'no email'})`);
      console.log(`   Project: ${projectInfo.name || projectId}`);
      console.log(`   Settings to migrate:`, {
        blocked: settingsToMigrate.blocked,
        monthlyLimit: settingsToMigrate.monthlyLimit ?? 'using global',
        usedThisMonth: settingsToMigrate.usedThisMonth
      });

      if (!dryRun) {
        try {
          // Create per-project settings document
          const settingsRef = doc(
            db, 
            `projects/${projectId}/userGuestPassSettings`, 
            userId
          );
          
          await setDoc(settingsRef, settingsToMigrate);
          
          console.log(`   ✅ Migrated successfully`);
          results.usersMigratedSuccessfully++;
        } catch (error) {
          console.error(`   ❌ Migration failed:`, error.message);
          results.usersMigrationFailed++;
          results.errors.push({
            userId,
            email: userData.email,
            error: error.message
          });
        }
      } else {
        console.log(`   ℹ️  Would migrate (dry run)`);
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 MIGRATION SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total users in system: ${results.totalUsers}`);
    console.log(`Users with guest pass data: ${results.usersWithGuestPassData}`);
    console.log(`Users skipped (no data): ${results.usersSkipped}`);
    
    if (dryRun) {
      console.log(`\n✅ Would migrate: ${results.usersWithGuestPassData} users`);
      console.log(`\n💡 Run with dryRun=false to perform actual migration`);
    } else {
      console.log(`\n✅ Successfully migrated: ${results.usersMigratedSuccessfully}`);
      console.log(`❌ Failed to migrate: ${results.usersMigrationFailed}`);
      
      if (results.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        results.errors.forEach(err => {
          console.log(`   - User ${err.userId} (${err.email}): ${err.error}`);
        });
      }
    }
    console.log(`${'='.repeat(80)}\n`);

    return results;
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    throw error;
  }
};

/**
 * Migrate all projects
 * @param {Array<string>} projectIds - Array of project IDs to migrate
 * @param {boolean} dryRun - If true, only log what would be migrated
 * @returns {Promise<Object>} Combined migration results
 */
export const migrateAllProjects = async (projectIds, dryRun = true) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 MULTI-PROJECT MIGRATION`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Projects to migrate: ${projectIds.length}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log(`${'='.repeat(80)}\n`);

  const allResults = {
    projectsMigrated: 0,
    projectsFailed: 0,
    totalUsersMigrated: 0,
    totalErrors: []
  };

  for (const projectId of projectIds) {
    try {
      const result = await migrateProjectGuestPassSettings(projectId, dryRun);
      allResults.projectsMigrated++;
      allResults.totalUsersMigrated += result.usersMigratedSuccessfully;
      allResults.totalErrors.push(...result.errors);
    } catch (error) {
      console.error(`❌ Failed to migrate project ${projectId}:`, error.message);
      allResults.projectsFailed++;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 ALL PROJECTS MIGRATION COMPLETE`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Projects migrated: ${allResults.projectsMigrated}`);
  console.log(`Projects failed: ${allResults.projectsFailed}`);
  console.log(`Total users migrated: ${allResults.totalUsersMigrated}`);
  console.log(`Total errors: ${allResults.totalErrors.length}`);
  console.log(`${'='.repeat(80)}\n`);

  return allResults;
};

// Example usage (uncomment to run):
// 
// // Dry run for single project
// migrateProjectGuestPassSettings('your-project-id', true);
// 
// // Live migration for single project
// migrateProjectGuestPassSettings('your-project-id', false);
// 
// // Migrate multiple projects
// migrateAllProjects(['project-1', 'project-2', 'project-3'], false);

export default {
  migrateProjectGuestPassSettings,
  migrateAllProjects
};

