import React, { useState } from 'react';
import DataExport from '../components/DataExport';
import DataExportDebug from '../components/DataExportDebug';
import { Bug, Download } from 'lucide-react';

const DataExportPage = () => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        {/* Debug Toggle */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex justify-center">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                showDebug
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showDebug ? (
                <>
                  <Download className="h-5 w-5" />
                  <span>Show Export</span>
                </>
              ) : (
                <>
                  <Bug className="h-5 w-5" />
                  <span>Debug Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showDebug ? <DataExportDebug /> : <DataExport />}
      </div>
    </div>
  );
};

export default DataExportPage;
