import { create } from 'zustand';
import { guestPassesService } from '../services/guestPassesService';

export const useGuestPassStore = create((set, get) => ({
  // State
  stats: null,
  users: [],
  passes: [],
  globalSettings: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch statistics for a project
  fetchStats: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const stats = await guestPassesService.getStats(projectId);
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats instead of throwing error
      const defaultStats = {
        totalPassesThisMonth: 0,
        passesSent: 0,
        activeUsers: 0,
        globalLimit: 100,
        sentPercentage: 0
      };
      set({ stats: defaultStats, loading: false, error: null });
      return defaultStats;
    }
  },

  // Fetch users for a project
  fetchUsers: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const users = await guestPassesService.getUsers(projectId);
      set({ users, loading: false });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ users: [], loading: false, error: null });
      return [];
    }
  },

  // Fetch passes for a project
  fetchPasses: async (projectId, filters = {}) => {
    try {
      console.log(`📡 GuestPassStore: Fetching passes for project ${projectId}`);
      set({ loading: true, error: null });
      const passes = await guestPassesService.getPasses(projectId, filters);
      console.log(`📊 GuestPassStore: Received ${passes.length} passes:`, passes);
      set({ passes, loading: false });
      return passes;
    } catch (error) {
      console.error('❌ GuestPassStore: Error fetching passes:', error);
      set({ passes: [], loading: false, error: null });
      return [];
    }
  },

  // Fetch global settings for a project
  fetchGlobalSettings: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const settings = await guestPassesService.getGlobalSettings(projectId);
      set({ globalSettings: settings, loading: false });
      return settings;
    } catch (error) {
      console.error('Error fetching global settings:', error);
      const defaultSettings = {
        monthlyLimit: 100,
        autoReset: true,
        allowOverrides: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set({ globalSettings: defaultSettings, loading: false, error: null });
      return defaultSettings;
    }
  },

  // Create a new pass
  createPass: async (projectId, passData) => {
    try {
      set({ loading: true, error: null });
      const newPass = await guestPassesService.createPass(projectId, passData);
      
      // Update local state
      const { passes } = get();
      set({ 
        passes: [newPass, ...passes],
        loading: false 
      });
      
      return newPass;
    } catch (error) {
      console.error('Error creating pass:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update pass sent status
  updatePassSentStatus: async (projectId, passId, sentStatus) => {
    try {
      set({ loading: true, error: null });
      const updatedPass = await guestPassesService.updatePassSentStatus(projectId, passId, sentStatus);
      
      // Update local state
      const { passes } = get();
      const updatedPasses = passes.map(pass => 
        pass.id === passId ? updatedPass : pass
      );
      set({ 
        passes: updatedPasses,
        loading: false 
      });
      
      return updatedPass;
    } catch (error) {
      console.error('Error updating pass status:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Block a user
  blockUser: async (projectId, userId) => {
    try {
      set({ loading: true, error: null });
      await guestPassesService.blockUser(projectId, userId);
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, blocked: true } : user
      );
      set({ 
        users: updatedUsers,
        loading: false 
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Unblock a user
  unblockUser: async (projectId, userId) => {
    try {
      set({ loading: true, error: null });
      await guestPassesService.unblockUser(projectId, userId);
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, blocked: false } : user
      );
      set({ 
        users: updatedUsers,
        loading: false 
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update user monthly limit
  updateUserLimit: async (projectId, userId, newLimit) => {
    try {
      set({ loading: true, error: null });
      await guestPassesService.updateUserLimit(projectId, userId, newLimit);
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, monthlyLimit: newLimit } : user
      );
      set({ 
        users: updatedUsers,
        loading: false 
      });
    } catch (error) {
      console.error('Error updating user limit:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update global monthly limit
  updateGlobalLimit: async (projectId, newLimit) => {
    try {
      console.log(`🔄 [Store] Updating global limit for project ${projectId} to ${newLimit}`);
      set({ loading: true, error: null });
      
      await guestPassesService.updateGlobalLimit(projectId, newLimit);
      
      // Update local state
      const currentSettings = get().globalSettings;
      const updatedSettings = { ...currentSettings, monthlyLimit: newLimit };
      
      console.log(`✅ [Store] Updated local global settings:`, updatedSettings);
      
      set({ 
        globalSettings: updatedSettings,
        loading: false 
      });
    } catch (error) {
      console.error('❌ [Store] Error updating global limit:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update validity duration
  updateValidityDuration: async (projectId, newDuration) => {
    try {
      console.log(`🔄 [Store] Updating validity duration for project ${projectId} to ${newDuration} hours`);
      set({ loading: true, error: null });
      
      await guestPassesService.updateValidityDuration(projectId, newDuration);
      
      // Update local state
      const currentSettings = get().globalSettings;
      const updatedSettings = { ...currentSettings, validityDurationHours: newDuration };
      
      console.log(`✅ [Store] Updated validity duration:`, updatedSettings);
      
      set({ 
        globalSettings: updatedSettings,
        loading: false 
      });
    } catch (error) {
      console.error('❌ [Store] Error updating validity duration:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Toggle block all users setting
  toggleBlockAll: async (projectId, blockAllUsers) => {
    try {
      console.log(`🔄 [Store] ${blockAllUsers ? 'Blocking' : 'Unblocking'} all users for project ${projectId}`);
      set({ loading: true, error: null });
      
      await guestPassesService.toggleBlockAll(projectId, blockAllUsers);
      
      // Update local state
      const currentSettings = get().globalSettings;
      const updatedSettings = { ...currentSettings, blockAllUsers: blockAllUsers };
      
      console.log(`✅ [Store] Updated block all setting:`, updatedSettings);
      
      set({ 
        globalSettings: updatedSettings,
        loading: false 
      });
    } catch (error) {
      console.error('❌ [Store] Error updating block all setting:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset monthly usage for all users
  resetMonthlyUsage: async (projectId) => {
    try {
      set({ loading: true, error: null });
      await guestPassesService.resetMonthlyUsage(projectId);
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => ({ ...user, usedThisMonth: 0 }));
      set({ 
        users: updatedUsers,
        loading: false 
      });
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get analytics data
  getAnalytics: async (projectId, period = 'month') => {
    try {
      set({ loading: true, error: null });
      const analytics = await guestPassesService.getAnalytics(projectId, period);
      set({ loading: false });
      return analytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear all data (useful for project switching)
  clearData: () => set({
    stats: null,
    users: [],
    passes: [],
    globalSettings: null,
    loading: false,
    error: null
  }),

  // Initialize user data (for when external app creates users)
  initializeUser: async (projectId, userId, userData) => {
    try {
      set({ loading: true, error: null });
      const user = await guestPassesService.initializeUser(projectId, userId, userData);
      set({ loading: false });
      return user;
    } catch (error) {
      console.error('Error initializing user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
