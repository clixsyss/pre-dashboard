import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Home,
  MapPin,
  X,
  Save
} from 'lucide-react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'residential',
    location: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Only call filterProjects when we have projects or when filters change
    if (projects.length > 0 || searchTerm || typeFilter !== 'all') {
      // Apply filters directly here instead of calling filterProjects
      let filtered = [...projects];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(project => 
          project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(project => project.type === typeFilter);
      }

      setFilteredProjects(filtered);
    } else {
      // Initialize filteredProjects with empty array if no projects
      setFilteredProjects([]);
    }
  }, [projects, searchTerm, typeFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjects(projectsData);
      setFilteredProjects(projectsData); // Initialize filtered projects with all projects
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
      setFilteredProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const projectData = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (showEditModal && selectedProject) {
        await updateDoc(doc(db, 'projects', selectedProject.id), {
          ...projectData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'projects'), projectData);
      }

      // Reset form and close modal
      setFormData({
        name: '',
        type: 'residential',
        location: ''
      });
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedProject(null);
      
      // Refresh projects
      fetchProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project');
    }
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name || '',
      type: project.type || 'residential',
      location: project.location || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      residential: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Residential', icon: Home },
      commercial: { bg: 'bg-green-100', text: 'text-green-800', label: 'Commercial', icon: Building2 }
    };
    
    const config = typeConfig[type] || typeConfig.residential;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <button 
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage residential and commercial projects</p>
        </div>
        <button
          onClick={() => {
            setSelectedProject(null);
            setFormData({
              name: '',
              type: 'residential',
              location: ''
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Project
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredProjects?.length || 0} of {projects.length} projects
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      {getTypeBadge(project.type)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{project.location || 'No location specified'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Project ID: {project.id?.slice(-6)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(project)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              {searchTerm || typeFilter !== 'all' 
                ? 'No projects match your filters' 
                : 'No projects found. Create your first project!'
              }
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {showEditModal ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter project name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project location"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedProject(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2 inline" />
                    {showEditModal ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{projectToDelete.name}</strong>? 
                    This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
