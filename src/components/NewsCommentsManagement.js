import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  RotateCcw, 
  Eye, 
  AlertTriangle,
  User,
  Shield
} from 'lucide-react';
import { 
  getAllProjectComments, 
  deleteComment, 
  restoreComment, 
  getCommentStats 
} from '../services/newsCommentsService';
import { getUserDetails, formatUserForDisplay } from '../services/userService';

const NewsCommentsManagement = ({ projectId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // all, active, deleted
    search: ''
  });
  const [selectedComment, setSelectedComment] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchComments();
      fetchStats();
    }
  }, [projectId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await getAllProjectComments(projectId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const fetchedStats = await getCommentStats(projectId);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    setLoadingUserDetails(true);
    try {
      const userData = await getUserDetails(userId);
      setUserDetails(formatUserForDisplay(userData));
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      try {
        await deleteComment(projectId, comment.newsId, comment.id, 'admin', 'Deleted by administrator');
        await fetchComments();
        await fetchStats();
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleRestoreComment = async (comment) => {
    try {
      await restoreComment(projectId, comment.newsId, comment.id);
      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error('Error restoring comment:', error);
    }
  };

  const handleViewUserDetails = (comment) => {
    setSelectedComment(comment);
    setShowUserDetails(true);
    fetchUserDetails(comment.userId);
  };

  const filteredComments = comments.filter(comment => {
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && !comment.isDeleted) ||
      (filters.status === 'deleted' && comment.isDeleted);
    
    const matchesSearch = !filters.search || 
      comment.text.toLowerCase().includes(filters.search.toLowerCase()) ||
      comment.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
      comment.newsTitle.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (isDeleted) => {
    return isDeleted ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const getStatusText = (isDeleted) => {
    return isDeleted ? 'Deleted' : 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comments Management</h2>
          <p className="text-gray-600">Moderate and manage news comments</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-success-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Trash2 className="w-8 h-8 text-danger-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deleted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-accent-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Reactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withReactions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search comments..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, status: 'all' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filters.status === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters({ ...filters, status: 'active' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filters.status === 'active' 
                  ? 'bg-success-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilters({ ...filters, status: 'deleted' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filters.status === 'deleted' 
                  ? 'bg-danger-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deleted
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading comments...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
            <p className="text-gray-600">No comments match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Comment Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {comment.userName?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{comment.userName || 'Anonymous'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.isDeleted)}`}>
                            {getStatusText(comment.isDeleted)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatTime(comment.createdAt)}</span>
                          <span>•</span>
                          <span>{comment.newsTitle}</span>
                          {comment.userUnit && (
                            <>
                              <span>•</span>
                              <span>Unit {comment.userUnit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="mb-4">
                      <p className={`text-gray-900 ${comment.isDeleted ? 'line-through opacity-60' : ''}`}>
                        {comment.text}
                      </p>
                      {comment.isDeleted && comment.deletionReason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Deletion Reason:</p>
                              <p className="text-sm text-red-700">{comment.deletionReason}</p>
                              <p className="text-xs text-red-600 mt-1">
                                Deleted {formatTime(comment.deletedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {Object.entries(comment.reactions).map(([emoji, reaction]) => (
                          <span key={emoji} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                            <span>{emoji}</span>
                            <span>{reaction.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewUserDetails(comment)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View user details"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    
                    {comment.isDeleted ? (
                      <button
                        onClick={() => handleRestoreComment(comment)}
                        className="p-2 text-success-600 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                        title="Restore comment"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteComment(comment)}
                        className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loadingUserDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-gray-600">Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{userDetails.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{userDetails.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{userDetails.mobile}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Unit</label>
                      <p className="text-sm text-gray-900">{userDetails.projects?.[0]?.userUnit || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Unable to load user details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsCommentsManagement;
