import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  AlertTriangle, 
  RotateCcw,
  Edit,
  Plus,
  Check,
  X,
  Search,
  UserCog,
  RefreshCcw,
  Clock
} from 'lucide-react';
import ExportButton from './ExportButton';

const AdminControls = ({ 
  globalSettings, 
  users, 
  onUpdateGlobalLimit, 
  onUpdateValidityDuration,
  onResetUsage,
  onUpdateUserLimit,
  onBlockUser,
  onUnblockUser,
  onToggleBlockAll,
  projectId,
  hideUserControls = false // NEW: Hide per-user sections when true
}) => {
  const [activeSection, setActiveSection] = useState(hideUserControls ? 'global' : 'users');
  const [editingGlobalLimit, setEditingGlobalLimit] = useState(false);
  const [newGlobalLimit, setNewGlobalLimit] = useState(globalSettings?.monthlyLimit || 30);
  const [editingValidityDuration, setEditingValidityDuration] = useState(false);
  const [newValidityDuration, setNewValidityDuration] = useState(globalSettings?.validityDurationHours || 2);
  const [editingUserLimit, setEditingUserLimit] = useState(null);
  const [newUserLimit, setNewUserLimit] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  // Only show sections based on hideUserControls
  const sections = hideUserControls ? [
    { id: 'global', name: 'Global Settings', icon: Settings },
    { id: 'actions', name: 'Bulk Actions', icon: Shield }
  ] : [
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'global', name: 'Global Settings', icon: Settings },
    { id: 'actions', name: 'Bulk Actions', icon: Shield }
  ];

  const handleUpdateGlobalLimit = async () => {
    if (newGlobalLimit && newGlobalLimit !== globalSettings?.monthlyLimit) {
      try {
        // Convert to number before saving to Firestore
        const limitAsNumber = parseInt(newGlobalLimit, 10);
        if (isNaN(limitAsNumber) || limitAsNumber < 0) {
          console.error('Invalid limit value:', newGlobalLimit);
          return;
        }
        await onUpdateGlobalLimit(projectId, limitAsNumber);
        setEditingGlobalLimit(false);
      } catch (error) {
        console.error('Error updating global limit:', error);
      }
    }
  };

  const handleUpdateValidityDuration = async () => {
    if (newValidityDuration && newValidityDuration !== globalSettings?.validityDurationHours) {
      try {
        // Convert to number before saving to Firestore
        const durationAsNumber = parseFloat(newValidityDuration);
        if (isNaN(durationAsNumber) || durationAsNumber <= 0) {
          console.error('Invalid validity duration value:', newValidityDuration);
          return;
        }
        await onUpdateValidityDuration(projectId, durationAsNumber);
        setEditingValidityDuration(false);
      } catch (error) {
        console.error('Error updating validity duration:', error);
      }
    }
  };

  const handleUpdateUserLimit = async (userId, currentLimit) => {
    if (newUserLimit && parseInt(newUserLimit) !== currentLimit) {
      try {
        await onUpdateUserLimit(projectId, userId, parseInt(newUserLimit));
        setEditingUserLimit(null);
        setNewUserLimit('');
      } catch (error) {
        console.error('Error updating user limit:', error);
      }
    }
  };

  const handleResetToDefault = async (userId) => {
    if (!globalSettings?.monthlyLimit) {
      console.error('No global limit set');
      return;
    }
    const defaultLimit = globalSettings.monthlyLimit;
    try {
      await onUpdateUserLimit(projectId, userId, defaultLimit);
    } catch (error) {
      console.error('Error resetting user limit to default:', error);
    }
  };

  const handleResetAllToDefault = async () => {
    if (!globalSettings?.monthlyLimit) {
      console.error('No global limit set');
      return;
    }
    
    const defaultLimit = globalSettings.monthlyLimit;
    const usersWithCustomLimits = users.filter(user => {
      const hasCustomLimit = user.monthlyLimit !== undefined && 
                            user.monthlyLimit !== null && 
                            user.monthlyLimit !== defaultLimit;
      return hasCustomLimit;
    });

    if (usersWithCustomLimits.length === 0) return;

    try {
      // Reset all users with custom limits
      for (const user of usersWithCustomLimits) {
        await onUpdateUserLimit(projectId, user.id, defaultLimit);
      }
      setShowResetAllConfirm(false);
    } catch (error) {
      console.error('Error resetting all limits to default:', error);
    }
  };

  const handleResetUsage = async () => {
    try {
      await onResetUsage(projectId);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  };

  const getUsageColor = (used, limit) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users || !globalSettings?.monthlyLimit) return [];

    let filtered = [...users];
    const defaultLimit = globalSettings.monthlyLimit;

    if (searchTerm.trim()) {
      // When searching, show ALL matching users (so you can set custom limits for anyone)
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // When NOT searching, show ONLY users with custom limits
      filtered = filtered.filter(user => {
        const hasCustomLimit = user.monthlyLimit !== undefined && 
                              user.monthlyLimit !== null && 
                              user.monthlyLimit !== defaultLimit;
        return hasCustomLimit;
      });
    }

    return filtered;
  }, [users, searchTerm, globalSettings?.monthlyLimit]);

  // Count users with custom limits
  const customLimitCount = useMemo(() => {
    if (!users || !globalSettings?.monthlyLimit) return 0;
    const defaultLimit = globalSettings.monthlyLimit;
    
    const customUsers = users.filter(user => {
      // Only count as custom if the limit is explicitly different from global
      const hasCustomLimit = user.monthlyLimit !== undefined && 
                            user.monthlyLimit !== null && 
                            user.monthlyLimit !== defaultLimit;
      return hasCustomLimit;
    });
    
    console.log('🔍 Custom Limit Detection:', {
      defaultLimit,
      totalUsers: users.length,
      customUsersCount: customUsers.length,
      allUserLimits: users.map(u => ({ 
        name: u.name, 
        limit: u.monthlyLimit,
        isCustom: u.monthlyLimit !== defaultLimit 
      }))
    });
    
    return customUsers.length;
  }, [users, globalSettings?.monthlyLimit]);

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white text-pre-red shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <section.icon className="h-4 w-4" />
            <span>{section.name}</span>
          </button>
        ))}
      </div>

      {/* User Management - HIDDEN when hideUserControls is true */}
      {!hideUserControls && activeSection === 'users' && (
        <div className="space-y-6">
          {/* DEPRECATED NOTICE */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900">Per-User Controls Deprecated</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This feature is being phased out. Please use <strong>Unit Management</strong> instead. 
                  All family members in the same unit should share one limit.
                </p>
              </div>
            </div>
          </div>
          
          {/* Header with Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-pre-red" />
                User Limits & Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {users?.length || 0} total users · {customLimitCount} with custom limits
              </p>
            </div>
            {customLimitCount > 0 && (
              <button
                onClick={() => setShowResetAllConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                title={`Reset all ${customLimitCount} users to default limit (${globalSettings?.monthlyLimit || 10})`}
              >
                <RefreshCcw className="h-4 w-4" />
                <span>Reset All to Default ({customLimitCount})</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users with custom limits by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pre-red focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all duration-200 flex items-center space-x-2"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Info Banner */}
            <div className="mt-4 flex items-center space-x-2 text-sm">
              <UserCog className="h-4 w-4 text-pre-red" />
              <span className="text-gray-700">
                {searchTerm ? (
                  <>Search results from <span className="font-semibold text-gray-900">all users</span></>
                ) : (
                  <>Showing only users with <span className="font-semibold text-pre-red">custom pass limits</span></>
                )}
              </span>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {searchTerm ? (
                <>
                  Found <span className="font-semibold text-gray-900">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''} with custom limits
                </>
              )}
            </span>
            {filteredUsers.length === 0 && searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-pre-red hover:text-red-700 font-medium flex items-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Clear search</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          {searchTerm ? (
                            <>
                              <Search className="h-16 w-16 text-gray-300 mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                              <p className="text-gray-500 mb-4 max-w-md">
                                No users found matching "{searchTerm}". Try a different search term.
                              </p>
                              <button
                                onClick={() => setSearchTerm('')}
                                className="px-4 py-2 bg-pre-red text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
                              >
                                <X className="h-4 w-4" />
                                <span>Clear Search</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <UserCog className="h-16 w-16 text-gray-300 mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Limits Set</h3>
                              <p className="text-gray-500 max-w-md mb-2">
                                All users are currently using the default global limit of <span className="font-semibold text-gray-900">{globalSettings?.monthlyLimit || 10} passes</span>.
                              </p>
                              <p className="text-sm text-gray-400">
                                Click the edit icon next to a user's limit to set a custom value.
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          user.blocked 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            user.blocked ? 'bg-red-500' : 'bg-green-500'
                          }`}></span>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.usedThisMonth} / {user.monthlyLimit}
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2.5 shadow-inner">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-500 ${getUsageColor(user.usedThisMonth, user.monthlyLimit)}`}
                              style={{ width: `${Math.min((user.usedThisMonth / user.monthlyLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            {Math.round((user.usedThisMonth / user.monthlyLimit) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserLimit === user.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={newUserLimit}
                              onChange={(e) => setNewUserLimit(e.target.value)}
                              className="w-20 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                              placeholder={user.monthlyLimit}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateUserLimit(user.id, user.monthlyLimit)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserLimit(null);
                                setNewUserLimit('');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{user.monthlyLimit}</span>
                              {globalSettings?.monthlyLimit && user.monthlyLimit !== globalSettings.monthlyLimit && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pre-red bg-opacity-10 text-pre-red border border-pre-red border-opacity-20">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setEditingUserLimit(user.id);
                                setNewUserLimit(user.monthlyLimit.toString());
                              }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit limit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              {globalSettings?.monthlyLimit && user.monthlyLimit !== globalSettings.monthlyLimit && (
                                <button
                                  onClick={() => handleResetToDefault(user.id)}
                                  className="p-1.5 text-orange-500 hover:text-white hover:bg-orange-500 rounded-lg transition-all duration-200"
                                  title={`Reset to default (${globalSettings.monthlyLimit})`}
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                            </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {user.blocked ? (
                            <button
                              onClick={() => onUnblockUser && onUnblockUser(projectId, user.id)}
                              className="px-3 py-1.5 text-green-600 hover:text-white bg-green-50 hover:bg-green-600 border border-green-200 hover:border-green-600 rounded-lg transition-all duration-200 font-medium"
                              title="Unblock User"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => onBlockUser && onBlockUser(projectId, user.id)}
                              className="px-3 py-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all duration-200 font-medium"
                              title="Block User"
                            >
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Settings */}
      {activeSection === 'global' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Global Monthly Limit</h3>
                <p className="text-sm text-gray-500">Default limit for all users</p>
              </div>
              {!editingGlobalLimit && (
                <button
                  onClick={() => setEditingGlobalLimit(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {editingGlobalLimit ? (
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={newGlobalLimit}
                  onChange={(e) => setNewGlobalLimit(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                  placeholder="Enter new limit"
                />
                <button
                  onClick={handleUpdateGlobalLimit}
                  className="flex items-center space-x-2 px-4 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setEditingGlobalLimit(false);
                    setNewGlobalLimit(globalSettings?.monthlyLimit || 10);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {globalSettings?.monthlyLimit || 10} passes
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Guest Pass Validity Duration</h3>
                <p className="text-sm text-gray-500">How long guest passes remain valid after creation</p>
              </div>
              {!editingValidityDuration && (
                <button
                  onClick={() => setEditingValidityDuration(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {editingValidityDuration ? (
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newValidityDuration}
                  onChange={(e) => setNewValidityDuration(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                  placeholder="Enter duration in hours"
                />
                <button
                  onClick={handleUpdateValidityDuration}
                  className="flex items-center space-x-2 px-4 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setEditingValidityDuration(false);
                    setNewValidityDuration(globalSettings?.validityDurationHours || 2);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {globalSettings?.validityDurationHours || 2} hours
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Guest passes expire {globalSettings?.validityDurationHours || 2} hours after generation
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COMMENTED OUT: Block All Users - now shown in parent page Global Settings tab
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Block All Users</h3>
                <p className="text-sm text-gray-500">Prevent all users from generating guest passes</p>
              </div>
              <button
                onClick={() => onToggleBlockAll && onToggleBlockAll(projectId, !globalSettings?.blockAllUsers)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  globalSettings?.blockAllUsers 
                    ? 'bg-red-600 focus:ring-red-500' 
                    : 'bg-gray-300 focus:ring-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                    globalSettings?.blockAllUsers ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {globalSettings?.blockAllUsers ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">All Guest Pass Generation Blocked</p>
                    <p className="text-sm text-red-700 mt-1">
                      No users can currently generate guest passes. Individual user blocks still apply.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Users can generate guest passes according to their individual limits and block status.
                </p>
              </div>
            )}
          </div>
          */}

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Auto Reset</p>
                  <p className="text-sm text-gray-500">Reset usage on 1st of month</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                  </div>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Allow Overrides</p>
                  <p className="text-sm text-gray-500">Admins can override limits</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                  </div>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {activeSection === 'actions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Perform administrative actions that affect multiple users or the entire system.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Reset Monthly Usage</h4>
                  <p className="text-sm text-red-700">
                    Reset all users' monthly usage counters to zero
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Usage</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900">Export User Data</h4>
                  <p className="text-sm text-blue-700">
                    Download all user data and usage statistics as CSV
                  </p>
                </div>
                <ExportButton dataType="all" className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-900">Send Usage Reminders</h4>
                  <p className="text-sm text-green-700">
                    Notify users approaching their monthly limits
                  </p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Send Reminders</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Usage Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Reset Usage</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to reset all users' monthly usage counters to zero? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetUsage}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Reset Usage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Limits to Default Confirmation Modal */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <RefreshCcw className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reset Custom Limits?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">
              This will reset <span className="font-semibold text-gray-900">{customLimitCount} users</span> with custom limits back to the default limit of <span className="font-semibold text-orange-600">{globalSettings?.monthlyLimit || 10} passes</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Previous custom limits will be lost.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetAllConfirm(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllToDefault}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Reset All ({customLimitCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;
