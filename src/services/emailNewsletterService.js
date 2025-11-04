import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppDataStore } from '../stores/appDataStore';

/**
 * Email Newsletter Service
 * Handles email groups, campaigns, and sending via Firebase Functions
 * 
 * OPTIMIZATION: Uses cached user data from appDataStore to reduce Firebase reads
 */

// Get all email groups for a project
export const getEmailGroups = async (projectId) => {
  try {
    const groupsRef = collection(db, `projects/${projectId}/emailGroups`);
    const q = query(groupsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching email groups:', error);
    throw error;
  }
};

// Create a new email group
export const createEmailGroup = async (projectId, groupData) => {
  try {
    const groupsRef = collection(db, `projects/${projectId}/emailGroups`);
    const docRef = await addDoc(groupsRef, {
      ...groupData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...groupData };
  } catch (error) {
    console.error('Error creating email group:', error);
    throw error;
  }
};

// Update an email group
export const updateEmailGroup = async (projectId, groupId, groupData) => {
  try {
    const groupRef = doc(db, `projects/${projectId}/emailGroups`, groupId);
    await updateDoc(groupRef, {
      ...groupData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating email group:', error);
    throw error;
  }
};

// Delete an email group
export const deleteEmailGroup = async (projectId, groupId) => {
  try {
    const groupRef = doc(db, `projects/${projectId}/emailGroups`, groupId);
    await deleteDoc(groupRef);
  } catch (error) {
    console.error('Error deleting email group:', error);
    throw error;
  }
};

// Get all campaigns for a project
export const getCampaigns = async (projectId) => {
  try {
    const campaignsRef = collection(db, `projects/${projectId}/emailCampaigns`);
    const q = query(campaignsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

// Create and send email campaign
export const createCampaign = async (projectId, campaignData) => {
  try {
    const campaignsRef = collection(db, `projects/${projectId}/emailCampaigns`);
    const docRef = await addDoc(campaignsRef, {
      ...campaignData,
      status: 'draft',
      sentCount: 0,
      failedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...campaignData };
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Send email campaign
export const sendCampaign = async (projectId, campaignId) => {
  try {
    const campaignRef = doc(db, `projects/${projectId}/emailCampaigns`, campaignId);
    
    // Update status to sending
    await updateDoc(campaignRef, {
      status: 'sending',
      sentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // The actual email sending will be handled by Firebase Cloud Function
    // that watches for status changes on emailCampaigns collection
    
    return true;
  } catch (error) {
    console.error('Error sending campaign:', error);
    throw error;
  }
};

// Get project users emails (for building recipient lists)
// OPTIMIZED: Uses cached data from appDataStore
export const getProjectUsersEmails = async (projectId) => {
  try {
    console.log('📧 EmailNewsletterService: Getting project users from cache...');
    
    // Get cached users from appDataStore
    const { getUsersByProject } = useAppDataStore.getState();
    const cachedUsers = getUsersByProject(projectId);
    
    console.log(`✅ EmailNewsletterService: Found ${cachedUsers.length} cached users for project`);
    
    // Map users to email format
    const projectUsers = cachedUsers.map(user => {
      // Find project-specific data
      const userProject = user.projects?.find(p => p.projectId === projectId);
      
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        unit: userProject?.userUnit || '',
        role: userProject?.userRole || '',
        building: userProject?.building || ''
      };
    });
    
    return projectUsers;
  } catch (error) {
    console.error('Error fetching project users:', error);
    throw error;
  }
};

// Search users by email, name, user_id, unit, or building
// Only searches if searchTerm has at least 2 characters
// OPTIMIZED: Uses cached data from appDataStore
export const searchProjectUsers = async (projectId, searchTerm) => {
  try {
    console.log('🔍 searchProjectUsers called with:', { projectId, searchTerm });
    
    if (!searchTerm || searchTerm.length < 2) {
      console.log('Search term too short, returning empty');
      return [];
    }

    // Get cached users from appDataStore
    const { getUsersByProject } = useAppDataStore.getState();
    const cachedUsers = getUsersByProject(projectId);
    
    console.log(`✅ Using ${cachedUsers.length} cached users for search`);
    
    const searchLower = searchTerm.toLowerCase();
    const results = [];
    
    cachedUsers.forEach(user => {
      // Find project-specific data
      const userProject = user.projects?.find(p => p.projectId === projectId);
      
      if (!userProject) return;
      
      const userId = user.id.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const fullName = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase().trim();
      const unit = (userProject.userUnit || '').toString().toLowerCase();
      const building = (userProject.building || '').toLowerCase();
      
      // Search across all fields
      if (
        userId.includes(searchLower) ||
        email.includes(searchLower) ||
        fullName.includes(searchLower) ||
        unit.includes(searchLower) ||
        building.includes(searchLower)
      ) {
        results.push({
          id: user.id,
          email: user.email,
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          unit: userProject.userUnit,
          role: userProject.userRole,
          building: userProject.building || ''
        });
      }
    });
    
    console.log('Matching results:', results.length);
    
    // Limit results to 50 for performance
    return results.slice(0, 50);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Delete a campaign
export const deleteCampaign = async (projectId, campaignId) => {
  try {
    const campaignRef = doc(db, `projects/${projectId}/emailCampaigns`, campaignId);
    await deleteDoc(campaignRef);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

const emailNewsletterService = {
  getEmailGroups,
  createEmailGroup,
  updateEmailGroup,
  deleteEmailGroup,
  getCampaigns,
  createCampaign,
  sendCampaign,
  getProjectUsersEmails,
  searchProjectUsers,
  deleteCampaign
};

export default emailNewsletterService;

