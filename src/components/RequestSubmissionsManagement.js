import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  User,
  FileText,
  Image as ImageIcon,
  Paperclip,
  MessageCircle
} from 'lucide-react';
import AdminRequestChat from './AdminRequestChat';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const RequestSubmissionsManagement = ({ projectId, selectedCategory, onBack }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatSubmission, setChatSubmission] = useState(null);

  // Fetch categories for filter
  const fetchCategories = useCallback(async () => {
    try {
      const q = query(
        collection(db, `projects/${projectId}/requestCategories`),
        orderBy('englishTitle', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [projectId]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, `projects/${projectId}/requestSubmissions`),
        orderBy('createdAt', 'desc')
      );

      // Apply category filter if specific category is selected
      if (selectedCategory) {
        q = query(
          collection(db, `projects/${projectId}/requestSubmissions`),
          where('categoryId', '==', selectedCategory.id),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchSubmissions();
  }, [fetchCategories, fetchSubmissions]);

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || submission.status === statusFilter;

    const matchesCategory = 
      categoryFilter === 'all' || submission.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Update submission status
  const updateStatus = async (submissionId, newStatus) => {
    try {
      await updateDoc(doc(db, `projects/${projectId}/requestSubmissions`, submissionId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: newStatus, updatedAt: new Date() }
            : sub
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // View submission details
  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  // Open chat for submission
  const openChat = (submission) => {
    setChatSubmission(submission);
    setShowChat(true);
  };

  // Close chat
  const closeChat = () => {
    setShowChat(false);
    setChatSubmission(null);
  };

  // Handle status update from chat
  const handleStatusUpdate = (submissionId, newStatus) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, status: newStatus, updatedAt: new Date() }
          : sub
      )
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'in_progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {selectedCategory && (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? `${selectedCategory.englishTitle} Submissions` : 'Request Submissions'}
            </h2>
            <p className="text-gray-600">
              {selectedCategory 
                ? `Manage submissions for ${selectedCategory.englishTitle}` 
                : 'View and manage all request submissions'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Search submissions..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {!selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.englishTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => {
                const StatusIcon = getStatusIcon(submission.status);
                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.userName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.userEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.categoryName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewSubmission(submission)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => openChat(submission)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </button>
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(submission.id, 'in_progress')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => updateStatus(submission.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateStatus(submission.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {submission.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => updateStatus(submission.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateStatus(submission.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No request submissions have been made yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Submission Details Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Submission Details - {selectedSubmission.categoryName}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{selectedSubmission.userName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedSubmission.userEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mobile</label>
                    <p className="text-sm text-gray-900">{selectedSubmission.userPhone || selectedSubmission.userMobile || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSubmission.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Form Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Form Data</h4>
                <div className="space-y-4">
                  {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]) => {
                    // Debug: Log the submission data structure
                    console.log('Debug submission data:', {
                      key,
                      value,
                      hasFieldMetadata: !!selectedSubmission.fieldMetadata,
                      fieldMetadata: selectedSubmission.fieldMetadata,
                      submissionKeys: Object.keys(selectedSubmission)
                    });
                    
                    // Find the field metadata for this field ID
                    const fieldMetadata = selectedSubmission.fieldMetadata?.find(field => field.id === key);
                    const fieldName = fieldMetadata?.fieldName || key.replace(/([A-Z])/g, ' $1').trim();
                    const fieldType = fieldMetadata?.fieldType || 'text';
                    const isRequired = fieldMetadata?.required || false;
                    
                    
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-gray-500">
                            {fieldName}
                          </label>
                          <div className="flex items-center space-x-2">
                            {isRequired && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {fieldType}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || 'Not provided')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Media Files */}
              {selectedSubmission.mediaFiles && selectedSubmission.mediaFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Attached Files</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedSubmission.mediaFiles.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Paperclip className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-900 truncate">{file.name}</span>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                {selectedSubmission.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        updateStatus(selectedSubmission.id, 'in_progress');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Start Processing
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(selectedSubmission.id, 'completed');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(selectedSubmission.id, 'rejected');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedSubmission.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => {
                        updateStatus(selectedSubmission.id, 'completed');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(selectedSubmission.id, 'rejected');
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Chat Modal */}
      {showChat && chatSubmission && (
        <AdminRequestChat
          projectId={projectId}
          requestId={chatSubmission.id}
          requestData={chatSubmission}
          onBack={closeChat}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default RequestSubmissionsManagement;
