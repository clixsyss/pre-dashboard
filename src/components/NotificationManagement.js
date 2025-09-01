import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Calendar,
  AlertTriangle,
  Info,
  Megaphone,
  Clock,
  Users,
  Target,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';

const NotificationManagement = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Notification store
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    addNotification,
    updateNotification,
    deleteNotification,
    toggleNotificationStatus,
    getNotificationStats,
    clearNotifications
  } = useNotificationStore();

  useEffect(() => {
    if (projectId) {
      fetchNotifications(projectId);
    }

    return () => {
      clearNotifications();
    };
  }, [projectId, fetchNotifications, clearNotifications]);

  // Filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && notification.isActive) ||
                         (statusFilter === 'inactive' && !notification.isActive);
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  // Stats
  const stats = getNotificationStats();

  // Modal handlers
  const openAddModal = () => {
    resetNotificationForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (notification) => {
    setSelectedNotification(notification);
    setNotificationForm({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'announcement',
      category: notification.category || 'general',
      priority: notification.priority || 'normal',
      targetAudience: notification.targetAudience || 'all',
      specificUsers: notification.specificUsers || [],
      scheduledFor: notification.scheduledFor || '',
      expiresAt: notification.expiresAt || '',
      isActive: notification.isActive !== undefined ? notification.isActive : true,
      requiresAction: notification.requiresAction || false,
      actionUrl: notification.actionUrl || '',
      actionText: notification.actionText || '',
      imageUrl: notification.imageUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedNotification(null);
  };

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    category: 'general',
    priority: 'normal',
    targetAudience: 'all',
    specificUsers: [],
    scheduledFor: '',
    expiresAt: '',
    isActive: true,
    requiresAction: false,
    actionUrl: '',
    actionText: '',
    imageUrl: ''
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!notificationForm.title.trim()) errors.title = 'Title is required';
    if (!notificationForm.message.trim()) errors.message = 'Message is required';
    if (notificationForm.requiresAction && !notificationForm.actionText.trim()) {
      errors.actionText = 'Action text is required when action is enabled';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'announcement',
      category: 'general',
      priority: 'normal',
      targetAudience: 'all',
      specificUsers: [],
      scheduledFor: '',
      expiresAt: '',
      isActive: true,
      requiresAction: false,
      actionUrl: '',
      actionText: '',
      imageUrl: ''
    });
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNotification = async () => {
    if (!validateForm()) return;
    
    try {
      const notificationData = {
        ...notificationForm,
        scheduledFor: notificationForm.scheduledFor ? new Date(notificationForm.scheduledFor) : null,
        expiresAt: notificationForm.expiresAt ? new Date(notificationForm.expiresAt) : null
      };
      
      await addNotification(projectId, notificationData);
      resetNotificationForm();
      closeModals();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const handleEditNotification = async () => {
    if (!validateForm()) return;
    
    try {
      const notificationData = {
        ...notificationForm,
        scheduledFor: notificationForm.scheduledFor ? new Date(notificationForm.scheduledFor) : null,
        expiresAt: notificationForm.expiresAt ? new Date(notificationForm.expiresAt) : null
      };
      
      await updateNotification(projectId, selectedNotification.id, notificationData);
      closeModals();
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      try {
        await deleteNotification(projectId, notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleToggleStatus = async (notificationId, currentStatus) => {
    try {
      await toggleNotificationStatus(projectId, notificationId, !currentStatus);
    } catch (error) {
      console.error('Error toggling notification status:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'announcement': return 'text-purple-600 bg-purple-100';
      case 'event': return 'text-green-600 bg-green-100';
      case 'alert': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Send announcements, events, and alerts to users
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Send Notification
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Megaphone className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.announcements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
            <option value="alert">Alert</option>
            <option value="info">Info</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="mt-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <span className="text-sm text-gray-500">{filteredNotifications.length} notifications</span>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div key={notification.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1 rounded ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {notification.targetAudience === 'all' ? 'All Users' : notification.targetAudience}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        {notification.scheduledFor && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Scheduled: {new Date(notification.scheduledFor).toLocaleDateString()}
                          </div>
                        )}
                        {notification.requiresAction && (
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Requires Action
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openViewModal(notification)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(notification)}
                        className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(notification.id, notification.isActive)}
                        className={`p-1 rounded ${
                          notification.isActive 
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                      >
                        {notification.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">Get started by sending your first notification.</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modals */}
      {(isAddModalOpen || isEditModalOpen || isViewModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAddModalOpen ? 'Send New Notification' :
                 isEditModalOpen ? 'Edit Notification' :
                 'Notification Details'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {isViewModalOpen ? (
                // View Notification Details
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedNotification?.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getTypeColor(selectedNotification?.type)}`}>
                          {getTypeIcon(selectedNotification?.type)}
                        </div>
                        <span className="capitalize">{selectedNotification?.type}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedNotification?.priority)}`}>
                        {selectedNotification?.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedNotification?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedNotification?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedNotification?.message}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                      <p className="text-gray-900 capitalize">{selectedNotification?.targetAudience}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <p className="text-gray-900 capitalize">{selectedNotification?.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                      <p className="text-gray-900">
                        {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                      <p className="text-gray-900">
                        {selectedNotification?.updatedAt ? new Date(selectedNotification.updatedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedNotification?.scheduledFor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
                      <p className="text-gray-900">{new Date(selectedNotification.scheduledFor).toLocaleString()}</p>
                    </div>
                  )}

                  {selectedNotification?.expiresAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expires At</label>
                      <p className="text-gray-900">{new Date(selectedNotification.expiresAt).toLocaleString()}</p>
                    </div>
                  )}

                  {selectedNotification?.requiresAction && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Action Required</h3>
                      <div className="space-y-2">
                        <p><strong>Action Text:</strong> {selectedNotification.actionText}</p>
                        {selectedNotification.actionUrl && (
                          <p><strong>Action URL:</strong> {selectedNotification.actionUrl}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Add/Edit Notification Form
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={notificationForm.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter notification title"
                      />
                      {formErrors.title && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={notificationForm.type}
                        onChange={(e) => handleFormChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="announcement">Announcement</option>
                        <option value="event">Event</option>
                        <option value="alert">Alert</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={notificationForm.priority}
                        onChange={(e) => handleFormChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={notificationForm.category}
                        onChange={(e) => handleFormChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="security">Security</option>
                        <option value="amenities">Amenities</option>
                        <option value="events">Events</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => handleFormChange('message', e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.message ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter notification message"
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
                    )}
                  </div>

                  {/* Target Audience */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Target Audience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audience Type</label>
                        <select
                          value={notificationForm.targetAudience}
                          onChange={(e) => handleFormChange('targetAudience', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Users</option>
                          <option value="residents">Residents Only</option>
                          <option value="staff">Staff Only</option>
                          <option value="specific">Specific Users</option>
                        </select>
                      </div>
                      
                      {notificationForm.targetAudience === 'specific' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specific Users</label>
                          <input
                            type="text"
                            value={notificationForm.specificUsers.join(', ')}
                            onChange={(e) => handleFormChange('specificUsers', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter user IDs separated by commas"
                          />
                          <p className="mt-1 text-sm text-gray-500">Enter user IDs separated by commas</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Scheduling</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For (Optional)</label>
                        <input
                          type="datetime-local"
                          value={notificationForm.scheduledFor}
                          onChange={(e) => handleFormChange('scheduledFor', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">Leave empty to send immediately</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (Optional)</label>
                        <input
                          type="datetime-local"
                          value={notificationForm.expiresAt}
                          onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">Leave empty for no expiration</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Settings */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requiresAction"
                          checked={notificationForm.requiresAction}
                          onChange={(e) => handleFormChange('requiresAction', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requiresAction" className="text-sm font-medium text-gray-700">
                          Requires User Action
                        </label>
                      </div>
                      
                      {notificationForm.requiresAction && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Action Text <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={notificationForm.actionText}
                              onChange={(e) => handleFormChange('actionText', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors.actionText ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="e.g., View Details, Book Now"
                            />
                            {formErrors.actionText && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.actionText}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Action URL (Optional)</label>
                            <input
                              type="url"
                              value={notificationForm.actionUrl}
                              onChange={(e) => handleFormChange('actionUrl', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={notificationForm.isActive}
                        onChange={(e) => handleFormChange('isActive', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Active (visible to users)
                      </label>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              {!isViewModalOpen && (
                <button
                  onClick={isAddModalOpen ? handleAddNotification : handleEditNotification}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isAddModalOpen ? 'Send Notification' : 'Update Notification'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
