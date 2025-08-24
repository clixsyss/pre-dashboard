import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign,
  MoreVertical
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Courts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    type: 'indoor',
    surface: '',
    capacity: '',
    hourlyRate: '',
    description: '',
    amenities: '',
    operatingHours: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'courts'));
      const courtsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourts(courtsData);
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourt) {
        await updateDoc(doc(db, 'courts', editingCourt.id), formData);
      } else {
        await addDoc(collection(db, 'courts'), formData);
      }
      setShowModal(false);
      setEditingCourt(null);
      resetForm();
      fetchCourts();
    } catch (error) {
      console.error('Error saving court:', error);
    }
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name || '',
      sport: court.sport || '',
      type: court.type || 'indoor',
      surface: court.surface || '',
      capacity: court.capacity || '',
      hourlyRate: court.hourlyRate || '',
      description: court.description || '',
      amenities: court.amenities || '',
      operatingHours: court.operatingHours || '',
      address: court.address || '',
      phone: court.phone || '',
      email: court.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courtId) => {
    if (window.confirm('Are you sure you want to delete this court?')) {
      try {
        await deleteDoc(doc(db, 'courts', courtId));
        fetchCourts();
      } catch (error) {
        console.error('Error deleting court:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sport: '',
      type: 'indoor',
      surface: '',
      capacity: '',
      hourlyRate: '',
      description: '',
      amenities: '',
      operatingHours: '',
      address: '',
      phone: '',
      email: ''
    });
  };

  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || court.type === filterType;
    return matchesSearch && matchesFilter;
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{court.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        court.type === 'indoor' ? 'bg-blue-100 text-blue-800' :
                        court.type === 'outdoor' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {court.type}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {court.sport}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{court.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{court.operatingHours || '24/7'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>${court.hourlyRate || '0'}/hour</span>
                  </div>
                </div>

                {court.description && (
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{court.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Capacity: {court.capacity || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(court)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(court.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courts found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first sports court'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => {
                setEditingCourt(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Court
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingCourt ? 'Edit Court' : 'Add New Court'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingCourt(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Court Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                      <input
                        type="text"
                        required
                        value={formData.sport}
                        onChange={(e) => setFormData({...formData, sport: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="covered">Covered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Surface</label>
                      <input
                        type="text"
                        value={formData.surface}
                        onChange={(e) => setFormData({...formData, surface: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                      <input
                        type="text"
                        value={formData.amenities}
                        onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
                      <input
                        type="text"
                        value={formData.operatingHours}
                        onChange={(e) => setFormData({...formData, operatingHours: e.target.value})}
                        placeholder="e.g., 6:00 AM - 10:00 PM"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCourt(null);
                        resetForm();
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingCourt ? 'Update Court' : 'Add Court'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;
