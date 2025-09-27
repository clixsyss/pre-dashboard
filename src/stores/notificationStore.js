import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  selectedNotification: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedNotification: (notification) => set({ selectedNotification: notification }),

  fetchNotifications: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const notificationsRef = collection(db, `projects/${projectId}/notifications`);
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const notificationsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
      }));
      
      set({ notifications: notificationsData });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addNotification: async (projectId, notificationData) => {
    try {
      set({ loading: true, error: null });
      
      const newNotification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'announcement', // announcement, event, alert, info
        category: notificationData.category || 'general',
        priority: notificationData.priority || 'normal', // low, normal, high, urgent
        targetAudience: notificationData.targetAudience || 'all', // all, residents, staff, specific
        specificUsers: notificationData.specificUsers || [],
        scheduledFor: notificationData.scheduledFor || null,
        expiresAt: notificationData.expiresAt || null,
        isActive: notificationData.isActive !== undefined ? notificationData.isActive : true,
        requiresAction: notificationData.requiresAction || false,
        actionUrl: notificationData.actionUrl || null,
        actionText: notificationData.actionText || null,
        imageUrl: notificationData.imageUrl || null,
        createdBy: notificationData.createdBy || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/notifications`), newNotification);
      newNotification.id = docRef.id;
      newNotification.createdAt = new Date();

      set((state) => ({
        notifications: [newNotification, ...state.notifications]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding notification:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateNotification: async (projectId, notificationId, notificationData) => {
    try {
      set({ loading: true, error: null });
      const notificationRef = doc(db, `projects/${projectId}/notifications`, notificationId);
      
      const updateData = {
        ...notificationData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(notificationRef, updateData);

      set((state) => ({
        notifications: state.notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, ...updateData, updatedAt: new Date() }
            : notification
        )
      }));
    } catch (error) {
      console.error("Error updating notification:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteNotification: async (projectId, notificationId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/notifications`, notificationId));
      
      set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== notificationId)
      }));
    } catch (error) {
      console.error("Error deleting notification:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleNotificationStatus: async (projectId, notificationId, isActive) => {
    try {
      await get().updateNotification(projectId, notificationId, { isActive });
    } catch (error) {
      console.error("Error toggling notification status:", error);
      throw error;
    }
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter(notification => notification.type === type);
  },

  getActiveNotifications: () => {
    return get().notifications.filter(notification => notification.isActive);
  },

  getNotificationsByPriority: (priority) => {
    return get().notifications.filter(notification => notification.priority === priority);
  },

  getNotificationsByCategory: (category) => {
    return get().notifications.filter(notification => notification.category === category);
  },

  getUpcomingNotifications: () => {
    const now = new Date();
    return get().notifications.filter(notification => 
      notification.scheduledFor && new Date(notification.scheduledFor) > now
    );
  },

  getExpiredNotifications: () => {
    const now = new Date();
    return get().notifications.filter(notification => 
      notification.expiresAt && new Date(notification.expiresAt) < now
    );
  },

  getNotificationStats: () => {
    const notifications = get().notifications;
    const total = notifications.length;
    const active = notifications.filter(n => n.isActive).length;
    const announcements = notifications.filter(n => n.type === 'announcement').length;
    const events = notifications.filter(n => n.type === 'event').length;
    const alerts = notifications.filter(n => n.type === 'alert').length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    const high = notifications.filter(n => n.priority === 'high').length;

    return {
      total,
      active,
      inactive: total - active,
      announcements,
      events,
      alerts,
      urgent,
      high
    };
  },

  clearNotifications: () => set({ notifications: [], selectedNotification: null })
}));
