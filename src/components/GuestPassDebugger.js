/**
 * Debug component to help identify issues with guest pass data
 * This will show detailed information about what's happening
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bug, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const GuestPassDebugger = ({ projectId }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDebugCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Running guest pass debug check...');
      
      // Get debug info from our debug utility
      const { debugGuestPasses, debugServiceQuery } = await import('../utils/debugGuestPasses');
      
      const debugResult = await debugGuestPasses(projectId);
      const serviceQueryResult = await debugServiceQuery(projectId);
      
      setDebugInfo({
        projectId,
        debugResult,
        serviceQueryResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Debug check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      runDebugCheck();
    }
  }, [projectId, runDebugCheck]);

  if (!projectId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">No project ID available for debugging</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bug className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Guest Pass Debugger</h3>
        </div>
        <button
          onClick={runDebugCheck}
          disabled={loading}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Refresh Debug'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-2">Project Information</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>Collection:</strong> guestPasses</p>
            <p><strong>Last Check:</strong> {debugInfo?.timestamp || 'Never'}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Error: {error}</span>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">Collection Data</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Total Passes in Collection:</strong> {debugInfo.debugResult?.totalPasses || 0}</p>
                <p><strong>Passes for This Project:</strong> {debugInfo.debugResult?.projectPasses?.length || 0}</p>
                <p><strong>Users with Guest Pass Data:</strong> {debugInfo.debugResult?.usersWithGuestPassData || 0}</p>
              </div>
            </div>

            {debugInfo.debugResult?.projectPasses?.length > 0 && (
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-900 mb-2">Project Passes Found</h4>
                <div className="space-y-2">
                  {debugInfo.debugResult.projectPasses.map((pass, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>ID:</strong> {pass.id}</div>
                        <div><strong>User:</strong> {pass.userName}</div>
                        <div><strong>Status:</strong> {pass.sentStatus ? 'Sent' : 'Pending'}</div>
                        <div><strong>Created:</strong> {pass.createdAt?.toLocaleString() || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.debugResult?.projectPasses?.length === 0 && debugInfo.debugResult?.totalPasses > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-yellow-800 font-semibold">Project ID Mismatch Detected</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Found {debugInfo.debugResult.totalPasses} passes in the collection, but none match project ID "{projectId}".
                      Check the console for details about the actual project IDs being used.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {debugInfo.debugResult?.totalPasses === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-blue-800 font-semibold">No Passes Found</p>
                    <p className="text-blue-700 text-sm mt-1">
                      The guestPasses collection is empty. This is normal if no passes have been created yet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">Service Query Result</h4>
              <div className="text-sm text-gray-600">
                {debugInfo.serviceQueryResult?.error ? (
                  <div className="text-red-600">
                    <p><strong>Error:</strong> {debugInfo.serviceQueryResult.error}</p>
                    {debugInfo.serviceQueryResult.error.includes('failed-precondition') && (
                      <p className="mt-2 text-xs">
                        This is likely a Firestore indexing issue. You need to create an index for:
                        <br />
                        Collection: guestPasses
                        <br />
                        Fields: projectId (Ascending), createdAt (Descending)
                      </p>
                    )}
                  </div>
                ) : (
                  <p><strong>Passes Found:</strong> {Array.isArray(debugInfo.serviceQueryResult) ? debugInfo.serviceQueryResult.length : 'Unknown'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestPassDebugger;
