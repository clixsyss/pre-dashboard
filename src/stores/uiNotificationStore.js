import { create } from 'zustand';

export const useUINotificationStore = create((set, get) => ({
  notifications: [],
  nextId: 1,

  addNotification: (message, type = 'info', duration = 5000) => {
    const id = get().nextId++;
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      timestamp: Date.now()
    };

    set((state) => ({
      notifications: [...state.notifications, notification]
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  // Convenience methods
  success: (message, duration = 5000) => get().addNotification(message, 'success', duration),
  error: (message, duration = 7000) => get().addNotification(message, 'error', duration),
  warning: (message, duration = 6000) => get().addNotification(message, 'warning', duration),
  info: (message, duration = 5000) => get().addNotification(message, 'info', duration)
}));
