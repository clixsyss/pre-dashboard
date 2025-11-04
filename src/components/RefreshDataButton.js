import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppDataStore } from '../stores/appDataStore';

/**
 * RefreshDataButton Component
 * 
 * Displays a button to manually refresh cached data with a "Last updated X ago" indicator.
 * Shows loading state during refresh and updates automatically every minute.
 */
const RefreshDataButton = ({ projectId, className = '' }) => {
  const { refreshAllData, getCacheMetadata } = useAppDataStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState('');
  const [error, setError] = useState(null);

  // Calculate and update "Last updated X ago" text
  const updateLastUpdatedText = useCallback(() => {
    const metadata = getCacheMetadata(projectId);
    
    if (!metadata || !metadata.lastRefreshTimestamp) {
      setLastUpdatedText('Never updated');
      return;
    }

    const now = Date.now();
    const diff = now - metadata.lastRefreshTimestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      setLastUpdatedText('Just now');
    } else if (minutes === 1) {
      setLastUpdatedText('1 minute ago');
    } else if (minutes < 60) {
      setLastUpdatedText(`${minutes} minutes ago`);
    } else if (hours === 1) {
      setLastUpdatedText('1 hour ago');
    } else if (hours < 24) {
      setLastUpdatedText(`${hours} hours ago`);
    } else if (days === 1) {
      setLastUpdatedText('1 day ago');
    } else {
      setLastUpdatedText(`${days} days ago`);
    }
  }, [projectId, getCacheMetadata]);

  // Update text on mount and every minute
  useEffect(() => {
    updateLastUpdatedText();
    const interval = setInterval(updateLastUpdatedText, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateLastUpdatedText]);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing || !projectId) return;

    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🔄 RefreshDataButton: Starting manual refresh...');
      await refreshAllData(projectId);
      updateLastUpdatedText();
      console.log('✅ RefreshDataButton: Refresh completed successfully');
    } catch (err) {
      console.error('❌ RefreshDataButton: Refresh failed:', err);
      setError('Failed to refresh data');
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Last updated text */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Last updated:</span>{' '}
        <span className="text-gray-500">{lastUpdatedText}</span>
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || !projectId}
        className={`
          flex items-center gap-2 px-4 py-2 
          rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isRefreshing
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-pre-red text-white hover:bg-red-700 active:scale-95 shadow-sm hover:shadow-md'
          }
        `}
        title="Refresh all data from Firebase"
      >
        <RefreshCw 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
      </button>

      {/* Error message */}
      {error && (
        <div className="text-red-600 text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};

export default RefreshDataButton;

