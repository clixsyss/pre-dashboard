import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Filter,
  Search,
  Eye,
  Trash2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  Activity,
  TrendingUp,
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';
import useComplaintStore from '../stores/complaintStore';
import { getComprehensiveUserDetails, formatUserForDisplay } from '../services/userService';
import * as XLSX from 'xlsx';

const ComplaintsManagement = ({ projectId }) => {
  const {
    complaints,
    loading,
    stats,
    filters,
    fetchComplaints,
    fetchStats,
    setFilters,
    deleteComplaint,
    updateComplaintStatus
  } = useComplaintStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchComplaints(projectId);
      fetchStats(projectId);
    }
  }, [projectId, fetchComplaints, fetchStats]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownOpen && !event.target.closest('.relative.inline-block')) {
        setStatusDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusDropdownOpen]);

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
    // Fetch user details when viewing complaint
    fetchUserDetails(complaint.userId);
  };

  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    setLoadingUserDetails(true);
    try {
      const userData = await getComprehensiveUserDetails(userId);
      console.log('Fetched user data:', userData);
      console.log('User projects:', userData?.projects);
      setUserDetails(formatUserForDisplay(userData));
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    } finally {
      setLoadingUserDetails(false);
    }
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

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await updateComplaintStatus(projectId, complaintId, newStatus);
      setStatusDropdownOpen(null);
      // Refresh complaints to get updated data
      await fetchComplaints(projectId);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const statusOptions = [
    { value: 'Open', label: 'Open', color: 'blue', icon: '🆕' },
    { value: 'In Progress', label: 'In Progress', color: 'orange', icon: '⏳' },
    { value: 'Resolved', label: 'Resolved', color: 'green', icon: '✅' }
  ];

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

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Filter by date range if specified
      let dataToExport = complaints;
      
      if (exportStartDate || exportEndDate) {
        dataToExport = complaints.filter(complaint => {
          const complaintDate = complaint.createdAt?.toDate ? complaint.createdAt.toDate() : new Date(complaint.createdAt);
          
          if (exportStartDate && exportEndDate) {
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return complaintDate >= start && complaintDate <= end;
          } else if (exportStartDate) {
            const start = new Date(exportStartDate);
            return complaintDate >= start;
          } else if (exportEndDate) {
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            return complaintDate <= end;
          }
          return true;
        });
      }

      // Prepare data for export
      const exportData = dataToExport.map(complaint => ({
        'ID': complaint.id,
        'Title': complaint.title || 'N/A',
        'Category': complaint.category || 'N/A',
        'User ID': complaint.userId || 'N/A',
        'Status': complaint.status || 'N/A',
        'Priority': complaint.priority || 'N/A',
        'Last Message': getLastMessage(complaint),
        'Created At': formatDate(complaint.createdAt),
        'Updated At': formatDate(complaint.updatedAt)
      }));

      if (exportData.length === 0) {
        alert('No data to export for the selected date range.');
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // ID
        { wch: 30 }, // Title
        { wch: 20 }, // Category
        { wch: 25 }, // User ID
        { wch: 15 }, // Status
        { wch: 15 }, // Priority
        { wch: 40 }, // Last Message
        { wch: 20 }, // Created At
        { wch: 20 }  // Updated At
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Complaints');

      // Generate Excel file
      const dateRange = exportStartDate && exportEndDate 
        ? `${exportStartDate}_to_${exportEndDate}`
        : exportStartDate 
        ? `from_${exportStartDate}`
        : exportEndDate 
        ? `to_${exportEndDate}`
        : new Date().toISOString().split('T')[0];
      const fileName = `Complaints_${dateRange}.xlsx`;
      XLSX.writeFile(wb, fileName);

      console.log('Complaints exported successfully');
      setShowExportModal(false);
      setExportStartDate('');
      setExportEndDate('');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
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
      <div className="flex justify-betweeen align-items-center items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaints Management</h2>
          <p className="text-gray-600">Manage user complaints and support requests</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
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
                <option value="Open">🆕 Open</option>
                <option value="In Progress">⏳ In Progress</option>
                <option value="Resolved">✅ Resolved</option>
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
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setStatusDropdownOpen(statusDropdownOpen === complaint.id ? null : complaint.id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getStatusColor(complaint.status)} hover:shadow-md`}
                          title="Click to change status"
                        >
                          <span className="mr-1.5">
                            {statusOptions.find(s => s.value === complaint.status)?.icon || '📋'}
                          </span>
                          <span>{complaint.status}</span>
                          <ChevronDown className="w-3 h-3 ml-1.5" />
                        </button>
                        
                        {statusDropdownOpen === complaint.id && (
                          <div className="absolute z-50 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusUpdate(complaint.id, option.value)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors ${
                                    complaint.status === option.value ? 'bg-gray-50 font-medium' : ''
                                  }`}
                                  disabled={complaint.status === option.value}
                                >
                                  <span className="mr-2">{option.icon}</span>
                                  <span>{option.label}</span>
                                  {complaint.status === option.value && (
                                    <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
          userDetails={userDetails}
          showUserDetails={showUserDetails}
          setShowUserDetails={setShowUserDetails}
          loadingUserDetails={loadingUserDetails}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedComplaint(null);
            setUserDetails(null);
            setShowUserDetails(false);
          }}
        />
      )}

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export to Excel</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a date range to export or leave empty to export all data
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Complaint Detail Modal Component
const ComplaintDetailModal = ({ complaint, projectId, onClose, userDetails, showUserDetails, setShowUserDetails, loadingUserDetails }) => {
  const { updateComplaintStatus, addMessage, uploadComplaintImage, subscribeToComplaint, currentComplaint } = useComplaintStore();

  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const messagesEndRef = useRef(null);

  // Use real-time complaint data if available, otherwise fallback to prop
  const currentComplaintData = currentComplaint || complaint;
  const isComplaintClosed = currentComplaintData?.status === 'Closed';

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Add a small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentComplaintData.messages]);

  // Set up real-time subscription
  useEffect(() => {
    if (projectId && complaint.id) {
      const unsubscribeFn = subscribeToComplaint(projectId, complaint.id);
      setUnsubscribe(() => unsubscribeFn);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId, complaint.id, subscribeToComplaint, unsubscribe]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateComplaintStatus(projectId, currentComplaintData.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    if (isComplaintClosed) return;

    try {
      let imageData = null;
      if (selectedFile) {
        setUploading(true);
        imageData = await uploadComplaintImage(selectedFile, currentComplaintData.id);
      }

      await addMessage(projectId, currentComplaintData.id, {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{currentComplaintData.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Complaint #{currentComplaintData.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentComplaintData.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                    currentComplaintData.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      currentComplaintData.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {currentComplaintData.status}
                  </span>
                </div>
                {/* User Project & Unit Info */}
                {userDetails && userDetails.projects && userDetails.projects.length > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building className="w-3 h-3" />
                      <span>{userDetails.projects.find(p => p.id === projectId)?.name || userDetails.projects[0]?.name || 'Unknown Project'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>Unit {userDetails.projects.find(p => p.id === projectId)?.userUnit || userDetails.projects[0]?.userUnit || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Details Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUserDetails(!showUserDetails)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                User Details
                {showUserDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* User Details Section */}
          {showUserDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              {loadingUserDetails ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Name</span>
                        </div>
                        <p className="text-sm text-gray-900">{userDetails.fullName}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Email</span>
                        </div>
                        <p className="text-sm text-gray-900">{userDetails.email}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Phone</span>
                        </div>
                        <p className="text-sm text-gray-900">{userDetails.mobile}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Date of Birth</span>
                        </div>
                        <p className="text-sm text-gray-900">{userDetails.dateOfBirth}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">National ID</span>
                        </div>
                        <p className="text-sm text-gray-900">{userDetails.nationalId}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Gender</span>
                        </div>
                        <p className="text-sm text-gray-900 capitalize">{userDetails.gender}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Profile Status</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userDetails.isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {userDetails.isProfileComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                      
                      {/* Current Project & Unit */}
                      {userDetails.projects && userDetails.projects.length > 0 && (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Current Project</span>
                            </div>
                            <p className="text-sm text-gray-900">
                              {userDetails.projects.find(p => p.id === projectId)?.name || 
                               userDetails.projects[0]?.name || 'No project found'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Current Unit</span>
                            </div>
                            <p className="text-sm text-gray-900">
                              Unit {userDetails.projects.find(p => p.id === projectId)?.userUnit || 
                                    userDetails.projects[0]?.userUnit || 'N/A'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Projects and Units */}
                  {userDetails.projects && userDetails.projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Projects & Units ({userDetails.projects.length})
                      </h4>
                      <div className="space-y-2">
                        {userDetails.projects.map((project, index) => (
                          <div key={project.id || index} className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{project.name || 'Unknown Project'}</h5>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {project.location || 'Location not set'}
                                  </span>
                                  <span className="text-sm text-gray-600">Unit {project.userUnit || 'N/A'}</span>
                                  <span className="text-sm text-gray-600">Role: {project.userRole || 'Member'}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                                project.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {project.status || 'active'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Metrics */}
                  {userDetails.activityMetrics && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Activity Overview
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Building className="w-4 h-4 text-blue-500" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{userDetails.activityMetrics.totalProjects || 0}</p>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Calendar className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{userDetails.activityMetrics.totalBookings || 0}</p>
                          <p className="text-xs text-gray-600">Total Bookings</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{userDetails.activityMetrics.recentBookings || 0}</p>
                          <p className="text-xs text-gray-600">Recent (30d)</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border text-center">
                          <div className="flex items-center justify-center mb-1">
                            <FileText className="w-4 h-4 text-red-500" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{userDetails.activityMetrics.totalComplaints || 0}</p>
                          <p className="text-xs text-gray-600">Complaints</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings */}
                  {userDetails.bookings && userDetails.bookings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Recent Bookings ({userDetails.bookings.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetails.bookings.slice(0, 5).map((booking, index) => (
                          <div key={booking.id || index} className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {booking.type === 'court' ? 'Court Booking' :
                                    booking.type === 'academy' ? 'Academy Registration' :
                                      'Booking'}
                                </h5>
                                <p className="text-sm text-gray-600">{booking.projectName}</p>
                                {booking.date && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(booking.date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {booking.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Complaints */}
                  {userDetails.complaints && userDetails.complaints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Recent Complaints ({userDetails.complaints.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetails.complaints.slice(0, 3).map((complaint, index) => (
                          <div key={complaint.id || index} className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{complaint.title || 'Complaint'}</h5>
                                <p className="text-sm text-gray-600">{complaint.projectName}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(complaint.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${complaint.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                    complaint.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}>
                                {complaint.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Unable to load user details</p>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="max-w-4xl mx-auto space-y-4">
            {currentComplaintData.messages?.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${message.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${message.senderType === 'admin' ? 'bg-gray-600' : 'bg-red-600'
                  }`}>
                  {message.senderType === 'admin' ? 'A' : 'U'}
                </div>

                {/* Message */}
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${message.senderType === 'admin'
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
                  <p className={`text-xs mt-2 ${message.senderType === 'admin' ? 'text-gray-500' : 'text-red-100'
                    }`}>
                    {message.timestamp?.toDate?.()?.toLocaleString() || new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Status and Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          {/* Closed Complaint Notice */}
          {isComplaintClosed && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium">This complaint has been closed. You can view the conversation but cannot send new messages.</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  value={currentComplaintData.status}
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
          <form onSubmit={handleSendMessage} className={`flex items-end gap-3 ${isComplaintClosed ? 'opacity-50' : ''}`}>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              disabled={isComplaintClosed}
            />
            <label
              htmlFor="file-input"
              className={`p-3 border border-gray-300 rounded-lg transition-colors ${isComplaintClosed ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}
              title={isComplaintClosed ? "Cannot attach files to closed complaints" : "Attach Image/Video"}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>

            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isComplaintClosed ? "This complaint is closed" : "Type your message..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                disabled={isComplaintClosed}
              />
              {uploading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || (!newMessage.trim() && !selectedFile) || isComplaintClosed}
              className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title={isComplaintClosed ? "Cannot send messages to closed complaints" : "Send Message"}
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
