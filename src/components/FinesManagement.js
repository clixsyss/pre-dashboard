import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  MessageCircle, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Upload,
  X
} from 'lucide-react';
import { 
  getFines, 
  getFinesByStatus, 
  createFine, 
  updateFineStatus, 
  updateFineDetails,
  searchUsers,
  uploadFineImage,
  addMessage,
  onFineChange
} from '../services/finesService';

const FinesManagement = ({ projectId }) => {
  const [fines, setFines] = useState([]);
  const [filteredFines, setFilteredFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    issued: 0,
    paid: 0,
    disputed: 0,
    cancelled: 0
  });

  // Create Fine Modal State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    amount: '',
    occurrenceDate: '',
    issuingDate: new Date().toISOString().split('T')[0],
    description: '',
    evidenceImage: null
  });
  const [uploading, setUploading] = useState(false);

  // Load fines
  const loadFines = useCallback(async () => {
    try {
      setLoading(true);
      const finesData = await getFines(projectId);
      setFines(finesData);
      setFilteredFines(finesData);
      
      // Calculate stats
      const stats = finesData.reduce((acc, fine) => {
        acc.total++;
        acc[fine.status] = (acc[fine.status] || 0) + 1;
        return acc;
      }, { total: 0, issued: 0, paid: 0, disputed: 0, cancelled: 0 });
      
      setStats(stats);
    } catch (error) {
      console.error('Error loading fines:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFines();
  }, [loadFines]);

  // Setup real-time listener when chat opens
  useEffect(() => {
    let unsubscribe = null;
    
    if (showChat && selectedFine) {
      unsubscribe = setupChatListener(selectedFine.id);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showChat, selectedFine]);

  // Filter fines
  useEffect(() => {
    let filtered = fines;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(fine => 
        fine.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.userUnit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.amount?.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fine => fine.status === statusFilter);
    }

    setFilteredFines(filtered);
  }, [fines, searchTerm, statusFilter]);

  // Search users
  const handleUserSearch = async (term) => {
    setUserSearchTerm(term);
    if (term.length > 2) {
      try {
        console.log('Searching users with term:', term);
        const results = await searchUsers(projectId, term);
        console.log('Search results:', results);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        alert('Error searching users. Please try again.');
      }
    } else {
      setSearchResults([]);
    }
  };

  // Handle form submission
  const handleCreateFine = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    if (!formData.occurrenceDate) {
      alert('Please select an occurrence date');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setUploading(true);
      
      let evidenceUrl = null;
      if (formData.evidenceImage) {
        evidenceUrl = await uploadFineImage(projectId, 'temp', formData.evidenceImage);
      }

      const fineData = {
        userId: selectedUser.id,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        userPhone: selectedUser.phone,
        userUnit: selectedUser.unitNumber || selectedUser.userUnit,
        reason: formData.reason,
        amount: parseFloat(formData.amount),
        occurrenceDate: formData.occurrenceDate ? new Date(formData.occurrenceDate) : null,
        issuingDate: formData.issuingDate ? new Date(formData.issuingDate) : new Date(),
        description: formData.description,
        evidenceImage: evidenceUrl,
        issuedBy: 'admin' // You might want to get actual admin info
      };

      console.log('Creating fine with data:', fineData); // Debug log

      await createFine(projectId, fineData);
      await loadFines();
      setShowCreateModal(false);
      resetForm();
      alert('Fine issued successfully!');
    } catch (error) {
      console.error('Error creating fine:', error);
      alert('Error issuing fine');
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      reason: '',
      amount: '',
      occurrenceDate: '',
      issuingDate: new Date().toISOString().split('T')[0],
      description: '',
      evidenceImage: null
    });
    setSelectedUser(null);
    setUserSearchTerm('');
    setSearchResults([]);
  };

  // Handle status update
  const handleStatusUpdate = async (fineId, newStatus, reason) => {
    try {
      await updateFineStatus(projectId, fineId, newStatus, reason);
      await loadFines();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  // Open chat modal
  const openChat = (fine) => {
    setSelectedFine(fine);
    setChatMessages(fine.messages || []);
    setShowChat(true);
  };

  // Close chat modal
  const closeChat = () => {
    setShowChat(false);
    setSelectedFine(null);
    setChatMessages([]);
    setNewMessage('');
    removeSelectedImage();
  };

  // Send message in chat
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedFine) return;

    try {
      setSendingMessage(true);
      
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await uploadFineImage(projectId, selectedFine.id, selectedImage);
        setUploadingImage(false);
      }

      const messageData = {
        text: newMessage.trim(),
        sender: 'admin',
        imageUrl
      };

      await addMessage(projectId, selectedFine.id, messageData);
      setNewMessage('');
      removeSelectedImage();
      
      // The real-time listener will update the messages
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview('');
  };

  // Setup real-time chat listener
  const setupChatListener = (fineId) => {
    return onFineChange(projectId, fineId, (updatedFine) => {
      if (updatedFine) {
        setChatMessages(updatedFine.messages || []);
        setSelectedFine(updatedFine);
      }
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    let date;
    // Handle different date formats
    if (dateString?.toDate) {
      // Firestore Timestamp
      date = dateString.toDate();
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else {
      return 'Invalid date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      issued: 'text-orange-600 bg-orange-50',
      paid: 'text-green-600 bg-green-50',
      disputed: 'text-red-600 bg-red-50',
      cancelled: 'text-gray-600 bg-gray-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      issued: AlertTriangle,
      paid: CheckCircle,
      disputed: XCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || AlertTriangle;
    return <Icon className="w-4 h-4" />;
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    // Handle different timestamp formats
    if (timestamp?.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fines & Violations</h1>
          <p className="text-gray-600">Manage user fines and violations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Issue Fine
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Fines</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issued</p>
              <p className="text-2xl font-bold text-orange-600">{stats.issued}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disputed</p>
              <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, unit, reason, or amount..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fines List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFines.map((fine) => (
                <tr key={fine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{fine.userName}</div>
                        <div className="text-sm text-gray-500">Unit {fine.userUnit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{fine.reason}</div>
                    {fine.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{fine.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(fine.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                      {getStatusIcon(fine.status)}
                      {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(fine.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFine(fine);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openChat(fine)}
                        className="text-green-600 hover:text-green-900"
                        title="Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {fine.status === 'issued' && (
                        <button
                          onClick={() => handleStatusUpdate(fine.id, 'paid', 'Marked as paid by admin')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFines.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fines found</h3>
            <p className="text-gray-500">No fines match your current filters.</p>
          </div>
        )}
      </div>

      {/* Create Fine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Issue New Fine</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateFine} className="space-y-4">
              {/* User Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search User *
                </label>
                <input
                  type="text"
                  placeholder="Search by name, unit, email, phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  required
                />
                
                {/* Search Results */}
                {userSearchTerm.length > 2 && (
                  <div className="mt-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearchTerm(`${user.name} - Unit ${user.unitNumber || user.userUnit || 'N/A'}`);
                            setSearchResults([]);
                          }}
                        >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          Unit {user.unitNumber || user.userUnit || 'N/A'} • {user.email}
                          {user.phone && <span> • {user.phone}</span>}
                        </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No users found matching "{userSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected User */}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">{selectedUser.name}</div>
                    <div className="text-sm text-blue-700">
                      Unit {selectedUser.unitNumber || selectedUser.userUnit || 'N/A'} • {selectedUser.email}
                      {selectedUser.phone && <span> • {selectedUser.phone}</span>}
                      {selectedUser.userRole && <span> • {selectedUser.userRole}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Fine Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="e.g., Parking violation, Noise complaint"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (EGP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occurrence Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.occurrenceDate}
                    onChange={(e) => setFormData({...formData, occurrenceDate: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuing Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.issuingDate}
                    onChange={(e) => setFormData({...formData, issuingDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about the violation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setFormData({...formData, evidenceImage: e.target.files[0]})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Issue Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal - Placeholder */}
      {showDetailModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Fine Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedFine.userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <p className="text-sm text-gray-900">{selectedFine.userUnit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedFine.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFine.status)}`}>
                    {getStatusIcon(selectedFine.status)}
                    {selectedFine.status.charAt(0).toUpperCase() + selectedFine.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <p className="text-sm text-gray-900">{selectedFine.reason}</p>
              </div>
              
              {selectedFine.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedFine.description}</p>
                </div>
              )}
              
              {selectedFine.evidenceImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evidence</label>
                  <img 
                    src={selectedFine.evidenceImage} 
                    alt="Evidence" 
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedFine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col" style={{ height: '80vh' }}>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Fine Chat: {selectedFine.reason}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedFine.userName} (Unit {selectedFine.userUnit}) • {formatCurrency(selectedFine.amount)}
                  </p>
                </div>
                <button
                  onClick={closeChat}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'admin'
                            ? 'bg-blue-500 text-white'
                            : message.sender === 'system'
                            ? 'bg-gray-200 text-gray-700 text-center'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {message.text && <p className="text-sm">{message.text}</p>}
                        {message.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={message.imageUrl} 
                              alt="Attached image" 
                              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                              onClick={() => window.open(message.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Selected image" 
                      className="max-w-xs max-h-32 rounded-lg border"
                    />
                    <button
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMessage}
                  />
                  
                  {/* Image Upload Button */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="chat-image-upload"
                  />
                  <label
                    htmlFor="chat-image-upload"
                    className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center justify-center"
                    title="Attach Image"
                  >
                    <Upload className="w-4 h-4" />
                  </label>
                  
                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedImage) || sendingMessage || uploadingImage}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(sendingMessage || uploadingImage) && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {uploadingImage ? 'Uploading...' : 'Send'}
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

export default FinesManagement;
