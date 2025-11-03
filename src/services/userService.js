import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { fetchUsersPaginated, fetchProjectsCached, searchUsers as searchUsersOptimized } from '../utils/firestoreOptimization'

class UserService {
  /**
   * Fetch all users with pagination support (OPTIMIZED)
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Object with users array and pagination info
   */
  async getAllUsers(options = {}) {
    try {
      const {
        pageSize = 50,
        lastDoc = null,
        projectId = null,
        useCache = true
      } = options;

      console.log('🔍 UserService: Fetching users with pagination', { pageSize, projectId });

      // Fetch users with pagination
      const { users, lastDoc: newLastDoc, hasMore } = await fetchUsersPaginated({
        pageSize,
        lastDoc,
        projectId,
        useCache
      });
      
      // Fetch projects for project name resolution (cached)
      const projects = await fetchProjectsCached({ useCache });
      const projectsMap = {};
      projects.forEach(project => {
        projectsMap[project.id] = project;
      });

      // Enhance users with project information
      const enhancedUsers = users.map(user => {
        let enhancedProjects = [];
        if (user.projects && Array.isArray(user.projects)) {
          enhancedProjects = user.projects.map(project => ({
            ...project,
            projectName: projectsMap[project.projectId]?.name || 'Unknown Project',
            projectType: projectsMap[project.projectId]?.type || 'Unknown Type',
            projectLocation: projectsMap[project.projectId]?.location || 'Unknown Location'
          }));
        }
        
        return {
          ...user,
          enhancedProjects
        };
      });

      console.log(`✅ UserService: Fetched ${enhancedUsers.length} users`);

      return {
        users: enhancedUsers,
        lastDoc: newLastDoc,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Legacy method - fetches first page of users
   * Maintained for backward compatibility
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsersLegacy() {
    const { users } = await this.getAllUsers({ pageSize: 100 });
    return users;
  }

  /**
   * Fetch a specific user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)))
      
      if (userDoc.empty) {
        throw new Error('User not found')
      }
      
      const userData = userDoc.docs[0].data()
      return {
        id: userDoc.docs[0].id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate?.() || null,
        updatedAt: userData.updatedAt?.toDate?.() || null
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  /**
   * Search users by various criteria (OPTIMIZED)
   * @param {string} searchTerm - Search term
   * @param {string} field - Field to search in ('name', 'email', 'mobile', 'nationalId')
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchTerm, field = 'name') {
    try {
      console.log('🔍 UserService: Searching users', { searchTerm, field });
      
      // Use optimized search that limits data fetching
      const users = await searchUsersOptimized(searchTerm, field);

      // Enhance with project information
      const projects = await fetchProjectsCached({ useCache: true });
      const projectsMap = {};
      projects.forEach(project => {
        projectsMap[project.id] = project;
      });

      return users.map(user => {
        let enhancedProjects = [];
        if (user.projects && Array.isArray(user.projects)) {
          enhancedProjects = user.projects.map(project => ({
            ...project,
            projectName: projectsMap[project.projectId]?.name || 'Unknown Project',
            projectType: projectsMap[project.projectId]?.type || 'Unknown Type',
            projectLocation: projectsMap[project.projectId]?.location || 'Unknown Location'
          }));
        }

        return {
          ...user,
          enhancedProjects
        };
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateUser(userId, updateData) {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        ...updateData,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      const userDocRef = doc(db, 'users', userId)
      await deleteDoc(userDocRef)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Get document status for a user
   * @param {Object} user - User object
   * @returns {Object} Document status object
   */
  getDocumentStatus(user) {
    const documents = user.documents || {}
    
    return {
      profilePicture: !!documents.profilePictureUrl,
      frontId: !!documents.frontIdUrl,
      backId: !!documents.backIdUrl,
      allRequired: !!documents.frontIdUrl && !!documents.backIdUrl,
      anyDocuments: !!documents.profilePictureUrl || !!documents.frontIdUrl || !!documents.backIdUrl
    }
  }

  /**
   * Get users with missing required documents (OPTIMIZED - uses pagination)
   * @returns {Promise<Array>} Array of users missing required documents
   */
  async getUsersWithMissingDocuments(options = {}) {
    try {
      const { pageSize = 100 } = options;
      const { users } = await this.getAllUsers({ pageSize });
      
      return users.filter(user => {
        const status = this.getDocumentStatus(user)
        return !status.allRequired
      });
    } catch (error) {
      console.error('Error fetching users with missing documents:', error);
      throw error;
    }
  }

  /**
   * Get document statistics (OPTIMIZED - uses limited fetch)
   * Note: For accurate stats on large datasets, consider using Cloud Functions with aggregation
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStatistics(options = {}) {
    try {
      console.log('⚠️ UserService: Document statistics - fetching limited sample');
      const { pageSize = 200 } = options; // Sample only
      const { users } = await this.getAllUsers({ pageSize });
      
      const stats = {
        total: users.length,
        isSample: true, // Indicate this is a sample
        sampleSize: users.length,
        withProfilePicture: 0,
        withFrontId: 0,
        withBackId: 0,
        withAllRequired: 0,
        withAnyDocuments: 0
      };
      
      users.forEach(user => {
        const status = this.getDocumentStatus(user);
        
        if (status.profilePicture) stats.withProfilePicture++;
        if (status.frontId) stats.withFrontId++;
        if (status.backId) stats.withBackId++;
        if (status.allRequired) stats.withAllRequired++;
        if (status.anyDocuments) stats.withAnyDocuments++;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting document statistics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user details (alias for getUserById)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getComprehensiveUserDetails(userId) {
    return this.getUserById(userId)
  }

  /**
   * Get basic user details (alias for getUserById)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserDetails(userId) {
    return this.getUserById(userId)
  }

  /**
   * Get user projects
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user projects
   */
  async getUserProjects(userId) {
    try {
      const user = await this.getUserById(userId)
      return user.enhancedProjects || user.projects || []
    } catch (error) {
      console.error('Error getting user projects:', error)
      throw error
    }
  }

  /**
   * Format user data for display
   * @param {Object} userData - Raw user data
   * @returns {Object} Formatted user data
   */
  formatUserForDisplay(userData) {
    if (!userData) return null

    return {
      ...userData,
      displayName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.fullName || userData.email || 'Unknown User',
      fullName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.fullName || 'N/A'
    }
  }
}

const userServiceInstance = new UserService()

// Named exports for backward compatibility
export const getComprehensiveUserDetails = (userId) => userServiceInstance.getComprehensiveUserDetails(userId)
export const getUserDetails = (userId) => userServiceInstance.getUserDetails(userId)
export const getUserProjects = (userId) => userServiceInstance.getUserProjects(userId)
export const formatUserForDisplay = (userData) => userServiceInstance.formatUserForDisplay(userData)

export default userServiceInstance