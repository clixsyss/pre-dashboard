import React, { useState, useEffect } from 'react';
import { Download, Users, User, CheckCircle, AlertCircle, Search } from 'lucide-react';
import dataExportService from '../services/dataExportService';

const UserDataExport = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const projectId = dataExportService.getCurrentProjectId();
      const projectUsers = await dataExportService.fetchProjectUsers(projectId);
      setUsers(projectUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setExportStatus({
        type: 'error',
        message: `Failed to load users: ${error.message}`
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleExport = async () => {
    if (selectedUsers.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'Please select at least one user to export'
      });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      const results = [];
      
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        const result = await dataExportService.exportUserData(userId, exportFormat);
        results.push({
          userId,
          userName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || userId,
          ...result
        });
      }

      setExportStatus({
        type: 'success',
        message: `Successfully exported data for ${results.length} user(s)`,
        details: results
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export User Data</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select users from your project to export their data including gate passes, orders, bookings, and profile information.
        </p>
      </div>

      {/* Export Status */}
      {exportStatus && (
        <div className={`p-4 rounded-lg border-2 ${
          exportStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {exportStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
          {exportStatus.details && (
            <div className="mt-2 text-sm">
              <p>Exported users:</p>
              <ul className="list-disc list-inside ml-4">
                {exportStatus.details.map((detail, index) => (
                  <li key={index}>
                    {detail.userName} - {detail.summary?.totalRecords || 0} total records
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* User Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Users to Export</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedUsers.length} of {filteredUsers.length} selected
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No users found matching your search.' : 'No users found in this project.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              const displayName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email || 'Unknown User';
              
              return (
                <button
                  key={user.id}
                  onClick={() => handleUserToggle(user.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 ring-offset-2' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <User className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{displayName}</h3>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role && (
                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Format Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Format</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setExportFormat('json')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              exportFormat === 'json'
                ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500 ring-offset-2'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">J</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold">JSON Format</h3>
                <p className="text-sm opacity-75">Structured data, easy to import</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setExportFormat('csv')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              exportFormat === 'csv'
                ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500 ring-offset-2'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">C</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold">CSV Format</h3>
                <p className="text-sm opacity-75">Spreadsheet compatible</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={isExporting || selectedUsers.length === 0}
          className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 ${
            isExporting || selectedUsers.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
          }`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Export Selected Users ({selectedUsers.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Information */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">Export Information</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Each selected user will get separate files for their data</li>
          <li>• Files will be named with the user ID for easy identification</li>
          <li>• Export includes: profile, gate passes, guest passes, orders, and bookings</li>
          <li>• A summary file will be created for each user</li>
          <li>• All timestamps are included in ISO format for easy processing</li>
        </ul>
      </div>
    </div>
  );
};

export default UserDataExport;
