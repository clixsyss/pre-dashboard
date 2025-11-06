import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  UserCheck, 
  Calendar, 
  Settings, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Building2,
  RefreshCw,
  MapPin,
  ShieldOff,
  Bell,
  Download,
  X
} from 'lucide-react';
import { sendStatusNotification } from '../services/statusNotificationService';
import { useAppDataStore } from '../stores/appDataStore';
import { useGuestPassStore } from '../stores/guestPassStore';
import PassTable from '../components/PassTable';
import AdminControls from '../components/AdminControls';
import UnitControls from '../components/UnitControls';
import AdminGuestPassSettings from '../components/AdminGuestPassSettings';
import * as XLSX from 'xlsx';

const GuestPasses = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('passes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sendingGlobalNotification, setSendingGlobalNotification] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const { getUsersByProject } = useAppDataStore();
  
  const {
    stats,
    users,
    passes,
    units,
    globalSettings,
    loading,
    fetchStats,
    fetchUsers,
    fetchPasses,
    fetchUnits,
    fetchGlobalSettings,
    updateGlobalLimit,
    updateValidityDuration,
    toggleProjectWideBlocking,
    toggleFamilyMembersBlocking,
    updateUnitLimit,
    toggleUnitBlocking,
    resetUnitToDefault,
    resetMonthlyUsage
  } = useGuestPassStore();

  useEffect(() => {
    const selectedProjectData = localStorage.getItem('adminSelectedProject');
    if (selectedProjectData) {
      const project = JSON.parse(selectedProjectData);
      setSelectedProject(project);
      
      // Debug logging
      console.log('🔍 GuestPasses Debug Info:');
      console.log('  URL projectId:', projectId);
      console.log('  Selected project:', project);
      console.log('  Project ID from localStorage:', project?.id);
      
      // Use the project ID from localStorage if available, otherwise use URL projectId
      const activeProjectId = project?.id || projectId;
      console.log('  Active project ID being used:', activeProjectId);
      
      // Fetch data for the current project
      if (activeProjectId) {
        console.log('📡 Fetching data for project:', activeProjectId);
        fetchStats(activeProjectId);
        fetchUsers(activeProjectId);
        fetchPasses(activeProjectId);
        fetchUnits(activeProjectId);
        fetchGlobalSettings(activeProjectId);
      }
    }
  }, [projectId, fetchStats, fetchUsers, fetchPasses, fetchUnits, fetchGlobalSettings]);

  const tabs = [
    { id: 'passes', name: 'Pass Logs', icon: Calendar },
    { id: 'units', name: 'Unit Management', icon: Building2 },
    { id: 'settings', name: 'Global Settings', icon: Settings },
    { id: 'location', name: 'Location Settings', icon: MapPin }
  ];

  const filteredPasses = passes.filter(pass => 
    pass.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pass.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Send global notification about guest pass usage
  const handleSendGlobalNotification = async () => {
    const activeProjectId = selectedProject?.id || projectId;
    if (!activeProjectId) {
      alert('Project ID is required');
      return;
    }

    if (!window.confirm('Send guest pass usage notification to all project users? This will notify all residents about their monthly guest pass consumption.')) {
      return;
    }

    setSendingGlobalNotification(true);
    
    try {
      // Get all project users
      const projectUsers = getUsersByProject(activeProjectId);
      
      if (projectUsers.length === 0) {
        alert('No users found in this project');
        return;
      }

      // Group users by unit to calculate unit usage
      const unitStats = {};
      units.forEach(unit => {
        unitStats[unit.unit] = {
          used: unit.usedThisMonth || 0,
          limit: unit.monthlyLimit || globalSettings.monthlyLimit || 30,
          users: unit.users || []
        };
      });

      // Send notifications to all users with their unit-specific stats
      const promises = projectUsers.map(user => {
        const userProject = user.projects?.find(p => p.projectId === activeProjectId);
        const userUnit = userProject?.unit || userProject?.userUnit || '';
        const unitStat = unitStats[userUnit] || { used: 0, limit: globalSettings.monthlyLimit || 30 };
        
        const used = unitStat.used || 0;
        const limit = unitStat.limit || globalSettings.monthlyLimit || 30;
        const remaining = limit - used;
        const percentage = Math.round((used / limit) * 100);
        
        let message = '';
        let messageAr = '';
        
        if (remaining <= 0) {
          message = `Dear ${user.fullName || user.firstName || 'Resident'}, your unit ${userUnit || 'N/A'} has reached the monthly guest pass limit of ${limit} passes. No more guest passes can be issued this month.`;
          messageAr = `عزيزي ${user.fullName || user.firstName || 'الساكن'}، لقد وصلت وحدة ${userUnit || 'N/A'} إلى الحد الأقصى الشهري لتصاريح الضيوف البالغ ${limit} تصريح. لا يمكن إصدار المزيد من تصاريح الضيوف هذا الشهر.`;
        } else if (remaining <= 3) {
          message = `Dear ${user.fullName || user.firstName || 'Resident'}, your unit ${userUnit || 'N/A'} has used ${used} out of ${limit} guest passes this month. Only ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining. Please use them wisely.`;
          messageAr = `عزيزي ${user.fullName || user.firstName || 'الساكن'}، لقد استخدمت وحدة ${userUnit || 'N/A'} ${used} من أصل ${limit} تصريح ضيف هذا الشهر. بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''} فقط. يرجى استخدامها بحكمة.`;
        } else if (percentage >= 75) {
          message = `Dear ${user.fullName || user.firstName || 'Resident'}, your unit ${userUnit || 'N/A'} has used ${used} out of ${limit} guest passes this month (${percentage}% used). ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining.`;
          messageAr = `عزيزي ${user.fullName || user.firstName || 'الساكن'}، لقد استخدمت وحدة ${userUnit || 'N/A'} ${used} من أصل ${limit} تصريح ضيف هذا الشهر (${percentage}% مستخدم). بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''}.`;
        } else {
          message = `Dear ${user.fullName || user.firstName || 'Resident'}, your unit ${userUnit || 'N/A'} has used ${used} out of ${limit} guest passes this month. ${remaining} pass${remaining !== 1 ? 'es' : ''} remaining.`;
          messageAr = `عزيزي ${user.fullName || user.firstName || 'الساكن'}، لقد استخدمت وحدة ${userUnit || 'N/A'} ${used} من أصل ${limit} تصريح ضيف هذا الشهر. بقي ${remaining} تصريح${remaining !== 1 ? 'ات' : ''}.`;
        }
        
        return sendStatusNotification(
          activeProjectId,
          user.id,
          'Guest Pass Usage Update',
          message,
          'تحديث استخدام تصاريح الضيوف',
          messageAr,
          'alert'
        );
      });
      
      await Promise.all(promises);
      
      alert(`✅ Global notification sent successfully to ${projectUsers.length} user(s)!`);
    } catch (error) {
      console.error('Error sending global notification:', error);
      alert('Failed to send global notification. Please try again.');
    } finally {
      setSendingGlobalNotification(false);
    }
  };

  // Export guest passes to Excel
  const exportToExcel = () => {
    try {
      // Filter by date range if specified
      let dataToExport = filteredPasses;
      
      if (exportStartDate || exportEndDate) {
        dataToExport = filteredPasses.filter(pass => {
          const passDate = pass.createdAt?.toDate ? pass.createdAt.toDate() : new Date(pass.createdAt);
          
          if (exportStartDate && exportEndDate) {
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return passDate >= start && passDate <= end;
          } else if (exportStartDate) {
            const start = new Date(exportStartDate);
            return passDate >= start;
          } else if (exportEndDate) {
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return passDate <= end;
          }
          return true;
        });
      }

      // Helper function to format dates consistently
      const formatExportDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        try {
          // Handle Firestore Timestamp
          if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().toLocaleString();
          }
          // Handle Date object or string
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return 'N/A';
          return date.toLocaleString();
        } catch (error) {
          console.error('Error formatting date:', error, dateValue);
          return 'N/A';
        }
      };

      // Prepare data for export
      const exportData = dataToExport.map(pass => ({
        'Pass ID': pass.id || 'N/A',
        'User Name': pass.userName || 'N/A',
        'User ID': pass.userId || 'N/A',
        'Unit': pass.unit || 'N/A',
        'Guest Name': pass.guestName || 'N/A',
        'Purpose': pass.purpose || 'N/A',
        'Status': pass.sentStatus ? 'Sent' : 'Pending',
        'Created Date': formatExportDate(pass.createdAt),
        'Valid From': formatExportDate(pass.validFrom),
        'Valid Until': formatExportDate(pass.validUntil),
        'Sent At': formatExportDate(pass.sentAt)
      }));

      if (exportData.length === 0) {
        alert('No data to export for the selected date range.');
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Pass ID
        { wch: 20 }, // User Name
        { wch: 20 }, // User ID
        { wch: 12 }, // Unit
        { wch: 20 }, // Guest Name
        { wch: 25 }, // Purpose
        { wch: 10 }, // Status
        { wch: 20 }, // Created Date
        { wch: 20 }, // Valid From
        { wch: 20 }, // Valid Until
        { wch: 20 }  // Sent At
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Guest Passes');

      // Generate filename with date range
      let filename = 'guest-passes';
      if (exportStartDate && exportEndDate) {
        filename += `_${exportStartDate}_to_${exportEndDate}`;
      } else if (exportStartDate) {
        filename += `_from_${exportStartDate}`;
      } else if (exportEndDate) {
        filename += `_until_${exportEndDate}`;
      } else {
        filename += `_all`;
      }
      filename += `.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Close modal and reset dates
      setShowExportModal(false);
      setExportStartDate('');
      setExportEndDate('');

      alert(`✅ Successfully exported ${exportData.length} guest pass${exportData.length !== 1 ? 'es' : ''} to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Please select a project to manage guest passes.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Guest Passes</h3>
          <p className="text-gray-500">Fetching data for {selectedProject.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Matching Dashboard Design */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-pre-red to-red-600 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Guest Pass Management</h1>
              <p className="text-lg text-gray-600 mt-1">
                Managing passes for <span className="font-semibold bg-gradient-to-r from-pre-red to-red-600 bg-clip-text text-transparent">{selectedProject.name}</span>
              </p>
            </div>
          </div>
          
          {(users.length === 0 && passes.length === 0) && (
            <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Getting Started</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    This system tracks guest passes generated by the mobile app. 
                    Users and passes will appear here once the mobile app starts creating them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSendGlobalNotification}
            disabled={sendingGlobalNotification}
            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
              sendingGlobalNotification
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
            title="Send guest pass usage notification to all project users"
          >
            {sendingGlobalNotification ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                <span>Notify All Users</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md font-medium"
          >
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => {
              const activeProjectId = selectedProject?.id || projectId;
              if (activeProjectId) {
                fetchStats(activeProjectId);
                fetchUsers(activeProjectId);
                fetchPasses(activeProjectId);
                fetchUnits(activeProjectId);
                fetchGlobalSettings(activeProjectId);
              }
            }}
            className="px-5 py-3 bg-gradient-to-r from-pre-red to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Matching Dashboard Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Passes Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Total Passes</p>
              <p className="text-4xl font-bold text-gray-900 mb-3">{stats?.totalPassesThisMonth || 0}</p>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-pre-red">This Month</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Passes Sent Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Sent Successfully</p>
              <p className="text-4xl font-bold text-gray-900 mb-3">{stats?.passesSent || 0}</p>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-green-600">
                  {stats?.totalPassesThisMonth > 0 
                    ? Math.round((stats?.passesSent / stats?.totalPassesThisMonth) * 100)
                    : 0}% Success Rate
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-md">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Active Users</p>
              <p className="text-4xl font-bold text-gray-900 mb-3">{users?.filter(u => !u.blocked).length || 0}</p>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-600">of {users?.length || 0} total</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md">
              <UserCheck className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Global Limit Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-base font-medium text-gray-600 mb-3">Monthly Limit</p>
              <p className="text-4xl font-bold text-gray-900 mb-3">{globalSettings?.monthlyLimit || 0}</p>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-orange-600">Per User</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section - Matching Dashboard Design */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`relative py-5 px-2 font-semibold text-sm flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-pre-red'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pre-red to-red-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'passes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-pre-red" />
                  Pass Activity Log
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ID or user name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pre-red focus:border-transparent transition-all duration-200 w-64"
                    />
                  </div>
                  <button className="p-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
                    <Filter className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <PassTable passes={filteredPasses} />
            </div>
          )}

          {activeTab === 'units' && (
            <UnitControls 
              units={units}
              globalSettings={globalSettings}
              onUpdateUnitLimit={updateUnitLimit}
              onBlockUnit={(projectId, unit, reason) => toggleUnitBlocking(projectId, unit, true, reason)}
              onUnblockUnit={(projectId, unit) => toggleUnitBlocking(projectId, unit, false)}
              onResetUnitToDefault={resetUnitToDefault}
              projectId={selectedProject?.id || projectId}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Global Project Settings</h3>
              
              {/* Blocking Controls */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Blocking Controls</h3>
                
                {/* Block All Users */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 flex items-center">
                        <ShieldOff className="h-4 w-4 mr-2 text-red-600" />
                        Block All Users
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Block everyone (owners and family members)</p>
                    </div>
                    <button
                      onClick={() => toggleProjectWideBlocking(selectedProject?.id || projectId, !globalSettings?.blockAllUsers)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        globalSettings?.blockAllUsers 
                          ? 'bg-red-600 focus:ring-red-500' 
                          : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                          globalSettings?.blockAllUsers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {globalSettings?.blockAllUsers && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        All users are blocked. This overrides all other settings.
                      </p>
                    </div>
                  )}
                </div>

                {/* Block Family Members Only */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-orange-600" />
                        Block Family Members Only
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Block only family members, allow owners</p>
                    </div>
                    <button
                      onClick={() => toggleFamilyMembersBlocking(selectedProject?.id || projectId, !globalSettings?.blockFamilyMembers)}
                      disabled={globalSettings?.blockAllUsers}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        globalSettings?.blockFamilyMembers 
                          ? 'bg-orange-600 focus:ring-orange-500' 
                          : 'bg-gray-300 focus:ring-gray-400'
                      } ${globalSettings?.blockAllUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                          globalSettings?.blockFamilyMembers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {globalSettings?.blockFamilyMembers && !globalSettings?.blockAllUsers && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700">
                        Only family members are blocked. Property owners can still generate passes.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Global Limit & Validity - Editable */}
              <AdminControls 
                globalSettings={globalSettings}
                users={[]} // Pass empty array - per-user controls are disabled
                onUpdateGlobalLimit={updateGlobalLimit}
                onUpdateValidityDuration={updateValidityDuration}
                onResetUsage={resetMonthlyUsage}
                onUpdateUserLimit={() => {}} // Disabled
                onBlockUser={() => {}} // Disabled
                onUnblockUser={() => {}} // Disabled
                onToggleBlockAll={toggleProjectWideBlocking}
                projectId={selectedProject?.id || projectId}
                hideUserControls={true} // NEW prop to hide user sections
              />
            </div>
          )}

          {activeTab === 'location' && (
            <AdminGuestPassSettings projectId={selectedProject?.id || projectId} />
          )}
        </div>
      </div>

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export to Excel</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a date range to export or leave empty to export all data
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPasses;
