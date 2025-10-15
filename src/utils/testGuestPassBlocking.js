/**
 * Test utility to verify guest pass blocking functionality
 * This can be used to test if blocking/unblocking works correctly
 */

import { guestPassesService } from '../services/guestPassesService';

/**
 * Test function to verify user blocking works
 * @param {string} projectId - The project ID to test
 * @param {string} userId - The user ID to test
 */
export const testUserBlocking = async (projectId, userId) => {
  console.log(`🧪 Testing user blocking for user ${userId} in project ${projectId}`);
  
  try {
    // 1. Check initial eligibility
    console.log('1️⃣ Checking initial eligibility...');
    const initialCheck = await guestPassesService.checkUserEligibility(projectId, userId);
    console.log('Initial eligibility:', initialCheck);
    
    // 2. Block the user
    console.log('2️⃣ Blocking user...');
    await guestPassesService.blockUser(projectId, userId);
    console.log('✅ User blocked successfully');
    
    // 3. Check eligibility after blocking
    console.log('3️⃣ Checking eligibility after blocking...');
    const blockedCheck = await guestPassesService.checkUserEligibility(projectId, userId);
    console.log('Eligibility after blocking:', blockedCheck);
    
    if (blockedCheck.success || blockedCheck.error !== 'User blocked') {
      console.error('❌ ERROR: User should be blocked but eligibility check passed');
      return false;
    }
    
    // 4. Unblock the user
    console.log('4️⃣ Unblocking user...');
    await guestPassesService.unblockUser(projectId, userId);
    console.log('✅ User unblocked successfully');
    
    // 5. Check eligibility after unblocking
    console.log('5️⃣ Checking eligibility after unblocking...');
    const unblockedCheck = await guestPassesService.checkUserEligibility(projectId, userId);
    console.log('Eligibility after unblocking:', unblockedCheck);
    
    if (!unblockedCheck.success && unblockedCheck.error === 'User blocked') {
      console.error('❌ ERROR: User should be unblocked but is still showing as blocked');
      return false;
    }
    
    console.log('✅ All tests passed! Blocking/unblocking works correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

/**
 * Test function to verify user data structure
 * @param {string} projectId - The project ID to test
 * @param {string} userId - The user ID to test
 */
export const testUserDataStructure = async (projectId, userId) => {
  console.log(`🔍 Testing user data structure for user ${userId}`);
  
  try {
    // Get user data
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User not found');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('📊 User data structure:', {
      hasProjects: !!userData.projects,
      projectsIsArray: Array.isArray(userData.projects),
      projectsLength: userData.projects?.length || 0,
      hasGuestPassData: !!userData.guestPassData,
      guestPassData: userData.guestPassData
    });
    
    // Check if user belongs to the project
    if (userData.projects && Array.isArray(userData.projects)) {
      const projectInfo = userData.projects.find(project => project.projectId === projectId);
      if (projectInfo) {
        console.log('✅ User belongs to project:', projectInfo);
      } else {
        console.log('⚠️ User does not belong to the specified project');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

/**
 * Run all tests
 * @param {string} projectId - The project ID to test
 * @param {string} userId - The user ID to test
 */
export const runAllTests = async (projectId, userId) => {
  console.log('🚀 Running all guest pass tests...');
  
  const structureTest = await testUserDataStructure(projectId, userId);
  if (!structureTest) {
    console.log('❌ Data structure test failed, skipping blocking test');
    return false;
  }
  
  const blockingTest = await testUserBlocking(projectId, userId);
  
  if (structureTest && blockingTest) {
    console.log('🎉 All tests passed! Guest pass system is working correctly.');
    return true;
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
    return false;
  }
};

// Export for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testGuestPassBlocking = { testUserBlocking, testUserDataStructure, runAllTests };
  console.log('🧪 Test functions available in window.testGuestPassBlocking');
}
