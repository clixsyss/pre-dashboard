/**
 * Centralized App Data Store with localStorage Persistence
 * 
 * This store fetches users, projects, and units data ONLY AFTER project selection
 * and caches them in localStorage for 24 hours to minimize Firebase reads.
 * 
 * Components should NEVER fetch users/projects/units directly - they should
 * always use this store.
 * 
 * Features:
 * - localStorage persistence with 24-hour cache duration
 * - Lazy loading (data fetched only after project selection)
 * - Manual refresh capability
 * - Automatic cache expiry
 */

import { create } from 'zustand';
import { collection, getDocs, query, limit, orderBy, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';
import dataCacheService from '../services/dataCacheService';

// Cache configuration (Extended for cost optimization)
const CACHE_DURATION = {
  users: 24 * 60 * 60 * 1000, // 24 hours
  projects: 7 * 24 * 60 * 60 * 1000, // 7 days (projects rarely change)
  units: 24 * 60 * 60 * 1000, // 24 hours
  counts: 24 * 60 * 60 * 1000 // 24 hours
};

export const useAppDataStore = create((set, get) => ({
  // ============= STATE =============
  users: [],
  projects: [],
  units: {}, // { [projectId]: units[] }
  userCount: 0,
  projectCount: 0,
  
  // Cache metadata
  usersLastFetched: null,
  projectsLastFetched: null,
  unitsLastFetched: {}, // { [projectId]: timestamp }
  countsLastFetched: null,
  lastRefreshTimestamp: null, // For "Last updated X ago" display
  
  // Loading states
  usersLoading: false,
  projectsLoading: false,
  unitsLoading: {}, // { [projectId]: boolean }
  
  // Errors
  usersError: null,
  projectsError: null,
  unitsError: null,
  
  // Initialization
  initialized: false,
  currentProjectId: null,

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
   * Since users are now cached per-project, just return them directly
   */
  getUsersByProject: (projectId) => {
    const state = get();
    // If current project matches, return cached users (already filtered)
    if (state.currentProjectId === projectId && state.users.length > 0) {
      return state.users;
    }
    // Otherwise filter (fallback)
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
   * Fetch users for a specific project (with localStorage caching)
   * Now caches users PER PROJECT for efficiency
   */
  fetchUsers: async (forceRefresh = false, projectId = null) => {
    const state = get();
    
    if (!projectId) {
      console.warn('⚠️ AppDataStore: No projectId provided for fetchUsers');
      return [];
    }
    
    // Try to load from localStorage first (unless force refresh)
    // Cache key is project-specific now
    if (!forceRefresh) {
      const cached = dataCacheService.get('users', projectId);
      if (cached && cached.data) {
        console.log(`✅ AppDataStore: Using localStorage cached users for project ${projectId}`, cached.data.length);
        set({ 
          users: cached.data,
          usersLastFetched: cached.timestamp,
          lastRefreshTimestamp: cached.timestamp,
          usersLoading: false,
          currentProjectId: projectId
        });
        return cached.data;
      }
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
      console.log(`📊 AppDataStore: Fetching users for project ${projectId} from Firebase...`);

      // Fetch ALL users first (Firebase doesn't support array-contains with limits efficiently)
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5000) // Increased limit to ensure we get all project users
      );

      const snapshot = await getDocs(usersQuery);
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));

      // Filter users for this specific project
      const projectUsers = allUsers.filter(user => {
        if (user.projects && Array.isArray(user.projects)) {
          return user.projects.some(p => p.projectId === projectId);
        }
        return false;
      });

      console.log(`✅ AppDataStore: Fetched ${projectUsers.length} users for project ${projectId} from Firebase (filtered from ${allUsers.length} total)`);

      const timestamp = Date.now();
      
      // Save to localStorage with project-specific key
      dataCacheService.set('users', projectUsers, projectId);

      set({ 
        users: projectUsers, 
        usersLastFetched: timestamp,
        lastRefreshTimestamp: timestamp,
        usersLoading: false,
        currentProjectId: projectId
      });

      return projectUsers;
    } catch (error) {
      console.error(`❌ AppDataStore: Error fetching users for project ${projectId}:`, error);
      set({ usersError: error.message, usersLoading: false });
      throw error;
    }
  },

  /**
   * Fetch projects (with localStorage caching)
   */
  fetchProjects: async (forceRefresh = false) => {
    const state = get();
    
    // Try to load from localStorage first (unless force refresh)
    if (!forceRefresh) {
      const cached = dataCacheService.get('projects');
      if (cached && cached.data) {
        console.log('✅ AppDataStore: Using localStorage cached projects', cached.data.length);
        set({ 
          projects: cached.data,
          projectsLastFetched: cached.timestamp,
          projectsLoading: false,
          projectCount: cached.data.length
        });
        return cached.data;
      }
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

      console.log(`✅ AppDataStore: Fetched ${projects.length} projects from Firebase`);

      const timestamp = Date.now();
      
      // Save to localStorage
      dataCacheService.set('projects', projects);

      set({ 
        projects, 
        projectsLastFetched: timestamp,
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
   * Fetch ALL units for a specific project (with localStorage caching)
   * Uses pagination to fetch all units in batches of 1000
   * ONLY fetches from Firebase if cache doesn't exist (never re-fetches unless manually refreshed)
   */
  fetchUnits: async (projectId, forceRefresh = false) => {
    console.log(`🔍 AppDataStore.fetchUnits called for project ${projectId}, forceRefresh: ${forceRefresh}`);
    
    if (!projectId) {
      console.warn('⚠️ AppDataStore: No projectId provided for fetchUnits');
      return [];
    }

    const state = get();
    
    // ALWAYS try to load from localStorage first (ignore expiry unless forceRefresh)
    const cached = dataCacheService.get('units', projectId);
    console.log(`💾 Cache check: ${cached ? 'EXISTS' : 'NOT FOUND'}, has data: ${cached?.data ? 'YES (' + cached.data.length + ' units)' : 'NO'}`);
    
    if (cached && cached.data && !forceRefresh) {
      console.log(`✅ AppDataStore: Using localStorage cached units for project ${projectId} (${cached.data.length} units) - No Firebase query`);
      
      const newUnits = { ...state.units };
      newUnits[projectId] = cached.data;
      
      const newUnitsLastFetched = { ...state.unitsLastFetched };
      newUnitsLastFetched[projectId] = cached.timestamp;
      
      set({ 
        units: newUnits,
        unitsLastFetched: newUnitsLastFetched,
        lastRefreshTimestamp: cached.timestamp
      });
      
      return cached.data;
    }
    
    console.log(`🔥 Cache not found or forceRefresh=true, fetching from Firebase...`);
  

    // Already loading? Wait for it
    const loadingState = state.unitsLoading[projectId];
    if (loadingState) {
      console.log(`⏳ AppDataStore: Units for project ${projectId} already loading, waiting...`);
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.unitsLoading[projectId]) {
            clearInterval(checkInterval);
            resolve(currentState.units[projectId] || []);
          }
        }, 100);
      });
    }

    try {
      const newLoadingState = { ...state.unitsLoading };
      newLoadingState[projectId] = true;
      set({ unitsLoading: newLoadingState, unitsError: null });
      
      console.log(`📊 AppDataStore: Fetching ALL units for project ${projectId} from Firestore (cache doesn't exist or force refresh)...`);

      // Fetch ALL units using pagination (1000 at a time)
      let allUnits = [];
      let lastDoc = null;
      let hasMore = true;
      let batchCount = 0;
      const BATCH_SIZE = 1000;

      while (hasMore) {
        batchCount++;
        console.log(`📦 AppDataStore: Fetching units batch ${batchCount}... (lastDoc exists: ${!!lastDoc})`);
        
        let unitsQuery;
        if (lastDoc) {
          // IMPORTANT: orderBy is required for startAfter pagination to work
          unitsQuery = query(
            collection(db, `projects/${projectId}/units`),
            orderBy('__name__'), // Order by document ID
            startAfter(lastDoc),
            limit(BATCH_SIZE)
          );
          console.log(`   Using startAfter with lastDoc ID: ${lastDoc.id}`);
        } else {
          unitsQuery = query(
            collection(db, `projects/${projectId}/units`),
            orderBy('__name__'), // Order by document ID
            limit(BATCH_SIZE)
          );
          console.log(`   First query (no startAfter)`);
        }

        const snapshot = await getDocs(unitsQuery);
        console.log(`   Got ${snapshot.docs.length} documents from Firebase`);
        
        if (snapshot.empty || snapshot.docs.length === 0) {
          console.log(`   Snapshot is empty, stopping pagination`);
          hasMore = false;
          break;
        }

        const batchUnits = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        allUnits = [...allUnits, ...batchUnits];
        
        // Check if there are more documents
        if (snapshot.docs.length < BATCH_SIZE) {
          console.log(`   Got ${snapshot.docs.length} docs (< ${BATCH_SIZE}), no more pages`);
          hasMore = false;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
          console.log(`   Got full batch (${BATCH_SIZE}), continuing with lastDoc: ${lastDoc.id}`);
          hasMore = true;
        }
        
        console.log(`✅ Batch ${batchCount}: Fetched ${batchUnits.length} units (Total: ${allUnits.length})`);
      }

      console.log(`✅ AppDataStore: Fetched ALL ${allUnits.length} units for project ${projectId} from Firebase in ${batchCount} batches`);

      const timestamp = Date.now();
      
      // Save ALL units to localStorage with INFINITE duration (never expires unless manually refreshed)
      dataCacheService.set('units', allUnits, projectId);

      const newUnits = { ...state.units };
      newUnits[projectId] = allUnits;
      
      const newUnitsLastFetched = { ...state.unitsLastFetched };
      newUnitsLastFetched[projectId] = timestamp;
      
      const newLoadingStateDone = { ...state.unitsLoading };
      newLoadingStateDone[projectId] = false;

      set({ 
        units: newUnits,
        unitsLastFetched: newUnitsLastFetched,
        unitsLoading: newLoadingStateDone,
        lastRefreshTimestamp: timestamp
      });

      return allUnits;
    } catch (error) {
      console.error(`❌ AppDataStore: Error fetching units for project ${projectId}:`, error);
      
      const newLoadingState = { ...state.unitsLoading };
      newLoadingState[projectId] = false;
      
      set({ unitsError: error.message, unitsLoading: newLoadingState });
      throw error;
    }
  },

  /**
   * Get units for a specific project from cache
   */
  getUnitsForProject: (projectId) => {
    const state = get();
    return state.units[projectId] || [];
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
   * Initialize app data for a specific project
   * This should be called AFTER project selection
   */
  initializeProjectData: async (projectId) => {
    if (!projectId) {
      console.warn('⚠️ AppDataStore: No projectId provided for initialization');
      return;
    }

    try {
      console.log(`🚀 AppDataStore: Initializing data for project ${projectId}...`);
      
      // Set current project
      set({ currentProjectId: projectId });
      
      // Fetch users and units in parallel
      await Promise.all([
        get().fetchUsers(false, projectId),
        get().fetchUnits(projectId, false)
      ]);

      // Calculate counts
      await get().fetchUserCount();

      set({ initialized: true });
      console.log(`✅ AppDataStore: Initialization complete for project ${projectId}`);
    } catch (error) {
      console.error(`❌ AppDataStore: Initialization failed for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Refresh all data for current project (force fetch from Firebase)
   */
  refreshAllData: async (projectId = null) => {
    const state = get();
    const targetProjectId = projectId || state.currentProjectId;
    
    if (!targetProjectId) {
      console.warn('⚠️ AppDataStore: No projectId available for refresh');
      return;
    }

    console.log(`🔄 AppDataStore: Force refreshing all data for project ${targetProjectId}...`);
    
    try {
      // Clear project-specific cache before refreshing
      dataCacheService.clear('users', targetProjectId);
      dataCacheService.clear('units', targetProjectId);
      
      // Fetch users and units in parallel with force refresh
      await Promise.all([
        get().fetchUsers(true, targetProjectId),
        get().fetchUnits(targetProjectId, true)
      ]);
      
      await get().fetchUserCount(true);
      
      console.log('✅ AppDataStore: All data refreshed from Firebase');
      
      // Return the refresh timestamp for UI display
      return Date.now();
    } catch (error) {
      console.error('❌ AppDataStore: Refresh failed:', error);
      throw error;
    }
  },

  /**
   * Clear all caches (localStorage and memory)
   */
  clearCache: () => {
    dataCacheService.clearAll();
    
    set({
      users: [],
      projects: [],
      units: {},
      usersLastFetched: null,
      projectsLastFetched: null,
      unitsLastFetched: {},
      countsLastFetched: null,
      lastRefreshTimestamp: null,
      initialized: false
    });
    
    console.log('🗑️ AppDataStore: All caches cleared (localStorage + memory)');
  },
  
  /**
   * Get cache metadata for display
   */
  getCacheMetadata: (projectId = null) => {
    const state = get();
    const targetProjectId = projectId || state.currentProjectId;
    
    return {
      lastRefreshTimestamp: state.lastRefreshTimestamp,
      usersCount: state.users.length,
      unitsCount: targetProjectId ? (state.units[targetProjectId] || []).length : 0,
      projectsCount: state.projects.length,
      usersLastFetched: state.usersLastFetched,
      unitsLastFetched: targetProjectId ? state.unitsLastFetched[targetProjectId] : null,
      cacheSize: dataCacheService.getCacheSize()
    };
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

// Note: Auto-refresh has been disabled to reduce costs.
// Use the manual refresh button in the dashboard to fetch fresh data.

export default useAppDataStore;

