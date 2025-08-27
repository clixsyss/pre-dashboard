import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useSportsStore = create((set, get) => ({
  sports: [],
  selectedSport: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedSport: (sport) => set({ selectedSport: sport }),

  fetchSports: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/sports`));
      const sportsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ sports: sportsData });
    } catch (error) {
      console.error("Error fetching sports:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addSport: async (projectId, sportData) => {
    try {
      set({ loading: true, error: null });
      const newSport = {
        name: sportData.name,
        description: sportData.description,
        category: sportData.category,
        difficulty: sportData.difficulty,
        ageGroup: sportData.ageGroup,
        maxParticipants: sportData.maxParticipants,
        duration: sportData.duration,
        equipment: sportData.equipment || [],
        rules: sportData.rules || [],
        image: sportData.image || '',
        active: sportData.active !== undefined ? sportData.active : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/sports`), newSport);
      newSport.id = docRef.id;

      set((state) => ({
        sports: [...state.sports, newSport]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding sport:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateSport: async (projectId, sportId, sportData) => {
    try {
      set({ loading: true, error: null });
      const sportRef = doc(db, `projects/${projectId}/sports`, sportId);
      
      const updateData = {
        name: sportData.name,
        description: sportData.description,
        category: sportData.category,
        difficulty: sportData.difficulty,
        ageGroup: sportData.ageGroup,
        maxParticipants: sportData.maxParticipants,
        duration: sportData.duration,
        equipment: sportData.equipment || [],
        rules: sportData.rules || [],
        image: sportData.image || '',
        active: sportData.active,
        updatedAt: serverTimestamp()
      };

      await updateDoc(sportRef, updateData);

      set((state) => ({
        sports: state.sports.map(sport => 
          sport.id === sportId ? { ...sport, ...updateData } : sport
        )
      }));
    } catch (error) {
      console.error("Error updating sport:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteSport: async (projectId, sportId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/sports`, sportId));
      
      set((state) => ({
        sports: state.sports.filter(sport => sport.id !== sportId)
      }));
    } catch (error) {
      console.error("Error deleting sport:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleSportStatus: async (projectId, sportId) => {
    try {
      set({ loading: true, error: null });
      const sportRef = doc(db, `projects/${projectId}/sports`, sportId);
      const currentSport = get().sports.find(s => s.id === sportId);
      
      if (currentSport) {
        const newStatus = !currentSport.active;
        await updateDoc(sportRef, { 
          active: newStatus,
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          sports: state.sports.map(sport => 
            sport.id === sportId ? { ...sport, active: newStatus } : sport
          )
        }));
      }
    } catch (error) {
      console.error("Error toggling sport status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getSportsByCategory: (category) => {
    return get().sports.filter(sport => sport.category === category);
  },

  getActiveSports: () => {
    return get().sports.filter(sport => sport.active);
  },

  getSportsByAgeGroup: (ageGroup) => {
    return get().sports.filter(sport => sport.ageGroup === ageGroup);
  },

  clearSports: () => set({ sports: [], selectedSport: null })
}));
