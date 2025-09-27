import React, { useState, useEffect } from 'react';
import { useCourtStore } from '../stores/courtStore';
import { useUINotificationStore } from '../stores/uiNotificationStore';
import { useSportsStore } from '../stores/sportsStore';
import AddSampleSports from './AddSampleSports';
import { initializeSportsForProject } from '../utils/projectInitializer';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  DollarSign, 
  Building, 
  Trophy,
  X,
  AlertCircle,
  CheckCircle,
  Camera,
  Image
} from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const CourtsManagement = ({ projectId }) => {
  const { error: showError } = useUINotificationStore();
  const {
    courts,
    loading,
    error,
    fetchCourts,
    addCourt,
    updateCourt,
    deleteCourt,
    updateCourtStatus
  } = useCourtStore();

  const {
    sports,
    fetchSports
  } = useSportsStore();

  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    capacity: '',
    type: 'outdoor',
    sportId: '',
    surface: 'hard',
    description: '',
    imageFile: null,
    imageUrl: ''
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchCourts(projectId);
      fetchSports(projectId);
    }
  }, [projectId, fetchCourts, fetchSports]);

  // Auto-initialize sports if none exist
  useEffect(() => {
    if (projectId && sports.length === 0 && !loading) {
      const autoInitializeSports = async () => {
        try {
          console.log('No sports found, auto-initializing...');
          await initializeSportsForProject(projectId);
          // Refresh sports after initialization
          fetchSports(projectId);
        } catch (error) {
          console.error('Error auto-initializing sports:', error);
        }
      };
      
      // Small delay to ensure the component is fully loaded
      const timer = setTimeout(autoInitializeSports, 1000);
      return () => clearTimeout(timer);
    }
  }, [projectId, sports.length, loading, fetchSports]);

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      price: '',
      capacity: '',
      type: 'outdoor',
      sportId: '',
      surface: 'hard',
      description: '',
      imageFile: null,
      imageUrl: ''
    });
    setEditingCourt(null);
  };

  const handleImageUpload = async (file) => {
    if (!file || !projectId) return null;
    
    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `courts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        url: downloadURL,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error uploading image. Please try again.');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let imageData = null;
      
      // Handle image upload if there's a new file
      if (formData.imageFile) {
        imageData = await handleImageUpload(formData.imageFile);
      }
      
      const courtData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        hourlyRate: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 0,
        type: formData.type,
        sport: formData.sportId,
        surface: formData.surface,
        description: formData.description.trim(),
        status: 'available',
        active: true
      };
      
      // Add image data if available
      if (imageData) {
        courtData.imageUrl = imageData.url;
        courtData.imageFileName = imageData.fileName;
        console.log('New image uploaded:', imageData);
      } else if (editingCourt && editingCourt.imageUrl) {
        // Keep existing image if no new file uploaded
        courtData.imageUrl = editingCourt.imageUrl;
        courtData.imageFileName = editingCourt.imageFileName;
        console.log('Keeping existing image:', editingCourt.imageUrl);
      } else {
        console.log('No image data available');
      }
      
      console.log('Court data being saved:', courtData);

      if (editingCourt) {
        await updateCourt(projectId, editingCourt.id, courtData);
        setSuccessMessage('Court updated successfully!');
      } else {
        await addCourt(projectId, courtData);
        setSuccessMessage('Court added successfully!');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving court:', error);
      // Show user-friendly error message
      showError(`Failed to ${editingCourt ? 'update' : 'add'} court: ${error.message}`);
    }
  };

  const handleEdit = (court) => {
    console.log('Editing court:', court);
    console.log('Court imageUrl:', court.imageUrl);
    console.log('Court imageFileName:', court.imageFileName);
    
    setEditingCourt(court);
    setFormData({
      name: court.name || '',
      location: court.location || '',
      price: court.hourlyRate?.toString() || '',
      capacity: court.capacity?.toString() || '',
      type: court.type || 'outdoor',
      sportId: court.sport || '',
      surface: court.surface || 'hard',
      description: court.description || '',
      imageFile: null,
      imageUrl: court.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courtId) => {
    if (window.confirm('Are you sure you want to delete this court? This action cannot be undone.')) {
      try {
        await deleteCourt(projectId, courtId);
      } catch (error) {
        console.error('Error deleting court:', error);
        showError(`Failed to delete court: ${error.message}`);
      }
    }
  };

  const handleStatusChange = async (courtId, newStatus) => {
    try {
      await updateCourtStatus(projectId, courtId, newStatus);
    } catch (error) {
      console.error('Error updating court status:', error);
      showError(`Failed to update court status: ${error.message}`);
    }
  };

  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || court.status === statusFilter;
    const matchesType = typeFilter === 'all' || court.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    return type === 'indoor' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const formatSurface = (surface) => {
    if (!surface) return 'Unknown';
    return surface.charAt(0).toUpperCase() + surface.slice(1).replace(/([A-Z])/g, ' $1');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courts Management</h2>
          <p className="text-gray-600">Manage sports courts and facilities</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Court
        </button>
      </div>

      {/* Show AddSampleSports if no sports available */}
      {sports.length === 0 && (
        <AddSampleSports projectId={projectId} />
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <div className="text-sm text-green-700">
              <strong>Success:</strong> {successMessage}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search courts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
          <option value="booked">Booked</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>

        <div className="text-sm text-gray-600 flex items-center">
          Showing {filteredCourts.length} of {courts.length} courts
        </div>
      </div>

      {/* Courts Table */}
      {filteredCourts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity & Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourts.map((court) => (
                  <tr key={court.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{court.name}</div>
                        <div className="text-sm text-gray-500">{court.description || 'No description'}</div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Trophy className="w-4 h-4 mr-1" />
                          {sports.find(s => s.id === court.sport)?.name || 'Unknown Sport'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {court.location}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(court.type)}`}>
                          <Building className="w-3 h-3 mr-1" />
                          {court.type}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {formatSurface(court.surface)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {court.capacity} people
                      </div>
                      <div className="flex items-center text-sm text-gray-900 mt-1">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        ${court.hourlyRate}/hour
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={court.status}
                        onChange={(e) => handleStatusChange(court.id, e.target.value)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(court.status)} border-0 focus:ring-0`}
                      >
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="booked">Booked</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {court.imageUrl ? (
                        <img 
                          src={court.imageUrl} 
                          alt={court.name} 
                          className="h-12 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-12 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(court)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(court.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Building className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {courts.length === 0 
              ? "Get started by adding your first court."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {courts.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Court
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Court Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCourt ? 'Edit Court' : 'Add New Court'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter court name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter court location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Hour *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Max people"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport *
                    </label>
                    <select
                      required
                      value={formData.sportId}
                      onChange={(e) => setFormData({...formData, sportId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Sport</option>
                      {sports.map((sport) => (
                        <option key={sport.id} value={sport.id}>
                          {sport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surface *
                    </label>
                    <select
                      required
                      value={formData.surface}
                      onChange={(e) => setFormData({...formData, surface: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hard">Hard Court</option>
                      <option value="clay">Clay Court</option>
                      <option value="grass">Grass Court</option>
                      <option value="artificial">Artificial Turf</option>
                      <option value="concrete">Concrete</option>
                      <option value="asphalt">Asphalt</option>
                      <option value="wood">Wooden Floor</option>
                      <option value="synthetic">Synthetic Surface</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description of the court"
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData({ 
                            ...formData, 
                            imageFile: file,
                            imageUrl: URL.createObjectURL(file) // Preview
                          });
                        }
                      }}
                      className="hidden"
                      id="court-image-upload"
                    />
                    <label htmlFor="court-image-upload" className="cursor-pointer">
                      {formData.imageUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={formData.imageUrl} 
                            alt="Court preview" 
                            className="mx-auto h-32 w-48 object-cover rounded-lg"
                          />
                          <p className="text-sm text-gray-600">
                            {formData.imageFile ? formData.imageFile.name : 'Current image'}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, imageFile: null, imageUrl: '' });
                              document.getElementById('court-image-upload').value = '';
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">
                            Click to upload court image
                          </p>
                          <p className="text-xs text-gray-500">
                            Supports JPG, PNG, WebP (Max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSubmitting || uploading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting || uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                        {uploading ? 'Uploading...' : (editingCourt ? 'Updating...' : 'Adding...')}
                      </>
                    ) : (
                      editingCourt ? 'Update Court' : 'Add Court'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtsManagement;
