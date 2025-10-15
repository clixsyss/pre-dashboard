import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';

class GuestPassesService {
  constructor() {
    this.collections = {
      users: 'users', // Use main users collection
      passes: 'guestPasses',
      settings: 'guestPassSettings'
    };
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

      // Try to get total passes this month
      try {
        const passesQuery = query(
          collection(db, this.collections.passes),
          where('projectId', '==', projectId),
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
          collection(db, this.collections.passes),
          where('projectId', '==', projectId),
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
            // Check if user has guest pass data, if not create default
            const guestPassData = userData.guestPassData || {
              monthlyLimit: 10, // Default limit
              usedThisMonth: 0,
              blocked: false
            };
            
            projectUsers.push({
              id: doc.id,
              name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email),
              email: userData.email,
              monthlyLimit: guestPassData.monthlyLimit,
              usedThisMonth: guestPassData.usedThisMonth,
              blocked: guestPassData.blocked,
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              updatedAt: userData.updatedAt?.toDate?.() || new Date()
            });
          }
        }
      });
      
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
      console.log(`🔍 GuestPassesService: Using collection: ${this.collections.passes}`);
      
      let passesQuery = query(
        collection(db, this.collections.passes),
        where('projectId', '==', projectId),
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
        console.log('   Collection: guestPasses');
        console.log('   Fields: projectId (Ascending), createdAt (Descending)');
      }
      console.log('No passes collection found yet, returning empty array');
      return [];
    }
  }

  // Get global settings for a project
  async getGlobalSettings(projectId) {
    try {
      const settingsDoc = await getDoc(doc(db, this.collections.settings, projectId));
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      } else {
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
      const guestPassData = userData.guestPassData || { blocked: false, monthlyLimit: 10, usedThisMonth: 0 };
      
      if (guestPassData.blocked) {
        throw new Error('User is blocked from generating passes');
      }
      
      // Check monthly limit
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const userPassesQuery = query(
        collection(db, this.collections.passes),
        where('projectId', '==', projectId),
        where('userId', '==', userId),
        where('createdAt', '>=', startOfMonth)
      );
      const userPassesSnapshot = await getDocs(userPassesQuery);
      
      if (userPassesSnapshot.size >= guestPassData.monthlyLimit) {
        throw new Error('User has reached their monthly limit');
      }
      
      // Generate unique pass ID
      const passId = this.generatePassId();
      
      // Create pass document
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
      
      const docRef = await addDoc(collection(db, this.collections.passes), passDoc);
      
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
      const passRef = doc(db, this.collections.passes, passId);
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
        const userData = userDoc.data();
        const guestPassData = userData.guestPassData || {};
        
        await updateDoc(userRef, {
          guestPassData: {
            ...guestPassData,
            blocked: true,
            updatedAt: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
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
        const userData = userDoc.data();
        const guestPassData = userData.guestPassData || {};
        
        await updateDoc(userRef, {
          guestPassData: {
            ...guestPassData,
            blocked: false,
            updatedAt: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new Error('Failed to unblock user');
    }
  }

  // Update user monthly limit
  async updateUserLimit(projectId, userId, newLimit) {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const guestPassData = userData.guestPassData || {};
        
        await updateDoc(userRef, {
          guestPassData: {
            ...guestPassData,
            monthlyLimit: newLimit,
            updatedAt: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating user limit:', error);
      throw new Error('Failed to update user limit');
    }
  }

  // Update global monthly limit
  async updateGlobalLimit(projectId, newLimit) {
    try {
      await updateDoc(doc(db, this.collections.settings, projectId), {
        monthlyLimit: newLimit,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating global limit:', error);
      throw new Error('Failed to update global limit');
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
        collection(db, this.collections.passes),
        where('projectId', '==', projectId),
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
      // Get user data
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User not found',
          message: 'User not found in the system'
        };
      }
      
      const userData = userDoc.data();
      const guestPassData = userData.guestPassData || { 
        blocked: false, 
        monthlyLimit: 10, 
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
      
      if (guestPassData.blocked) {
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
        collection(db, this.collections.passes),
        where('projectId', '==', projectId),
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
        const guestPassData = existingUserData.guestPassData || {};
        
        // Initialize guest pass data if it doesn't exist
        if (!existingUserData.guestPassData) {
          await updateDoc(userRef, {
            guestPassData: {
              monthlyLimit: 10, // Default limit
              usedThisMonth: 0,
              blocked: false,
              updatedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          });
          
          return {
            ...existingUserData,
            guestPassData: {
              monthlyLimit: 10,
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
