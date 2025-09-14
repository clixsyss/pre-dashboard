import { create } from 'zustand';
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useAcademyStore = create((set, get) => ({
  academyOptions: [],
  programsByAcademy: {},
  selectedAcademy: null,
  userBookings: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchAcademies: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/academies`));
      const academyData = [];
      const programData = {};

      querySnapshot.forEach((docSnap) => {
        const academyId = docSnap.id;
        const data = docSnap.data();
        academyData.push({ id: academyId, ...data });
        programData[academyId] = data.programs || [];
      });

      set({ academyOptions: academyData, programsByAcademy: programData });
    } catch (error) {
      console.error("Error fetching academies:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addAcademy: async (projectId, academy) => {
    try {
      set({ loading: true, error: null });
      const academyId = Date.now().toString();
      const academyRef = doc(db, `projects/${projectId}/academies`, academyId);
      await setDoc(academyRef, {
        name: academy.name,
        type: academy.type,
        establishedYear: academy.establishedYear,
        rating: academy.rating,
        description: academy.description,
        email: academy.email,
        phone: academy.phone,
        location: academy.location,
        website: academy.website,
        capacity: academy.capacity,
        operatingHours: academy.operatingHours,
        facilities: academy.facilities,
        programs: [],
        imageUrl: academy.imageUrl || '',
        imageFileName: academy.imageFileName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const newAcademy = {
        id: academyId,
        name: academy.name,
        type: academy.type,
        establishedYear: academy.establishedYear,
        rating: academy.rating,
        description: academy.description,
        email: academy.email,
        phone: academy.phone,
        location: academy.location,
        website: academy.website,
        capacity: academy.capacity,
        operatingHours: academy.operatingHours,
        facilities: academy.facilities,
        programs: [],
        imageUrl: academy.imageUrl || '',
        imageFileName: academy.imageFileName || ''
      };

      set((state) => ({
        academyOptions: [...state.academyOptions, newAcademy],
        programsByAcademy: { ...state.programsByAcademy, [academyId]: [] }
      }));
    } catch (error) {
      console.error("Error adding academy:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateAcademy: async (projectId, academy) => {
    try {
      set({ loading: true, error: null });
      const academyRef = doc(db, `projects/${projectId}/academies`, academy.id);
      await updateDoc(academyRef, {
        name: academy.name,
        type: academy.type,
        establishedYear: academy.establishedYear,
        rating: academy.rating,
        description: academy.description,
        email: academy.email,
        phone: academy.phone,
        location: academy.location,
        website: academy.website,
        capacity: academy.capacity,
        operatingHours: academy.operatingHours,
        facilities: academy.facilities,
        imageUrl: academy.imageUrl || '',
        imageFileName: academy.imageFileName || '',
        updatedAt: serverTimestamp()
      });

      set((state) => {
        const updatedOptions = state.academyOptions.map(a => 
          a.id === academy.id ? { ...a, ...academy } : a
        );
        return { academyOptions: updatedOptions };
      });
    } catch (error) {
      console.error("Error updating academy:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteAcademy: async (projectId, academyId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/academies`, academyId));
      
      set((state) => {
        const newProgramsByAcademy = { ...state.programsByAcademy };
        delete newProgramsByAcademy[academyId];
        
        return {
          academyOptions: state.academyOptions.filter(a => a.id !== academyId),
          programsByAcademy: newProgramsByAcademy
        };
      });
    } catch (error) {
      console.error("Error deleting academy:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addProgram: async (projectId, academyId, program) => {
    try {
      set({ loading: true, error: null });
      const academyRef = doc(db, `projects/${projectId}/academies`, academyId);
      
      const currentAcademy = get().academyOptions.find(a => a.id === academyId);
      const currentPrograms = currentAcademy?.programs || [];
      const updatedPrograms = [...currentPrograms, { ...program, id: Date.now().toString() }];
      
      await updateDoc(academyRef, { 
        programs: updatedPrograms,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        programsByAcademy: { ...state.programsByAcademy, [academyId]: updatedPrograms },
        academyOptions: state.academyOptions.map(a => 
          a.id === academyId ? { ...a, programs: updatedPrograms } : a
        )
      }));
    } catch (error) {
      console.error("Error adding program:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProgram: async (projectId, academyId, programId, updatedProgram) => {
    try {
      set({ loading: true, error: null });
      const academyRef = doc(db, `projects/${projectId}/academies`, academyId);
      
      const currentAcademy = get().academyOptions.find(a => a.id === academyId);
      const currentPrograms = currentAcademy?.programs || [];
      const updatedPrograms = currentPrograms.map(p => 
        p.id === programId ? { ...p, ...updatedProgram } : p
      );
      
      await updateDoc(academyRef, { 
        programs: updatedPrograms,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        programsByAcademy: { ...state.programsByAcademy, [academyId]: updatedPrograms },
        academyOptions: state.academyOptions.map(a => 
          a.id === academyId ? { ...a, programs: updatedPrograms } : a
        )
      }));
    } catch (error) {
      console.error("Error updating program:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProgram: async (projectId, academyId, programId) => {
    try {
      set({ loading: true, error: null });
      const academyRef = doc(db, `projects/${projectId}/academies`, academyId);
      
      const currentAcademy = get().academyOptions.find(a => a.id === academyId);
      const currentPrograms = currentAcademy?.programs || [];
      const updatedPrograms = currentPrograms.filter(p => p.id !== programId);
      
      await updateDoc(academyRef, { 
        programs: updatedPrograms,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        programsByAcademy: { ...state.programsByAcademy, [academyId]: updatedPrograms },
        academyOptions: state.academyOptions.map(a => 
          a.id === academyId ? { ...a, programs: updatedPrograms } : a
        )
      }));
    } catch (error) {
      console.error("Error deleting program:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedAcademy: (academy) => set({ selectedAcademy: academy }),
  clearAcademies: () => set({ academyOptions: [], programsByAcademy: {}, selectedAcademy: null })
}));
