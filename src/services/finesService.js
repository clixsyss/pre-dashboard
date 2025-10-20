import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Create a new fine/violation
export const createFine = async (projectId, fineData) => {
  try {
    const finesCollection = collection(db, 'projects', projectId, 'fines');
    
    const fine = {
      ...fineData,
      status: 'issued', // issued, paid, disputed, cancelled
      messages: [],
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(finesCollection, fine);
    
    // Send push notification to user when fine is created
    if (fineData.userId) {
      try {
        // Import dynamically to avoid circular dependency
        const { default: mobilePushService } = await import('./mobilePushService');
        
        const notificationMessage = `A fine of ${fineData.amount} EGP has been issued to your account. Reason: ${fineData.reason}. Please check your account for details.`;
        
        await mobilePushService.sendPushNotification(fineData.userId, projectId, {
          title: 'Fine Issued',
          message: notificationMessage,
          actionType: 'fine_issued',
          category: 'fine',
          priority: 'high',
          metadata: {
            fineId: docRef.id,
            amount: fineData.amount,
            reason: fineData.reason
          }
        });
        
        console.log('Fine creation notification sent successfully');
      } catch (notificationError) {
        console.warn('Failed to send fine notification:', notificationError);
        // Don't fail the fine creation if notification fails
      }
    }
    
    return { id: docRef.id, ...fine };
  } catch (error) {
    console.error('Error creating fine:', error);
    throw error;
  }
};

// Get all fines for a project
export const getFines = async (projectId) => {
  try {
    const finesCollection = collection(db, 'projects', projectId, 'fines');
    const q = query(finesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching fines:', error);
    throw error;
  }
};

// Get fines for a specific user
export const getUserFines = async (projectId, userId) => {
  try {
    const finesCollection = collection(db, 'projects', projectId, 'fines');
    const q = query(
      finesCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user fines:', error);
    throw error;
  }
};

// Get fines by status
export const getFinesByStatus = async (projectId, status) => {
  try {
    const finesCollection = collection(db, 'projects', projectId, 'fines');
    const q = query(
      finesCollection,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching fines by status:', error);
    throw error;
  }
};

// Get a specific fine
export const getFine = async (projectId, fineId) => {
  try {
    const fineDoc = doc(db, 'projects', projectId, 'fines', fineId);
    const snapshot = await getDoc(fineDoc);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      throw new Error('Fine not found');
    }
  } catch (error) {
    console.error('Error fetching fine:', error);
    throw error;
  }
};

// Update fine status
export const updateFineStatus = async (projectId, fineId, status, reason = '', userId = null) => {
  try {
    const fineDoc = doc(db, 'projects', projectId, 'fines', fineId);
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add system message about status change
    if (reason) {
      const systemMessage = {
        id: Date.now().toString(),
        text: `Fine status updated to "${status}". Reason: ${reason}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      };

      // Get current fine to append message
      const currentFine = await getFine(projectId, fineId);
      updateData.messages = [...(currentFine.messages || []), systemMessage];
      updateData.lastMessageAt = new Date();
    }

    await updateDoc(fineDoc, updateData);
    
    // Send push notification to user if userId provided
    if (userId) {
      try {
        // Import dynamically to avoid circular dependency
        const { default: mobilePushService } = await import('./mobilePushService');
        
        let notificationMessage = '';
        switch (status) {
          case 'issued':
            notificationMessage = `A fine has been issued to your account. ${reason ? `Reason: ${reason}` : 'Please check your account for details.'}`;
            break;
          case 'paid':
            notificationMessage = `Your fine payment has been confirmed and recorded. Thank you for your prompt payment.`;
            break;
          case 'disputed':
            notificationMessage = `Your fine dispute has been received and is under review. We will contact you soon.`;
            break;
          case 'cancelled':
            notificationMessage = `The fine on your account has been cancelled. ${reason ? `Reason: ${reason}` : ''}`;
            break;
          default:
            notificationMessage = `Your fine status has been updated to ${status.toUpperCase()}.`;
        }
        
        await mobilePushService.sendPushNotification(userId, projectId, {
          title: 'Fine Status Update',
          message: notificationMessage,
          actionType: 'fine_update',
          category: 'fine',
          priority: 'high'
        });
        
        console.log('Fine status notification sent successfully');
      } catch (notificationError) {
        console.warn('Failed to send fine notification:', notificationError);
        // Don't fail the status update if notification fails
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating fine status:', error);
    throw error;
  }
};

// Update fine details
export const updateFineDetails = async (projectId, fineId, updates, reason = '') => {
  try {
    const fineDoc = doc(db, 'projects', projectId, 'fines', fineId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Add system message about the update
    if (reason) {
      const systemMessage = {
        id: Date.now().toString(),
        text: `Fine details updated. Reason: ${reason}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      };

      // Get current fine to append message
      const currentFine = await getFine(projectId, fineId);
      updateData.messages = [...(currentFine.messages || []), systemMessage];
      updateData.lastMessageAt = new Date();
    }

    await updateDoc(fineDoc, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating fine details:', error);
    throw error;
  }
};

// Add message to fine chat
export const addMessage = async (projectId, fineId, messageData) => {
  try {
    const fineDoc = doc(db, 'projects', projectId, 'fines', fineId);
    
    // Get current fine to append message
    const currentFine = await getFine(projectId, fineId);
    
    const newMessage = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date()
    };

    const updatedMessages = [...(currentFine.messages || []), newMessage];

    await updateDoc(fineDoc, {
      messages: updatedMessages,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });

    return newMessage;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

// Listen to real-time fine changes
export const onFineChange = (projectId, fineId, callback) => {
  const fineDoc = doc(db, 'projects', projectId, 'fines', fineId);
  
  return onSnapshot(fineDoc, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// Upload fine evidence image
export const uploadFineImage = async (projectId, fineId, imageFile) => {
  try {
    const imageRef = ref(storage, `projects/${projectId}/fines/${fineId}/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading fine image:', error);
    throw error;
  }
};

// Delete fine image
export const deleteFineImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting fine image:', error);
    throw error;
  }
};

// Search users for fine assignment
export const searchUsers = async (projectId, searchTerm) => {
  try {
    // Fetch all users from global collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter users who belong to this specific project
    const projectUsersData = usersData.filter(user => {
      if (user.projects && Array.isArray(user.projects)) {
        return user.projects.some(project => project.projectId === projectId);
      }
      return false;
    });

    // Add project-specific info to users
    const enrichedUsers = projectUsersData.map(user => {
      const projectInfo = user.projects.find(project => project.projectId === projectId);
      const enrichedUser = {
        ...user,
        // Fix: Use the correct field names from the projects array
        unitNumber: projectInfo?.unit || user.unitNumber || user.unit,
        userUnit: projectInfo?.unit || user.unitNumber || user.unit,
        userRole: projectInfo?.role || user.userRole || user.role,
        name: user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name),
        phone: user.mobile || user.phone
      };
      
      console.log('Project info for user:', projectInfo); // Debug project info
      console.log('Enriched user:', enrichedUser); // Debug log
      return enrichedUser;
    });

    // Filter users based on search term
    const filteredUsers = enrichedUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.mobile?.toLowerCase().includes(searchLower) ||
        user.unitNumber?.toLowerCase().includes(searchLower) ||
        user.id?.toLowerCase().includes(searchLower)
      );
    });

    return filteredUsers;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

const finesService = {
  createFine,
  getFines,
  getUserFines,
  getFinesByStatus,
  getFine,
  updateFineStatus,
  updateFineDetails,
  addMessage,
  onFineChange,
  uploadFineImage,
  deleteFineImage,
  searchUsers
};

export default finesService;
