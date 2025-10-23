import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image, 
  Video, 
  Eye,
  EyeOff,
  X,
  Save,
  Globe,
  Star,
  MessageCircle,
  User,
  Calendar,
  Trash
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
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useUINotificationStore } from '../stores/uiNotificationStore';
import newsService from '../services/newsService';

const NewsManagementSystem = ({ projectId }) => {
  const { success, error: showError, warning, info } = useUINotificationStore();
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [groupedComments, setGroupedComments] = useState([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentSortOption, setCurrentSortOption] = useState('Most relevant');
  const [newsCategories, setNewsCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    featured: false,
    isPublished: false,
    interactionsEnabled: true,
    mediaFile: null,
    mediaType: 'image',
    linkUrl: '',
    linkTitle: ''
  });

  const fetchCategories = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const q = query(
        collection(db, `projects/${projectId}/newsCategories`),
        orderBy('displayOrder', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const cats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNewsCategories(cats.filter(c => c.isActive !== false));
    } catch (error) {
      console.error('Error fetching news categories:', error);
      // Keep empty if fetch fails
      setNewsCategories([]);
    }
  }, [projectId]);

  const fetchNews = useCallback(async () => {
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
      
      // Get news with reaction counts
      const newsWithCounts = await newsService.getNewsWithReactionCounts(projectId, news);
      setNewsItems(newsWithCounts);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchCategories();
      fetchNews();
    }
  }, [projectId, fetchCategories, fetchNews]);

  // Cleanup comments subscription on unmount
  useEffect(() => {
    return () => {
      // Cleanup will be handled by the onSnapshot unsubscribe
    };
  }, []);

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
        interactionsEnabled: formData.interactionsEnabled,
        authorId: 'admin', // You can get this from auth context
        authorName: 'Admin',
        createdAt: editingItem ? editingItem.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add URL fields if they have actual values
      if (formData.linkUrl && formData.linkUrl.trim() !== '') {
        newsData.linkUrl = formData.linkUrl.trim();
      }
      if (formData.linkTitle && formData.linkTitle.trim() !== '') {
        newsData.linkTitle = formData.linkTitle.trim();
      }
      
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
      interactionsEnabled: item.interactionsEnabled !== false, // Default to true if undefined
      mediaFile: null,
      mediaType: item.mediaType || 'image',
      linkUrl: item.linkUrl || '',
      linkTitle: item.linkTitle || ''
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

  const toggleInteractions = async (item) => {
    if (!projectId) return;
    
    try {
      const newStatus = !(item.interactionsEnabled !== false); // Default to true if undefined
      await updateDoc(doc(db, `projects/${projectId}/news`, item.id), {
        interactionsEnabled: newStatus,
        updatedAt: serverTimestamp()
      });
      fetchNews();
      
      if (newStatus) {
        success('News interactions enabled!');
      } else {
        warning('News interactions disabled!');
      }
    } catch (error) {
      console.error('Error toggling interactions:', error);
      showError('Error updating interaction settings. Please try again.');
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
      interactionsEnabled: true,
      mediaFile: null,
      mediaType: 'image',
      linkUrl: '',
      linkTitle: ''
    });
    setEditingItem(null);
  };

  const getCategoryStyle = (categoryId) => {
    const category = newsCategories.find(c => c.id === categoryId);
    if (!category) return {};
    
    const color = category.color || '#6B7280';
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}50`
    };
  };

  const getCategoryName = (categoryId) => {
    const category = newsCategories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : categoryId;
  };

  // Comments functions
  const openCommentsModal = async (newsItem) => {
    setSelectedNewsItem(newsItem);
    setShowCommentsModal(true);
    await fetchComments(newsItem.id);
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedNewsItem(null);
    setComments([]);
    setGroupedComments([]);
    setReplyingTo(null);
    setReplyText('');
    setShowSortDropdown(false);
  };

  const toggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  const setSortOption = (option) => {
    setCurrentSortOption(option);
    setShowSortDropdown(false);
    // Re-group and sort comments with new option
    setGroupedComments(groupComments(comments));
  };

  const isCurrentUserComment = (comment) => {
    const auth = getAuth();
    const user = auth.currentUser;
    return user && comment.userId === user.uid;
  };

  const deleteCommentWithReplies = async (commentId) => {
    if (!selectedNewsItem) return;
    
    try {
      await newsService.deleteCommentWithReplies(projectId, selectedNewsItem.id, commentId);
      success('Comment and replies deleted successfully.');
      
      // Remove from local state
      setComments(comments.filter(c => c.id !== commentId));
      setGroupedComments(groupComments(comments.filter(c => c.id !== commentId)));
    } catch (error) {
      console.error('Error deleting comment with replies:', error);
      showError('Error deleting comment. Please try again.');
    }
  };

  const fetchComments = async (newsId) => {
    if (!projectId || !newsId) return;
    
    setCommentsLoading(true);
    try {
      const commentsRef = collection(db, `projects/${projectId}/news/${newsId}/comments`);
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
        setGroupedComments(groupComments(commentsData));
        setCommentsLoading(false);
      });

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching comments:', error);
      showError('Error loading comments. Please try again.');
      setCommentsLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!projectId || !selectedNewsItem || !window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const commentRef = doc(db, `projects/${projectId}/news/${selectedNewsItem.id}/comments`, commentId);
      await deleteDoc(commentRef);
      success('Comment deleted successfully.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Error deleting comment. Please try again.');
    }
  };

  const formatCommentDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Group comments by parent-child relationships
  const groupComments = (commentsList) => {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create a map of all comments
    commentsList.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    commentsList.forEach(comment => {
      if (comment.parentCommentId) {
        // This is a reply, add it to its parent's replies
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id));
      }
    });

    // Apply sorting based on current sort option
    const sortComments = (commentList) => {
      switch (currentSortOption) {
        case 'Most relevant':
          // Sort by total interactions (reactions + replies)
          return commentList.sort((a, b) => {
            const aInteractions = (a.reactions ? Object.keys(a.reactions).length : 0) + (a.replies ? a.replies.length : 0);
            const bInteractions = (b.reactions ? Object.keys(b.reactions).length : 0) + (b.replies ? b.replies.length : 0);
            return bInteractions - aInteractions;
          });
        case 'Latest':
          return commentList.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
        case 'Oldest':
          return commentList.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateA - dateB;
          });
        case 'Most liked':
          return commentList.sort((a, b) => {
            const aLikes = a.reactions ? Object.keys(a.reactions).length : 0;
            const bLikes = b.reactions ? Object.keys(b.reactions).length : 0;
            return bLikes - aLikes;
          });
        default:
          return commentList;
      }
    };

    // Sort root comments
    const sortedRootComments = sortComments(rootComments);

    // Sort replies by creation date (oldest first) for all sorting options
    sortedRootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA - dateB;
        });
      }
    });

    return sortedRootComments;
  };

  // Render a single comment with its replies
  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-6 mt-2' : ''}`}>
      <div
        className={`p-3 rounded-lg border ${
          comment.isDeleted 
            ? 'bg-gray-50 border-gray-200 opacity-60' 
            : comment.isAdminReply
              ? 'bg-red-50 border-red-200 shadow-sm'
              : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className={`text-sm font-medium ${
                  comment.isAdminReply ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {comment.userName || 'Anonymous'}
                </span>
                {comment.isAdminReply && (
                  <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatCommentDate(comment.createdAt)}
              </span>
              {comment.userUnit && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  comment.isAdminReply 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {comment.userUnit}
                </span>
              )}
              {comment.userProject && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  comment.isAdminReply 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {comment.userProject}
                </span>
              )}
            </div>
            
            {comment.isDeleted ? (
              <div className="text-gray-500 italic text-sm">
                <p className="mb-1">This comment has been deleted by an admin.</p>
                {comment.deletionReason && (
                  <p className="text-xs">Reason: {comment.deletionReason}</p>
                )}
              </div>
            ) : (
              <div className="text-gray-800 text-sm">
                <p className="whitespace-pre-wrap">{comment.text}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {!comment.isDeleted && !comment.isAdminReply && (
              <button
                onClick={() => startReply(comment)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
                title="Reply to comment"
              >
                <MessageCircle className="h-3 w-3" />
              </button>
            )}
            {!comment.isDeleted && isCurrentUserComment(comment) && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this comment? This will also delete all replies to this comment.')) {
                    deleteCommentWithReplies(comment.id);
                  }
                }}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
                title="Delete your comment"
              >
                <Trash className="h-3 w-3" />
              </button>
            )}
            {!comment.isDeleted && !isCurrentUserComment(comment) && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
                title="Delete comment (Admin)"
              >
                <Trash className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo && replyingTo.id === comment.id && (
        <div className="ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reply to {comment.userName}:
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={submitReply}
                disabled={!replyText.trim() || submittingReply}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={cancelReply}
                className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  // Admin reply functions
  const startReply = (comment) => {
    setReplyingTo(comment);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const submitReply = async () => {
    if (!replyText.trim() || !replyingTo || !selectedNewsItem || !projectId) return;
    
    setSubmittingReply(true);
    try {
      // Get the current admin's authentication info
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        showError('Admin not authenticated. Please log in again.');
        return;
      }

      const commentsRef = collection(db, `projects/${projectId}/news/${selectedNewsItem.id}/comments`);
      const replyData = {
        id: '', // Will be set after creation
        userId: user.uid, // Use actual admin UID
        userName: user.displayName || 'Admin',
        userEmail: user.email || 'admin@pre.com',
        text: replyText.trim(),
        parentCommentId: replyingTo.id,
        reactions: {},
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        deletionReason: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAdminReply: true, // Mark as admin reply
        userUnit: 'Administration',
        userProject: 'PRE Management',
      };

      const docRef = await addDoc(commentsRef, replyData);
      await updateDoc(docRef, { id: docRef.id });
      
      success('Reply posted successfully.');
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error posting reply:', error);
      showError('Error posting reply. Please try again.');
    } finally {
      setSubmittingReply(false);
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
                    Interactions
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
                          {item.linkUrl && (
                            <div className="flex items-center mt-2 text-xs text-blue-600">
                              <Globe className="h-3 w-3 mr-1" />
                              <span className="truncate">{item.linkTitle || 'External Link'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border-2"
                        style={getCategoryStyle(item.category)}
                      >
                        {getCategoryName(item.category)}
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
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10V19H4C3.46957 19 2.96086 18.7893 2.58579 18.4142C2.21071 18.0391 2 17.5304 2 17V12C2 11.4696 2.21071 10.9609 2.58579 10.5858C2.96086 10.2107 3.46957 10 4 10H7ZM7 10V5C7 4.20435 7.31607 3.44129 7.87868 2.87868C8.44129 2.31607 9.20435 2 10 2C10.7956 2 11.5587 2.31607 12.1213 2.87868C12.6839 3.44129 13 4.20435 13 5V8H20C20.5304 8 21.0391 8.21071 21.4142 8.58579C21.7893 8.96086 22 9.46957 22 10V17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H9L7 10Z"/>
                          </svg>
                          <span className="text-xs font-medium text-gray-700">{item.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z"/>
                          </svg>
                          <span className="text-xs font-medium text-gray-700">{item.loveCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 9H9.01M15 9H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"/>
                          </svg>
                          <span className="text-xs font-medium text-gray-700">{item.laughCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"/>
                          </svg>
                          <span className="text-xs font-medium text-gray-700">{item.commentCount || 0}</span>
                        </div>
                      </div>
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
                          onClick={() => toggleInteractions(item)}
                          className={`p-1 rounded transition-colors ${
                            (item.interactionsEnabled !== false) 
                              ? 'text-purple-600 hover:text-purple-700' 
                              : 'text-gray-400 hover:text-purple-600'
                          }`}
                          title={
                            (item.interactionsEnabled !== false)
                              ? 'Disable interactions (comments & reactions)'
                              : 'Enable interactions (comments & reactions)'
                          }
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {(item.interactionsEnabled !== false) ? (
                              // Chat bubble with checkmark (enabled)
                              <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                              </>
                            ) : (
                              // Chat bubble with X (disabled)
                              <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M6 18L18 6" />
                              </>
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => openCommentsModal(item)}
                          className="text-green-600 hover:text-green-800 transition-colors p-1 rounded"
                          title="View Comments"
                        >
                          <MessageCircle className="h-4 w-4" />
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
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[75vh] overflow-y-auto">
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
                  required
                >
                  <option value="">Select a category...</option>
                  {newsCategories.length > 0 ? (
                    newsCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No categories available - create one first</option>
                  )}
                </select>
                {newsCategories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Please create news categories first in the Categories tab
                  </p>
                )}
              </div>

              {/* Link URL and Title */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkTitle}
                    onChange={(e) => setFormData({ ...formData, linkTitle: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Read more about this news..."
                  />
                </div>
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
              <div className="flex flex-wrap items-center gap-6">
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="interactionsEnabled"
                    checked={formData.interactionsEnabled}
                    onChange={(e) => setFormData({ ...formData, interactionsEnabled: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="interactionsEnabled" className="ml-2 text-sm font-medium text-gray-700">
                    Enable interactions (comments & reactions)
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

      {/* Comments Modal */}
      {showCommentsModal && selectedNewsItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[75vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Comments for "{selectedNewsItem.title}"
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(selectedNewsItem.createdAt)}
                      </span>
                    </div>
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={toggleSortDropdown}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {currentSortOption}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      {showSortDropdown && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => setSortOption('Most relevant')}
                            className="block w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          >
                            Most relevant
                          </button>
                          <button
                            onClick={() => setSortOption('Latest')}
                            className="block w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          >
                            Latest
                          </button>
                          <button
                            onClick={() => setSortOption('Oldest')}
                            className="block w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          >
                            Oldest
                          </button>
                          <button
                            onClick={() => setSortOption('Most liked')}
                            className="block w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          >
                            Most liked
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeCommentsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">Loading comments...</span>
                </div>
              ) : groupedComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-base font-medium text-gray-900 mb-1">No comments yet</h4>
                  <p className="text-sm text-gray-500">This news item doesn't have any comments yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedComments.map((comment) => renderComment(comment))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={closeCommentsModal}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagementSystem;
