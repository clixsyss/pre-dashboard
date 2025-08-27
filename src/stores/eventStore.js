import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useEventStore = create((set, get) => ({
  events: [],
  selectedEvent: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  fetchEvents: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/events`));
      const eventsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ events: eventsData });
    } catch (error) {
      console.error("Error fetching events:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addEvent: async (projectId, eventData) => {
    try {
      set({ loading: true, error: null });
      const newEvent = {
        name: eventData.name,
        description: eventData.description,
        type: eventData.type,
        category: eventData.category,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        maxParticipants: eventData.maxParticipants,
        currentParticipants: eventData.currentParticipants || 0,
        entryFee: eventData.entryFee || 0,
        status: eventData.status || 'upcoming',
        active: eventData.active !== undefined ? eventData.active : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/events`), newEvent);
      newEvent.id = docRef.id;

      set((state) => ({
        events: [...state.events, newEvent]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding event:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (projectId, eventId, eventData) => {
    try {
      set({ loading: true, error: null });
      const eventRef = doc(db, `projects/${projectId}/events`, eventId);
      
      const updateData = {
        ...eventData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(eventRef, updateData);

      set((state) => ({
        events: state.events.map(event => 
          event.id === eventId ? { ...event, ...updateData } : event
        )
      }));
    } catch (error) {
      console.error("Error updating event:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteEvent: async (projectId, eventId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/events`, eventId));
      
      set((state) => ({
        events: state.events.filter(event => event.id !== eventId)
      }));
    } catch (error) {
      console.error("Error deleting event:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getEventsByType: (type) => {
    return get().events.filter(event => event.type === type);
  },

  getEventsByStatus: (status) => {
    return get().events.filter(event => event.status === status);
  },

  getUpcomingEvents: () => {
    return get().events.filter(event => event.status === 'upcoming');
  },

  clearEvents: () => set({ events: [], selectedEvent: null })
}));
