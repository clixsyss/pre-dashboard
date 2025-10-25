import React, { useState } from 'react';
import DataExport from '../components/DataExport';
import DataExportDebug from '../components/DataExportDebug';
import UserDataExport from '../components/UserDataExport';
import { Bug, Users, User } from 'lucide-react';

const DataExportPage = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'users', 'debug'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Admin Data</span>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'users'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>User Data</span>
            </button>
            
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'debug'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Bug className="h-5 w-5" />
              <span>Debug</span>
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'admin' && <DataExport />}
        {activeTab === 'users' && <UserDataExport />}
        {activeTab === 'debug' && <DataExportDebug />}
      </div>
    </div>
  );
};

export default DataExportPage;
