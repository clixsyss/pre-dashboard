/**
 * Project-Specific Notification Manager Component
 * Allows admins to create, schedule, and send push notifications to users of a specific project
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
  Building2, 
  Bell, 
  Send, 
  Clock, 
  Users, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Search
} from 'lucide-react';
import { db } from '../config/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const NotificationManager = () => {
  const { currentAdmin, loading: adminLoading } = useAdminAuth();
  
  // Project Selection State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(true);
  
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
    deepLink: '' // Add deep link support
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');
  const [projectUsers, setProjectUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    registeredTokens: 0,
    sentToday: 0
  });

  // Load projects
  const fetchProjects = useCallback(async () => {
    if (!currentAdmin) return;

    try {
      setProjectsLoading(true);
      
      // Fetch all projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by admin's assigned projects
      const adminProjects = projectsData.filter(project => 
        currentAdmin?.assignedProjects?.includes(project.id)
      );
      
      setProjects(adminProjects);
      
      // Auto-select if only one project
      if (adminProjects.length === 1) {
        setSelectedProject(adminProjects[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [currentAdmin]);

  // Load project users and stats
  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      // Fetch users for this project
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          if (user.projects && Array.isArray(user.projects)) {
            return user.projects.some(p => p.projectId === selectedProject.id);
          }
          return false;
        });
      
      setProjectUsers(users);

      // Count tokens
      let tokenCount = 0;
      for (const user of users) {
        const tokensSnapshot = await getDocs(collection(db, `users/${user.id}/tokens`));
        tokenCount += tokensSnapshot.size;
      }

      // Count notifications sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const notificationsQuery = query(
        collection(db, `projects/${selectedProject.id}/notifications`),
        where('createdAt', '>=', today),
        where('status', '==', 'sent')
      );
      const todayNotifications = await getDocs(notificationsQuery);

      setStats({
        totalUsers: users.length,
        registeredTokens: tokenCount,
        sentToday: todayNotifications.size
      });

      // Load recent notifications
      await loadRecentNotifications();
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  }, [selectedProject]);

  const loadRecentNotifications = async () => {
    if (!selectedProject) return;

    try {
      const notificationsRef = collection(db, `projects/${selectedProject.id}/notifications`);
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
  };

  useEffect(() => {
    if (currentAdmin && !adminLoading) {
      fetchProjects();
    }
  }, [currentAdmin, adminLoading, fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject, loadProjectData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      if (!selectedProject) {
        throw new Error('Please select a project first');
      }

      // Prepare notification document
      const notificationDoc = {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        title_en: formData.title_en.trim(),
        title_ar: formData.title_ar.trim(),
        body_en: formData.body_en.trim(),
        body_ar: formData.body_ar.trim(),
        type: formData.type,
        sendNow: formData.sendNow,
        scheduledAt: formData.sendNow ? null : new Date(formData.scheduledAt),
        audience: {
          all: formData.audienceType === 'all',
          uids: formData.audienceType === 'specific' ? formData.selectedUsers : [],
          topic: formData.audienceType === 'topic' ? formData.topic : null
        },
        createdBy: currentAdmin.uid,
        createdAt: serverTimestamp(),
        status: 'pending',
        sentAt: null,
        meta: {
          image: formData.image || null,
          deepLink: formData.deepLink || null,
          adminEmail: currentAdmin.email,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`
        }
      };

      // Add notification to project's notifications collection
      const notificationsRef = collection(db, `projects/${selectedProject.id}/notifications`);
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

      // Reload data
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
    if (!selectedProject) return;

    try {
      const notificationRef = doc(db, `projects/${selectedProject.id}/notifications`, notificationId);
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

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Project Selection View
  if (!selectedProject) {
    if (projectsLoading || adminLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
                <p className="text-gray-600 mt-1">Select a project to send notifications</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">No projects match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{project.location}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Bell className="h-3 w-3 mr-1" />
                          Send Notifications
                        </span>
                      </div>
                      <Building2 className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Manage project notifications</span>
                        <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Notification Management View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
                <p className="text-gray-600 text-sm">Push Notification Manager</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{stats.totalUsers}</p>
                  <p className="text-gray-500">Users</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600">{stats.registeredTokens}</p>
                  <p className="text-gray-500">Tokens</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-purple-600">{stats.sentToday}</p>
                  <p className="text-gray-500">Sent Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Send className="h-5 w-5 mr-2 text-blue-600" />
                Create Notification
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
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

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* English Content */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">EN</span>
                    English Content
                  </h3>
                  
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

                {/* Arabic Content */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs mr-2">AR</span>
                    المحتوى العربي (Arabic Content)
                  </h3>
                  
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

                {/* Notification Settings */}
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
                      <option value="all">All Users ({stats.totalUsers})</option>
                      <option value="topic">Topic Subscribers</option>
                      <option value="specific">Specific Users</option>
                    </select>
                  </div>
                </div>

                {/* Topic Input */}
                {formData.audienceType === 'topic' && (
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User IDs (one per line)
                    </label>
                    <textarea
                      name="selectedUsers"
                      value={formData.selectedUsers.join('\n')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        selectedUsers: e.target.value.split('\n').filter(id => id.trim())
                      }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter user IDs (one per line)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.selectedUsers.length} user(s) selected
                    </p>
                  </div>
                )}

                {/* Image URL */}
                <div>
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

                {/* Deep Link */}
                <div>
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

                {/* Send Now or Schedule */}
                <div className="p-4 bg-blue-50 rounded-lg">
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
                    <div className="mt-3">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {showPreview && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewLang('en')}
                      className={`px-3 py-1 rounded text-sm font-medium ${previewLang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setPreviewLang('ar')}
                      className={`px-3 py-1 rounded text-sm font-medium ${previewLang === 'ar' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      AR
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
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
                        {selectedProject.name}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {previewLang === 'en' ? formData.title_en || 'No title' : formData.title_ar || 'لا يوجد عنوان'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewLang === 'en' ? formData.body_en || 'No body' : formData.body_ar || 'لا يوجد نص'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">Just now</p>
                </div>
              </div>
            )}

            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Recent Notifications
              </h3>
              
              <div className="space-y-3">
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => {
                    const badge = getStatusBadge(notification.status);
                    const StatusIcon = badge.icon;
                    
                    return (
                      <div key={notification.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm text-gray-900 line-clamp-1 flex-1">
                            {notification.title_en}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center ${badge.bg} ${badge.text} ml-2`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {notification.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.body_en}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.status === 'sent' && notification.successCount && (
                            <span className="text-green-600 font-medium">
                              {notification.successCount} sent
                            </span>
                          )}
                          {notification.status === 'failed' && (
                            <button
                              onClick={() => retryNotification(notification.id)}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Total Users</span>
                  <span className="font-bold text-2xl">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Active Tokens</span>
                  <span className="font-bold text-2xl">{stats.registeredTokens}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Sent Today</span>
                  <span className="font-bold text-2xl">{stats.sentToday}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
