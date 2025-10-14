/**
 * Notification Manager Component for Admin Dashboard
 * Allows admins to create, schedule, and send push notifications
 * Supports bilingual content (English/Arabic) and audience targeting
 */

import React, { useState, useEffect } from 'react';
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
import { db } from '../config/firebase';
import { useAuthState } from '../hooks/useAuthState';

const NotificationManager = () => {
  const { user } = useAuthState();
  
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
    image: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');

  // Load recent notifications
  useEffect(() => {
    loadRecentNotifications();
  }, []);

  const loadRecentNotifications = async () => {
    try {
      const notificationsRef = collection(db, 'notifications');
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

      // Prepare notification document
      const notificationDoc = {
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
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending',
        sentAt: null,
        meta: {
          image: formData.image || null,
          adminEmail: user.email
        }
      };

      // Add notification to Firestore
      const notificationsRef = collection(db, 'notifications');
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
        image: ''
      });

      // Reload recent notifications
      await loadRecentNotifications();

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
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'pending',
        sendNow: true,
        updatedAt: serverTimestamp()
      });
      
      alert('Notification queued for retry');
      await loadRecentNotifications();
    } catch (error) {
      console.error('Error retrying notification:', error);
      alert('Failed to retry notification: ' + error.message);
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
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      scheduled: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Push Notification Manager</h1>
        <p className="mt-2 text-gray-600">Create and send push notifications to your users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Create Notification</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✓ Notification created successfully and queued for delivery!
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">✗ {error}</p>
                </div>
              )}

              {/* English Content */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">English Content</h3>
                
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
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Arabic Content (المحتوى العربي)</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Arabic) * - العنوان
                  </label>
                  <input
                    type="text"
                    name="title_ar"
                    value={formData.title_ar}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="أدخل عنوان الإشعار بالعربية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.title_ar.length}/50 حرف
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body (Arabic) * - النص
                  </label>
                  <textarea
                    name="body_ar"
                    value={formData.body_ar}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="أدخل نص الإشعار بالعربية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {formData.body_ar.length}/200 حرف
                  </p>
                </div>
              </div>

              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
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
                </select>
              </div>

              {/* Image URL (Optional) */}
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

              {/* Audience Selection */}
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
                  <option value="all">All Users</option>
                  <option value="topic">Topic Subscribers</option>
                  <option value="specific">Specific Users</option>
                </select>

                {formData.audienceType === 'topic' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter topic name (e.g., 'sports', 'news')"
                    />
                  </div>
                )}

                {formData.audienceType === 'specific' && (
                  <div className="mt-3">
                    <textarea
                      name="selectedUsers"
                      value={formData.selectedUsers.join('\n')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        selectedUsers: e.target.value.split('\n').filter(id => id.trim())
                      }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter user IDs (one per line)"
                    />
                  </div>
                )}
              </div>

              {/* Send Now or Schedule */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="sendNow"
                    checked={formData.sendNow}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
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

              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  formData.sendNow ? 'Create & Send Now' : 'Schedule Notification'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Preview & Recent Notifications */}
        <div className="space-y-6">
          {/* Preview Section */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewLang('en')}
                    className={`px-3 py-1 rounded ${previewLang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setPreviewLang('ar')}
                    className={`px-3 py-1 rounded ${previewLang === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    AR
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div className={previewLang === 'ar' ? 'text-right' : ''}>
                  <p className="font-semibold text-gray-900">
                    {previewLang === 'en' ? formData.title_en : formData.title_ar || 'No title'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewLang === 'en' ? formData.body_en : formData.body_ar || 'No body'}
                  </p>
                </div>
                <p className="text-xs text-gray-400">Just now • PRE Group</p>
              </div>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Notifications</h3>
            
            <div className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-gray-500">No recent notifications</p>
              ) : (
                recentNotifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">
                        {notification.title_en}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(notification.status)}`}>
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {notification.body_en}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.status === 'failed' && (
                        <button
                          onClick={() => retryNotification(notification.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;

