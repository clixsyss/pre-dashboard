/**
 * Debug utility to help identify issues with guest pass data
 * This will help us see what's actually in Firebase vs what the dashboard is showing
 */

import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Debug function to check all guest pass collections and data
 * @param {string} projectId - The project ID to check
 */
export const debugGuestPasses = async (projectId) => {
  console.log(`🔍 Debugging guest passes for project: ${projectId}`);
  
  try {
    // 1. Check guestPasses collection
    console.log('1️⃣ Checking guestPasses collection...');
    const guestPassesRef = collection(db, 'guestPasses');
    const guestPassesSnapshot = await getDocs(guestPassesRef);
    
    console.log(`📊 Total guest passes in collection: ${guestPassesSnapshot.size}`);
    
    const allPasses = [];
    guestPassesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      allPasses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        sentAt: data.sentAt?.toDate?.() || data.sentAt
      });
    });
    
    console.log('📋 All passes in guestPasses collection:', allPasses);
    
    // 2. Check passes for this specific project
    console.log(`2️⃣ Checking passes for project ${projectId}...`);
    const projectPassesQuery = query(
      guestPassesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    try {
      const projectPassesSnapshot = await getDocs(projectPassesQuery);
      console.log(`📊 Passes for project ${projectId}: ${projectPassesSnapshot.size}`);
      
      const projectPasses = [];
      projectPassesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        projectPasses.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          sentAt: data.sentAt?.toDate?.() || data.sentAt
        });
      });
      
      console.log(`📋 Passes for project ${projectId}:`, projectPasses);
      
      if (projectPasses.length === 0) {
        console.log('⚠️ No passes found for this project. Checking if projectId matches...');
        
        // Check if there are passes with similar project IDs
        const similarProjectIds = allPasses
          .map(p => p.projectId)
          .filter((id, index, arr) => arr.indexOf(id) === index);
        
        console.log('🔍 Found project IDs in passes:', similarProjectIds);
        
        if (similarProjectIds.length > 0) {
          console.log('💡 Suggestion: Check if the project ID matches exactly');
          console.log(`   Expected: "${projectId}"`);
          console.log(`   Found: ${similarProjectIds.map(id => `"${id}"`).join(', ')}`);
        }
      }
      
    } catch (queryError) {
      console.error('❌ Error querying project passes:', queryError);
      console.log('💡 This might be a Firestore indexing issue');
    }
    
    // 3. Check if there are any other collections that might contain passes
    console.log('3️⃣ Checking for other potential pass collections...');
    
    const potentialCollections = ['guest_passes', 'passes', 'guestPass', 'gatePasses'];
    
    for (const collectionName of potentialCollections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        if (snapshot.size > 0) {
          console.log(`📊 Found ${snapshot.size} documents in ${collectionName} collection`);
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.projectId === projectId) {
              console.log(`✅ Found matching project pass in ${collectionName}:`, {
                id: doc.id,
                projectId: data.projectId,
                userName: data.userName,
                createdAt: data.createdAt
              });
            }
          });
        }
      } catch (error) {
        // Collection doesn't exist, which is fine
      }
    }
    
    // 4. Check users collection for any guest pass related data
    console.log('4️⃣ Checking users collection for guest pass data...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let usersWithGuestPassData = 0;
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.guestPassData) {
        usersWithGuestPassData++;
        if (userData.projects && Array.isArray(userData.projects)) {
          const projectInfo = userData.projects.find(p => p.projectId === projectId);
          if (projectInfo) {
            console.log(`👤 User ${doc.id} has guest pass data for project ${projectId}:`, userData.guestPassData);
          }
        }
      }
    });
    
    console.log(`📊 Users with guest pass data: ${usersWithGuestPassData}`);
    
    return {
      totalPasses: allPasses.length,
      projectPasses: projectPasses || [],
      usersWithGuestPassData,
      allPasses
    };
    
  } catch (error) {
    console.error('❌ Error debugging guest passes:', error);
    return { error: error.message };
  }
};

/**
 * Debug function to check the exact query being used by the service
 * @param {string} projectId - The project ID to check
 */
export const debugServiceQuery = async (projectId) => {
  console.log(`🔍 Debugging service query for project: ${projectId}`);
  
  try {
    // This replicates the exact query from guestPassesService.getPasses()
    const passesRef = collection(db, 'guestPasses');
    const passesQuery = query(
      passesRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(passesQuery);
    console.log(`📊 Service query result: ${snapshot.size} passes`);
    
    const passes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      sentAt: doc.data().sentAt?.toDate()
    }));
    
    console.log('📋 Service query passes:', passes);
    return passes;
    
  } catch (error) {
    console.error('❌ Error in service query:', error);
    if (error.code === 'failed-precondition') {
      console.log('💡 This is likely a Firestore indexing issue. You need to create an index for:');
      console.log('   Collection: guestPasses');
      console.log('   Fields: projectId (Ascending), createdAt (Descending)');
    }
    return { error: error.message };
  }
};

/**
 * Create a test pass to verify the creation process
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID (optional, will create a test user if not provided)
 */
export const createTestPass = async (projectId, userId = null) => {
  console.log(`🧪 Creating test pass for project: ${projectId}`);
  
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    
    const testPassData = {
      id: `TEST-${Date.now()}`,
      projectId: projectId,
      userId: userId || 'test-user-123',
      userName: 'Test User',
      createdAt: serverTimestamp(),
      sentStatus: false,
      sentAt: null,
      qrCodeUrl: null,
      testPass: true // Mark as test pass
    };
    
    const passesRef = collection(db, 'guestPasses');
    const docRef = await addDoc(passesRef, testPassData);
    
    console.log('✅ Test pass created:', docRef.id);
    
    // Immediately try to fetch it
    const { getDoc } = await import('firebase/firestore');
    const testPassDoc = await getDoc(docRef);
    console.log('📋 Test pass data:', testPassDoc.data());
    
    return {
      id: docRef.id,
      ...testPassData
    };
    
  } catch (error) {
    console.error('❌ Error creating test pass:', error);
    return { error: error.message };
  }
};

// Export for easy testing in browser console
if (typeof window !== 'undefined') {
  window.debugGuestPasses = { debugGuestPasses, debugServiceQuery, createTestPass };
  console.log('🧪 Debug functions available in window.debugGuestPasses');
}
