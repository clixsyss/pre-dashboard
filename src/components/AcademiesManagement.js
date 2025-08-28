import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  School,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { useAcademyStore } from '../stores/academyStore';

const AcademiesManagement = ({ projectId }) => {
  // Academy store integration
  const {
    academies: projectAcademies,
    fetchAcademies,
    loading: academiesLoading,
    error: academiesError,
    addAcademy,
    updateAcademy,
    deleteAcademy
  } = useAcademyStore();

  // State management
  const [academySearchTerm, setAcademySearchTerm] = useState('');
  const [academyTypeFilter, setAcademyTypeFilter] = useState('all');
  const [academyRatingFilter, setAcademyRatingFilter] = useState('all');
  const [selectedAcademyForModal, setSelectedAcademyForModal] = useState(null);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isAddAcademyModalOpen, setIsAddAcademyModalOpen] = useState(false);
  const [selectedAcademyForPrograms, setSelectedAcademyForPrograms] = useState(null);
  const [isProgramsModalOpen, setIsProgramsModalOpen] = useState(false);

  // Fetch academies when component mounts
  useEffect(() => {
    if (projectId) {
      console.log('Fetching academies for project:', projectId);
      fetchAcademies(projectId);
    }
  }, [projectId, fetchAcademies]);

  // Filter academies based on search and filters
  const getFilteredAcademies = () => {
    if (!projectAcademies || projectAcademies.length === 0) return [];
    
    let filtered = [...projectAcademies];

    if (academySearchTerm) {
      filtered = filtered.filter(academy =>
        (academy.name && academy.name.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.description && academy.description.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.location && academy.location.toLowerCase().includes(academySearchTerm.toLowerCase())) ||
        (academy.email && academy.email.toLowerCase().includes(academySearchTerm.toLowerCase()))
      );
    }

    if (academyTypeFilter !== 'all') {
      filtered = filtered.filter(academy => academy.type === academyTypeFilter);
    }

    if (academyRatingFilter !== 'all') {
      const minRating = parseInt(academyRatingFilter);
      filtered = filtered.filter(academy => academy.rating >= minRating);
    }

    return filtered;
  };

  // Academy action handlers
  const handleViewAcademy = (academy) => {
    setSelectedAcademyForModal(academy);
    setIsAcademyModalOpen(true);
  };

  const handleEditAcademy = (academy) => {
    setSelectedAcademyForModal(academy);
    setIsAddAcademyModalOpen(true);
  };

  const handleAddNewAcademy = () => {
    setSelectedAcademyForModal(null);
    setIsAddAcademyModalOpen(true);
  };

  const handleManagePrograms = (academy) => {
    setSelectedAcademyForPrograms(academy);
    setIsProgramsModalOpen(true);
  };


  const handleDeleteAcademy = async (academyId) => {
    if (window.confirm('Are you sure you want to delete this academy?')) {
      try {
        await deleteAcademy(projectId, academyId);
        console.log('Academy deleted:', academyId);
      } catch (error) {
        console.error('Error deleting academy:', error);
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Academies Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Academies</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage sports academies and training programs
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchAcademies(projectId)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleAddNewAcademy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Academy
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search academies by name, description, or location..."
              value={academySearchTerm}
              onChange={(e) => setAcademySearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={academyTypeFilter}
            onChange={(e) => setAcademyTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="sports">Sports</option>
            <option value="fitness">Fitness</option>
            <option value="wellness">Wellness</option>
            <option value="martial-arts">Martial Arts</option>
            <option value="swimming">Swimming</option>
          </select>
          <select
            value={academyRatingFilter}
            onChange={(e) => setAcademyRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {academiesLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading academies...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {academiesError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading academies:</p>
            <p className="text-sm">{academiesError}</p>
          </div>
        </div>
      )}

      {/* Academies Table */}
      {!academiesLoading && !academiesError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAcademies().map((academy) => (
                  <tr key={academy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <School className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {academy.name || 'Unknown Academy'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {academy.type || 'General'}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            Since {academy.establishedYear || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-xs">{academy.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-xs">{academy.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{academy.location || 'No location'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {renderStars(academy.rating || 0)}
                          <span className="ml-2 text-sm text-gray-900">{academy.rating || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{academy.capacity || 0} students</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {academy.programs && academy.programs.length > 0 ? (
                          academy.programs.slice(0, 3).map((program, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {program}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">No programs</span>
                        )}
                        {academy.programs && academy.programs.length > 3 && (
                          <span className="text-xs text-gray-500">+{academy.programs.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAcademy(academy)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditAcademy(academy)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Academy"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManagePrograms(academy)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Manage Programs"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAcademy(academy.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Academy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {getFilteredAcademies().length === 0 && (
            <div className="text-center py-12">
              <School className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No academies found</h3>
              <p className="text-gray-600">
                {projectAcademies && projectAcademies.length > 0
                  ? 'No academies match your search criteria.'
                  : 'Get started by adding your first academy.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Academy Details Modal */}
      {isAcademyModalOpen && selectedAcademyForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Academy Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAcademyForModal.type || 'Academy'} Information
                </p>
              </div>
              <button
                onClick={() => setIsAcademyModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <School className="h-5 w-5 mr-2 text-green-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academy Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.name || 'Unknown Academy'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.type || 'General'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Established</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.establishedYear || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</label>
                    <div className="flex items-center mt-1">
                      {renderStars(selectedAcademyForModal.rating || 0)}
                      <span className="ml-2 text-sm text-gray-900">{selectedAcademyForModal.rating || 0}/5</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedAcademyForModal.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.email || 'No email'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.phone || 'No phone'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.location || 'No location'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.website || 'No website'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Programs & Facilities Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Programs & Facilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacity</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.capacity || 0} students
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Operating Hours</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.operatingHours || 'Not specified'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Programs Offered</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAcademyForModal.programs && selectedAcademyForModal.programs.length > 0 ? (
                        selectedAcademyForModal.programs.map((program, index) => (
                          <span
                            key={index}
                            className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {program}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No programs listed</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Facilities</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAcademyForModal.facilities && selectedAcademyForModal.facilities.length > 0 ? (
                        selectedAcademyForModal.facilities.map((facility, index) => (
                          <span
                            key={index}
                            className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
                          >
                            {facility}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No facilities listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academy ID</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">
                      {selectedAcademyForModal.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedAcademyForModal.createdAt ? new Date(selectedAcademyForModal.createdAt.toDate()).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <button
                onClick={() => handleEditAcademy(selectedAcademyForModal)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Academy
              </button>
              <button
                onClick={() => setIsAcademyModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Academy Modal */}
      {isAddAcademyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAcademyForModal ? 'Edit Academy' : 'Add New Academy'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAcademyForModal ? 'Update academy information' : 'Create a new sports academy'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddAcademyModalOpen(false);
                  setSelectedAcademyForModal(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academy Name *
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedAcademyForModal?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter academy name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      defaultValue={selectedAcademyForModal?.type || 'sports'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sports">Sports</option>
                      <option value="fitness">Fitness</option>
                      <option value="wellness">Wellness</option>
                      <option value="martial-arts">Martial Arts</option>
                      <option value="swimming">Swimming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Established Year
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedAcademyForModal?.establishedYear || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      defaultValue={selectedAcademyForModal?.rating || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0 - 5.0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedAcademyForModal?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the academy and its mission..."
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      defaultValue={selectedAcademyForModal?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="academy@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue={selectedAcademyForModal?.phone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedAcademyForModal?.location || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location or address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      defaultValue={selectedAcademyForModal?.website || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://academy.com"
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedAcademyForModal?.capacity || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Number of students"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedAcademyForModal?.operatingHours || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mon-Fri 8AM-8PM"
                    />
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facilities (comma-separated)
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedAcademyForModal?.facilities?.join(', ') || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Indoor Court, Swimming Pool, Gym, Locker Rooms"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={() => {
                  setIsAddAcademyModalOpen(false);
                  setSelectedAcademyForModal(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save functionality
                  console.log('Save academy functionality to be implemented');
                }}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedAcademyForModal ? 'Update Academy' : 'Create Academy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs Management Modal */}
      {isProgramsModalOpen && selectedAcademyForPrograms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Manage Programs - {selectedAcademyForPrograms.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add, edit, and manage programs for this academy
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProgramsModalOpen(false);
                  setSelectedAcademyForPrograms(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Programs Management</p>
                <p className="text-sm">Add and manage programs for this academy</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsProgramsModalOpen(false);
                  setSelectedAcademyForPrograms(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademiesManagement;
