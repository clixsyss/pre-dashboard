/**
 * Project-Specific FCM Push Notification Management
 * Integrated into ProjectDashboard for sending push notifications to project users
 * Supports bilingual content (English/Arabic) and audience targeting
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  Bell, 
  Send,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Target,
  Megaphone,
  Plus,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db } from '../config/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const NotificationManagement = ({ projectId }) => {
  const { currentAdmin } = useAdminAuth();

  // Form state
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    body_en: '',
    body_ar: '',
    type: 'announcement',
    sendNow: true,
    scheduledAt: '',
    audienceType: 'all',
    selectedUsers: [],
    topic: '',
    image: '',
    deepLink: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');
  const [stats, setStats] = useState({
    totalUsers: 0,
    registeredTokens: 0,
    sentToday: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Load recent notifications
  const loadRecentNotifications = useCallback(async () => {
    if (!projectId) return;

    try {
      const notificationsRef = collection(db, `projects/${projectId}/notifications`);
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRecentNotifications(notifications);
    } catch (error) {
      console.error('Error loading recent notifications:', error);
    }
  }, [projectId]);

  // Load project data
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;

    try {
      // Fetch users for this project
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          if (user.projects && Array.isArray(user.projects)) {
            return user.projects.some(p => p.projectId === projectId);
          }
          return false;
        });

      // Store project users for selection
      setProjectUsers(users);

      // Count tokens (optional - may not have permission)
      let tokenCount = 0;
      try {
        for (const user of users) {
          try {
            const tokensSnapshot = await getDocs(collection(db, `users/${user.id}/tokens`));
            tokenCount += tokensSnapshot.size;
          } catch (err) {
            // Silently skip token counting if no permission
            console.warn(`Cannot count tokens for user ${user.id}: insufficient permissions`);
          }
        }
      } catch (err) {
        console.warn('Token counting not available due to permissions');
      }

      // Count notifications sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      try {
        const notificationsQuery = query(
          collection(db, `projects/${projectId}/notifications`),
          where('createdAt', '>=', today),
          where('status', '==', 'sent')
        );
        const todayNotifications = await getDocs(notificationsQuery);

        setStats({
          totalUsers: users.length,
          registeredTokens: tokenCount,
          sentToday: todayNotifications.size
        });
      } catch (err) {
        console.error('Error fetching notification stats:', err);
        setStats({
          totalUsers: users.length,
          registeredTokens: tokenCount,
          sentToday: 0
        });
      }

      // Load recent notifications
      await loadRecentNotifications();
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  }, [projectId, loadRecentNotifications]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // User selection handlers
  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeSelectedUser = (userId) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const selectAllUsers = () => {
    const filteredUsers = getFilteredUsers();
    const allFilteredIds = filteredUsers.map(u => u.id);
    setSelectedUserIds(prev => {
      // Merge existing selections with new ones (avoid duplicates)
      const combined = [...new Set([...prev, ...allFilteredIds])];
      return combined;
    });
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  // Get selected user objects
  const getSelectedUsers = () => {
    return projectUsers.filter(user => selectedUserIds.includes(user.id));
  };

  // Filter users based on search
  const getFilteredUsers = () => {
    if (!userSearchTerm) return projectUsers;
    
    const searchLower = userSearchTerm.toLowerCase();
    return projectUsers.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const userProject = user.projects?.find(p => p.projectId === projectId);
      const unit = (userProject?.unit || '').toLowerCase();
      
      return fullName.includes(searchLower) || 
             email.includes(searchLower) || 
             unit.includes(searchLower);
    });
  };

  // Get paginated users
  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const filtered = getFilteredUsers();
    return Math.ceil(filtered.length / usersPerPage);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      console.log('[NotificationManagement] Prevented double submission');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.title_en || !formData.body_en) {
        throw new Error('English title and body are required');
      }

      if (!formData.title_ar || !formData.body_ar) {
        throw new Error('Arabic title and body are required');
      }

      if (!projectId) {
        throw new Error('Project ID is missing');
      }

      // Get project name
      const projectDoc = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
      const projectName = !projectDoc.empty ? projectDoc.docs[0].data().name : 'Unknown Project';

      // Prepare notification document
      const notificationDoc = {
        projectId: projectId,
        projectName: projectName,
        title_en: formData.title_en.trim(),
        title_ar: formData.title_ar.trim(),
        body_en: formData.body_en.trim(),
        body_ar: formData.body_ar.trim(),
        type: formData.type,
        sendNow: formData.sendNow,
        scheduledAt: formData.sendNow ? null : new Date(formData.scheduledAt),
        audience: {
          all: formData.audienceType === 'all',
          uids: formData.audienceType === 'specific' ? selectedUserIds : [],
          topic: formData.audienceType === 'topic' ? formData.topic : null
        },
        createdBy: currentAdmin?.uid || 'unknown',
        createdAt: serverTimestamp(),
        status: 'pending',
        sentAt: null,
        meta: {
          image: formData.image || null,
          deepLink: formData.deepLink || null,
          adminEmail: currentAdmin?.email || 'unknown',
          adminName: `${currentAdmin?.firstName || ''} ${currentAdmin?.lastName || ''}`.trim() || 'Admin'
        }
      };

      // Add notification to project's notifications collection
      const notificationsRef = collection(db, `projects/${projectId}/notifications`);
      const docRef = await addDoc(notificationsRef, notificationDoc);

      console.log('Notification created:', docRef.id);

      // Show success message
      setSuccess(true);
      setError(null);

      // Reset form
      setFormData({
        title_en: '',
        title_ar: '',
        body_en: '',
        body_ar: '',
        type: 'announcement',
        sendNow: true,
        scheduledAt: '',
        audienceType: 'all',
        selectedUsers: [],
        topic: '',
        image: '',
        deepLink: ''
      });
      setSelectedUserIds([]);
      setUserSearchTerm('');
      setCurrentPage(1);
      setShowPreview(false);

      // Hide form and reload data
      setShowForm(false);
      await loadProjectData();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error creating notification:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const retryNotification = async (notificationId) => {
    if (!projectId) return;

    try {
      const notificationRef = doc(db, `projects/${projectId}/notifications`, notificationId);
      await updateDoc(notificationRef, {
        status: 'pending',
        sendNow: true,
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadRecentNotifications();
      } catch (error) {
      console.error('Error retrying notification:', error);
      setError('Failed to retry notification: ' + error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      sent: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock }
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Push Notification Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Send FCM push notifications to your project users
          </p>
        </div>
          <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Hide Form' : 'Send Notification'}
          </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tokens</p>
              <p className="text-3xl font-bold text-gray-900">{stats.registeredTokens}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-xl">
              <Send className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sent Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.sentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent</p>
              <p className="text-3xl font-bold text-gray-900">{recentNotifications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">
              Notification created successfully!
            </p>
            <p className="text-green-700 text-sm mt-1">
              It's being processed and will be delivered shortly.
            </p>
          </div>
                          </div>
                        )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create Notification Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-900">Create New Notification</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* English Content */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-gray-900 flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">EN</span>
                English Content
              </h4>

              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    name="title_en"
                    value={formData.title_en}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter notification title in English"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.title_en.length}/50 characters
                  </p>
                  </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body (English) *
                  </label>
                  <textarea
                    name="body_en"
                    value={formData.body_en}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter notification body in English"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.body_en.length}/200 characters
                      </p>
                    </div>
                    </div>
                  </div>

            {/* Arabic Content */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-semibold text-gray-900 flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs mr-2">AR</span>
                المحتوى العربي (Arabic Content)
              </h4>

              <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان (Title) *
                      </label>
                      <input
                        type="text"
                    name="title_ar"
                    value={formData.title_ar}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                    placeholder="أدخل عنوان الإشعار بالعربية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.title_ar.length}/50 حرف
                  </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    النص (Body) *
                      </label>
                  <textarea
                    name="body_ar"
                    value={formData.body_ar}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                    placeholder="أدخل نص الإشعار بالعربية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.body_ar.length}/200 حرف
                  </p>
                </div>
              </div>
                    </div>

            {/* Notification Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Notification Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                      </label>
                      <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="announcement">📢 Announcement</option>
                    <option value="promo">🎁 Promotion</option>
                    <option value="news">📰 News</option>
                    <option value="booking">📅 Booking</option>
                    <option value="order">🛍️ Order</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="event">🎉 Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                      </label>
                      <select
                    name="audienceType"
                    value={formData.audienceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Project Users ({stats.totalUsers})</option>
                    <option value="topic">Topic Subscribers</option>
                    <option value="specific">Specific Users</option>
                      </select>
                  </div>

                {/* Topic Input */}
                {formData.audienceType === 'topic' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Name
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., sports, news, announcements"
                    />
                  </div>
                )}

                {/* Specific Users */}
                {formData.audienceType === 'specific' && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Users ({selectedUserIds.length} selected)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllUsers}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Select All {userSearchTerm ? 'Filtered' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllUsers}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                  </div>

                    {/* Selected Users Display */}
                    {selectedUserIds.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-2">Selected Users:</p>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedUsers().map((user) => (
                            <div
                              key={user.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 rounded-full text-xs"
                            >
                              <span className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeSelectedUser(user.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remove user"
                              >
                                <X className="h-3 w-3" />
                              </button>
                      </div>
                          ))}
                        </div>
                      </div>
                    )}
                      
                    {/* Search Bar */}
                    <div className="mb-3">
                          <input
                            type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or unit..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                        </div>

                    {/* User List */}
                    <div className="border border-gray-300 rounded-lg bg-white">
                      {getFilteredUsers().length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                            {getPaginatedUsers().map((user) => {
                              const userProject = user.projects?.find(p => p.projectId === projectId);
                              const isSelected = selectedUserIds.includes(user.id);
                              
                              return (
                                <label
                                  key={user.id}
                                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    isSelected ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleUserSelection(user.id)}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    {userProject?.unit && (
                                      <p className="text-xs text-blue-600 mt-0.5">Unit: {userProject.unit}</p>
                      )}
                    </div>
                                </label>
                              );
                            })}
                  </div>

                          {/* Pagination Controls */}
                          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Show:</span>
                              <select
                                value={usersPerPage}
                                onChange={(e) => {
                                  setUsersPerPage(Number(e.target.value));
                                  setCurrentPage(1);
                                }}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                              </select>
                              <span className="text-xs text-gray-600">
                                Showing {(currentPage - 1) * usersPerPage + 1}-
                                {Math.min(currentPage * usersPerPage, getFilteredUsers().length)} of{' '}
                                {getFilteredUsers().length}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <span className="text-xs text-gray-600">
                                Page {currentPage} of {getTotalPages()}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                                disabled={currentPage >= getTotalPages()}
                                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedUserIds.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        📢 Notification will be sent to {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                        <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                      </div>
                      
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deep Link (Optional)
                  </label>
                        <input
                    type="text"
                    name="deepLink"
                    value={formData.deepLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/home, /news/123, /bookings"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    App route to navigate to when notification is tapped
                  </p>
                      </div>
                    </div>
                  </div>

            {/* Send Now or Schedule */}
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">Delivery Options</h4>
              <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                  name="sendNow"
                  checked={formData.sendNow}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Send immediately
                </span>
                        </label>
                      
              {!formData.sendNow && (
                <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule for
                            </label>
                            <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleInputChange}
                    required={!formData.sendNow}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                            )}
                          </div>
                          
            {/* Preview Section */}
            {showPreview && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Notification Preview</h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewLang('en')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${previewLang === 'en'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLang('ar')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${previewLang === 'ar'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      AR
                    </button>
                          </div>
                        </div>

                <div className="border border-gray-300 rounded-lg p-4 space-y-3 bg-white">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className={previewLang === 'ar' ? 'text-right' : ''}>
                    <div className="flex items-center mb-2">
                      <Bell className="h-4 w-4 text-blue-600 mr-2" />
                      <p className="font-semibold text-gray-900 text-sm">
                        PRE Group
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 text-base">
                      {previewLang === 'en' ? formData.title_en || 'No title' : formData.title_ar || 'لا يوجد عنوان'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewLang === 'en' ? formData.body_en || 'No body' : formData.body_ar || 'لا يوجد نص'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">Just now</p>
                    </div>
                  </div>
              )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700 font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
                <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {formData.sendNow ? 'Create & Send Now' : 'Schedule Notification'}
                  </>
                )}
                </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    title_en: '',
                    title_ar: '',
                    body_en: '',
                    body_ar: '',
                    type: 'announcement',
                    sendNow: true,
                    scheduledAt: '',
                    audienceType: 'all',
                    selectedUsers: [],
                    topic: '',
                    image: '',
                    deepLink: ''
                  });
                  setSelectedUserIds([]);
                  setUserSearchTerm('');
                  setCurrentPage(1);
                  setShowPreview(false);
                }}
                className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Notifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">History of sent and scheduled notifications</p>
            </div>

        {recentNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">Get started by sending your first notification to project users.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentNotifications.map((notification) => {
                  const badge = getStatusBadge(notification.status);
                  const StatusIcon = badge.icon;

                  return (
                    <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Bell className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {notification.title_en}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {notification.body_en}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full capitalize">
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.audience?.all ? (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            All Users
                          </div>
                        ) : notification.audience?.topic ? (
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-2 text-gray-400" />
                            Topic: {notification.audience.topic}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {notification.audience?.uids?.length || 0} users
        </div>
      )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.status === 'sent' ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-green-600 font-medium">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {notification.successCount || 0} sent
                            </div>
                            {notification.failureCount > 0 && (
                              <div className="text-red-600 text-xs">
                                {notification.failureCount} failed
                              </div>
                            )}
                          </div>
                        ) : notification.status === 'failed' ? (
                          <div className="text-red-600 text-xs">
                            <XCircle className="h-4 w-4 inline mr-1" />
                            Failed
                          </div>
                        ) : (
                          <div className="text-gray-500 text-xs">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {notification.status === 'failed' && (
                            <button
                              onClick={() => retryNotification(notification.id)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Retry Notification"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-sm p-6 border border-red-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="ml-4">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Push Notification System</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Powered by Firebase Cloud Messaging (FCM)
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Supports iOS, Android, and Web platforms
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Bilingual content (English & Arabic)
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Only users in this project will receive notifications
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Real-time delivery with automatic retry on failure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
