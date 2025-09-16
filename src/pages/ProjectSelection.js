import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  ArrowRight,
  Search
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const ProjectSelection = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();
  const { currentAdmin, getFilteredProjects } = useAdminAuth();

  useEffect(() => {
    if (currentAdmin) {
      fetchProjects();
    }
  }, [currentAdmin]);

  useEffect(() => {
    if (!currentAdmin || !projects.length) return;
    
    console.log('Current admin:', currentAdmin);
    console.log('All projects:', projects);
    
    // Get projects filtered by admin assignments
    const adminProjects = getFilteredProjects(projects);
    console.log('Filtered projects for admin:', adminProjects);
    
    if (searchTerm) {
      const filtered = adminProjects.filter(project => 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(adminProjects);
    }
  }, [searchTerm, projects, currentAdmin, getFilteredProjects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch users to get real stats for each project
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate stats for each project
      const projectsWithStats = projectsData.map(project => {
        // Count users in this project
        const projectUsers = usersData.filter(user => {
          if (user.projects && Array.isArray(user.projects)) {
            return user.projects.some(userProject => userProject.projectId === project.id);
          }
          return false;
        });
        
        // Count bookings for this project (if you have a bookings collection)
        let projectBookings = 0;
        let projectEvents = 0;
        
        // You can add similar logic for bookings and events if you have those collections
        // For now, we'll just show user count
        
        return {
          ...project,
          stats: {
            users: projectUsers.length,
            bookings: projectBookings,
            events: projectEvents
          }
        };
      });
      
      setProjects(projectsWithStats);
      setFilteredProjects(projectsWithStats);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Store selected project in localStorage for persistence
    localStorage.setItem('adminSelectedProject', JSON.stringify(project));
    // Navigate to project management page
    navigate(`/project/${project.id}/dashboard`);
  };

  const getProjectStats = (project) => {
    // Get real stats from the projects array
    const projectWithStats = projects.find(p => p.id === project.id);
    if (projectWithStats && projectWithStats.stats) {
      return projectWithStats.stats;
    }
    return {
      users: 0,
      bookings: 0,
      events: 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
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
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
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
                        <div className="text-2xl font-bold text-pre-red">
                          {loading ? (
                            <div className="animate-pulse bg-red-200 h-8 w-12 rounded mx-auto"></div>
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
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last updated: {project.updatedAt ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-pre-red font-medium">Manage →</span>
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
  );
};

export default ProjectSelection;
