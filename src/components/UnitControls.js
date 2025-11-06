import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  Search, 
  X, 
  Check, 
  Edit2, 
  RefreshCcw,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Ban,
  CheckCircle,
  Users,
  User
} from 'lucide-react';
import { sendStatusNotification } from '../services/statusNotificationService';

const UnitControls = ({
  units = [],
  globalSettings = {},
  onUpdateUnitLimit,
  onBlockUnit,
  onUnblockUnit,
  onResetUnitToDefault,
  projectId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUnitLimit, setEditingUnitLimit] = useState(null);
  const [newUnitLimit, setNewUnitLimit] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [sendingNotification, setSendingNotification] = useState(null);
  const [showUserNotificationModal, setShowUserNotificationModal] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any dropdown
      if (!event.target.closest('.user-notification-dropdown')) {
        setShowUserNotificationModal(null);
      }
    };

    if (showUserNotificationModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserNotificationModal]);

  // Filter and search units
  const filteredUnits = useMemo(() => {
    if (!units) return [];

    let filtered = [...units];
    const defaultLimit = globalSettings.monthlyLimit || 30;

    if (searchTerm.trim()) {
      // When searching, show ALL matching units
      filtered = filtered.filter(unit => 
        unit.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.users?.some(u => 
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      // When NOT searching, show ONLY units with custom limits or blocked units
      filtered = filtered.filter(unit => {
        const hasCustomLimit = unit.monthlyLimit !== undefined && 
                              unit.monthlyLimit !== null && 
                              unit.monthlyLimit !== defaultLimit;
        return hasCustomLimit || unit.blocked;
      });
    }

    return filtered.sort((a, b) => a.unit.localeCompare(b.unit));
  }, [units, searchTerm, globalSettings?.monthlyLimit]);

  // Count units with custom limits or blocked
  const customUnitsCount = useMemo(() => {
    if (!units || !globalSettings?.monthlyLimit) return 0;
    const defaultLimit = globalSettings.monthlyLimit;
    
    return units.filter(unit => {
      const hasCustomLimit = unit.monthlyLimit !== undefined && 
                            unit.monthlyLimit !== null && 
                            unit.monthlyLimit !== defaultLimit;
      return hasCustomLimit || unit.blocked;
    }).length;
  }, [units, globalSettings?.monthlyLimit]);

  const handleEditUnitLimit = (unit) => {
    setEditingUnitLimit(unit.unit);
    setNewUnitLimit(unit.monthlyLimit || globalSettings.monthlyLimit || 30);
  };

  const handleSaveUnitLimit = async () => {
    if (!editingUnitLimit || !newUnitLimit) return;
    
    try {
      const limit = parseInt(newUnitLimit, 10);
      if (isNaN(limit) || limit < 0) {
        alert('Please enter a valid number');
        return;
      }
      
      await onUpdateUnitLimit(projectId, editingUnitLimit, limit);
      setEditingUnitLimit(null);
      setNewUnitLimit('');
    } catch (error) {
      console.error('Error saving unit limit:', error);
      alert('Failed to update unit limit');
    }
  };

  const handleBlockUnit = async (unit, currentlyBlocked) => {
    if (currentlyBlocked) {
      // Unblock immediately
      await onUnblockUnit(projectId, unit);
      setShowBlockConfirm(null);
    } else {
      // Show confirmation dialog for blocking
      setShowBlockConfirm(unit);
      setBlockReason('');
    }
  };

  const confirmBlockUnit = async () => {
    if (!showBlockConfirm) return;
    
    try {
      await onBlockUnit(projectId, showBlockConfirm, blockReason || 'Blocked by admin');
      setShowBlockConfirm(null);
      setBlockReason('');
    } catch (error) {
      console.error('Error blocking unit:', error);
      alert('Failed to block unit');
    }
  };

  const getUsageColor = (used, limit) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Generate user-friendly message about guest pass consumption
  const generateUsageMessage = (unit, user = null) => {
    // Use individual user's usage if provided, otherwise use unit total
    const used = user ? (user.usedThisMonth || 0) : (unit.usedThisMonth || 0);
    const limit = unit.monthlyLimit || globalSettings.monthlyLimit || 30;
    const remaining = limit - used;
    const percentage = Math.round((used / limit) * 100);
    
    const unitName = unit.unit;
    const userName = user ? user.name : 'Residents';
    const usageContext = user ? 'you have' : 'your unit has';
    const usageContextAr = user ? 'لقد استخدمت' : 'لقد استخدمت وحدتك';
    
    let message = '';
    let messageAr = '';
    
    if (remaining <= 0) {
      message = `Dear ${userName}, ${usageContext} reached the monthly guest pass limit of ${limit} passes. No more guest passes can be issued this month.`;
      messageAr = `عزيزي ${userName}، ${usageContextAr} الحد الأقصى الشهري لتصاريح الضيوف البالغ ${limit} تصريح. لا يمكن إصدار المزيد من تصاريح الضيوف هذا الشهر.`;
    } else if (remaining <= 3) {
      message = `Dear ${userName}, ${usageContext} used ${used} out of ${limit} guest passes this month. Only ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining. Please use them wisely.`;
      messageAr = `عزيزي ${userName}، ${usageContextAr} ${used} من أصل ${limit} تصريح ضيف هذا الشهر. بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''} فقط. يرجى استخدامها بحكمة.`;
    } else if (percentage >= 75) {
      message = `Dear ${userName}, ${usageContext} used ${used} out of ${limit} guest passes this month (${percentage}% used). ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining.`;
      messageAr = `عزيزي ${userName}، ${usageContextAr} ${used} من أصل ${limit} تصريح ضيف هذا الشهر (${percentage}% مستخدم). بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''}.`;
    } else {
      message = `Dear ${userName}, ${usageContext} used ${used} out of ${limit} guest passes this month. ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining.`;
      messageAr = `عزيزي ${userName}، ${usageContextAr} ${used} من أصل ${limit} تصريح ضيف هذا الشهر. بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''}.`;
    }
    
    return { message, messageAr };
  };

  // Send notification to all users in a unit
  const handleSendUnitNotification = async (unit) => {
    if (!projectId || !unit.users || unit.users.length === 0) {
      alert('No users found in this unit');
      return;
    }

    if (!window.confirm(`Send guest pass usage notification to all ${unit.users.length} resident(s) in unit ${unit.unit}?`)) {
      return;
    }

    setSendingNotification(`unit-${unit.unit}`);
    
    try {
      const { message, messageAr } = generateUsageMessage(unit);
      
      const title_en = `Guest Pass Usage - Unit ${unit.unit}`;
      const title_ar = `استخدام تصاريح الضيوف - الوحدة ${unit.unit}`;
      
      // Send to all users in the unit
      const promises = unit.users.map(user => 
        sendStatusNotification(
          projectId,
          user.id,
          title_en,
          message,
          title_ar,
          messageAr,
          'alert'
        )
      );
      
      await Promise.all(promises);
      
      alert(`✅ Notification sent successfully to ${unit.users.length} resident(s) in unit ${unit.unit}`);
    } catch (error) {
      console.error('Error sending unit notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setSendingNotification(null);
    }
  };

  // Send notification to a specific user
  const handleSendUserNotification = async (unit, user) => {
    if (!projectId) {
      alert('Project ID is required');
      return;
    }

    if (!window.confirm(`Send guest pass usage notification to ${user.name}?`)) {
      return;
    }

    setSendingNotification(`user-${user.id}`);
    
    try {
      const { message, messageAr } = generateUsageMessage(unit, user);
      
      const title_en = `Guest Pass Usage - Unit ${unit.unit}`;
      const title_ar = `استخدام تصاريح الضيوف - الوحدة ${unit.unit}`;
      
      await sendStatusNotification(
        projectId,
        user.id,
        title_en,
        message,
        title_ar,
        messageAr,
        'alert'
      );
      
      alert(`✅ Notification sent successfully to ${user.name}`);
    } catch (error) {
      console.error('Error sending user notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setSendingNotification(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Home className="h-6 w-6 mr-2 text-pre-red" />
            Unit Limits & Status
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {units?.length || 0} total units · {customUnitsCount} with custom settings
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search units by number or resident name..."
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

        <div className="mt-4 flex items-center space-x-2 text-sm">
          <Building2 className="h-4 w-4 text-pre-red" />
          <span className="text-gray-700">
            {searchTerm ? (
              <>Search results from <span className="font-semibold text-gray-900">all units</span></>
            ) : (
              <>Showing only units with <span className="font-semibold text-pre-red">custom settings or blocked status</span></>
            )}
          </span>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {searchTerm ? (
            <>
              Found <span className="font-semibold text-gray-900">{filteredUnits.length}</span> unit{filteredUnits.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </>
          ) : (
            <>
              Showing <span className="font-semibold text-gray-900">{filteredUnits.length}</span> unit{filteredUnits.length !== 1 ? 's' : ''} with custom settings
            </>
          )}
        </span>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Residents (Individual Usage)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Monthly Limit (Per User)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Usage This Month
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <tr key={unit.unit} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{unit.unit}</div>
                          <div className="text-xs text-gray-500">{unit.userCount} resident{unit.userCount !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {unit.users?.map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                            <span className="text-gray-700 truncate flex-1">{user.name}</span>
                            <span className="text-xs font-semibold ml-2">
                              <span className={user.usedThisMonth >= user.monthlyLimit ? 'text-red-600' : 'text-blue-600'}>
                                {user.usedThisMonth || 0}
                              </span>
                              <span className="text-gray-400">/{user.monthlyLimit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUnitLimit === unit.unit ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={newUnitLimit}
                            onChange={(e) => setNewUnitLimit(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveUnitLimit();
                              }
                            }}
                          />
                          <button
                            onClick={handleSaveUnitLimit}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUnitLimit(null);
                              setNewUnitLimit('');
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-semibold ${unit.hasCustomLimit ? 'text-pre-red' : 'text-gray-600'}`}>
                            {unit.monthlyLimit} passes
                          </span>
                          {unit.hasCustomLimit && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              Custom
                            </span>
                          )}
                          <button
                            onClick={() => handleEditUnitLimit(unit)}
                            className="p-1 text-gray-400 hover:text-pre-red hover:bg-red-50 rounded-lg transition-colors"
                            title="Edit limit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {unit.hasCustomLimit && (
                            <button
                              onClick={() => onResetUnitToDefault(projectId, unit.unit)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reset to default"
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {unit.usedThisMonth} / {unit.monthlyLimit}
                            </span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2.5 shadow-inner">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-500 ${getUsageColor(unit.usedThisMonth, unit.monthlyLimit)}`}
                              style={{ width: `${Math.min((unit.usedThisMonth / unit.monthlyLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {Math.round((unit.usedThisMonth / unit.monthlyLimit) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {unit.blocked ? (
                        <div className="flex items-center">
                          <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                            <Ban className="h-3 w-3 mr-1" />
                            Blocked
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {/* Send notification to unit button */}
                        <button
                          onClick={() => handleSendUnitNotification(unit)}
                          disabled={sendingNotification === `unit-${unit.unit}` || !unit.users || unit.users.length === 0}
                          className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                            sendingNotification === `unit-${unit.unit}` || !unit.users || unit.users.length === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          }`}
                          title="Send notification to all residents in this unit"
                        >
                          {sendingNotification === `unit-${unit.unit}` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4" />
                              <span>Notify Unit</span>
                            </>
                          )}
                        </button>
                        
                        {/* User-specific notification dropdown (if multiple users) */}
                        {unit.users && unit.users.length > 0 && (
                          <div className="relative user-notification-dropdown">
                            <button
                              onClick={() => setShowUserNotificationModal(showUserNotificationModal === `unit-${unit.unit}` ? null : `unit-${unit.unit}`)}
                              disabled={sendingNotification?.startsWith('user-')}
                              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                                sendingNotification?.startsWith('user-')
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                              }`}
                              title="Send notification to specific user"
                            >
                              <User className="h-4 w-4" />
                              <span>Notify User</span>
                            </button>
                            
                            {/* Dropdown menu */}
                            {showUserNotificationModal === `unit-${unit.unit}` && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                                <div className="py-2 max-h-60 overflow-y-auto">
                                  {unit.users.map((user) => (
                                    <button
                                      key={user.id}
                                      onClick={() => {
                                        handleSendUserNotification(unit, user);
                                        setShowUserNotificationModal(null);
                                      }}
                                      disabled={sendingNotification === `user-${user.id}`}
                                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                                        sendingNotification === `user-${user.id}` ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                      </div>
                                      {sendingNotification === `user-${user.id}` && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Block/Unblock button */}
                        <button
                          onClick={() => handleBlockUnit(unit.unit, unit.blocked)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                            unit.blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                          }`}
                        >
                          {unit.blocked ? (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4" />
                              <span>Block</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12">
                    <div className="text-center">
                      {searchTerm ? (
                        <>
                          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Units Found</h3>
                          <p className="text-gray-500 max-w-md mx-auto mb-4">
                            No units matching "<span className="font-semibold">{searchTerm}</span>"
                          </p>
                          <button
                            onClick={() => setSearchTerm('')}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span>Clear Search</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Home className="h-16 w-16 text-gray-300 mb-4 mx-auto" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Unit Settings</h3>
                          <p className="text-gray-500 max-w-md mb-2 mx-auto">
                            All units are currently using the default global limit of <span className="font-semibold text-gray-900">{globalSettings?.monthlyLimit || 30} passes</span>.
                          </p>
                          <p className="text-sm text-gray-400">
                            Search for a unit to set a custom limit or block it.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">How Unit Limits Work</h4>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>• <strong>Per-User Limits:</strong> Each user in a unit gets their own independent monthly limit</li>
              <li>• <strong>Custom Unit Limits:</strong> Set specific limits for all users in a unit (e.g., VIP units - each user gets that limit)</li>
              <li>• <strong>Unit Blocking:</strong> Block entire units from generating passes (all users in unit affected)</li>
              <li>• <strong>Default Behavior:</strong> Units without custom settings give each user the global project limit</li>
              <li>• <strong>Usage Tracking:</strong> Each user's usage is tracked independently within their unit</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Block Unit Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Block Unit?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              This will block <span className="font-semibold text-gray-900">all family members</span> in unit{' '}
              <span className="font-semibold text-pre-red">{showBlockConfirm}</span> from generating guest passes.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Violation of compound rules"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBlockConfirm(null);
                  setBlockReason('');
                }}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockUnit}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2"
              >
                <Ban className="h-4 w-4" />
                <span>Block Unit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitControls;

