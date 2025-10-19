/**
 * Utility script to fix monthlyLimit fields that were incorrectly saved as strings
 * Run this once from the browser console on the dashboard to fix all existing data
 */

import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Fix all guest pass settings documents to ensure monthlyLimit is a number
 */
export const fixGlobalSettings = async () => {
  try {
    console.log('🔧 Starting global settings fix...');
    
    const settingsRef = collection(db, 'guestPassSettings');
    const settingsSnapshot = await getDocs(settingsRef);
    
    let fixed = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    for (const docSnapshot of settingsSnapshot.docs) {
      const data = docSnapshot.data();
      const projectId = docSnapshot.id;
      
      if (data.monthlyLimit !== undefined && data.monthlyLimit !== null) {
        const currentValue = data.monthlyLimit;
        const currentType = typeof currentValue;
        
        console.log(`📊 Project ${projectId}: monthlyLimit = ${currentValue} (${currentType})`);
        
        if (currentType === 'string') {
          try {
            const numericValue = parseInt(currentValue, 10);
            
            if (isNaN(numericValue)) {
              console.error(`❌ Invalid value for project ${projectId}: ${currentValue}`);
              errors++;
              continue;
            }
            
            await updateDoc(doc(db, 'guestPassSettings', projectId), {
              monthlyLimit: numericValue
            });
            
            console.log(`✅ Fixed project ${projectId}: "${currentValue}" → ${numericValue}`);
            fixed++;
          } catch (error) {
            console.error(`❌ Error fixing project ${projectId}:`, error);
            errors++;
          }
        } else if (currentType === 'number') {
          console.log(`✓ Project ${projectId} already correct`);
          alreadyCorrect++;
        } else {
          console.warn(`⚠️ Project ${projectId} has unexpected type: ${currentType}`);
          errors++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`✓ Already correct: ${alreadyCorrect}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Total processed: ${settingsSnapshot.size}`);
    
    return { fixed, alreadyCorrect, errors, total: settingsSnapshot.size };
  } catch (error) {
    console.error('❌ Error fixing global settings:', error);
    throw error;
  }
};

/**
 * Remove monthlyLimit from users who should use the global default
 * This makes them automatically follow global limit changes
 * 
 * @param {string} projectId - Project ID to check global limit against
 * @param {boolean} removeAll - If true, removes ALL user limits. If false, only removes those matching global.
 */
export const removeDefaultUserLimits = async (projectId, removeAll = false) => {
  try {
    console.log('🔧 Starting to remove default user limits...');
    console.log(`   Mode: ${removeAll ? 'REMOVE ALL user limits' : 'Remove only users matching global limit'}`);
    
    // Get global limit first
    let globalLimit = null;
    if (!removeAll) {
      try {
        const globalDoc = await getDocs(collection(db, 'guestPassSettings'));
        const projectSettings = globalDoc.docs.find(d => d.id === projectId);
        if (projectSettings) {
          const data = projectSettings.data();
          globalLimit = typeof data.monthlyLimit === 'string' 
            ? parseInt(data.monthlyLimit, 10) 
            : data.monthlyLimit;
          console.log(`📊 Global limit for project ${projectId}: ${globalLimit}`);
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch global limit:', error);
      }
    }
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let removed = 0;
    let kept = 0;
    let noGuestPassData = 0;
    let errors = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      const userId = userDoc.id;
      
      if (!data.guestPassData) {
        noGuestPassData++;
        continue;
      }
      
      const guestPassData = data.guestPassData;
      
      if (guestPassData.monthlyLimit !== undefined && guestPassData.monthlyLimit !== null) {
        const currentValue = guestPassData.monthlyLimit;
        const numericValue = typeof currentValue === 'string' 
          ? parseInt(currentValue, 10) 
          : currentValue;
        
        // Decide whether to remove this user's limit
        let shouldRemove = false;
        
        if (removeAll) {
          shouldRemove = true;
        } else if (globalLimit && numericValue === globalLimit) {
          shouldRemove = true;
        }
        
        if (shouldRemove) {
          try {
            // Remove the monthlyLimit field while keeping other guestPassData fields
            const { monthlyLimit, ...restOfGuestPassData } = guestPassData;
            
            await updateDoc(doc(db, 'users', userId), {
              guestPassData: restOfGuestPassData
            });
            
            console.log(`✅ Removed limit from user ${userId}: ${currentValue} → will use global`);
            removed++;
          } catch (error) {
            console.error(`❌ Error removing limit for user ${userId}:`, error);
            errors++;
          }
        } else {
          console.log(`ℹ️  Kept custom limit for user ${userId}: ${numericValue} (global is ${globalLimit})`);
          kept++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Removed (now use global): ${removed}`);
    console.log(`🎯 Kept (have custom limits): ${kept}`);
    console.log(`⚠️ No guestPassData: ${noGuestPassData}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Total processed: ${usersSnapshot.size}`);
    
    return { removed, kept, noGuestPassData, errors, total: usersSnapshot.size };
  } catch (error) {
    console.error('❌ Error removing default user limits:', error);
    throw error;
  }
};

/**
 * Fix all guest pass limit data (both global and user-specific)
 * 
 * @param {string} projectId - Project ID (required for removing default limits)
 * @param {boolean} removeDefaults - Whether to remove user limits that match global (recommended: true)
 */
export const fixAllGuestPassLimits = async (projectId, removeDefaults = true) => {
  console.log('🚀 Starting complete guest pass limits fix...\n');
  
  if (!projectId) {
    console.error('❌ projectId is required! Example: fixAllGuestPassLimits("3OcGvjzt8lPCNG4PB812")');
    return;
  }
  
  try {
    console.log('='.repeat(50));
    console.log('STEP 1: Fixing Global Settings (strings → numbers)');
    console.log('='.repeat(50));
    const globalResults = await fixGlobalSettings();
    
    if (removeDefaults) {
      console.log('\n' + '='.repeat(50));
      console.log('STEP 2: Removing Default User Limits');
      console.log('Users matching global limit will be removed');
      console.log('Users with truly custom limits will be kept');
      console.log('='.repeat(50));
      const removeResults = await removeDefaultUserLimits(projectId, false);
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ COMPLETE!');
      console.log('='.repeat(50));
      console.log('\n📊 Overall Summary:');
      console.log(`Global Settings - Fixed: ${globalResults.fixed}, Already correct: ${globalResults.alreadyCorrect}`);
      console.log(`User Limits - Removed: ${removeResults.removed}, Kept (custom): ${removeResults.kept}`);
      console.log(`\n💡 Result: ${removeResults.removed} users now follow global limit automatically`);
      
      return {
        globalSettings: globalResults,
        removedDefaults: removeResults,
        totalFixed: globalResults.fixed + removeResults.removed
      };
    } else {
      console.log('\n⚠️ Skipping user limit removal (removeDefaults = false)');
      return {
        globalSettings: globalResults,
        totalFixed: globalResults.fixed
      };
    }
  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.fixGuestPassLimits = {
    fixGlobalSettings,
    removeDefaultUserLimits,
    fixAll: fixAllGuestPassLimits
  };
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Guest Pass Limits Fix utility loaded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📌 MOST IMPORTANT: Fix everything at once');
  console.log('   await window.fixGuestPassLimits.fixAll("YOUR_PROJECT_ID")');
  console.log('   Example: await window.fixGuestPassLimits.fixAll("3OcGvjzt8lPCNG4PB812")');
  console.log('');
  console.log('🔧 Individual functions:');
  console.log('   window.fixGuestPassLimits.fixGlobalSettings() - Fix string to number');
  console.log('   window.fixGuestPassLimits.removeDefaultUserLimits(projectId, removeAll)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

