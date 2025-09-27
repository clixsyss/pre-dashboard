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
  Clock,
  Upload,
  Download,
  File
} from 'lucide-react';
import {
  getPDFGuidelines,
  createPDFGuideline,
  updatePDFGuideline,
  deleteGuideline
} from '../services/projectGuidelinesService';
import { uploadPDF, deletePDF, formatFileSize, validatePDFFile } from '../services/pdfUploadService';

const PDFGuidelines = ({ projectId }) => {
  const [pdfGuidelines, setPdfGuidelines] = useState([]);
  const [filteredGuidelines, setFilteredGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [viewingGuideline, setViewingGuideline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    isActive: true,
    file: null,
    fileUrl: '',
    fileName: '',
    fileSize: 0
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
      fetchPDFGuidelines();
    }
  }, [projectId]);

  // Filter guidelines when search term or category changes
  useEffect(() => {
    filterGuidelines();
  }, [pdfGuidelines, searchTerm, categoryFilter]);

  const fetchPDFGuidelines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPDFGuidelines(projectId);
      setPdfGuidelines(data);
    } catch (err) {
      setError('Failed to load PDF guidelines');
      console.error('Error fetching PDF guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterGuidelines = () => {
    let filtered = pdfGuidelines;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(guideline =>
        guideline.title.toLowerCase().includes(searchLower) ||
        (guideline.description && guideline.description.toLowerCase().includes(searchLower)) ||
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
      description: '',
      category: 'general',
      priority: 'medium',
      isActive: true,
      file: null,
      fileUrl: '',
      fileName: '',
      fileSize: 0
    });
    setEditingGuideline(null);
  };

  const handleOpenModal = (guideline = null) => {
    if (guideline) {
      setEditingGuideline(guideline);
      setFormData({
        title: guideline.title || '',
        description: guideline.description || '',
        category: guideline.category || 'general',
        priority: guideline.priority || 'medium',
        isActive: guideline.isActive !== false,
        file: null,
        fileUrl: guideline.fileUrl || '',
        fileName: guideline.fileName || '',
        fileSize: guideline.fileSize || 0
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setUploading(false);
    setUploadProgress(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validatePDFFile(file);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        fileSize: file.size
      }));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!editingGuideline && !formData.file) {
      setError('Please select a PDF file to upload');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let fileUrl = formData.fileUrl;
      let fileName = formData.fileName;
      let fileSize = formData.fileSize;
      let filePath = '';

      // Upload new file if provided
      if (formData.file) {
        setUploading(true);
        setUploadProgress(0);
        
        const uploadResult = await uploadPDF(formData.file, projectId, formData.title);
        fileUrl = uploadResult.url;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.size;
        filePath = uploadResult.path;
        
        setUploadProgress(100);
        setUploading(false);
      }

      const guidelineData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        isActive: formData.isActive,
        fileUrl,
        fileName,
        fileSize,
        filePath: filePath || editingGuideline?.filePath
      };

      if (editingGuideline) {
        await updatePDFGuideline(projectId, editingGuideline.id, guidelineData);
      } else {
        await createPDFGuideline(projectId, guidelineData);
      }

      await fetchPDFGuidelines();
      handleCloseModal();
    } catch (err) {
      setError(err.message || 'Failed to save PDF guideline');
      console.error('Error saving PDF guideline:', err);
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (guideline) => {
    if (!window.confirm('Are you sure you want to delete this PDF guideline? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      
      // Delete file from storage if it exists
      if (guideline.filePath) {
        try {
          await deletePDF(guideline.filePath);
        } catch (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete from database
      await deleteGuideline(projectId, guideline.id);
      
      await fetchPDFGuidelines();
    } catch (err) {
      setError('Failed to delete PDF guideline');
      console.error('Error deleting PDF guideline:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleView = (guideline) => {
    setViewingGuideline(guideline);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(pri => pri.value === priority) || priorities[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pre-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Guidelines</h2>
          <p className="text-gray-600">Manage project guidelines as PDF documents</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Upload className="h-5 w-5" />
          Upload PDF
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search PDF guidelines..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={categoryFilter}
            onChange={handleCategoryFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Guidelines List */}
      <div className="grid gap-4">
        {filteredGuidelines.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF guidelines found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'No guidelines match your search criteria.' 
                : 'Upload your first PDF guideline to get started.'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Upload PDF
              </button>
            )}
          </div>
        ) : (
          filteredGuidelines.map((guideline) => {
            const categoryInfo = getCategoryInfo(guideline.category);
            const priorityInfo = getPriorityInfo(guideline.priority);
            
            return (
              <div key={guideline.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-6 w-6 text-pre-red" />
                      <h3 className="text-lg font-semibold text-gray-900">{guideline.title}</h3>
                      {!guideline.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {guideline.description && (
                      <p className="text-gray-600 mb-3">{guideline.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(guideline.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <File className="h-4 w-4" />
                        <span>{formatFileSize(guideline.fileSize)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.label} Priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(guideline)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View PDF"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(guideline)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(guideline)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                      disabled={saving}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingGuideline ? 'Edit PDF Guideline' : 'Upload PDF Guideline'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                    placeholder="Enter guideline title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                    rows={3}
                    placeholder="Enter guideline description"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF File {!editingGuideline && '*'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.file ? formData.file.name : 'Click to upload PDF or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500">Max file size: 10MB</span>
                    </label>
                  </div>
                  {formData.file && (
                    <div className="mt-2 text-sm text-gray-600">
                      File size: {formatFileSize(formData.fileSize)}
                    </div>
                  )}
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
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
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pre-red focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-pre-red focus:ring-pre-red border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Uploading PDF...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pre-red h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
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
                    disabled={saving || uploading}
                    className="px-4 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingGuideline ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingGuideline ? 'Update' : 'Upload'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View PDF Modal */}
      {viewingGuideline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{viewingGuideline.title}</h3>
                  {viewingGuideline.description && (
                    <p className="text-gray-600 mt-1">{viewingGuideline.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingGuideline.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  <button
                    onClick={() => setViewingGuideline(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <iframe
                src={viewingGuideline.fileUrl}
                className="w-full h-96 border border-gray-300 rounded-lg"
                title={viewingGuideline.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGuidelines;
