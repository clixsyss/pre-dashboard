/**
 * Firestore Query Optimization Utilities
 * 
 * This module provides optimized query functions with built-in pagination,
 * caching, and limits to reduce Firebase read costs.
 */

import { collection, getDocs, query, limit, startAfter, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// In-memory cache with timestamps
const queryCache = new Map();
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (extended for cost optimization)
const DEFAULT_PAGE_SIZE = 50;

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > value.duration) {
      queryCache.delete(key);
    }
  }
}

/**
 * Generate cache key from query parameters
 */
function generateCacheKey(collectionPath, options = {}) {
  return `${collectionPath}_${JSON.stringify(options)}`;
}

/**
 * Get data from cache if valid
 */
function getFromCache(cacheKey) {
  const cached = queryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < cached.duration) {
    console.log(`✅ Cache hit for: ${cacheKey}`);
    return cached.data;
  }
  return null;
}

/**
 * Store data in cache
 */
function setCache(cacheKey, data, duration = DEFAULT_CACHE_DURATION) {
  queryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    duration
  });
}

/**
 * Clear specific cache entry or all cache
 */
export function clearCache(cacheKey = null) {
  if (cacheKey) {
    queryCache.delete(cacheKey);
  } else {
    queryCache.clear();
  }
}

/**
 * Fetch users with pagination and caching
 * @param {Object} options - Query options
 * @param {number} options.pageSize - Number of items per page (default: 50)
 * @param {Object} options.lastDoc - Last document for pagination
 * @param {string} options.projectId - Filter by project ID
 * @param {boolean} options.useCache - Use cache (default: true)
 * @param {number} options.cacheDuration - Cache duration in ms
 * @returns {Promise<{users: Array, lastDoc: Object, hasMore: boolean}>}
 */
export async function fetchUsersPaginated(options = {}) {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    lastDoc = null,
    projectId = null,
    useCache = true,
    cacheDuration = DEFAULT_CACHE_DURATION
  } = options;

  const cacheKey = generateCacheKey('users', { pageSize, lastDoc: lastDoc?.id, projectId });

  // Check cache first
  if (useCache && !lastDoc) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    console.log(`📊 Fetching users (limit: ${pageSize}, projectId: ${projectId || 'all'})`);

    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // Fetch one extra to check if there are more
    );

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const users = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      lastLoginAt: doc.data().lastLoginAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null
    }));

    // Filter by project if needed (client-side since we can't compound index easily)
    let filteredUsers = users;
    if (projectId) {
      filteredUsers = users.filter(user => 
        user.projects?.some(p => p.projectId === projectId)
      );
    }

    const result = {
      users: filteredUsers,
      lastDoc: docs[docs.length - 1],
      hasMore,
      total: snapshot.size
    };

    // Cache the first page only
    if (!lastDoc && useCache) {
      setCache(cacheKey, result, cacheDuration);
    }

    console.log(`✅ Fetched ${filteredUsers.length} users (hasMore: ${hasMore})`);
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Fetch users count efficiently (with caching)
 */
export async function fetchUsersCount(options = {}) {
  const {
    projectId = null,
    useCache = true,
    cacheDuration = 10 * 60 * 1000 // 10 minutes for counts
  } = options;

  const cacheKey = generateCacheKey('users_count', { projectId });

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    // For accurate counts, we need to fetch all users
    // In production, use Firestore aggregation queries or Cloud Functions
    console.log('⚠️ Fetching user count - consider using Firestore aggregation queries');
    
    const snapshot = await getDocs(collection(db, 'users'));
    let count = snapshot.size;

    // Filter by project if needed
    if (projectId) {
      count = snapshot.docs.filter(doc => {
        const userData = doc.data();
        return userData.projects?.some(p => p.projectId === projectId);
      }).length;
    }

    if (useCache) {
      setCache(cacheKey, count, cacheDuration);
    }

    return count;
  } catch (error) {
    console.error('Error fetching user count:', error);
    throw error;
  }
}

/**
 * Fetch projects with caching
 */
export async function fetchProjectsCached(options = {}) {
  const {
    useCache = true,
    cacheDuration = 10 * 60 * 1000 // 10 minutes
  } = options;

  const cacheKey = generateCacheKey('projects', {});

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    console.log('📊 Fetching projects');
    const snapshot = await getDocs(collection(db, 'projects'));
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (useCache) {
      setCache(cacheKey, projects, cacheDuration);
    }

    console.log(`✅ Fetched ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Fetch collection with pagination
 * Generic function for any collection
 */
export async function fetchCollectionPaginated(collectionPath, options = {}) {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    lastDoc = null,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    whereConditions = [], // Array of {field, operator, value}
    useCache = true,
    cacheDuration = DEFAULT_CACHE_DURATION
  } = options;

  const cacheKey = generateCacheKey(collectionPath, { 
    pageSize, 
    lastDoc: lastDoc?.id, 
    orderByField,
    orderDirection,
    whereConditions 
  });

  // Check cache first
  if (useCache && !lastDoc) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    console.log(`📊 Fetching ${collectionPath} (limit: ${pageSize})`);

    // Build query
    let constraints = [];
    
    // Add where conditions
    whereConditions.forEach(({ field, operator, value }) => {
      constraints.push(where(field, operator, value));
    });

    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));

    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Add limit
    constraints.push(limit(pageSize + 1));

    const q = query(collection(db, collectionPath), ...constraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const items = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = {
      items,
      lastDoc: docs[docs.length - 1],
      hasMore,
      total: snapshot.size
    };

    // Cache the first page only
    if (!lastDoc && useCache) {
      setCache(cacheKey, result, cacheDuration);
    }

    console.log(`✅ Fetched ${items.length} items from ${collectionPath} (hasMore: ${hasMore})`);
    return result;
  } catch (error) {
    console.error(`Error fetching ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Search users with optimized query
 * Fetches limited data and filters client-side
 */
export async function searchUsers(searchTerm, field = 'all', pageSize = 50) {
  try {
    // Fetch limited set of users
    const { users } = await fetchUsersPaginated({ 
      pageSize: 200, // Fetch more for search but still limited
      useCache: false // Don't cache search results
    });

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
          // Search in all fields
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
    }).slice(0, pageSize); // Limit results
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

// Clear expired cache periodically
setInterval(clearExpiredCache, 60 * 1000); // Every minute

const firestoreOptimization = {
  fetchUsersPaginated,
  fetchUsersCount,
  fetchProjectsCached,
  fetchCollectionPaginated,
  searchUsers,
  clearCache
};

export default firestoreOptimization;

