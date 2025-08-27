import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useUserStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  fetchUsers: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/users`));
      const usersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ users: usersData });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addUser: async (projectId, userData) => {
    try {
      set({ loading: true, error: null });
      const newUser = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'member', // admin, manager, member, guest
        status: userData.status || 'active', // active, inactive, suspended
        membershipType: userData.membershipType || 'basic', // basic, premium, vip
        joinDate: userData.joinDate || new Date().toISOString(),
        profileImage: userData.profileImage || '',
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || {},
        preferences: userData.preferences || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/users`), newUser);
      newUser.id = docRef.id;

      set((state) => ({
        users: [...state.users, newUser]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding user:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (projectId, userId, userData) => {
    try {
      set({ loading: true, error: null });
      const userRef = doc(db, `projects/${projectId}/users`, userId);
      
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);

      set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...updateData } : user
        )
      }));
    } catch (error) {
      console.error("Error updating user:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (projectId, userId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/users`, userId));
      
      set((state) => ({
        users: state.users.filter(user => user.id !== userId)
      }));
    } catch (error) {
      console.error("Error deleting user:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getUserById: (userId) => {
    return get().users.find(user => user.id === userId);
  },

  getUsersByRole: (role) => {
    return get().users.filter(user => user.role === role);
  },

  getUsersByStatus: (status) => {
    return get().users.filter(user => user.status === status);
  },

  getActiveUsers: () => {
    return get().users.filter(user => user.status === 'active');
  },

  clearUsers: () => set({ users: [], selectedUser: null })
}));
