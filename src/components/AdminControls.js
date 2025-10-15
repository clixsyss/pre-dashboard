import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  AlertTriangle, 
  Save,
  RotateCcw,
  Edit,
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';

const AdminControls = ({ 
  globalSettings, 
  users, 
  onUpdateGlobalLimit, 
  onResetUsage,
  onUpdateUserLimit,
  onBlockUser,
  onUnblockUser,
  projectId
}) => {
  const [activeSection, setActiveSection] = useState('users');
  const [editingGlobalLimit, setEditingGlobalLimit] = useState(false);
  const [newGlobalLimit, setNewGlobalLimit] = useState(globalSettings?.monthlyLimit || 100);
  const [editingUserLimit, setEditingUserLimit] = useState(null);
  const [newUserLimit, setNewUserLimit] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sections = [
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'global', name: 'Global Settings', icon: Settings },
    { id: 'actions', name: 'Bulk Actions', icon: Shield }
  ];

  const handleUpdateGlobalLimit = async () => {
    if (newGlobalLimit && newGlobalLimit !== globalSettings?.monthlyLimit) {
      try {
        await onUpdateGlobalLimit(projectId, newGlobalLimit);
        setEditingGlobalLimit(false);
      } catch (error) {
        console.error('Error updating global limit:', error);
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

      {/* User Management */}
      {activeSection === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Limits & Status</h3>
            <div className="text-sm text-gray-500">
              {users?.length || 0} total users
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                          <p className="text-gray-500">
                            No users have been created for guest passes yet. Users will appear here when they first access the guest pass feature in the mobile app.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.blocked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-900">
                            {user.usedThisMonth} / {user.monthlyLimit}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageColor(user.usedThisMonth, user.monthlyLimit)}`}
                              style={{ width: `${Math.min((user.usedThisMonth / user.monthlyLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserLimit === user.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={newUserLimit}
                              onChange={(e) => setNewUserLimit(e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-pre-red focus:border-transparent"
                              placeholder={user.monthlyLimit}
                            />
                            <button
                              onClick={() => handleUpdateUserLimit(user.id, user.monthlyLimit)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserLimit(null);
                                setNewUserLimit('');
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{user.monthlyLimit}</span>
                            <button
                              onClick={() => {
                                setEditingUserLimit(user.id);
                                setNewUserLimit(user.monthlyLimit.toString());
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {user.blocked ? (
                            <button
                              onClick={() => onUnblockUser && onUnblockUser(projectId, user.id)}
                              className="text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              title="Unblock User"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => onBlockUser && onBlockUser(projectId, user.id)}
                              className="text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
                    setNewGlobalLimit(globalSettings?.monthlyLimit || 100);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {globalSettings?.monthlyLimit || 100} passes
              </div>
            )}
          </div>

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
                    Download all user data and usage statistics
                  </p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="h-4 w-4" />
                  <span>Export</span>
                </button>
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

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Reset</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to reset all users' monthly usage counters? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetUsage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Usage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;
