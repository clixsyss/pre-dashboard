import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image, 
  Video, 
  Eye,
  EyeOff,
  Tag,
  X,
  Save,
  Globe,
  Star
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useUINotificationStore } from '../stores/uiNotificationStore';

const NewsManagementSystem = ({ projectId }) => {
  const { success, error: showError, warning, info } = useUINotificationStore();
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    featured: false,
    isPublished: false,
    mediaFile: null,
    mediaType: 'image'
  });

  useEffect(() => {
    if (projectId) {
      fetchNews();
    }
  }, [projectId]);

  const fetchNews = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, `projects/${projectId}/news`),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const news = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNewsItems(news);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !projectId) return null;
    
    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `news/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        url: downloadURL,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    
    // Check featured limit for new items or when marking as featured
    if (formData.featured && formData.isPublished) {
      const currentFeaturedCount = newsItems.filter(news => news.featured && news.isPublished).length;
      // If editing, don't count the current item
      const excludeCurrent = editingItem && editingItem.featured ? 1 : 0;
      
      if (currentFeaturedCount - excludeCurrent >= 3) {
        warning('You can only have 3 featured news items at a time. Please unfeature another item first.');
        return;
      }
    }
    
    setLoading(true);
    try {
      let mediaData = null;
      
      // Handle file upload if there's a new file
      if (formData.mediaFile) {
        mediaData = await handleFileUpload(formData.mediaFile);
      }
      
      const newsData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        category: formData.category,
        featured: formData.featured,
        isPublished: formData.isPublished,
        authorId: 'admin', // You can get this from auth context
        authorName: 'Admin',
        createdAt: editingItem ? editingItem.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add media data if available
      if (mediaData) {
        newsData.mediaUrl = mediaData.url;
        newsData.mediaType = mediaData.type;
        newsData.mediaFileName = mediaData.fileName;
      } else if (editingItem && editingItem.mediaUrl) {
        // Keep existing media if no new file uploaded
        newsData.mediaUrl = editingItem.mediaUrl;
        newsData.mediaType = editingItem.mediaType;
        newsData.mediaFileName = editingItem.mediaFileName;
      }
      
      // Set publishedAt if publishing for the first time
      if (formData.isPublished && (!editingItem || !editingItem.publishedAt)) {
        newsData.publishedAt = serverTimestamp();
      } else if (editingItem && editingItem.publishedAt) {
        newsData.publishedAt = editingItem.publishedAt;
      }
      
      if (editingItem) {
        // Update existing news
        await updateDoc(doc(db, `projects/${projectId}/news`, editingItem.id), newsData);
      } else {
        // Create new news
        await addDoc(collection(db, `projects/${projectId}/news`), newsData);
      }
      
      setShowModal(false);
      resetForm();
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      showError('Error saving news item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!projectId || !window.confirm('Are you sure you want to delete this news item?')) return;
    
    try {
      // Delete media file if it exists
      if (item.mediaFileName) {
        try {
          const fileRef = storageRef(storage, item.mediaFileName);
          await deleteObject(fileRef);
        } catch (error) {
          console.log('Media file not found or already deleted:', error);
        }
      }
      
      // Delete document
      await deleteDoc(doc(db, `projects/${projectId}/news`, item.id));
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      showError('Error deleting news item. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      content: item.content || '',
      excerpt: item.excerpt || '',
      category: item.category || 'general',
      featured: item.featured || false,
      isPublished: item.isPublished || false,
      mediaFile: null,
      mediaType: item.mediaType || 'image'
    });
    setShowModal(true);
  };

  const toggleVisibility = async (item) => {
    if (!projectId) return;
    
    try {
      const newStatus = !item.isPublished;
      const updateData = {
        isPublished: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus && !item.publishedAt) {
        updateData.publishedAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, `projects/${projectId}/news`, item.id), updateData);
      fetchNews();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showError('Error updating news visibility. Please try again.');
    }
  };

  const toggleFeatured = async (item) => {
    if (!projectId) return;
    
    // Check if we're trying to mark as featured and already have 3 featured items
    if (!item.featured) {
      const currentFeaturedCount = newsItems.filter(news => news.featured && news.isPublished).length;
      if (currentFeaturedCount >= 3) {
        warning('You can only have 3 featured news items at a time. Please unfeature another item first.');
        return;
      }
    }
    
    try {
      await updateDoc(doc(db, `projects/${projectId}/news`, item.id), {
        featured: !item.featured,
        updatedAt: serverTimestamp()
      });
      fetchNews();
      
      if (!item.featured) {
        success('News item marked as featured!');
      } else {
        info('News item removed from featured.');
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      showError('Error updating featured status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'general',
      featured: false,
      isPublished: false,
      mediaFile: null,
      mediaType: 'image'
    });
    setEditingItem(null);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'announcement': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-green-100 text-green-800 border-green-200';
      case 'update': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
          <p className="text-gray-600 mt-1">Create and manage news posts for your project</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Create News Post
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{newsItems.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {newsItems.filter(item => item.isPublished).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {newsItems.filter(item => !item.isPublished).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <EyeOff className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className={`rounded-xl p-4 border ${
          newsItems.filter(item => item.featured && item.isPublished).length >= 3 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Featured</p>
              <p className={`text-2xl font-bold ${
                newsItems.filter(item => item.featured && item.isPublished).length >= 3 
                  ? 'text-yellow-600' 
                  : 'text-purple-600'
              }`}>
                {newsItems.filter(item => item.featured && item.isPublished).length}/3
              </p>
              {newsItems.filter(item => item.featured && item.isPublished).length >= 3 && (
                <p className="text-xs text-yellow-600 mt-1">Limit reached</p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${
              newsItems.filter(item => item.featured && item.isPublished).length >= 3 
                ? 'bg-yellow-100' 
                : 'bg-purple-100'
            }`}>
              <Star className={`h-5 w-5 ${
                newsItems.filter(item => item.featured && item.isPublished).length >= 3 
                  ? 'text-yellow-600' 
                  : 'text-purple-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading news items...</p>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No news posts yet</h3>
            <p className="text-gray-600 mb-6">Create your first news post to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First News Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    News Post
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Media
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {newsItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {item.title || 'Untitled'}
                            </h4>
                            {item.featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.excerpt || item.content || 'No content'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleVisibility(item)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.isPublished 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {item.isPublished ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {item.mediaUrl ? (
                          <>
                            {item.mediaType === 'video' ? (
                              <Video className="h-5 w-5 text-red-500" />
                            ) : (
                              <Image className="h-5 w-5 text-blue-500" />
                            )}
                            <span className="text-sm text-gray-600">Has media</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No media</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFeatured(item)}
                          disabled={!item.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3}
                          className={`p-1 rounded transition-colors ${
                            item.featured 
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : !item.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-yellow-600'
                          }`}
                          title={
                            item.featured 
                              ? 'Remove from featured' 
                              : !item.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3
                                ? 'Featured limit reached (3/3)'
                                : 'Mark as featured'
                          }
                        >
                          <Star className={`h-4 w-4 ${item.featured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingItem ? 'Edit News Post' : 'Create News Post'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter news title"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your news content here..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Short excerpt (optional - will be auto-generated if empty)"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                  <option value="update">Update</option>
                </select>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({ 
                          ...formData, 
                          mediaFile: file,
                          mediaType: file.type.startsWith('video/') ? 'video' : 'image'
                        });
                      }
                    }}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.mediaFile ? formData.mediaFile.name : 'Click to upload image or video'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, MP4, MOV (Max 10MB)
                    </p>
                  </label>
                </div>
                {editingItem && editingItem.mediaUrl && !formData.mediaFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Current media: {editingItem.mediaType === 'video' ? 'Video' : 'Image'}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    disabled={!formData.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="featured" className={`ml-2 text-sm font-medium ${
                    !formData.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Mark as featured
                    {!formData.featured && newsItems.filter(news => news.featured && news.isPublished).length >= 3 && (
                      <span className="text-xs text-yellow-600 ml-1">(Limit reached: 3/3)</span>
                    )}
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
                    Publish immediately
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {uploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingItem ? 'Update Post' : 'Create Post'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagementSystem;
