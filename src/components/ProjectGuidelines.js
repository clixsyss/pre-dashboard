import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  User,
  Eye,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  getProjectGuidelines,
  createGuideline,
  updateGuideline,
  deleteGuideline,
  searchGuidelines
} from '../services/projectGuidelinesService';

const ProjectGuidelines = ({ projectId }) => {
  const [guidelines, setGuidelines] = useState([]);
  const [filteredGuidelines, setFilteredGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [viewingGuideline, setViewingGuideline] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    isActive: true
  });

  // Categories for guidelines
  const categories = [
    { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
    { value: 'safety', label: 'Safety', color: 'bg-red-100 text-red-800' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-blue-100 text-blue-800' },
    { value: 'rules', label: 'Rules & Regulations', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'procedures', label: 'Procedures', color: 'bg-green-100 text-green-800' },
    { value: 'emergency', label: 'Emergency', color: 'bg-orange-100 text-orange-800' }
  ];

  // Priority levels
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  // Load guidelines on component mount
  useEffect(() => {
    if (projectId) {
      fetchGuidelines();
    }
  }, [projectId]);

  // Filter guidelines when search term or category changes
  useEffect(() => {
    filterGuidelines();
  }, [guidelines, searchTerm, categoryFilter]);

  const fetchGuidelines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectGuidelines(projectId);
      setGuidelines(data);
    } catch (err) {
      setError('Failed to load guidelines');
      console.error('Error fetching guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterGuidelines = () => {
    let filtered = guidelines;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(guideline =>
        guideline.title.toLowerCase().includes(searchLower) ||
        guideline.content.toLowerCase().includes(searchLower) ||
        guideline.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(guideline => guideline.category === categoryFilter);
    }

    setFilteredGuidelines(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      isActive: true
    });
    setEditingGuideline(null);
  };

  const handleOpenModal = (guideline = null) => {
    if (guideline) {
      setEditingGuideline(guideline);
      setFormData({
        title: guideline.title,
        content: guideline.content,
        category: guideline.category,
        priority: guideline.priority,
        isActive: guideline.isActive
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingGuideline) {
        await updateGuideline(projectId, editingGuideline.id, formData);
      } else {
        await createGuideline(projectId, formData);
      }

      await fetchGuidelines();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save guideline');
      console.error('Error saving guideline:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guidelineId) => {
    if (!window.confirm('Are you sure you want to delete this guideline?')) {
      return;
    }

    try {
      setError(null);
      await deleteGuideline(projectId, guidelineId);
      await fetchGuidelines();
    } catch (err) {
      setError('Failed to delete guideline');
      console.error('Error deleting guideline:', err);
    }
  };

  const handleView = (guideline) => {
    setViewingGuideline(guideline);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(pri => pri.value === priority) || priorities[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading guidelines...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Guidelines</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage project rules, procedures, and important information
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Guideline
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Guidelines List */}
      <div className="space-y-4">
        {filteredGuidelines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guidelines found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'No guidelines match your search criteria.' 
                : 'Get started by creating your first project guideline.'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Guideline
              </button>
            )}
          </div>
        ) : (
          filteredGuidelines.map((guideline) => {
            const categoryInfo = getCategoryInfo(guideline.category);
            const priorityInfo = getPriorityInfo(guideline.priority);
            
            return (
              <div key={guideline.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{guideline.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                      {!guideline.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {guideline.content.length > 150 
                        ? `${guideline.content.substring(0, 150)}...` 
                        : guideline.content
                      }
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(guideline.createdAt)}</span>
                      </div>
                      {guideline.updatedAt && guideline.updatedAt !== guideline.createdAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Updated {formatDate(guideline.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(guideline)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(guideline)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit guideline"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(guideline.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete guideline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingGuideline ? 'Edit Guideline' : 'Add New Guideline'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter guideline title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter guideline content"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingGuideline ? 'Update' : 'Create'} Guideline
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingGuideline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Guideline Details</h3>
                <button
                  onClick={() => setViewingGuideline(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {viewingGuideline.title}
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryInfo(viewingGuideline.category).color}`}>
                    {getCategoryInfo(viewingGuideline.category).label}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityInfo(viewingGuideline.priority).color}`}>
                    {getPriorityInfo(viewingGuideline.priority).label}
                  </span>
                  {!viewingGuideline.isActive && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Content</h5>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{viewingGuideline.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Created</h5>
                  <p className="text-sm text-gray-600">{formatDate(viewingGuideline.createdAt)}</p>
                </div>
                {viewingGuideline.updatedAt && viewingGuideline.updatedAt !== viewingGuideline.createdAt && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h5>
                    <p className="text-sm text-gray-600">{formatDate(viewingGuideline.updatedAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingGuideline(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingGuideline(null);
                    handleOpenModal(viewingGuideline);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Guideline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGuidelines;
