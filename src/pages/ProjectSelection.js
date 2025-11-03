import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  ArrowRight,
  Search,
  LogOut,
  User,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAuth } from '../contexts/AuthContext';
import AdminGuestPassSettings from '../components/AdminGuestPassSettings';

const ProjectSelection = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationSettingsModal, setShowLocationSettingsModal] = useState(false);
  const [selectedProjectForLocation, setSelectedProjectForLocation] = useState(null);
  const navigate = useNavigate();
  const { currentAdmin, getFilteredProjects, loading: adminLoading, isSuperAdmin } = useAdminAuth();
  const { logout } = useAuth();
  const isSuper = isSuperAdmin();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const fetchProjects = useCallback(async () => {
    if (!currentAdmin) {
      console.log('ProjectSelection: No admin data available, skipping project fetch');
      return;
    }

    try {
      console.log('ProjectSelection: Starting to fetch projects...');
      setLoading(true);
      console.log('📊 ProjectSelection: Fetching data with optimization...');
      
      // OPTIMIZATION: Fetch projects with limit
      const projectsQuery = query(collection(db, 'projects'), limit(50));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ ProjectSelection: Fetched projects:', projectsData.length);
      
      // OPTIMIZATION: Fetch limited users for stats (sample)
      const usersQuery = query(
        collection(db, 'users'),
        limit(1000) // Limit to 1000 users for stats
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ ProjectSelection: Fetched ${usersData.length} users (limited for stats)`)
      
      // Calculate stats for each project
      const projectsWithStats = await Promise.all(projectsData.map(async (project) => {
        // Count users in this project
        const projectUsers = usersData.filter(user => {
          if (user.projects && Array.isArray(user.projects)) {
            return user.projects.some(userProject => userProject.projectId === project.id);
          }
          return false;
        });
        
        // Count units in this project
        let projectUnits = 0;
        try {
          const unitsSnapshot = await getDocs(collection(db, 'projects', project.id, 'units'));
          projectUnits = unitsSnapshot.size;
        } catch (error) {
          console.error(`Error fetching units for project ${project.id}:`, error);
        }
        
        // Count bookings for this project (if you have a bookings collection)
        let projectBookings = 0;
        let projectEvents = 0;
        
        // You can add similar logic for bookings and events if you have those collections
        // For now, we'll just show user count and units
        
        return {
          ...project,
          stats: {
            users: projectUsers.length,
            units: projectUnits,
            bookings: projectBookings,
            events: projectEvents
          }
        };
      }));
      
      setProjects(projectsWithStats);
      
      // Simple filtering - just show admin's assigned projects
      const adminProjects = projectsWithStats.filter(project => 
        currentAdmin?.assignedProjects?.includes(project.id)
      );
      setFilteredProjects(adminProjects);
      
      console.log('ProjectSelection: Projects loaded successfully:', projectsWithStats.length);
      console.log('ProjectSelection: Admin assigned projects:', adminProjects.length);
    } catch (err) {
      console.error('ProjectSelection: Error fetching projects:', err);
      setProjects([]); // Set empty array on error
      setFilteredProjects([]);
    } finally {
      setLoading(false);
      console.log('ProjectSelection: Loading complete');
    }
  }, [currentAdmin]);

  useEffect(() => {
    console.log('ProjectSelection: useEffect triggered - currentAdmin:', !!currentAdmin, 'adminLoading:', adminLoading);
    if (currentAdmin && !adminLoading) {
      console.log('ProjectSelection: Loading projects for admin:', currentAdmin.email);
      fetchProjects();
    }
  }, [currentAdmin, adminLoading, fetchProjects]);

  // Simple search effect
  useEffect(() => {
    if (!projects.length) return;
    
    // Get admin's assigned projects
    const adminProjects = projects.filter(project => 
      currentAdmin?.assignedProjects?.includes(project.id)
    );
    
    // Apply search filter
    if (searchTerm) {
      const filtered = adminProjects.filter(project => 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(adminProjects);
    }
  }, [searchTerm, projects, currentAdmin?.assignedProjects]);

  const handleProjectSelect = (project) => {
    // Store selected project in localStorage for persistence
    localStorage.setItem('adminSelectedProject', JSON.stringify(project));
    // Navigate to project management page
    navigate(`/project/${project.id}/dashboard`);
  };

  const handleViewProjectLocation = (project, e) => {
    e.stopPropagation(); // Prevent project selection
    setSelectedProjectForLocation(project);
    setShowLocationSettingsModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationSettingsModal(false);
    setSelectedProjectForLocation(null);
  };

  const getProjectStats = (project) => {
    // Get real stats from the projects array
    const projectWithStats = projects.find(p => p.id === project.id);
    if (projectWithStats && projectWithStats.stats) {
      return projectWithStats.stats;
    }
    return {
      users: 0,
      units: 0,
      bookings: 0,
      events: 0
    };
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-gray-600">
            {adminLoading ? 'Loading admin data...' : 'Loading projects...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Admin: {currentAdmin ? 'Loaded' : 'Not loaded'} | 
            Projects: {projects.length} | 
            Filtered: {filteredProjects.length}
          </p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">No admin account found</p>
          <p className="text-gray-500 mt-2">Please contact your administrator</p>
          <button 
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  console.log('ProjectSelection: About to render with state:', { 
    loading, 
    adminLoading, 
    currentAdmin: !!currentAdmin, 
    currentAdminType: currentAdmin?.accountType,
    projects: projects.length, 
    filteredProjects: filteredProjects.length,
    hasGetFilteredProjects: !!getFilteredProjects
  });

  // Simple test to see if basic render works
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Select Project</h1>
                <p className="text-gray-600 mt-1">Choose which project you want to manage</p>
              </div>
              <div className="flex items-center space-x-4">
                {isSuper && (
                  <button
                    onClick={() => {
                      setSelectedProjectForLocation(null);
                      setShowLocationSettingsModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <SettingsIcon className="h-5 w-5 mr-2" />
                    All Locations
                  </button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              
              {/* Admin Info and Logout */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{currentAdmin?.firstName} {currentAdmin?.lastName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize">{currentAdmin?.accountType?.replace('_', ' ')}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">No projects match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const stats = getProjectStats(project);
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="p-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {project.name}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{project.location}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.type === 'residential' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.type}
                        </span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-pre-red group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pre-red">
                          {loading ? (
                            <div className="animate-pulse bg-red-200 h-8 w-12 rounded mx-auto"></div>
                          ) : (
                            stats.users
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {loading ? (
                            <div className="animate-pulse bg-blue-200 h-8 w-12 rounded mx-auto"></div>
                          ) : (
                            stats.units
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Units</div>
                      </div>
                      {/* <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {loading ? (
                            <div className="animate-pulse bg-green-200 h-8 w-12 rounded mx-auto"></div>
                          ) : (
                            stats.bookings
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Bookings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {loading ? (
                            <div className="animate-pulse bg-purple-200 h-8 w-12 rounded mx-auto"></div>
                          ) : (
                            stats.events
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Events</div>
                      </div> */}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last updated: {project.updatedAt ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleViewProjectLocation(project, e)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View location settings"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                          <span className="text-pre-red font-medium">Manage →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Location Settings Modal */}
      {showLocationSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={closeLocationModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-7xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedProjectForLocation ? selectedProjectForLocation.name : 'All Projects'} - Location Settings
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProjectForLocation 
                      ? `Configure location restrictions for ${selectedProjectForLocation.name}`
                      : 'Configure location restrictions for all projects'
                    }
                  </p>
                </div>
                <button
                  onClick={closeLocationModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <AdminGuestPassSettings projectId={selectedProjectForLocation?.id || null} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelection;
