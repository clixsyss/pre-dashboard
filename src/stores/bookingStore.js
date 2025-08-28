import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy, getDoc } from 'firebase/firestore';
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
      console.log('fetchBookings called with:', { projectId, filters });
      set({ loading: true, error: null });
      
      const collectionPath = `projects/${projectId}/bookings`;
      console.log('Collection path:', collectionPath);
      
      let q = collection(db, collectionPath);
      
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
      
      // Order by date only (since timeSlots is an array)
      q = query(q, orderBy('date'));
      
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('Query result:', { 
        empty: querySnapshot.empty, 
        size: querySnapshot.size,
        docs: querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      });
      
      const bookingsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      // Fetch user information for each booking
      console.log('Fetching user information for bookings...');
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            if (booking.userId) {
              console.log(`Fetching user data for userId: ${booking.userId}`);
              const userDoc = await getDoc(doc(db, 'users', booking.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log(`User data for ${booking.userId}:`, userData);
                const enrichedBooking = {
                  ...booking,
                  userName: userData.firstName && userData.lastName 
                    ? `${userData.firstName} ${userData.lastName}` 
                    : 'Unknown User',
                  userEmail: userData.email || 'No email',
                  userPhone: userData.mobile || 'No phone',
                  userUnit: userData.projects?.find(p => p.projectId === projectId)?.unit || 'N/A'
                };
                console.log(`Enriched booking:`, enrichedBooking);
                return enrichedBooking;
              } else {
                console.log(`No user document found for userId: ${booking.userId}`);
              }
            } else {
              console.log(`No userId found in booking:`, booking);
            }
            return {
              ...booking,
              userName: 'Unknown User',
              userEmail: 'No email',
              userPhone: 'No phone',
              userUnit: 'N/A'
            };
          } catch (error) {
            console.error(`Error fetching user info for booking ${booking.id}:`, error);
            return {
              ...booking,
              userName: 'Error loading user',
              userEmail: 'Error loading email',
              userPhone: 'Error loading phone',
              userUnit: 'N/A'
            };
          }
        })
      );
      
      console.log('Enriched bookings data:', enrichedBookings);
      set({ bookings: enrichedBookings });
      
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

  clearBookings: () => set({ bookings: [], selectedBooking: null }),

  // View booking details
  viewBooking: (bookingId) => {
    const booking = get().bookings.find(b => b.id === bookingId);
    if (booking) {
      set({ selectedBooking: booking });
    }
    return booking;
  },

  // Update booking status
  updateBookingStatus: async (projectId, bookingId, newStatus) => {
    try {
      set({ loading: true, error: null });
      const bookingRef = doc(db, `projects/${projectId}/bookings`, bookingId);
      
      await updateDoc(bookingRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        ),
        selectedBooking: state.selectedBooking?.id === bookingId 
          ? { ...state.selectedBooking, status: newStatus }
          : state.selectedBooking
      }));

      return true;
    } catch (error) {
      console.error("Error updating booking status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Cancel booking
  cancelBooking: async (projectId, bookingId) => {
    return get().updateBookingStatus(projectId, bookingId, 'cancelled');
  },

  // Confirm booking
  confirmBooking: async (projectId, bookingId) => {
    return get().updateBookingStatus(projectId, bookingId, 'confirmed');
  },

  // Complete booking
  completeBooking: async (projectId, bookingId) => {
    return get().updateBookingStatus(projectId, bookingId, 'completed');
  }
}));
