import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useCourtStore = create((set, get) => ({
  courts: [],
  selectedCourt: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedCourt: (court) => set({ selectedCourt: court }),

  fetchCourts: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/courts`));
      const courtsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ courts: courtsData });
    } catch (error) {
      console.error("Error fetching courts:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addCourt: async (projectId, courtData) => {
    try {
      set({ loading: true, error: null });
      const newCourt = {
        name: courtData.name,
        type: courtData.type,
        sport: courtData.sport,
        location: courtData.location,
        capacity: courtData.capacity,
        surface: courtData.surface,
        dimensions: courtData.dimensions || {},
        amenities: courtData.amenities || [],
        maintenanceSchedule: courtData.maintenanceSchedule || {},
        hourlyRate: courtData.hourlyRate || 0,
        status: courtData.status || 'available', // available, maintenance, booked
        image: courtData.image || '',
        description: courtData.description || '',
        active: courtData.active !== undefined ? courtData.active : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/courts`), newCourt);
      newCourt.id = docRef.id;

      set((state) => ({
        courts: [...state.courts, newCourt]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding court:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCourt: async (projectId, courtId, courtData) => {
    try {
      set({ loading: true, error: null });
      const courtRef = doc(db, `projects/${projectId}/courts`, courtId);
      
      const updateData = {
        name: courtData.name,
        type: courtData.type,
        sport: courtData.sport,
        location: courtData.location,
        capacity: courtData.capacity,
        surface: courtData.surface,
        dimensions: courtData.dimensions || {},
        amenities: courtData.amenities || [],
        maintenanceSchedule: courtData.maintenanceSchedule || {},
        hourlyRate: courtData.hourlyRate || 0,
        status: courtData.status,
        image: courtData.image || '',
        description: courtData.description || '',
        active: courtData.active,
        updatedAt: serverTimestamp()
      };

      await updateDoc(courtRef, updateData);

      set((state) => ({
        courts: state.courts.map(court => 
          court.id === courtId ? { ...court, ...updateData } : court
        )
      }));
    } catch (error) {
      console.error("Error updating court:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteCourt: async (projectId, courtId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/courts`, courtId));
      
      set((state) => ({
        courts: state.courts.filter(court => court.id !== courtId)
      }));
    } catch (error) {
      console.error("Error deleting court:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCourtStatus: async (projectId, courtId, status) => {
    try {
      set({ loading: true, error: null });
      const courtRef = doc(db, `projects/${projectId}/courts`, courtId);
      
      await updateDoc(courtRef, { 
        status,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        courts: state.courts.map(court => 
          court.id === courtId ? { ...court, status } : court
        )
      }));
    } catch (error) {
      console.error("Error updating court status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleCourtStatus: async (projectId, courtId) => {
    try {
      set({ loading: true, error: null });
      const courtRef = doc(db, `projects/${projectId}/courts`, courtId);
      const currentCourt = get().courts.find(c => c.id === courtId);
      
      if (currentCourt) {
        const newStatus = currentCourt.status === 'available' ? 'maintenance' : 'available';
        await updateDoc(courtRef, { 
          status: newStatus,
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          courts: state.courts.map(court => 
            court.id === courtId ? { ...court, status: newStatus } : court
          )
        }));
      }
    } catch (error) {
      console.error("Error toggling court status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getCourtsBySport: (sport) => {
    return get().courts.filter(court => court.sport === sport);
  },

  getAvailableCourts: () => {
    return get().courts.filter(court => court.status === 'available' && court.active);
  },

  getCourtsByType: (type) => {
    return get().courts.filter(court => court.type === type);
  },

  getCourtsByStatus: (status) => {
    return get().courts.filter(court => court.status === status);
  },

  getActiveCourts: () => {
    return get().courts.filter(court => court.active);
  },

  clearCourts: () => set({ courts: [], selectedCourt: null })
}));
