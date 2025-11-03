/**
 * Centralized App Data Store
 * 
 * This store fetches users and projects ONCE on app initialization
 * and provides cached data to ALL components.
 * 
 * Components should NEVER fetch users/projects directly - they should
 * always use this store.
 */

import { create } from 'zustand';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

// Cache configuration (Extended for cost optimization)
const CACHE_DURATION = {
  users: 24 * 60 * 60 * 1000, // 24 hours
  projects: 7 * 24 * 60 * 60 * 1000, // 7 days (projects rarely change)
  counts: 24 * 60 * 60 * 1000 // 24 hours
};

export const useAppDataStore = create((set, get) => ({
  // ============= STATE =============
  users: [],
  projects: [],
  userCount: 0,
  projectCount: 0,
  
  // Cache metadata
  usersLastFetched: null,
  projectsLastFetched: null,
  countsLastFetched: null,
  
  // Loading states
  usersLoading: false,
  projectsLoading: false,
  
  // Errors
  usersError: null,
  projectsError: null,
  
  // Initialization
  initialized: false,

  // ============= CACHE HELPERS =============
  
  /**
   * Check if data needs refresh
   */
  needsRefresh: (lastFetched, duration) => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > duration;
  },

  /**
   * Get users with project information enhanced
   */
  getUsersWithProjects: () => {
    const { users, projects } = get();
    const projectsMap = {};
    projects.forEach(p => {
      projectsMap[p.id] = p;
    });

    return users.map(user => {
      let enhancedProjects = [];
      if (user.projects && Array.isArray(user.projects)) {
        enhancedProjects = user.projects.map(project => ({
          ...project,
          projectName: projectsMap[project.projectId]?.name || 'Unknown Project',
          projectType: projectsMap[project.projectId]?.type || 'Unknown Type',
          projectLocation: projectsMap[project.projectId]?.location || 'Unknown Location'
        }));
      }

      return {
        ...user,
        enhancedProjects
      };
    });
  },

  /**
   * Get users for a specific project
   */
  getUsersByProject: (projectId) => {
    const usersWithProjects = get().getUsersWithProjects();
    return usersWithProjects.filter(user => 
      user.projects?.some(p => p.projectId === projectId)
    );
  },

  /**
   * Search users (client-side from cached data)
   */
  searchUsers: (searchTerm, field = 'all') => {
    const users = get().getUsersWithProjects();
    const searchLower = searchTerm.toLowerCase();

    return users.filter(user => {
      switch (field) {
        case 'name':
          const fullName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.toLowerCase()
            : user.fullName?.toLowerCase() || '';
          return fullName.includes(searchLower);
        
        case 'email':
          return user.email?.toLowerCase().includes(searchLower);
        
        case 'mobile':
          return user.mobile?.includes(searchTerm);
        
        case 'nationalId':
          return user.nationalId?.includes(searchTerm);
        
        default:
          const name = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.toLowerCase()
            : user.fullName?.toLowerCase() || '';
          return (
            name.includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.mobile?.includes(searchTerm) ||
            user.nationalId?.includes(searchTerm)
          );
      }
    });
  },

  // ============= FETCH FUNCTIONS =============

  /**
   * Fetch users (with caching)
   */
  fetchUsers: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we need to refresh
    if (!forceRefresh && !state.needsRefresh(state.usersLastFetched, CACHE_DURATION.users)) {
      console.log('✅ AppDataStore: Using cached users', state.users.length);
      return state.users;
    }

    // Already loading? Wait for it
    if (state.usersLoading) {
      console.log('⏳ AppDataStore: Users already loading, waiting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.usersLoading) {
            clearInterval(checkInterval);
            resolve(currentState.users);
          }
        }, 100);
      });
    }

    try {
      set({ usersLoading: true, usersError: null });
      console.log('📊 AppDataStore: Fetching users from Firestore...');

      // Fetch users with reasonable limit
      // For dashboard, 1000 users is usually enough for most operations
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));

      console.log(`✅ AppDataStore: Fetched ${users.length} users (cached for ${CACHE_DURATION.users / 60000} minutes)`);

      set({ 
        users, 
        usersLastFetched: Date.now(),
        usersLoading: false 
      });

      return users;
    } catch (error) {
      console.error('❌ AppDataStore: Error fetching users:', error);
      set({ usersError: error.message, usersLoading: false });
      throw error;
    }
  },

  /**
   * Fetch projects (with caching)
   */
  fetchProjects: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we need to refresh
    if (!forceRefresh && !state.needsRefresh(state.projectsLastFetched, CACHE_DURATION.projects)) {
      console.log('✅ AppDataStore: Using cached projects', state.projects.length);
      return state.projects;
    }

    // Already loading? Wait for it
    if (state.projectsLoading) {
      console.log('⏳ AppDataStore: Projects already loading, waiting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.projectsLoading) {
            clearInterval(checkInterval);
            resolve(currentState.projects);
          }
        }, 100);
      });
    }

    try {
      set({ projectsLoading: true, projectsError: null });
      console.log('📊 AppDataStore: Fetching projects from Firestore...');

      // Fetch all projects (usually not many)
      const projectsQuery = query(
        collection(db, 'projects'),
        limit(100) // Safety limit
      );

      const snapshot = await getDocs(projectsQuery);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ AppDataStore: Fetched ${projects.length} projects (cached for ${CACHE_DURATION.projects / 60000} minutes)`);

      set({ 
        projects, 
        projectsLastFetched: Date.now(),
        projectsLoading: false,
        projectCount: projects.length
      });

      return projects;
    } catch (error) {
      console.error('❌ AppDataStore: Error fetching projects:', error);
      set({ projectsError: error.message, projectsLoading: false });
      throw error;
    }
  },

  /**
   * Fetch user count (cached separately for longer)
   */
  fetchUserCount: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we need to refresh
    if (!forceRefresh && !state.needsRefresh(state.countsLastFetched, CACHE_DURATION.counts)) {
      console.log('✅ AppDataStore: Using cached user count', state.userCount);
      return state.userCount;
    }

    try {
      console.log('📊 AppDataStore: Fetching user count...');
      
      // Use existing users if available, otherwise fetch
      const users = state.users.length > 0 ? state.users : await get().fetchUsers();
      const count = users.length;

      set({ 
        userCount: count,
        countsLastFetched: Date.now()
      });

      console.log(`✅ AppDataStore: User count: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ AppDataStore: Error fetching user count:', error);
      throw error;
    }
  },

  /**
   * Initialize app data (call this once on app start)
   */
  initializeAppData: async () => {
    if (get().initialized) {
      console.log('✅ AppDataStore: Already initialized');
      return;
    }

    try {
      console.log('🚀 AppDataStore: Initializing app data...');
      
      // Fetch both in parallel
      await Promise.all([
        get().fetchProjects(),
        get().fetchUsers()
      ]);

      // Calculate counts
      await get().fetchUserCount();

      set({ initialized: true });
      console.log('✅ AppDataStore: Initialization complete');
    } catch (error) {
      console.error('❌ AppDataStore: Initialization failed:', error);
      throw error;
    }
  },

  /**
   * Refresh all data
   */
  refreshAllData: async () => {
    console.log('🔄 AppDataStore: Refreshing all data...');
    try {
      await Promise.all([
        get().fetchProjects(true),
        get().fetchUsers(true)
      ]);
      await get().fetchUserCount(true);
      console.log('✅ AppDataStore: All data refreshed');
    } catch (error) {
      console.error('❌ AppDataStore: Refresh failed:', error);
      throw error;
    }
  },

  /**
   * Clear cache (force reload on next fetch)
   */
  clearCache: () => {
    set({
      usersLastFetched: null,
      projectsLastFetched: null,
      countsLastFetched: null
    });
    console.log('🗑️ AppDataStore: Cache cleared');
  },

  /**
   * Update a single user in cache (after edit)
   */
  updateUserInCache: (userId, updates) => {
    const { users } = get();
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    );
    set({ users: updatedUsers });
    console.log('✅ AppDataStore: User updated in cache:', userId);
  },

  /**
   * Remove user from cache (after delete)
   */
  removeUserFromCache: (userId) => {
    const { users } = get();
    const updatedUsers = users.filter(user => user.id !== userId);
    set({ users: updatedUsers, userCount: updatedUsers.length });
    console.log('✅ AppDataStore: User removed from cache:', userId);
  },

  /**
   * Add user to cache (after create)
   */
  addUserToCache: (user) => {
    const { users } = get();
    set({ 
      users: [user, ...users],
      userCount: users.length + 1
    });
    console.log('✅ AppDataStore: User added to cache:', user.id);
  }
}));

// Auto-refresh cache periodically (every 5 minutes in background)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useAppDataStore.getState();
    if (store.initialized) {
      // Only refresh if cache is stale
      if (store.needsRefresh(store.usersLastFetched, CACHE_DURATION.users)) {
        console.log('🔄 AppDataStore: Auto-refreshing stale data...');
        store.fetchUsers(true).catch(err => 
          console.error('Auto-refresh failed:', err)
        );
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

export default useAppDataStore;

