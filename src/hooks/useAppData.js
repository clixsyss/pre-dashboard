/**
 * useAppData Hook
 * 
 * Easy-to-use hook for accessing centralized app data
 * Components should use this instead of fetching data directly
 */

import { useAppDataStore } from '../stores/appDataStore';
import { useEffect, useState } from 'react';

/**
 * Get users with automatic initialization
 */
export const useUsers = (options = {}) => {
  const { 
    projectId = null,
    searchTerm = '',
    searchField = 'all',
    autoFetch = true
  } = options;

  const { 
    users, 
    usersLoading, 
    usersError, 
    fetchUsers,
    getUsersByProject,
    searchUsers: searchUsersStore 
  } = useAppDataStore();

  const [filteredUsers, setFilteredUsers] = useState([]);

  // Auto-fetch on mount if needed
  useEffect(() => {
    if (autoFetch && users.length === 0 && !usersLoading) {
      fetchUsers();
    }
  }, [autoFetch, users.length, usersLoading, fetchUsers]);

  // Apply filters
  useEffect(() => {
    let result = users;

    // Filter by project
    if (projectId) {
      result = getUsersByProject(projectId);
    }

    // Apply search
    if (searchTerm) {
      result = result.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        switch (searchField) {
          case 'name':
            const fullName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.toLowerCase()
              : user.fullName?.toLowerCase() || '';
            return fullName.includes(searchLower);
          
          case 'email':
            return user.email?.toLowerCase().includes(searchLower);
          
          case 'mobile':
            return user.mobile?.includes(searchTerm);
          
          default:
            const name = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.toLowerCase()
              : user.fullName?.toLowerCase() || '';
            return (
              name.includes(searchLower) ||
              user.email?.toLowerCase().includes(searchLower) ||
              user.mobile?.includes(searchTerm)
            );
        }
      });
    }

    setFilteredUsers(result);
  }, [users, projectId, searchTerm, searchField, getUsersByProject]);

  return {
    users: filteredUsers,
    allUsers: users,
    loading: usersLoading,
    error: usersError,
    refresh: () => fetchUsers(true),
    count: filteredUsers.length,
    totalCount: users.length
  };
};

/**
 * Get projects with automatic initialization
 */
export const useProjects = (options = {}) => {
  const { autoFetch = true } = options;

  const { 
    projects, 
    projectsLoading, 
    projectsError, 
    fetchProjects 
  } = useAppDataStore();

  // Auto-fetch on mount if needed
  useEffect(() => {
    if (autoFetch && projects.length === 0 && !projectsLoading) {
      fetchProjects();
    }
  }, [autoFetch, projects.length, projectsLoading, fetchProjects]);

  return {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refresh: () => fetchProjects(true),
    count: projects.length
  };
};

/**
 * Get user count
 */
export const useUserCount = () => {
  const { userCount, fetchUserCount } = useAppDataStore();

  useEffect(() => {
    if (userCount === 0) {
      fetchUserCount();
    }
  }, [userCount, fetchUserCount]);

  return {
    count: userCount,
    refresh: () => fetchUserCount(true)
  };
};

/**
 * Get project count
 */
export const useProjectCount = () => {
  const { projectCount, fetchProjects } = useAppDataStore();

  useEffect(() => {
    if (projectCount === 0) {
      fetchProjects();
    }
  }, [projectCount, fetchProjects]);

  return {
    count: projectCount
  };
};

/**
 * Search users from cache
 */
export const useUserSearch = (searchTerm, searchField = 'all') => {
  const { searchUsers, users, usersLoading } = useAppDataStore();
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      const searchResults = searchUsers(searchTerm, searchField);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [searchTerm, searchField, users, searchUsers]);

  return {
    results,
    loading: usersLoading,
    count: results.length
  };
};

/**
 * Initialize app data (call once in App.js or Layout)
 */
export const useAppDataInitialization = () => {
  const { initialized, initializeAppData } = useAppDataStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialized && !loading) {
      setLoading(true);
      initializeAppData()
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [initialized, loading, initializeAppData]);

  return {
    initialized,
    loading,
    error
  };
};

export default {
  useUsers,
  useProjects,
  useUserCount,
  useProjectCount,
  useUserSearch,
  useAppDataInitialization
};

