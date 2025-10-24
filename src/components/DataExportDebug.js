import React, { useState } from 'react';
import { AlertCircle, Bug } from 'lucide-react';
import dataExportService from '../services/dataExportService';

const DataExportDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkData = async () => {
    setIsChecking(true);
    try {
      const projectId = dataExportService.getCurrentProjectId();
      const userId = dataExportService.getCurrentUserId();
      
      console.log('Debug: Project ID:', projectId);
      console.log('Debug: User ID:', userId);
      
      const dataCheck = await dataExportService.checkProjectData(projectId, userId);
      
      setDebugInfo({
        projectId,
        userId,
        dataCheck
      });
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({
        error: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Bug className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Export Debug</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Debug tool to check what data exists in your project and diagnose export issues.
        </p>
      </div>

      {/* Debug Button */}
      <div className="flex justify-center">
        <button
          onClick={checkData}
          disabled={isChecking}
          className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 ${
            isChecking
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
          }`}
        >
          {isChecking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Checking Data...</span>
            </>
          ) : (
            <>
              <Bug className="h-5 w-5" />
              <span>Check Project Data</span>
            </>
          )}
        </button>
      </div>

      {/* Debug Results */}
      {debugInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Results</h2>
          
          {debugInfo.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Error: {debugInfo.error}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Project Information</h3>
                  <p className="text-sm text-blue-800">Project ID: {debugInfo.projectId}</p>
                  <p className="text-sm text-blue-800">User ID: {debugInfo.userId}</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Data Collections</h3>
                  {Object.entries(debugInfo.dataCheck || {}).map(([collection, info]) => (
                    <div key={collection} className="text-sm text-green-800 mb-1">
                      <strong>{collection}:</strong> {info.total} total, {info.userSpecific} for user
                      {info.error && <span className="text-red-600"> (Error: {info.error})</span>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Console Output</h3>
                <p className="text-sm text-yellow-800">
                  Check your browser's developer console (F12) for detailed logging information.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use This Debug Tool</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Check Project Data" to see what data exists in your project</li>
          <li>• Check the browser console (F12) for detailed logging</li>
          <li>• If collections show 0 total items, the project might not have any data</li>
          <li>• If user-specific items are 0, your user ID might not match the data</li>
          <li>• Use this information to understand why exports are empty</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExportDebug;
