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
    // 1. Check project-specific guestPasses subcollection
    console.log('1️⃣ Checking project-specific guestPasses subcollection...');
    const guestPassesRef = collection(db, `projects/${projectId}/guestPasses`);
    const guestPassesSnapshot = await getDocs(guestPassesRef);
    
    console.log(`📊 Total guest passes for project ${projectId}: ${guestPassesSnapshot.size}`);
    
    const projectPasses = [];
    guestPassesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      projectPasses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        sentAt: data.sentAt?.toDate?.() || data.sentAt
      });
    });
    
    console.log(`📋 All passes for project ${projectId}:`, projectPasses);
    
    // 2. Check for legacy passes in global collection (for migration reference)
    console.log(`2️⃣ Checking legacy global guestPasses collection...`);
    let legacyPasses = [];
    
    try {
      const legacyRef = collection(db, 'guestPasses');
      const legacyQuery = query(
        legacyRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const legacySnapshot = await getDocs(legacyQuery);
      console.log(`📊 Legacy passes found for project ${projectId}: ${legacySnapshot.size}`);
      
      if (legacySnapshot.size > 0) {
        console.log('⚠️ Found passes in legacy global collection. Consider migrating to project-specific subcollection.');
        legacySnapshot.docs.forEach(doc => {
          legacyPasses.push({
            id: doc.id,
            ...doc.data()
          });
        });
        console.log('📋 Legacy passes:', legacyPasses);
      }
      
    } catch (queryError) {
      console.log('ℹ️ No legacy passes found (this is expected for new installations)');
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
      totalPasses: projectPasses.length,
      projectPasses: projectPasses || [],
      legacyPasses: legacyPasses || [],
      usersWithGuestPassData,
      allPasses: projectPasses
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
    const passesRef = collection(db, `projects/${projectId}/guestPasses`);
    const passesQuery = query(
      passesRef,
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
      console.log(`   Collection: projects/${projectId}/guestPasses`);
      console.log('   Fields: createdAt (Descending)');
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
      guestName: 'Test Guest',
      purpose: 'Testing',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdAt: serverTimestamp(),
      sentStatus: false,
      sentAt: null,
      qrCodeUrl: null,
      testPass: true // Mark as test pass
    };
    
    const passesRef = collection(db, `projects/${projectId}/guestPasses`);
    const docRef = await addDoc(passesRef, testPassData);
    
    console.log('✅ Test pass created in project subcollection:', docRef.id);
    
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
