import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'

class UserService {
  /**
   * Fetch all users with enhanced project information
   * @returns {Promise<Array>} Array of user objects with enhanced data
   */
  async getAllUsers() {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      
      // Fetch projects for project name resolution
      const projectsSnapshot = await getDocs(collection(db, 'projects'))
      const projectsMap = {}
      projectsSnapshot.docs.forEach(doc => {
        projectsMap[doc.id] = doc.data()
      })
      
      const usersData = usersSnapshot.docs.map(doc => {
        const userData = doc.data()
        
        // Enhance projects data with actual project names
        let enhancedProjects = []
        if (userData.projects && Array.isArray(userData.projects)) {
          enhancedProjects = userData.projects.map(project => ({
            ...project,
            projectName: projectsMap[project.projectId]?.name || 'Unknown Project',
            projectType: projectsMap[project.projectId]?.type || 'Unknown Type',
            projectLocation: projectsMap[project.projectId]?.location || 'Unknown Location'
          }))
        }
        
        return {
          id: doc.id,
          ...userData,
          enhancedProjects,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate?.() || null,
          updatedAt: userData.updatedAt?.toDate?.() || null
        }
      })
      
      return usersData
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
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
   * Search users by various criteria
   * @param {string} searchTerm - Search term
   * @param {string} field - Field to search in ('name', 'email', 'mobile', 'nationalId')
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchTerm, field = 'name') {
    try {
      const users = await this.getAllUsers()
      
      return users.filter(user => {
        switch (field) {
          case 'name':
            const fullName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.toLowerCase()
              : user.fullName?.toLowerCase() || ''
            return fullName.includes(searchTerm.toLowerCase())
          
          case 'email':
            return user.email?.toLowerCase().includes(searchTerm.toLowerCase())
          
          case 'mobile':
            return user.mobile?.includes(searchTerm)
          
          case 'nationalId':
            return user.nationalId?.includes(searchTerm)
          
          default:
            // Search in all fields
            const name = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.toLowerCase()
              : user.fullName?.toLowerCase() || ''
            return (
              name.includes(searchTerm.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.mobile?.includes(searchTerm) ||
              user.nationalId?.includes(searchTerm)
            )
        }
      })
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
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
   * Get users with missing required documents
   * @returns {Promise<Array>} Array of users missing required documents
   */
  async getUsersWithMissingDocuments() {
    try {
      const users = await this.getAllUsers()
      return users.filter(user => {
        const status = this.getDocumentStatus(user)
        return !status.allRequired
      })
    } catch (error) {
      console.error('Error fetching users with missing documents:', error)
      throw error
    }
  }

  /**
   * Get document statistics
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStatistics() {
    try {
      const users = await this.getAllUsers()
      
      const stats = {
        total: users.length,
        withProfilePicture: 0,
        withFrontId: 0,
        withBackId: 0,
        withAllRequired: 0,
        withAnyDocuments: 0
      }
      
      users.forEach(user => {
        const status = this.getDocumentStatus(user)
        
        if (status.profilePicture) stats.withProfilePicture++
        if (status.frontId) stats.withFrontId++
        if (status.backId) stats.withBackId++
        if (status.allRequired) stats.withAllRequired++
        if (status.anyDocuments) stats.withAnyDocuments++
      })
      
      return stats
    } catch (error) {
      console.error('Error getting document statistics:', error)
      throw error
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