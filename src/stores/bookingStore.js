import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),

  fetchBookings: async (projectId, filters = {}) => {
    try {
      set({ loading: true, error: null });
      let q = collection(db, `projects/${projectId}/bookings`);
      
      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.courtId) {
        q = query(q, where('courtId', '==', filters.courtId));
      }
      if (filters.academyId) {
        q = query(q, where('academyId', '==', filters.academyId));
      }
      if (filters.date) {
        q = query(q, where('date', '==', filters.date));
      }
      
      // Order by date and time
      q = query(q, orderBy('date'), orderBy('startTime'));
      
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ bookings: bookingsData });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addBooking: async (projectId, bookingData) => {
    try {
      set({ loading: true, error: null });
      const newBooking = {
        userId: bookingData.userId,
        userName: bookingData.userName,
        userEmail: bookingData.userEmail,
        type: bookingData.type, // 'court', 'academy', 'event'
        courtId: bookingData.courtId || null,
        academyId: bookingData.academyId || null,
        eventId: bookingData.eventId || null,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        duration: bookingData.duration,
        status: bookingData.status || 'pending', // pending, confirmed, cancelled, completed
        notes: bookingData.notes || '',
        totalPrice: bookingData.totalPrice || 0,
        paymentStatus: bookingData.paymentStatus || 'pending', // pending, paid, refunded
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/bookings`), newBooking);
      newBooking.id = docRef.id;

      set((state) => ({
        bookings: [...state.bookings, newBooking]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding booking:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateBooking: async (projectId, bookingId, bookingData) => {
    try {
      set({ loading: true, error: null });
      const bookingRef = doc(db, `projects/${projectId}/bookings`, bookingId);
      
      const updateData = {
        ...bookingData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(bookingRef, updateData);

      set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, ...updateData } : booking
        )
      }));
    } catch (error) {
      console.error("Error updating booking:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteBooking: async (projectId, bookingId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/bookings`, bookingId));
      
      set((state) => ({
        bookings: state.bookings.filter(booking => booking.id !== bookingId)
      }));
    } catch (error) {
      console.error("Error deleting booking:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateBookingStatus: async (projectId, bookingId, status) => {
    try {
      set({ loading: true, error: null });
      const bookingRef = doc(db, `projects/${projectId}/bookings`, bookingId);
      
      await updateDoc(bookingRef, { 
        status,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        )
      }));
    } catch (error) {
      console.error("Error updating booking status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePaymentStatus: async (projectId, bookingId, paymentStatus) => {
    try {
      set({ loading: true, error: null });
      const bookingRef = doc(db, `projects/${projectId}/bookings`, bookingId);
      
      await updateDoc(bookingRef, { 
        paymentStatus,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, paymentStatus } : booking
        )
      }));
    } catch (error) {
      console.error("Error updating payment status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getBookingsByUser: (userId) => {
    return get().bookings.filter(booking => booking.userId === userId);
  },

  getBookingsByCourt: (courtId) => {
    return get().bookings.filter(booking => booking.courtId === courtId);
  },

  getBookingsByAcademy: (academyId) => {
    return get().bookings.filter(booking => booking.academyId === academyId);
  },

  getBookingsByDate: (date) => {
    return get().bookings.filter(booking => booking.date === date);
  },

  getBookingsByStatus: (status) => {
    return get().bookings.filter(booking => booking.status === status);
  },

  getPendingBookings: () => {
    return get().bookings.filter(booking => booking.status === 'pending');
  },

  getConfirmedBookings: () => {
    return get().bookings.filter(booking => booking.status === 'confirmed');
  },

  getCancelledBookings: () => {
    return get().bookings.filter(booking => booking.status === 'cancelled');
  },

  getCompletedBookings: () => {
    return get().bookings.filter(booking => booking.status === 'completed');
  },

  getBookingsByDateRange: (startDate, endDate) => {
    return get().bookings.filter(booking => 
      booking.date >= startDate && booking.date <= endDate
    );
  },

  clearBookings: () => set({ bookings: [], selectedBooking: null })
}));
