import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Filter, 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import useComplaintStore from '../stores/complaintStore';

const ComplaintsManagement = ({ projectId }) => {
  const { 
    complaints, 
    loading, 
    stats, 
    filters,
    fetchComplaints, 
    fetchStats,
    setFilters,
    deleteComplaint
  } = useComplaintStore();
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchComplaints(projectId);
      fetchStats(projectId);
    }
  }, [projectId, fetchComplaints, fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    if (projectId) {
      fetchComplaints(projectId, { [key]: value });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchTerm });
    if (projectId) {
      fetchComplaints(projectId, { search: searchTerm });
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      try {
        await deleteComplaint(projectId, complaintId);
      } catch (error) {
        console.error('Error deleting complaint:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'Resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Closed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessage = (complaint) => {
    if (!complaint.messages || complaint.messages.length === 0) return 'No messages';
    const lastMessage = complaint.messages[complaint.messages.length - 1];
    return lastMessage.text || 'Image message';
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Please select a project to manage complaints.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaints Management</h2>
          <p className="text-gray-600">Manage user complaints and support requests</p>
        </div>
        <button
          onClick={() => setShowComplaintModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-gray-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="gate_access">Gate Access</option>
                <option value="noise">Noise Complaint</option>
                <option value="maintenance">Maintenance Request</option>
                <option value="security">Security Issue</option>
                <option value="facility">Facility Issue</option>
                <option value="billing">Billing Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading complaints...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                    <p className="text-gray-500">No complaints match your current filters.</p>
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                        <div className="text-sm text-gray-500">{complaint.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{complaint.userId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        <span className="ml-1">{complaint.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {getLastMessage(complaint)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Complaint"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComplaint(complaint.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Complaint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {showComplaintModal && selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          projectId={projectId}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedComplaint(null);
          }}
        />
      )}
    </div>
  );
};

// Complaint Detail Modal Component
const ComplaintDetailModal = ({ complaint, projectId, onClose }) => {
  const { updateComplaintStatus, addMessage, uploadComplaintImage } = useComplaintStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateComplaintStatus(projectId, complaint.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let imageData = null;
      if (selectedFile) {
        setUploading(true);
        imageData = await uploadComplaintImage(selectedFile, complaint.id);
      }

      await addMessage(projectId, complaint.id, {
        senderType: 'admin',
        senderId: 'admin', // You can get this from auth context if needed
        text: newMessage.trim() || 'Image message',
        imageUrl: imageData?.url || null,
        imageFileName: imageData?.fileName || null
      });

      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">Complaint #{complaint.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  complaint.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                  complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="max-w-4xl mx-auto space-y-4">
            {complaint.messages?.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${message.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  message.senderType === 'admin' ? 'bg-gray-600' : 'bg-red-600'
                }`}>
                  {message.senderType === 'admin' ? 'A' : 'U'}
                </div>
                
                {/* Message */}
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    message.senderType === 'admin'
                      ? 'bg-white text-gray-900 border border-gray-200'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {message.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={message.imageUrl}
                        alt="Message attachment"
                        className="w-full max-w-xs h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                  {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
                  <p className={`text-xs mt-2 ${
                    message.senderType === 'admin' ? 'text-gray-500' : 'text-red-100'
                  }`}>
                    {message.timestamp?.toDate?.()?.toLocaleString() || new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              title="Attach Image/Video"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>
            
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              {uploading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={uploading || (!newMessage.trim() && !selectedFile)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </form>
          
          {selectedFile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintsManagement;
