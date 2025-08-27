import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign,
  MoreVertical,
  Trophy,
  Users,
  Calendar,
  Star
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCourtStore, useSportsStore } from '../stores';

const Courts = () => {
  const { projectId } = useParams();
  const { 
    courts, 
    loading: courtsLoading, 
    error: courtsError,
    fetchCourts, 
    addCourt, 
    updateCourt, 
    deleteCourt 
  } = useCourtStore();
  
  const { 
    sports, 
    loading: sportsLoading, 
    fetchSports 
  } = useSportsStore();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sportId: '',
    sportName: '',
    type: 'indoor',
    surface: '',
    capacity: '',
    hourlyRate: '',
    description: '',
    amenities: '',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '22:00', isOpen: true },
      saturday: { open: '09:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '22:00', isOpen: true }
    },
    address: '',
    phone: '',
    email: '',
    isActive: true
  });

  useEffect(() => {
    if (projectId) {
      fetchCourts(projectId);
      fetchSports(projectId);
    }
  }, [projectId, fetchCourts, fetchSports]);

  useEffect(() => {
    setLoading(courtsLoading || sportsLoading);
  }, [courtsLoading, sportsLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const courtData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingCourt) {
        await updateCourt(projectId, editingCourt.id, courtData);
      } else {
        courtData.createdAt = new Date();
        await addCourt(projectId, courtData);
      }
      
      setShowModal(false);
      setEditingCourt(null);
      resetForm();
    } catch (error) {
      console.error('Error saving court:', error);
    }
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name || '',
      sportId: court.sportId || '',
      sportName: court.sportName || '',
      type: court.type || 'indoor',
      surface: court.surface || '',
      capacity: court.capacity || '',
      hourlyRate: court.hourlyRate || '',
      description: court.description || '',
      amenities: court.amenities || '',
      operatingHours: court.operatingHours || {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '22:00', isOpen: true },
        sunday: { open: '09:00', close: '22:00', isOpen: true }
      },
      address: court.address || '',
      phone: court.phone || '',
      email: court.email || '',
      isActive: court.isActive !== undefined ? court.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (courtId) => {
    if (window.confirm('Are you sure you want to delete this court? This will also affect all bookings associated with it.')) {
      try {
        await deleteCourt(projectId, courtId);
      } catch (error) {
        console.error('Error deleting court:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sportId: '',
      sportName: '',
      type: 'indoor',
      surface: '',
      capacity: '',
      hourlyRate: '',
      description: '',
      amenities: '',
      operatingHours: {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '22:00', isOpen: true },
        sunday: { open: '09:00', close: '22:00', isOpen: true }
      },
      address: '',
      phone: '',
      email: '',
      isActive: true
    });
  };

  // Safe filtering with null checks
  const filteredCourts = courts.filter(court => {
    const name = court.name || '';
    const sportName = court.sportName || '';
    const address = court.address || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = name.toLowerCase().includes(searchLower) ||
                         sportName.toLowerCase().includes(searchLower) ||
                         address.toLowerCase().includes(searchLower);
    const matchesType = filterType === 'all' || court.type === filterType;
    const matchesSport = filterSport === 'all' || court.sportId === filterSport;
    return matchesSearch && matchesType && matchesSport;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading courts...</p>
        </div>
      </div>
    );
  }

  if (courtsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading courts: {courtsError}</div>
        <button 
          onClick={() => fetchCourts(projectId)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Courts</h1>
          <p className="text-gray-600 mt-2">Manage all sports courts and facilities</p>
        </div>
        <button
          onClick={() => {
            setEditingCourt(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Court
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courts by name, sport, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sports</option>
            {sports.map(sport => (
              <option key={sport.id} value={sport.id}>{sport.name || 'Unnamed Sport'}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="covered">Covered</option>
          </select>
        </div>
      </div>

      {/* Courts Grid */}
      {filteredCourts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <div key={court.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{court.name || 'Unnamed Court'}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        court.type === 'indoor' ? 'bg-blue-100 text-blue-800' :
                        court.type === 'outdoor' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {court.type || 'unknown'}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {court.sportName || 'No Sport'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(court)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Edit Court"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(court.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded"
                      title="Delete Court"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {court.description || 'No description available'}
                </p>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  {court.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{court.address}</span>
                    </div>
                  )}
                  
                  {court.capacity && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Capacity: {court.capacity}</span>
                    </div>
                  )}
                  
                  {court.hourlyRate && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>${court.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      court.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {court.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {court.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently updated'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courts found</h3>
          <p className="text-gray-600">
            {searchTerm || filterSport !== 'all' || filterType !== 'all' 
              ? 'No courts match your search criteria.' 
              : 'Get started by adding your first sports court'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Court Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCourt ? 'Edit Court' : 'Add New Court'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Court Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Court 1, Tennis Court A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sport *</label>
                    <select
                      required
                      value={formData.sportId}
                      onChange={(e) => {
                        const selectedSport = sports.find(sport => sport.id === e.target.value);
                        setFormData({
                          ...formData, 
                          sportId: e.target.value,
                          sportName: selectedSport?.name || ''
                        });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a sport</option>
                      {sports.map(sport => (
                        <option key={sport.id} value={sport.id}>
                          {sport.name || 'Unnamed Sport'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="covered">Covered</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Surface</label>
                    <input
                      type="text"
                      value={formData.surface}
                      onChange={(e) => setFormData({...formData, surface: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Hard court, Grass, Clay"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 25.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the court..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amenities</label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Lighting, Parking, Changing rooms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full address of the court"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contact phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contact email address"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Court is active and available for booking
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingCourt ? 'Update Court' : 'Add Court'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;
