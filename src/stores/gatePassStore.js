import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useGatePassStore = create((set, get) => ({
  gatePasses: [],
  selectedGatePass: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedGatePass: (gatePass) => set({ selectedGatePass: gatePass }),

  fetchGatePasses: async (projectId, filters = {}) => {
    try {
      set({ loading: true, error: null });
      let q = collection(db, `projects/${projectId}/gatePasses`);
      
      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.date) {
        q = query(q, where('validFrom', '==', filters.date));
      }
      
      // Order by date
      q = query(q, orderBy('validFrom', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const gatePassesData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ gatePasses: gatePassesData });
    } catch (error) {
      console.error("Error fetching gate passes:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addGatePass: async (projectId, gatePassData) => {
    try {
      set({ loading: true, error: null });
      const newGatePass = {
        passNumber: gatePassData.passNumber || `GP-${Date.now()}`,
        type: gatePassData.type, // visitor, contractor, vendor, member, guest
        userId: gatePassData.userId || null,
        visitorName: gatePassData.visitorName,
        visitorEmail: gatePassData.visitorEmail,
        visitorPhone: gatePassData.visitorPhone,
        purpose: gatePassData.purpose,
        validFrom: gatePassData.validFrom,
        validUntil: gatePassData.validUntil,
        entryTime: gatePassData.entryTime || null,
        exitTime: gatePassData.exitTime || null,
        status: gatePassData.status || 'active', // active, expired, revoked, used
        accessLevel: gatePassData.accessLevel || 'restricted', // full, restricted, limited
        allowedAreas: gatePassData.allowedAreas || [],
        vehicleInfo: gatePassData.vehicleInfo || {},
        issuedBy: gatePassData.issuedBy,
        notes: gatePassData.notes || '',
        qrCode: gatePassData.qrCode || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/gatePasses`), newGatePass);
      newGatePass.id = docRef.id;

      set((state) => ({
        gatePasses: [newGatePass, ...state.gatePasses]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding gate pass:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateGatePass: async (projectId, gatePassId, gatePassData) => {
    try {
      set({ loading: true, error: null });
      const gatePassRef = doc(db, `projects/${projectId}/gatePasses`, gatePassId);
      
      const updateData = {
        ...gatePassData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(gatePassRef, updateData);

      set((state) => ({
        gatePasses: state.gatePasses.map(gatePass => 
          gatePass.id === gatePassId ? { ...gatePass, ...updateData } : gatePass
        )
      }));
    } catch (error) {
      console.error("Error updating gate pass:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteGatePass: async (projectId, gatePassId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/gatePasses`, gatePassId));
      
      set((state) => ({
        gatePasses: state.gatePasses.filter(gatePass => gatePass.id !== gatePassId)
      }));
    } catch (error) {
      console.error("Error deleting gate pass:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  checkIn: async (projectId, gatePassId) => {
    try {
      set({ loading: true, error: null });
      const gatePassRef = doc(db, `projects/${projectId}/gatePasses`, gatePassId);
      const currentGatePass = get().gatePasses.find(gp => gp.id === gatePassId);
      
      if (currentGatePass && currentGatePass.status === 'active') {
        const entryTime = new Date().toISOString();
        
        await updateDoc(gatePassRef, { 
          entryTime,
          status: 'used',
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          gatePasses: state.gatePasses.map(gatePass => 
            gatePass.id === gatePassId ? { 
              ...gatePass, 
              entryTime,
              status: 'used'
            } : gatePass
          )
        }));
      }
    } catch (error) {
      console.error("Error checking in:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  checkOut: async (projectId, gatePassId) => {
    try {
      set({ loading: true, error: null });
      const gatePassRef = doc(db, `projects/${projectId}/gatePasses`, gatePassId);
      const currentGatePass = get().gatePasses.find(gp => gp.id === gatePassId);
      
      if (currentGatePass && currentGatePass.entryTime) {
        const exitTime = new Date().toISOString();
        
        await updateDoc(gatePassRef, { 
          exitTime,
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          gatePasses: state.gatePasses.map(gatePass => 
            gatePass.id === gatePassId ? { 
              ...gatePass, 
              exitTime
            } : gatePass
          )
        }));
      }
    } catch (error) {
      console.error("Error checking out:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  revokeGatePass: async (projectId, gatePassId) => {
    try {
      set({ loading: true, error: null });
      const gatePassRef = doc(db, `projects/${projectId}/gatePasses`, gatePassId);
      
      await updateDoc(gatePassRef, { 
        status: 'revoked',
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        gatePasses: state.gatePasses.map(gatePass => 
          gatePass.id === gatePassId ? { ...gatePass, status: 'revoked' } : gatePass
        )
      }));
    } catch (error) {
      console.error("Error revoking gate pass:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getActiveGatePasses: () => {
    return get().gatePasses.filter(gatePass => gatePass.status === 'active');
  },

  getExpiredGatePasses: () => {
    const now = new Date().toISOString();
    return get().gatePasses.filter(gatePass => 
      gatePass.validUntil < now && gatePass.status === 'active'
    );
  },

  getGatePassesByType: (type) => {
    return get().gatePasses.filter(gatePass => gatePass.type === type);
  },

  getGatePassesByUser: (userId) => {
    return get().gatePasses.filter(gatePass => gatePass.userId === userId);
  },

  getGatePassesByStatus: (status) => {
    return get().gatePasses.filter(gatePass => gatePass.status === status);
  },

  getTodayGatePasses: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().gatePasses.filter(gatePass => 
      gatePass.validFrom.startsWith(today) || gatePass.validUntil.startsWith(today)
    );
  },

  generateQRCode: (gatePassId) => {
    // This would typically integrate with a QR code generation library
    return `https://yourdomain.com/gatepass/${gatePassId}`;
  },

  clearGatePasses: () => set({ gatePasses: [], selectedGatePass: null })
}));
