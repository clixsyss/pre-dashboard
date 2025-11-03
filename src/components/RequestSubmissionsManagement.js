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
  getDoc,
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendStatusNotification } from '../services/statusNotificationService';

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
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);

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

  // Fetch submissions with pagination
  const fetchSubmissions = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      console.log('📊 RequestSubmissions: Fetching with optimization...');
      
      let q = query(
        collection(db, `projects/${projectId}/requestSubmissions`),
        orderBy('createdAt', 'desc'),
        limit(100) // OPTIMIZATION: Limit to 100 most recent submissions
      );

      // Apply category filter if specific category is selected
      if (selectedCategory) {
        q = query(
          collection(db, `projects/${projectId}/requestSubmissions`),
          where('categoryId', '==', selectedCategory.id),
          orderBy('createdAt', 'desc'),
          limit(100) // OPTIMIZATION: Limit to 100 submissions
        );
      }

      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ RequestSubmissions: Fetched ${submissionsData.length} submissions (limited)`);
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
      
      // Find submission to get user details
      const submission = submissions.find(s => s.id === submissionId);
      
      // Send push notification to user
      if (submission?.userId) {
        try {
          const requestName = submission.categoryName || 'your request';
          let title_en = 'Request Status Update';
          let title_ar = 'تحديث حالة الطلب';
          let body_en = '';
          let body_ar = '';
          
          switch (newStatus) {
            case 'pending':
              body_en = `Your request for "${requestName}" is now pending review by our team.`;
              body_ar = `طلبك لـ "${requestName}" قيد المراجعة من قبل فريقنا.`;
              break;
            case 'in_progress':
              body_en = `Great news! Work has started on your request for "${requestName}". Our team is now processing your request.`;
              body_ar = `أخبار رائعة! بدأ العمل على طلبك لـ "${requestName}". فريقنا يعمل الآن على طلبك.`;
              break;
            case 'completed':
              body_en = `Your request for "${requestName}" has been completed! Thank you for using our services.`;
              body_ar = `تم إكمال طلبك لـ "${requestName}"! شكراً لاستخدام خدماتنا.`;
              break;
            case 'rejected':
              body_en = `Your request for "${requestName}" has been reviewed but cannot be approved at this time. Please contact the management office for more information.`;
              body_ar = `تمت مراجعة طلبك لـ "${requestName}" ولكن لا يمكن الموافقة عليه في هذا الوقت. يرجى الاتصال بمكتب الإدارة للحصول على مزيد من المعلومات.`;
              break;
            default:
              body_en = `Your request for "${requestName}" status has been updated to ${newStatus.toUpperCase()}.`;
              body_ar = `تم تحديث حالة طلبك لـ "${requestName}" إلى ${newStatus.toUpperCase()}.`;
          }
          
          await sendStatusNotification(projectId, submission.userId, title_en, body_en, title_ar, body_ar, 'alert');
          console.log('Request status notification sent successfully');
        } catch (notificationError) {
          console.warn('Failed to send status notification:', notificationError);
          // Don't fail the status update if notification fails
        }
      }
      
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

  // Fetch complete user data
  const fetchUserData = async (userId) => {
    if (!userId) return null;
    
    setLoadingUserData(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        return {
          id: userDocSnap.id,
          ...userDocSnap.data()
        };
      }
      
      console.warn('User document not found for ID:', userId);
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    } finally {
      setLoadingUserData(false);
    }
  };

  // View submission details
  const viewSubmission = async (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
    
    // Fetch complete user data
    if (submission.userId) {
      const fullUserData = await fetchUserData(submission.userId);
      setUserData(fullUserData);
    } else {
      setUserData(null);
    }
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
                  Media
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
                      {submission.mediaFiles && submission.mediaFiles.length > 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {submission.mediaFiles.slice(0, 3).map((file, idx) => (
                              file.url && file.type?.startsWith('image/') ? (
                                <img
                                  key={idx}
                                  src={file.url}
                                  alt={`Preview ${idx}`}
                                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                  title={file.name}
                                />
                              ) : (
                                <div 
                                  key={idx}
                                  className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
                                  title={file.name}
                                >
                                  <Paperclip className="h-4 w-4 text-gray-500" />
                                </div>
                              )
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            {submission.mediaFiles.length} file{submission.mediaFiles.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No files</span>
                      )}
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[75vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Submission Details - {selectedSubmission.categoryName}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-red-600" />
                  Complete User Information
                </h4>
                
                {loadingUserData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading user details...</span>
                  </div>
                ) : userData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Personal Information */}
                    <div className="col-span-full">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Personal Information</h5>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900 font-medium">
                        {userData.firstName && userData.lastName 
                          ? `${userData.firstName} ${userData.lastName}` 
                          : userData.userName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{userData.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mobile</label>
                      <p className="text-sm text-gray-900">{userData.mobile || userData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-sm text-gray-900 capitalize">{userData.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm text-gray-900">{userData.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">National ID</label>
                      <p className="text-sm text-gray-900">{userData.nationalId || 'Not provided'}</p>
                    </div>
                    
                    {/* Property Information - Only for current project */}
                    {userData.projects && userData.projects.length > 0 && (() => {
                      // Find the project matching the current projectId
                      const currentProject = userData.projects.find(p => p.projectId === projectId || p.id === projectId);
                      
                      if (!currentProject) {
                        return (
                          <div className="col-span-full mt-2">
                            <p className="text-sm text-yellow-600 italic">User project details not found for this project</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          <div className="col-span-full mt-2">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                              Property Information (This Project)
                            </h5>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Unit Number</label>
                            <p className="text-sm text-gray-900 font-medium">{currentProject.unit || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <p className="text-sm text-gray-900 capitalize">{currentProject.role || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Registration Status</label>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              currentProject.registrationStatus === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : currentProject.registrationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {currentProject.registrationStatus || 'Unknown'}
                            </span>
                          </div>
                          {currentProject.compound && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Compound</label>
                              <p className="text-sm text-gray-900">{currentProject.compound}</p>
                            </div>
                          )}
                          {currentProject.registrationStep && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Registration Step</label>
                              <p className="text-sm text-gray-900 capitalize">{currentProject.registrationStep.replace(/_/g, ' ')}</p>
                            </div>
                          )}
                          {currentProject.updatedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Last Updated</label>
                              <p className="text-sm text-gray-900">{formatDate(currentProject.updatedAt)}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Account Information */}
                    <div className="col-span-full mt-2">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Account Information</h5>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-xs text-gray-900 font-mono">{userData.id || selectedSubmission.userId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-sm text-gray-900">
                        {userData.createdAt ? formatDate(userData.createdAt) : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Verified</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userData.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profile Complete</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {userData.isProfileComplete ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Login</label>
                      <p className="text-sm text-gray-900">
                        {userData.lastLogin ? formatDate(userData.lastLogin) : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Request Submitted</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSubmission.createdAt)}</p>
                    </div>
                  </div>
                ) : (
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
                    <div className="col-span-full">
                      <p className="text-xs text-gray-500 italic">Complete user details not available</p>
                    </div>
                  </div>
                )}
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
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Attached Files ({selectedSubmission.mediaFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSubmission.mediaFiles.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {file.url && file.type?.startsWith('image/') ? (
                          <>
                            <div className="relative group">
                              <img
                                src={file.url}
                                alt={file.name || `Image ${index + 1}`}
                                className="w-full h-48 object-cover cursor-pointer"
                                onClick={() => window.open(file.url, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                Image
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50">
                              <p className="text-sm text-gray-900 truncate mb-2" title={file.name}>
                                {file.name || `Image ${index + 1}`}
                              </p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center justify-center"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Full
                                </button>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="flex-1 text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 flex items-center justify-center"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <Paperclip className="h-5 w-5 text-gray-500" />
                              <span className="text-sm text-gray-900 truncate">{file.name || 'Unnamed file'}</span>
                            </div>
                            {file.url ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="flex-1 text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 text-center"
                                >
                                  Download
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-red-600">File upload failed</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Click on any image to view it in full size
                  </p>
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
