/**
 * Data Cache Service
 * 
 * Handles localStorage caching for users and units data with timestamps.
 * Automatically expires stale data after 24 hours.
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_VERSION = '1.0'; // Increment to invalidate all caches

class DataCacheService {
  constructor() {
    this.storagePrefix = 'pre_dashboard_cache_';
  }

  /**
   * Generate cache key for a specific data type and project
   */
  getCacheKey(dataType, projectId = null) {
    const base = `${this.storagePrefix}${dataType}`;
    return projectId ? `${base}_${projectId}` : base;
  }

  /**
   * Get cached data with expiry check
   * Returns null if cache is invalid or expired
   */
  get(dataType, projectId = null) {
    try {
      const key = this.getCacheKey(dataType, projectId);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        console.log(`📭 DataCache: No cache found for ${dataType}${projectId ? ` (project: ${projectId})` : ''}`);
        return null;
      }

      const parsed = JSON.parse(cached);
      
      // Validate cache structure
      if (!parsed.version || !parsed.timestamp || !parsed.data) {
        console.log(`⚠️ DataCache: Invalid cache structure for ${dataType}, clearing...`);
        this.clear(dataType, projectId);
        return null;
      }

      // Check version
      if (parsed.version !== CACHE_VERSION) {
        console.log(`⚠️ DataCache: Version mismatch for ${dataType}, clearing...`);
        this.clear(dataType, projectId);
        return null;
      }

      // Check expiry
      const age = Date.now() - parsed.timestamp;
      if (age > CACHE_DURATION) {
        console.log(`⏰ DataCache: Cache expired for ${dataType} (age: ${Math.round(age / 1000 / 60)} minutes)`);
        this.clear(dataType, projectId);
        return null;
      }

      console.log(`✅ DataCache: Using cached ${dataType}${projectId ? ` (project: ${projectId})` : ''} - Age: ${Math.round(age / 1000 / 60)} minutes`);
      
      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        projectId: parsed.projectId
      };
    } catch (error) {
      console.error(`❌ DataCache: Error reading cache for ${dataType}:`, error);
      this.clear(dataType, projectId);
      return null;
    }
  }

  /**
   * Set cached data with current timestamp
   */
  set(dataType, data, projectId = null) {
    try {
      const key = this.getCacheKey(dataType, projectId);
      const cacheEntry = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        projectId: projectId,
        data: data
      };

      localStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`💾 DataCache: Cached ${dataType}${projectId ? ` (project: ${projectId})` : ''} - ${Array.isArray(data) ? data.length : 'N/A'} items`);
      
      return true;
    } catch (error) {
      console.error(`❌ DataCache: Error saving cache for ${dataType}:`, error);
      
      // If quota exceeded, try clearing old caches
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ DataCache: Storage quota exceeded, clearing old caches...');
        this.clearAll();
      }
      
      return false;
    }
  }

  /**
   * Clear specific cache entry
   */
  clear(dataType, projectId = null) {
    try {
      const key = this.getCacheKey(dataType, projectId);
      localStorage.removeItem(key);
      console.log(`🗑️ DataCache: Cleared cache for ${dataType}${projectId ? ` (project: ${projectId})` : ''}`);
    } catch (error) {
      console.error(`❌ DataCache: Error clearing cache for ${dataType}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`🗑️ DataCache: Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('❌ DataCache: Error clearing all caches:', error);
    }
  }

  /**
   * Get cache metadata (timestamp, age, etc.)
   */
  getCacheMetadata(dataType, projectId = null) {
    try {
      const key = this.getCacheKey(dataType, projectId);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      const isExpired = age > CACHE_DURATION;
      
      return {
        timestamp: parsed.timestamp,
        age: age,
        ageMinutes: Math.round(age / 1000 / 60),
        ageHours: Math.round(age / 1000 / 60 / 60),
        isExpired: isExpired,
        itemCount: Array.isArray(parsed.data) ? parsed.data.length : null,
        version: parsed.version
      };
    } catch (error) {
      console.error(`❌ DataCache: Error getting metadata for ${dataType}:`, error);
      return null;
    }
  }

  /**
   * Get the most recent cache timestamp across all caches
   */
  getMostRecentCacheTimestamp(projectId = null) {
    try {
      const dataTypes = ['users', 'units', 'projects'];
      const timestamps = [];
      
      dataTypes.forEach(dataType => {
        const metadata = this.getCacheMetadata(dataType, dataType === 'units' ? projectId : null);
        if (metadata && metadata.timestamp) {
          timestamps.push(metadata.timestamp);
        }
      });
      
      if (timestamps.length === 0) {
        return null;
      }
      
      return Math.max(...timestamps);
    } catch (error) {
      console.error('❌ DataCache: Error getting most recent timestamp:', error);
      return null;
    }
  }

  /**
   * Check if any cache needs refresh
   */
  needsRefresh(projectId = null) {
    const dataTypes = ['users', 'units'];
    
    for (const dataType of dataTypes) {
      const metadata = this.getCacheMetadata(dataType, dataType === 'units' ? projectId : null);
      if (!metadata || metadata.isExpired) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get cache size estimate in KB
   */
  getCacheSize() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length * 2; // 2 bytes per character (UTF-16)
        }
      });
      
      return Math.round(totalSize / 1024); // Convert to KB
    } catch (error) {
      console.error('❌ DataCache: Error calculating cache size:', error);
      return 0;
    }
  }
}

// Export singleton instance
const dataCacheServiceInstance = new DataCacheService();
export default dataCacheServiceInstance;

