import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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
      
      console.log('Fetched courts data:', courtsData);
      courtsData.forEach(court => {
        console.log(`Court ${court.name}:`, {
          imageUrl: court.imageUrl,
          imageFileName: court.imageFileName,
          image: court.image
        });
      });
      
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
        imageUrl: courtData.imageUrl || '',
        imageFileName: courtData.imageFileName || '',
        description: courtData.description || '',
        active: courtData.active !== undefined ? courtData.active : true,
        bookingIntervalMinutes: courtData.bookingIntervalMinutes || 60,
        availability: courtData.availability || {
          monday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          tuesday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          wednesday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          thursday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          friday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          saturday: { enabled: true, startTime: '08:00', endTime: '22:00' },
          sunday: { enabled: true, startTime: '08:00', endTime: '22:00' }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📊 Adding new court to Firestore:', newCourt);
      console.log('📅 Initial availability:', JSON.stringify(newCourt.availability, null, 2));

      const docRef = await addDoc(collection(db, `projects/${projectId}/courts`), newCourt);
      newCourt.id = docRef.id;

      set((state) => ({
        courts: [...state.courts, newCourt]
      }));
      
      console.log('✅ New court added successfully');

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
      
      console.log('Updating court with data:', courtData);
      
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
        imageUrl: courtData.imageUrl || '',
        imageFileName: courtData.imageFileName || '',
        description: courtData.description || '',
        active: courtData.active,
        bookingIntervalMinutes: courtData.bookingIntervalMinutes || 60,
        availability: courtData.availability || {},
        updatedAt: serverTimestamp()
      };
      
      console.log('📊 Update data being sent to Firestore:', updateData);
      console.log('📅 Availability in update:', JSON.stringify(updateData.availability, null, 2));
      console.log('⏱️ Booking interval in update:', updateData.bookingIntervalMinutes);

      await updateDoc(courtRef, updateData);

      set((state) => ({
        courts: state.courts.map(court => 
          court.id === courtId ? { ...court, ...updateData } : court
        )
      }));
      
      console.log('✅ Court updated successfully in Firestore');
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
