import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  School,
  MapPin,
  Phone,
  Mail,
  Users,
  X,
  Save,
  Star,
  Clock
} from 'lucide-react';
import { useAcademyStore } from '../stores/academyStore';

const Academies = () => {
  const { projectId } = useParams();
    const { 
    academyOptions, 
    loading, 
    fetchAcademies, 
    addAcademy, 
    updateAcademy, 
    deleteAcademy
  } = useAcademyStore();

  const [filteredAcademies, setFilteredAcademies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [academyToDelete, setAcademyToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    rating: 5,
    capacity: 100,
    sports: [],
    programs: [],
    operatingHours: '',
    facilities: []
  });

  useEffect(() => {
    if (projectId) {
      fetchAcademies(projectId);
    }
  }, [projectId, fetchAcademies]);

  useEffect(() => {
    filterAcademies();
  }, [academyOptions, searchTerm, filterAcademies]);

  const filterAcademies = useCallback(() => {
    const filtered = academyOptions.filter(academy =>
      academy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      academy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      academy.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAcademies(filtered);
  }, [academyOptions, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAcademy) {
        // Update existing academy
        await updateAcademy(projectId, {
          ...formData,
          id: selectedAcademy.id
        });
        setShowEditModal(false);
      } else {
        // Add new academy
        await addAcademy(projectId, formData);
        setShowAddModal(false);
      }

      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        rating: 5,
        capacity: 100,
        sports: [],
        programs: [],
        operatingHours: '',
        facilities: []
      });
      setSelectedAcademy(null);
      // Refresh the academies list
      if (projectId) {
        fetchAcademies(projectId);
      }
    } catch (err) {
      console.error('Error saving academy:', err);
    }
  };

  const handleEdit = (academy) => {
    setSelectedAcademy(academy);
    setFormData({
      name: academy.name || '',
      description: academy.description || '',
      address: academy.address || '',
      phone: academy.phone || '',
      email: academy.email || '',
      website: academy.website || '',
      rating: academy.rating || 5,
      capacity: academy.capacity || 100,
      sports: academy.sports || [],
      programs: academy.programs || [],
      operatingHours: academy.operatingHours || '',
      facilities: academy.facilities || []
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteAcademy(projectId, academyToDelete.id);
      setShowDeleteModal(false);
      setAcademyToDelete(null);
    } catch (err) {
      console.error('Error deleting academy:', err);
    }
  };

  const openDeleteModal = (academy) => {
    setAcademyToDelete(academy);
    setShowDeleteModal(true);
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academies Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sports academies and their programs
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Academy
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search academies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {filteredAcademies.length} of {academyOptions.length} academies
          </div>
        </div>
      </div>

      {/* Academies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAcademies.map((academy) => (
          <div key={academy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <School className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{academy.name}</h3>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(academy.rating || 0)}
                      <span className="text-sm text-gray-500 ml-1">({academy.rating || 0})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(academy)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(academy)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{academy.description}</p>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{academy.address}</span>
                </div>

                {academy.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{academy.phone}</span>
                  </div>
                )}

                {academy.email && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{academy.email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Capacity: {academy.capacity || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{academy.operatingHours || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {academy.sports && academy.sports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {academy.sports.slice(0, 3).map((sport, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {sport}
                      </span>
                    ))}
                    {academy.sports.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{academy.sports.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAcademies.length === 0 && (
        <div className="text-center py-12">
          <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No academies found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first academy'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Academy
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Academy Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedAcademy(null);
            }}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAcademy ? 'Edit Academy' : 'Add New Academy'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedAcademy(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <select
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5].map(rating => (
                          <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-4PM"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedAcademy(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {selectedAcademy ? 'Update Academy' : 'Add Academy'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Academy</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{academyToDelete?.name}</strong>? This will permanently remove the academy and all associated data.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Academy
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

export default Academies;
