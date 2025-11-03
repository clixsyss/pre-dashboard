import { create } from 'zustand';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit
  // onSnapshot removed - using manual fetching for cost optimization
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { storage } from '../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const useComplaintStore = create((set, get) => ({
  // State
  complaints: [],
  currentComplaint: null,
  loading: false,
  error: null,
  stats: {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  },
  filters: {
    status: '',
    category: '',
    priority: '',
    search: ''
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () => set({ filters: { status: '', category: '', priority: '', search: '' } }),

  // Fetch all complaints
  fetchComplaints: async (projectId, customFilters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const complaintsRef = collection(db, `projects/${projectId}/complaints`);
      let q = query(complaintsRef, orderBy('lastMessageAt', 'desc'));

      const filters = { ...get().filters, ...customFilters };

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const complaints = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter if provided
      let filteredComplaints = complaints;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredComplaints = complaints.filter(complaint => 
          complaint.title?.toLowerCase().includes(searchTerm) ||
          complaint.messages?.some(msg => msg.text?.toLowerCase().includes(searchTerm))
        );
      }

      set({ complaints: filteredComplaints });
      return filteredComplaints;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch single complaint
  fetchComplaint: async (projectId, complaintId) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = doc(db, `projects/${projectId}/complaints`, complaintId);
      const complaintSnap = await getDoc(complaintRef);
      
      if (complaintSnap.exists()) {
        const complaint = { id: complaintSnap.id, ...complaintSnap.data() };
        set({ currentComplaint: complaint });
        return complaint;
      } else {
        throw new Error('Complaint not found');
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Create new complaint
  createComplaint: async (projectId, userId, complaintData) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = collection(db, `projects/${projectId}/complaints`);
      const now = new Date();
      const complaint = {
        userId,
        adminId: null,
        title: complaintData.title,
        category: complaintData.category,
        status: 'Open',
        priority: complaintData.priority || 'Medium',
        messages: [{
          id: Date.now().toString(),
          senderType: 'user',
          senderId: userId,
          text: complaintData.initialMessage,
          timestamp: now,
          imageUrl: complaintData.imageUrl || null,
          imageFileName: complaintData.imageFileName || null
        }],
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now
      };

      const docRef = await addDoc(complaintRef, complaint);
      const newComplaint = { id: docRef.id, ...complaint };
      
      set(state => ({
        complaints: [newComplaint, ...state.complaints]
      }));
      
      return newComplaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Add message to complaint
  addMessage: async (projectId, complaintId, messageData) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = doc(db, `projects/${projectId}/complaints`, complaintId);
      
      const now = new Date();
      const message = {
        id: Date.now().toString(),
        senderType: messageData.senderType,
        senderId: messageData.senderId,
        text: messageData.text,
        timestamp: now,
        imageUrl: messageData.imageUrl || null,
        imageFileName: messageData.imageFileName || null
      };

      // Get current complaint to add message to array
      const complaintSnap = await getDoc(complaintRef);
      if (!complaintSnap.exists()) {
        throw new Error('Complaint not found');
      }

      const currentComplaint = complaintSnap.data();
      const updatedMessages = [...currentComplaint.messages, message];

      await updateDoc(complaintRef, {
        messages: updatedMessages,
        updatedAt: now,
        lastMessageAt: now
      });

      // Update local state
      set(state => ({
        complaints: state.complaints.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, messages: updatedMessages, lastMessageAt: message.timestamp }
            : complaint
        ),
        currentComplaint: state.currentComplaint?.id === complaintId 
          ? { ...state.currentComplaint, messages: updatedMessages, lastMessageAt: message.timestamp }
          : state.currentComplaint
      }));

      return message;
    } catch (error) {
      console.error('Error adding message:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update complaint status
  updateComplaintStatus: async (projectId, complaintId, status, adminId = null) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = doc(db, `projects/${projectId}/complaints`, complaintId);
      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (adminId) {
        updateData.adminId = adminId;
      }

      await updateDoc(complaintRef, updateData);

      // Update local state
      set(state => ({
        complaints: state.complaints.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, status, adminId, updatedAt: new Date() }
            : complaint
        ),
        currentComplaint: state.currentComplaint?.id === complaintId 
          ? { ...state.currentComplaint, status, adminId, updatedAt: new Date() }
          : state.currentComplaint
      }));

      return true;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Assign complaint to admin
  assignComplaint: async (projectId, complaintId, adminId) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = doc(db, `projects/${projectId}/complaints`, complaintId);
      await updateDoc(complaintRef, {
        adminId,
        updatedAt: new Date()
      });

      // Update local state
      set(state => ({
        complaints: state.complaints.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, adminId, updatedAt: new Date() }
            : complaint
        ),
        currentComplaint: state.currentComplaint?.id === complaintId 
          ? { ...state.currentComplaint, adminId, updatedAt: new Date() }
          : state.currentComplaint
      }));

      return true;
    } catch (error) {
      console.error('Error assigning complaint:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Upload image for complaint
  uploadComplaintImage: async (file, complaintId) => {
    try {
      set({ loading: true, error: null });
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `complaints/${complaintId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        url: downloadURL,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading complaint image:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Delete complaint image
  deleteComplaintImage: async (fileName) => {
    try {
      const imageRef = storageRef(storage, fileName);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error('Error deleting complaint image:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Get complaint statistics
  fetchStats: async (projectId) => {
    try {
      set({ loading: true, error: null });
      
      const complaints = await get().fetchComplaints(projectId);
      
      const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'Open').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        closed: complaints.filter(c => c.status === 'Closed').length
      };

      set({ stats });
      return stats;
    } catch (error) {
      console.error('Error fetching complaint stats:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Delete complaint
  deleteComplaint: async (projectId, complaintId) => {
    try {
      set({ loading: true, error: null });
      
      const complaintRef = doc(db, `projects/${projectId}/complaints`, complaintId);
      await deleteDoc(complaintRef);

      // Update local state
      set(state => ({
        complaints: state.complaints.filter(complaint => complaint.id !== complaintId),
        currentComplaint: state.currentComplaint?.id === complaintId ? null : state.currentComplaint
      }));

      return true;
    } catch (error) {
      console.error('Error deleting complaint:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Set current complaint
  setCurrentComplaint: (complaint) => set({ currentComplaint: complaint }),
  clearCurrentComplaint: () => set({ currentComplaint: null }),

  // Real-time subscriptions
  // REMOVED: subscribeToComplaints - replaced with manual fetchComplaints calls
  // COST OPTIMIZATION: Real-time listeners removed to reduce Firebase read costs
  // Use fetchComplaints() instead and call it manually or on a timer
  
  // REMOVED: subscribeToComplaint - replaced with manual fetchComplaint calls
  // COST OPTIMIZATION: Real-time listeners removed to reduce Firebase read costs
  // Use fetchComplaint() instead and call it manually when needed

  // Constants
  complaintCategories: [
    { id: 'gate_access', name: 'Gate Access', icon: 'gate' },
    { id: 'noise', name: 'Noise Complaint', icon: 'volume_off' },
    { id: 'maintenance', name: 'Maintenance Request', icon: 'build' },
    { id: 'security', name: 'Security Issue', icon: 'security' },
    { id: 'facility', name: 'Facility Issue', icon: 'home' },
    { id: 'billing', name: 'Billing Issue', icon: 'receipt' },
    { id: 'other', name: 'Other', icon: 'help' }
  ],

  priorityLevels: [
    { id: 'Low', name: 'Low', color: 'green' },
    { id: 'Medium', name: 'Medium', color: 'orange' },
    { id: 'High', name: 'High', color: 'red' },
    { id: 'Urgent', name: 'Urgent', color: 'purple' }
  ],

  statusOptions: [
    { id: 'Open', name: 'Open', color: 'blue' },
    { id: 'In Progress', name: 'In Progress', color: 'orange' },
    { id: 'Resolved', name: 'Resolved', color: 'green' },
    { id: 'Closed', name: 'Closed', color: 'gray' }
  ]
}));

export default useComplaintStore;
