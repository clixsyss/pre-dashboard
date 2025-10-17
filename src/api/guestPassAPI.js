/**
 * Guest Pass API Endpoints
 * These functions can be called by the mobile app to interact with the Guest Pass system
 */

import { guestPassesService } from '../services/guestPassesService';

/**
 * Check if a user can generate guest passes
 * This is the main function the mobile app should call before allowing pass generation
 * 
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} Eligibility result with detailed information
 */
export const checkUserEligibility = async (projectId, userId) => {
  try {
    console.log(`🔍 [API] Checking eligibility for user ${userId} in project ${projectId}`);
    
    // Validate inputs
    if (!projectId || !userId) {
      console.error('❌ [API] Missing required parameters:', { projectId, userId });
      return {
        success: false,
        error: 'Missing parameters',
        message: 'Project ID and User ID are required'
      };
    }
    
    const result = await guestPassesService.checkUserEligibility(projectId, userId);
    console.log('✅ [API] Eligibility check result:', result);
    
    // Add additional logging for debugging
    if (!result.success) {
      console.warn(`⚠️ [API] User ${userId} is NOT eligible:`, result.error);
    } else {
      console.log(`✅ [API] User ${userId} is eligible for pass generation`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [API] Error in checkUserEligibility:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to check user eligibility'
    };
  }
};

/**
 * Create a guest pass (should only be called after eligibility check passes)
 * 
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID
 * @param {string} userName - The user's display name
 * @param {Object} additionalData - Any additional pass data
 * @returns {Promise<Object>} Created pass data
 */
export const createGuestPass = async (projectId, userId, userName, additionalData = {}) => {
  try {
    console.log(`Creating guest pass for user ${userId} in project ${projectId}`);
    
    // First check eligibility
    const eligibilityCheck = await guestPassesService.checkUserEligibility(projectId, userId);
    if (!eligibilityCheck.success || !eligibilityCheck.data.canGenerate) {
      return {
        success: false,
        error: eligibilityCheck.error,
        message: eligibilityCheck.message,
        data: eligibilityCheck.data
      };
    }
    
    // Create the pass
    const passData = {
      userId,
      userName,
      ...additionalData
    };
    
    const result = await guestPassesService.createPass(projectId, passData);
    
    return {
      success: true,
      data: result,
      message: 'Guest pass created successfully'
    };
  } catch (error) {
    console.error('Error in createGuestPass API:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create guest pass'
    };
  }
};

/**
 * Mark a guest pass as sent (called after WhatsApp sending)
 * 
 * @param {string} projectId - The project ID
 * @param {string} passId - The pass ID to update
 * @param {string} qrCodeUrl - Optional QR code URL
 * @returns {Promise<Object>} Updated pass data
 */
export const markPassAsSent = async (projectId, passId, qrCodeUrl = null) => {
  try {
    console.log(`Marking pass ${passId} as sent in project ${projectId}`);
    
    const result = await guestPassesService.updatePassSentStatus(projectId, passId, true);
    
    return {
      success: true,
      data: result,
      message: 'Pass marked as sent successfully'
    };
  } catch (error) {
    console.error('Error in markPassAsSent API:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to mark pass as sent'
    };
  }
};

/**
 * Initialize user for guest passes (call when user first accesses the feature)
 * 
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID
 * @param {Object} userData - Additional user data
 * @returns {Promise<Object>} User data with guest pass info
 */
export const initializeUser = async (projectId, userId, userData = {}) => {
  try {
    console.log(`Initializing user ${userId} for guest passes in project ${projectId}`);
    
    const result = await guestPassesService.initializeUser(projectId, userId, userData);
    
    return {
      success: true,
      data: result,
      message: 'User initialized successfully'
    };
  } catch (error) {
    console.error('Error in initializeUser API:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to initialize user'
    };
  }
};

/**
 * Get user's current guest pass status and limits
 * 
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} User's guest pass status
 */
export const getUserStatus = async (projectId, userId) => {
  try {
    console.log(`Getting status for user ${userId} in project ${projectId}`);
    
    const result = await guestPassesService.checkUserEligibility(projectId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: {
          canGenerate: result.data.canGenerate,
          user: result.data.user,
          reason: result.data.reason
        },
        message: 'User status retrieved successfully'
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: result.message,
        data: result.data
      };
    }
  } catch (error) {
    console.error('Error in getUserStatus API:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to get user status'
    };
  }
};

/**
 * Generate a unique pass ID (utility function)
 * 
 * @returns {string} Unique pass ID
 */
export const generatePassId = () => {
  return guestPassesService.generatePassId();
};

/**
 * Validate pass ID format
 * 
 * @param {string} passId - The pass ID to validate
 * @returns {boolean} Whether the pass ID is valid
 */
export const isValidPassId = (passId) => {
  const passIdRegex = /^GP-[A-Z0-9]+-[A-Z0-9]+$/;
  return passIdRegex.test(passId);
};

// Export all functions as default object for convenience
export default {
  checkUserEligibility,
  createGuestPass,
  markPassAsSent,
  initializeUser,
  getUserStatus,
  generatePassId,
  isValidPassId
};
