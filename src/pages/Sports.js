import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Trophy,
  Users,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Sports = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'team', // team, individual, water, indoor, outdoor
    maxPlayers: '',
    minPlayers: '',
    equipment: '',
    rules: '',
    isActive: true
  });

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'sports'));
      const sportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSports(sportsData);
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSport) {
        await updateDoc(doc(db, 'sports', editingSport.id), formData);
      } else {
        await addDoc(collection(db, 'sports'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setShowModal(false);
      setEditingSport(null);
      resetForm();
      fetchSports();
    } catch (error) {
      console.error('Error saving sport:', error);
    }
  };

  const handleEdit = (sport) => {
    setEditingSport(sport);
    setFormData({
      name: sport.name || '',
      description: sport.description || '',
      category: sport.category || 'team',
      maxPlayers: sport.maxPlayers || '',
      minPlayers: sport.minPlayers || '',
      equipment: sport.equipment || '',
      rules: sport.rules || '',
      isActive: sport.isActive !== undefined ? sport.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (sportId) => {
    if (window.confirm('Are you sure you want to delete this sport? This will also affect all courts associated with it.')) {
      try {
        await deleteDoc(doc(db, 'sports', sportId));
        fetchSports();
      } catch (error) {
        console.error('Error deleting sport:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'team',
      maxPlayers: '',
      minPlayers: '',
      equipment: '',
      rules: '',
      isActive: true
    });
  };

  const filteredSports = sports.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sport.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sport.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sports Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sports and activities available for booking
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingSport(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Sport
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sports by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredSports.length} of {sports.length} sports
        </div>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSports.map((sport) => (
          <div key={sport.id} className="bg-white rounded-lg shadow-soft p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{sport.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    sport.category === 'team' ? 'bg-blue-100 text-blue-800' :
                    sport.category === 'individual' ? 'bg-green-100 text-green-800' :
                    sport.category === 'water' ? 'bg-cyan-100 text-cyan-800' :
                    sport.category === 'indoor' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sport.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(sport)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title="Edit Sport"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(sport.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded"
                  title="Delete Sport"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {sport.description || 'No description available'}
            </p>

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {sport.minPlayers && sport.maxPlayers 
                  ? `${sport.minPlayers}-${sport.maxPlayers} players`
                  : sport.maxPlayers 
                    ? `Up to ${sport.maxPlayers} players`
                    : 'No player limit specified'
                }
              </div>
              
              {sport.equipment && (
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  <span className="truncate">{sport.equipment}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  sport.isActive 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {sport.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-400">
                  {sport.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently updated'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Sport Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingSport ? 'Edit Sport' : 'Add New Sport'}
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
                    <label className="block text-sm font-medium text-gray-700">Sport Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Football, Tennis, Swimming"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="team">Team Sport</option>
                      <option value="individual">Individual Sport</option>
                      <option value="water">Water Sport</option>
                      <option value="indoor">Indoor Sport</option>
                      <option value="outdoor">Outdoor Sport</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of the sport..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Players</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minPlayers}
                      onChange={(e) => setFormData({...formData, minPlayers: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Players</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({...formData, maxPlayers: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., 22"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Required Equipment</label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Ball, Net, Rackets"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rules & Guidelines</label>
                  <textarea
                    value={formData.rules}
                    onChange={(e) => setFormData({...formData, rules: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Basic rules and guidelines..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Sport is active and available for booking
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
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingSport ? 'Update Sport' : 'Add Sport'}
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

export default Sports;
