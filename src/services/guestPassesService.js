import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

class GuestPassesService {
  constructor() {
    this.collections = {
      users: 'users', // Use main users collection
      settings: 'guestPassSettings'
    };
    // Note: passes are now per-project subcollections: projects/{projectId}/guestPasses
  }

  // Get statistics for a project
  async getStats(projectId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let totalPassesThisMonth = 0;
      let passesSent = 0;
      let activeUsers = 0;
      let globalLimit = 100;

      // Try to get total passes this month from project-specific subcollection
      try {
        const passesQuery = query(
          collection(db, `projects/${projectId}/guestPasses`),
          where('createdAt', '>=', startOfMonth)
        );
        const passesSnapshot = await getDocs(passesQuery);
        totalPassesThisMonth = passesSnapshot.size;
      } catch (error) {
        console.log('No passes collection found yet, using default values');
      }
      
      // Try to get sent passes this month
      try {
        const sentPassesQuery = query(
          collection(db, `projects/${projectId}/guestPasses`),
          where('sentStatus', '==', true),
          where('sentAt', '>=', startOfMonth)
        );
        const sentPassesSnapshot = await getDocs(sentPassesQuery);
        passesSent = sentPassesSnapshot.size;
      } catch (error) {
        console.log('No sent passes found yet, using default values');
      }
      
      // Try to get active users count
      try {
        const usersSnapshot = await getDocs(collection(db, this.collections.users));
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          
          // Check if user belongs to this project
          if (userData.projects && Array.isArray(userData.projects)) {
            const projectInfo = userData.projects.find(project => project.projectId === projectId);
            
            if (projectInfo) {
              // Check if user is not blocked for guest passes
              const guestPassData = userData.guestPassData || { blocked: false };
              if (!guestPassData.blocked) {
                activeUsers++;
              }
            }
          }
        });
      } catch (error) {
        console.log('No users collection found yet, using default values');
      }
      
      // Try to get global settings
      try {
        const settingsDoc = await getDoc(doc(db, this.collections.settings, projectId));
        const globalSettings = settingsDoc.exists() ? settingsDoc.data() : { monthlyLimit: 100 };
        globalLimit = globalSettings.monthlyLimit;
      } catch (error) {
        console.log('No settings collection found yet, using default values');
      }
      
      return {
        totalPassesThisMonth,
        passesSent,
        activeUsers,
        globalLimit,
        sentPercentage: totalPassesThisMonth > 0 ? (passesSent / totalPassesThisMonth) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      // Return default stats instead of throwing error
      return {
        totalPassesThisMonth: 0,
        passesSent: 0,
        activeUsers: 0,
        globalLimit: 100,
        sentPercentage: 0
      };
    }
  }

  // Get users for a project
  async getUsers(projectId) {
    try {
      // First, get the global settings to know the default limit
      let defaultLimit = 100; // Fallback default
      try {
        const settingsDoc = await getDoc(doc(db, this.collections.settings, projectId));
        if (settingsDoc.exists()) {
          defaultLimit = settingsDoc.data().monthlyLimit || 100;
        }
      } catch (error) {
        console.log('Could not fetch global settings, using fallback default:', defaultLimit);
      }

      // Get all users from main users collection
      const usersSnapshot = await getDocs(collection(db, this.collections.users));
      
      // Filter users who belong to this project and have guest pass data
      const projectUsers = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        
        // Check if user belongs to this project
        if (userData.projects && Array.isArray(userData.projects)) {
          const projectInfo = userData.projects.find(project => project.projectId === projectId);
          
          if (projectInfo) {
            // Check if user has guest pass data
            const guestPassData = userData.guestPassData;
            
            // Use guestPassData if it exists, otherwise use global defaults
            const monthlyLimit = guestPassData?.monthlyLimit ?? defaultLimit;
            const usedThisMonth = guestPassData?.usedThisMonth ?? 0;
            const blocked = guestPassData?.blocked ?? false;
            
            projectUsers.push({
              id: doc.id,
              name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email),
              email: userData.email,
              monthlyLimit: monthlyLimit,
              usedThisMonth: usedThisMonth,
              blocked: blocked,
              hasGuestPassData: !!guestPassData, // Track if user has explicit data
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              updatedAt: userData.updatedAt?.toDate?.() || new Date()
            });
          }
        }
      });
      
      console.log(`Fetched ${projectUsers.length} users for project ${projectId} (default limit: ${defaultLimit})`);
      
      return projectUsers;
    } catch (error) {
      console.log('Error fetching users, returning empty array');
      return [];
    }
  }

  // Get passes for a project
  async getPasses(projectId, filters = {}) {
    try {
      console.log(`🔍 GuestPassesService: Getting passes for project ${projectId}`);
      console.log(`🔍 GuestPassesService: Using collection: projects/${projectId}/guestPasses`);
      
      let passesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.sentStatus !== undefined) {
        passesQuery = query(passesQuery, where('sentStatus', '==', filters.sentStatus));
      }
      if (filters.userId) {
        passesQuery = query(passesQuery, where('userId', '==', filters.userId));
      }
      if (filters.limit) {
        passesQuery = query(passesQuery, limit(filters.limit));
      }

      console.log(`📡 GuestPassesService: Executing query for project ${projectId}`);
      const snapshot = await getDocs(passesQuery);
      console.log(`📊 GuestPassesService: Found ${snapshot.size} passes in Firebase`);
      
      const passes = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📋 GuestPassesService: Pass ${doc.id}:`, {
          id: doc.id,
          projectId: data.projectId,
          userName: data.userName,
          sentStatus: data.sentStatus,
          createdAt: data.createdAt
        });
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          sentAt: data.sentAt?.toDate()
        };
      });
      
      console.log(`✅ GuestPassesService: Returning ${passes.length} passes`);
      return passes;
    } catch (error) {
      console.error('❌ GuestPassesService: Error getting passes:', error);
      if (error.code === 'failed-precondition') {
        console.log('💡 This is likely a Firestore indexing issue. You need to create an index for:');
        console.log(`   Collection: projects/${projectId}/guestPasses`);
        console.log('   Fields: createdAt (Descending)');
      }
      console.log('No passes collection found yet, returning empty array');
      return [];
    }
  }

  // Get global settings for a project
  async getGlobalSettings(projectId) {
    try {
      console.log(`🔍 [Service] Getting global settings for project ${projectId}`);
      const settingsDoc = await getDoc(doc(db, this.collections.settings, projectId));
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        console.log(`✅ [Service] Found global settings:`, settings);
        return settings;
      } else {
        console.log(`⚠️ [Service] No global settings found, returning defaults`);
        // Return default settings without creating them in the database yet
        return {
          monthlyLimit: 100,
          autoReset: true,
          allowOverrides: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error(`❌ [Service] Error getting global settings:`, error);
      console.log('No settings collection found yet, returning default settings');
      return {
        monthlyLimit: 100,
        autoReset: true,
        allowOverrides: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Create a new pass
  async createPass(projectId, passData) {
    try {
      const { userId, userName } = passData;
      
      // Check if user exists and get their data
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Get global settings to use as default
      const globalSettings = await this.getGlobalSettings(projectId);
      
      const guestPassData = userData.guestPassData || { 
        blocked: false, 
        monthlyLimit: globalSettings.monthlyLimit, 
        usedThisMonth: 0 
      };
      
      if (guestPassData.blocked) {
        throw new Error('User is blocked from generating passes');
      }
      
      // Check monthly limit
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const userPassesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        where('userId', '==', userId),
        where('createdAt', '>=', startOfMonth)
      );
      const userPassesSnapshot = await getDocs(userPassesQuery);
      
      if (userPassesSnapshot.size >= guestPassData.monthlyLimit) {
        throw new Error('User has reached their monthly limit');
      }
      
      // Generate unique pass ID
      const passId = this.generatePassId();
      
      // Create pass document in project-specific subcollection
      const passDoc = {
        id: passId,
        projectId,
        userId,
        userName,
        createdAt: serverTimestamp(),
        sentStatus: false,
        sentAt: null,
        qrCodeUrl: null, // Will be set by external app
        ...passData
      };
      
      const docRef = await addDoc(collection(db, `projects/${projectId}/guestPasses`), passDoc);
      
      // Update user's used count in guestPassData
      await updateDoc(userRef, {
        guestPassData: {
          ...guestPassData,
          usedThisMonth: guestPassData.usedThisMonth + 1,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...passDoc,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating pass:', error);
      throw error;
    }
  }

  // Update pass sent status
  async updatePassSentStatus(projectId, passId, sentStatus) {
    try {
      const passRef = doc(db, `projects/${projectId}/guestPasses`, passId);
      const updateData = {
        sentStatus,
        updatedAt: serverTimestamp()
      };
      
      if (sentStatus) {
        updateData.sentAt = serverTimestamp();
      } else {
        updateData.sentAt = null;
      }
      
      await updateDoc(passRef, updateData);
      
      // Get updated pass data
      const passDoc = await getDoc(passRef);
      return {
        id: passDoc.id,
        ...passDoc.data(),
        createdAt: passDoc.data().createdAt?.toDate(),
        sentAt: passDoc.data().sentAt?.toDate()
      };
    } catch (error) {
      console.error('Error updating pass status:', error);
      throw new Error('Failed to update pass status');
    }
  }

  // Block a user
  async blockUser(projectId, userId) {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Use nested field updates to preserve existing fields
        await updateDoc(userRef, {
          'guestPassData.blocked': true,
          'guestPassData.blockedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Blocked user ${userId}`);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error('Failed to block user');
    }
  }

  // Unblock a user
  async unblockUser(projectId, userId) {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Use nested field updates to preserve existing fields
        await updateDoc(userRef, {
          'guestPassData.blocked': false,
          'guestPassData.unblockedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Unblocked user ${userId}`);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new Error('Failed to unblock user');
    }
  }

  // Update user monthly limit
  // If newLimit is null, undefined, or empty string, it REMOVES the custom limit
  // This makes the user follow the global limit instead
  async updateUserLimit(projectId, userId, newLimit) {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const guestPassData = userData.guestPassData || {};
        
        // If newLimit is null/undefined/empty, REMOVE the custom limit
        if (newLimit === null || newLimit === undefined || newLimit === '' || newLimit === 'null') {
          console.log(`🔧 [Service] Removing custom limit for user ${userId} - will use global limit`);
          
          // Remove monthlyLimit field while keeping other guestPassData
          const { monthlyLimit, remainingQuota, limitUpdatedAt, ...restOfGuestPassData } = guestPassData;
          
          await updateDoc(userRef, {
            guestPassData: restOfGuestPassData,
            updatedAt: serverTimestamp()
          });
          
          console.log(`✅ User ${userId} now uses global limit`);
          return;
        }
        
        // Ensure the limit is a number, not a string
        const limitAsNumber = typeof newLimit === 'string' ? parseInt(newLimit, 10) : newLimit;
        if (isNaN(limitAsNumber) || limitAsNumber < 0) {
          throw new Error(`Invalid limit value: ${newLimit}`);
        }
        
        console.log(`🔧 [Service] Setting CUSTOM limit for user ${userId}:`, limitAsNumber, '(type:', typeof limitAsNumber, ')');
        
        const usedThisMonth = guestPassData.usedThisMonth || 0;
        const remainingQuota = Math.max(0, limitAsNumber - usedThisMonth);
        
        // Use nested field updates to preserve existing fields
        await updateDoc(userRef, {
          'guestPassData.monthlyLimit': limitAsNumber,  // ✅ Save as number
          'guestPassData.remainingQuota': remainingQuota,
          'guestPassData.limitUpdatedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Updated user ${userId} CUSTOM limit: limit=${limitAsNumber}, used=${usedThisMonth}, remaining=${remainingQuota}`);
      }
    } catch (error) {
      console.error('Error updating user limit:', error);
      throw new Error('Failed to update user limit');
    }
  }

  // Update global monthly limit
  async updateGlobalLimit(projectId, newLimit) {
    try {
      console.log(`🔧 [Service] Updating global limit for project ${projectId} to ${newLimit}`);
      
      // Ensure the limit is a number, not a string
      const limitAsNumber = typeof newLimit === 'string' ? parseInt(newLimit, 10) : newLimit;
      if (isNaN(limitAsNumber) || limitAsNumber < 0) {
        throw new Error(`Invalid limit value: ${newLimit}`);
      }
      
      console.log(`🔧 [Service] Saving as number:`, limitAsNumber, '(type:', typeof limitAsNumber, ')');
      
      // Use setDoc to create or update the document
      await setDoc(doc(db, this.collections.settings, projectId), {
        monthlyLimit: limitAsNumber,  // ✅ Save as number
        autoReset: true,
        allowOverrides: true,
        updatedAt: serverTimestamp()
      }, { merge: true }); // merge: true allows partial updates
      
      console.log(`✅ [Service] Global limit updated successfully`);
    } catch (error) {
      console.error('❌ [Service] Error updating global limit:', error);
      throw new Error('Failed to update global limit');
    }
  }

  // Toggle block all users setting
  async toggleBlockAll(projectId, blockAllUsers) {
    try {
      console.log(`🔧 [Service] ${blockAllUsers ? 'Blocking' : 'Unblocking'} all users for project ${projectId}`);
      
      // Use setDoc with merge to update only the blockAllUsers field
      await setDoc(doc(db, this.collections.settings, projectId), {
        blockAllUsers: blockAllUsers,
        blockAllUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ [Service] Global block all setting updated: ${blockAllUsers}`);
    } catch (error) {
      console.error('❌ [Service] Error updating block all setting:', error);
      throw new Error('Failed to update block all setting');
    }
  }

  // Reset monthly usage for all users
  async resetMonthlyUsage(projectId) {
    try {
      const usersSnapshot = await getDocs(collection(db, this.collections.users));
      const batch = writeBatch(db);
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        
        // Check if user belongs to this project
        if (userData.projects && Array.isArray(userData.projects)) {
          const projectInfo = userData.projects.find(project => project.projectId === projectId);
          
          if (projectInfo) {
            const guestPassData = userData.guestPassData || {};
            
            batch.update(doc.ref, {
              guestPassData: {
                ...guestPassData,
                usedThisMonth: 0,
                updatedAt: serverTimestamp()
              },
              updatedAt: serverTimestamp()
            });
          }
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      throw new Error('Failed to reset monthly usage');
    }
  }

  // Get analytics data
  async getAnalytics(projectId, period = 'month') {
    try {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const passesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        where('createdAt', '>=', startDate),
        orderBy('createdAt')
      );
      
      const snapshot = await getDocs(passesQuery);
      
      // Process data for charts
      const dailyData = {};
      const userData = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt.toDate().toDateString();
        
        // Daily data
        if (!dailyData[date]) {
          dailyData[date] = { date, total: 0, sent: 0 };
        }
        dailyData[date].total++;
        if (data.sentStatus) {
          dailyData[date].sent++;
        }
        
        // User data
        if (!userData[data.userId]) {
          userData[data.userId] = {
            userId: data.userId,
            userName: data.userName,
            total: 0,
            sent: 0
          };
        }
        userData[data.userId].total++;
        if (data.sentStatus) {
          userData[data.userId].sent++;
        }
      });
      
      return {
        dailyData: Object.values(dailyData),
        userData: Object.values(userData),
        totalPasses: snapshot.size,
        sentPasses: snapshot.docs.filter(doc => doc.data().sentStatus).length
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  // Generate unique pass ID
  generatePassId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `GP-${timestamp}-${random}`.toUpperCase();
  }

  // API endpoint for mobile app to check user eligibility
  async checkUserEligibility(projectId, userId) {
    try {
      console.log(`🔍 [Service] Starting eligibility check for user ${userId} in project ${projectId}`);
      
      // Get user data
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error(`❌ [Service] User ${userId} not found in database`);
        return {
          success: false,
          error: 'User not found',
          message: 'User not found in the system'
        };
      }
      
      console.log(`✅ [Service] User ${userId} found in database`);
      
      const userData = userDoc.data();
      
      // Get global settings to use as default
      const globalSettings = await this.getGlobalSettings(projectId);
      
      const guestPassData = userData.guestPassData || { 
        blocked: false, 
        monthlyLimit: globalSettings.monthlyLimit, 
        usedThisMonth: 0 
      };
      
      // Check if user belongs to this project
      if (!userData.projects || !Array.isArray(userData.projects)) {
        return {
          success: false,
          error: 'User not in project',
          message: 'User does not belong to this project'
        };
      }
      
      const projectInfo = userData.projects.find(project => project.projectId === projectId);
      if (!projectInfo) {
        return {
          success: false,
          error: 'User not in project',
          message: 'User does not belong to this project'
        };
      }
      
      console.log(`📊 [Service] User guest pass data:`, {
        blocked: guestPassData.blocked,
        monthlyLimit: guestPassData.monthlyLimit,
        usedThisMonth: guestPassData.usedThisMonth
      });
      
      if (guestPassData.blocked) {
        console.warn(`🚫 [Service] User ${userId} is BLOCKED from generating passes`);
        return {
          success: false,
          error: 'User blocked',
          message: 'User is blocked from generating guest passes',
          data: {
            canGenerate: false,
            reason: 'blocked',
            user: {
              id: userId,
              name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email),
              email: userData.email,
              blocked: true
            }
          }
        };
      }
      
      // Check monthly limit
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const passesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        where('userId', '==', userId),
        where('createdAt', '>=', startOfMonth)
      );
      
      const passesSnapshot = await getDocs(passesQuery);
      const usedThisMonth = passesSnapshot.size;
      const canGenerate = usedThisMonth < guestPassData.monthlyLimit;
      
      if (!canGenerate) {
        return {
          success: false,
          error: 'Limit reached',
          message: 'User has reached their monthly limit',
          data: {
            canGenerate: false,
            reason: 'limit_reached',
            user: {
              id: userId,
              name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email),
              email: userData.email,
              usedThisMonth,
              monthlyLimit: guestPassData.monthlyLimit
            }
          }
        };
      }
      
      return {
        success: true,
        data: {
          canGenerate: true,
          user: {
            id: userId,
            name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email),
            email: userData.email,
            usedThisMonth,
            monthlyLimit: guestPassData.monthlyLimit,
            remainingQuota: guestPassData.monthlyLimit - usedThisMonth
          },
          reason: 'eligible'
        },
        message: 'User can generate guest passes'
      };
    } catch (error) {
      console.error(`Error checking user eligibility for ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to check user eligibility'
      };
    }
  }

  // Initialize user data (called when user first accesses guest passes)
  async initializeUser(projectId, userId, userData) {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const existingUserData = userDoc.data();
        
        // Initialize guest pass data if it doesn't exist
        if (!existingUserData.guestPassData) {
          // IMPORTANT: Do NOT set monthlyLimit here!
          // Users should use the global limit by default.
          // Only set monthlyLimit when admin explicitly assigns a custom limit.
          await updateDoc(userRef, {
            guestPassData: {
              // monthlyLimit: NOT SET - will use global limit
              usedThisMonth: 0,
              blocked: false,
              updatedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          });
          
          console.log(`✅ Initialized user ${userId} with default guest pass data (no custom limit)`);
          
          return {
            ...existingUserData,
            guestPassData: {
              usedThisMonth: 0,
              blocked: false,
              updatedAt: new Date()
            }
          };
        }
        
        return existingUserData;
      } else {
        throw new Error('User not found in main users collection');
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      throw new Error('Failed to initialize user');
    }
  }
}

export const guestPassesService = new GuestPassesService();
