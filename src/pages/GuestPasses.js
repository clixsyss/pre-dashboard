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
  ShieldOff
} from 'lucide-react';
import { useGuestPassStore } from '../stores/guestPassStore';
import PassTable from '../components/PassTable';
import AdminControls from '../components/AdminControls';
import UnitControls from '../components/UnitControls';
import ExportButton from '../components/ExportButton';
import AdminGuestPassSettings from '../components/AdminGuestPassSettings';

const GuestPasses = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('passes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  
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
          <ExportButton dataType="guestPasses" />
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
    </div>
  );
};

export default GuestPasses;
