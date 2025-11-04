import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy
  // onSnapshot removed - using manual refresh for cost optimization
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAppDataStore } from '../stores/appDataStore';

/**
 * Fines Service
 * OPTIMIZATION: Uses cached user data from appDataStore for user searches
 */

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
        const { sendStatusNotification } = await import('./statusNotificationService');
        
        const title_en = 'Fine Issued';
        const title_ar = 'تم إصدار غرامة';
        const body_en = `A fine of ${fineData.amount} EGP has been issued to your account. Reason: ${fineData.reason}. Please check your account for details.`;
        const body_ar = `تم إصدار غرامة بقيمة ${fineData.amount} جنيه على حسابك. السبب: ${fineData.reason}. يرجى التحقق من حسابك للحصول على التفاصيل.`;
        
        await sendStatusNotification(projectId, fineData.userId, title_en, body_en, title_ar, body_ar, 'alert');
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
        const { sendStatusNotification } = await import('./statusNotificationService');
        
        let title_en = 'Fine Status Update';
        let title_ar = 'تحديث حالة الغرامة';
        let body_en = '';
        let body_ar = '';
        
        switch (status) {
          case 'issued':
            body_en = `A fine has been issued to your account. ${reason ? `Reason: ${reason}` : 'Please check your account for details.'}`;
            body_ar = `تم إصدار غرامة على حسابك. ${reason ? `السبب: ${reason}` : 'يرجى التحقق من حسابك للحصول على التفاصيل.'}`;
            break;
          case 'paid':
            body_en = `Your fine payment has been confirmed and recorded. Thank you for your prompt payment.`;
            body_ar = `تم تأكيد وتسجيل دفع غرامتك. شكراً لدفعك السريع.`;
            break;
          case 'disputed':
            body_en = `Your fine dispute has been received and is under review. We will contact you soon.`;
            body_ar = `تم استلام اعتراضك على الغرامة وهو قيد المراجعة. سنتواصل معك قريباً.`;
            break;
          case 'cancelled':
            body_en = `The fine on your account has been cancelled. ${reason ? `Reason: ${reason}` : ''}`;
            body_ar = `تم إلغاء الغرامة على حسابك. ${reason ? `السبب: ${reason}` : ''}`;
            break;
          default:
            body_en = `Your fine status has been updated to ${status.toUpperCase()}.`;
            body_ar = `تم تحديث حالة غرامتك إلى ${status.toUpperCase()}.`;
        }
        
        await sendStatusNotification(projectId, userId, title_en, body_en, title_ar, body_ar, 'alert');
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

// REMOVED: onFineChange - replaced with manual getFine calls
// COST OPTIMIZATION: Real-time listener removed to reduce Firebase read costs
// Use getFine() instead and call it manually when needed (e.g., on button click or timer)

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
// OPTIMIZED: Uses cached data from appDataStore
export const searchUsers = async (projectId, searchTerm) => {
  try {
    console.log('🔍 FinesService: Searching users from cache...');
    
    // Get cached users from appDataStore
    const { getUsersByProject } = useAppDataStore.getState();
    const projectUsersData = getUsersByProject(projectId);
    
    console.log(`✅ FinesService: Using ${projectUsersData.length} cached users for search`);

    // Add project-specific info to users
    const enrichedUsers = projectUsersData.map(user => {
      const projectInfo = user.projects?.find(project => project.projectId === projectId);
      const enrichedUser = {
        ...user,
        // Fix: Use the correct field names from the projects array
        unitNumber: projectInfo?.unit || user.unitNumber || user.unit,
        userUnit: projectInfo?.unit || user.unitNumber || user.unit,
        userRole: projectInfo?.role || user.userRole || user.role,
        name: user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name),
        phone: user.mobile || user.phone
      };
      
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
  // onFineChange removed - use getFine() instead for cost optimization
  uploadFineImage,
  deleteFineImage,
  searchUsers
};

export default finesService;
