import React, { useState, useEffect, useCallback } from 'react';
import { Key, Clock, Check, X, AlertCircle, Smartphone, RefreshCw, Building2, Search, Eye, User, FileText, History } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const DeviceKeysManagement = ({ projectId }) => {
  const { currentAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('keys');
  const [requests, setRequests] = useState([]);
  const [deviceKeys, setDeviceKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userRequestHistory, setUserRequestHistory] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const loadDeviceKeys = useCallback(async (activeProjectId) => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Get all users in the project
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const keysData = [];
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Check if user belongs to this project
        // Projects is an array of objects, not an object with project IDs as keys
        const userProject = userData.projects?.find(p => p.projectId === activeProjectId);
        
        if (userProject) {
          keysData.push({
            id: userDoc.id,
            userId: userDoc.id,
            userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
            email: userData.email || 'No email',
            deviceKey: userData.deviceKey || 'Not set',
            unit: userProject.unit || 'N/A',
            role: userProject.role || 'N/A',
            lastLogin: userData.lastLoginAt || userData.lastLogin || null,
            deviceKeyUpdatedAt: userData.deviceKeyUpdatedAt || null,
            createdAt: userData.createdAt || null
          });
        }
      }

      setDeviceKeys(keysData);
    } catch (error) {
      console.error('Error loading device keys:', error);
      setErrorMessage('Failed to load device keys. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResetRequests = useCallback(async (activeProjectId) => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (!activeProjectId) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Read from project subcollection: projects/{projectId}/deviceKeyResetRequests
      const requestsRef = collection(db, 'projects', activeProjectId, 'deviceKeyResetRequests');
      const q = query(requestsRef);

      const snapshot = await getDocs(q);
      let fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user names for each request
      for (let request of fetchedRequests) {
        try {
          const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', request.userId)));
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            request.userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown';
            request.userEmail = userData.email || '';
            
            // Get user's unit in the project
            const userProject = userData.projects?.find(p => p.projectId === request.projectId);
            request.userUnit = userProject?.unit || 'N/A';
            request.userRole = userProject?.role || 'N/A';
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }

      // Apply status filter
      if (filter !== 'all') {
        fetchedRequests = fetchedRequests.filter(req => req.status === filter);
      }

      // Sort by requestedAt descending (newest first)
      fetchedRequests.sort((a, b) => {
        const aTime = a.requestedAt?.toMillis() || 0;
        const bTime = b.requestedAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error loading reset requests:', error);
      setErrorMessage('Failed to load reset requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const selectedProjectData = localStorage.getItem('adminSelectedProject');
    if (!selectedProjectData) return;

    const project = JSON.parse(selectedProjectData);
    setSelectedProject(project);
    
    const activeProjectId = project?.id || projectId;
    if (!activeProjectId) {
      console.log('⚠️ No project ID, skipping real-time listener setup');
      return;
    }

    console.log('🔄 Setting up real-time listeners for device keys and reset requests...');

    // Set up real-time listener for ALL USERS (to get device keys)
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef);

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        console.log('📡 Real-time update received for users - processing device keys...');
        const keysData = [];
        
        snapshot.docs.forEach(userDoc => {
          const userData = userDoc.data();
          
          // Check if user belongs to this project
          const userProject = userData.projects?.find(p => p.projectId === activeProjectId);
          
          if (userProject) {
            keysData.push({
              id: userDoc.id,
              userId: userDoc.id,
              userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
              email: userData.email || 'No email',
              deviceKey: userData.deviceKey || 'Not set',
              unit: userProject.unit || 'N/A',
              role: userProject.role || 'N/A',
              lastLogin: userData.lastLoginAt || userData.lastLogin || null,
              deviceKeyUpdatedAt: userData.deviceKeyUpdatedAt || null,
              createdAt: userData.createdAt || null
            });
          }
        });

        setDeviceKeys(keysData);
        console.log('✅ Real-time device keys updated:', keysData.length, 'users');
      },
      (error) => {
        console.error('❌ Real-time listener error for users:', error);
        setErrorMessage('Error loading real-time device keys. Please refresh the page.');
      }
    );

    // Set up real-time listener for reset requests
    const requestsRef = collection(db, 'projects', activeProjectId, 'deviceKeyResetRequests');
    const requestsQuery = query(requestsRef);

    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        console.log('📡 Real-time update received - processing requests...');
        let fetchedRequests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch user names for each request
        for (let request of fetchedRequests) {
          try {
            const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', request.userId)));
            if (!userSnap.empty) {
              const userData = userSnap.docs[0].data();
              request.userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown';
              request.userEmail = userData.email || '';
              
              // Get user's unit in the project
              const userProject = userData.projects?.find(p => p.projectId === request.projectId);
              request.userUnit = userProject?.unit || 'N/A';
              request.userRole = userProject?.role || 'N/A';
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
          }
        }

        // Apply status filter
        if (filter !== 'all') {
          fetchedRequests = fetchedRequests.filter(req => req.status === filter);
        }

        // Sort by requestedAt descending (newest first)
        fetchedRequests.sort((a, b) => {
          const aTime = a.requestedAt?.toMillis() || 0;
          const bTime = b.requestedAt?.toMillis() || 0;
          return bTime - aTime;
        });

        setRequests(fetchedRequests);
        setLoading(false);
        console.log('✅ Real-time requests updated:', fetchedRequests.length, 'requests');
      },
      (error) => {
        console.error('❌ Real-time listener error for requests:', error);
        setErrorMessage('Error loading real-time updates. Please refresh the page.');
        setLoading(false);
      }
    );

    // Cleanup both listeners on unmount
    return () => {
      console.log('🔌 Cleaning up real-time listeners...');
      unsubscribeUsers();
      unsubscribeRequests();
    };
  }, [projectId, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const activeProjectId = selectedProject?.id || projectId;
    if (activeProjectId) {
      await Promise.all([
        loadDeviceKeys(activeProjectId),
        loadResetRequests(activeProjectId)
      ]);
    }
    setRefreshing(false);
  };

  const handleApprove = async (requestId, userId) => {
    if (!window.confirm('Are you sure you want to approve this device key reset request? This will clear the user\'s current device key and allow them to register a new device on login.')) {
      return;
    }

    try {
      setProcessingId(requestId);
      setErrorMessage('');

      const activeProjectId = selectedProject?.id || projectId;
      if (!activeProjectId) {
        throw new Error('No project selected');
      }

      // Step 1: Clear the user's device key
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        deviceKey: '',
        deviceKeyUpdatedAt: Timestamp.now()
      });
      
      console.log('✅ Device key cleared for user:', userId);

      // Step 2: Update request status in project subcollection
      const requestRef = doc(db, 'projects', activeProjectId, 'deviceKeyResetRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        resolvedAt: Timestamp.now(),
        resolvedBy: currentAdmin?.uid || 'admin',
        adminNotes: 'Device key reset approved - user can now register a new device'
      });

      setSuccessMessage('Device key reset approved! User can now login on a new device.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload both device keys and requests to show updated data
      await Promise.all([
        loadDeviceKeys(activeProjectId),
        loadResetRequests(activeProjectId)
      ]);
    } catch (error) {
      console.error('Error approving request:', error);
      setErrorMessage('Failed to approve request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const adminNotes = window.prompt('Please provide a reason for rejection (optional):');
    
    if (adminNotes === null) {
      return;
    }

    try {
      setProcessingId(requestId);
      setErrorMessage('');

      const activeProjectId = selectedProject?.id || projectId;
      if (!activeProjectId) {
        throw new Error('No project selected');
      }

      // Update in project subcollection
      const requestRef = doc(db, 'projects', activeProjectId, 'deviceKeyResetRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        resolvedAt: Timestamp.now(),
        resolvedBy: currentAdmin?.uid || 'admin',
        adminNotes: adminNotes || 'Request rejected by admin'
      });

      setSuccessMessage('Device key reset request rejected.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await loadResetRequests(activeProjectId);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setErrorMessage('Failed to reject request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetDeviceKey = async (deviceKeyData) => {
    if (!window.confirm(`Are you sure you want to reset the device key for ${deviceKeyData.userName}? This will force them to request a new device key on their next login.`)) {
      return;
    }

    try {
      setProcessingId(deviceKeyData.id);
      setErrorMessage('');

      // Clear the device key from the user's document
      const userRef = doc(db, 'users', deviceKeyData.userId);
      await updateDoc(userRef, {
        deviceKey: '',
        deviceKeyUpdatedAt: Timestamp.now()
      });

      setSuccessMessage(`Device key reset successfully for ${deviceKeyData.userName}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload device keys
      const activeProjectId = selectedProject?.id || projectId;
      if (activeProjectId) {
        await loadDeviceKeys(activeProjectId);
      }
    } catch (error) {
      console.error('Error resetting device key:', error);
      setErrorMessage('Failed to reset device key. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Load user details and their request history
  const loadUserDetailsAndHistory = async (userId) => {
    try {
      setLoadingModal(true);
      
      // Load user details
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserDetails({
          id: userDoc.id,
          ...userDoc.data()
        });
      }
      
      // Load all requests from all projects for this user
      const allProjects = await getDocs(collection(db, 'projects'));
      const allRequests = [];
      
      for (const projectDoc of allProjects.docs) {
        const requestsRef = collection(db, 'projects', projectDoc.id, 'deviceKeyResetRequests');
        const q = query(requestsRef, where('userId', '==', userId));
        const requestsSnapshot = await getDocs(q);
        
        requestsSnapshot.docs.forEach(doc => {
          allRequests.push({
            id: doc.id,
            projectId: projectDoc.id,
            projectName: projectDoc.data().name || 'Unknown Project',
            ...doc.data()
          });
        });
      }
      
      // Sort by requestedAt descending
      allRequests.sort((a, b) => {
        const aTime = a.requestedAt?.toMillis() || 0;
        const bTime = b.requestedAt?.toMillis() || 0;
        return bTime - aTime;
      });
      
      setUserRequestHistory(allRequests);
    } catch (error) {
      console.error('Error loading user details and history:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
    await loadUserDetailsAndHistory(request.userId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: Check, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: X, label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const tabs = [
    { id: 'keys', name: 'Device Keys', icon: Key },
    { id: 'requests', name: 'Reset Requests', icon: RefreshCw }
  ];

  const filteredDeviceKeys = deviceKeys.filter(key =>
    key.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.deviceKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(request =>
    (request.userName && request.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (request.userEmail && request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (request.reason && request.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-500">Please select a project to manage device keys.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Device Keys</h3>
          <p className="text-gray-500">Fetching data for {selectedProject.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Key className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Device Key Management</h1>
              <p className="text-lg text-gray-600 mt-1">
                Managing device keys for <span className="font-semibold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{selectedProject.name}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-medium text-green-700">Live Updates Active</span>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-start shadow-sm">
          <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive
                    ? 'border-pre-red text-pre-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${isActive ? 'text-pre-red' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-pre-red focus:border-transparent sm:text-sm transition-all duration-200"
            placeholder={activeTab === 'keys' ? 'Search by name, email, or device key...' : 'Search by name, email, or reason...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {activeTab === 'keys' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Smartphone className="h-6 w-6 mr-2 text-blue-600" />
                User Device Keys
              </h2>
              <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-medium">
                {filteredDeviceKeys.length} {filteredDeviceKeys.length === 1 ? 'User' : 'Users'}
              </span>
            </div>

            {filteredDeviceKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Device Keys Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No users match your search criteria.' : 'No users with device keys in this project.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeviceKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{key.userName}</div>
                            <div className="text-sm text-gray-500">{key.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {key.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            key.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                            key.role === 'family' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {key.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 text-xs bg-gray-100 rounded font-mono text-gray-700 break-all max-w-xs inline-block">
                            {key.deviceKey}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(key.deviceKeyUpdatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(key.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleResetDeviceKey(key)}
                            disabled={processingId === key.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${processingId === key.id ? 'animate-spin' : ''}`} />
                            {processingId === key.id ? 'Resetting...' : 'Reset'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <RefreshCw className="h-6 w-6 mr-2 text-blue-600" />
                Reset Requests
              </h2>
              <div className="flex items-center gap-2">
                {['all', 'pending', 'approved', 'rejected'].map(filterOption => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === filterOption
                        ? 'bg-pre-red text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'No requests match your search criteria.'
                    : filter === 'all'
                    ? 'No device key reset requests to display.'
                    : `No ${filter} device key reset requests to display.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.userName || 'Unknown User'}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.userEmail}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {request.userUnit && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                              Unit: {request.userUnit}
                            </span>
                          )}
                          {request.userRole && (
                            <span className={`px-2 py-1 rounded-full font-medium ${
                              request.userRole === 'owner' ? 'bg-purple-100 text-purple-800' :
                              request.userRole === 'family' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.userRole}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg">{request.reason}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested</p>
                          <p className="text-sm text-gray-900">{formatDate(request.requestedAt)}</p>
                        </div>
                        {request.resolvedAt && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resolved</p>
                            <p className="text-sm text-gray-900">{formatDate(request.resolvedAt)}</p>
                          </div>
                        )}
                      </div>

                      {request.adminNotes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                          <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg">{request.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id, request.userId)}
                            disabled={processingId === request.id}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md font-medium"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {processingId === request.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md font-medium"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {processingId === request.id ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Device Key Reset Request</h2>
                    <p className="text-red-100 mt-1">Complete user details and request history</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                    setUserDetails(null);
                    setUserRequestHistory([]);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {loadingModal ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user details...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Current Request Details */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                      Current Request
                    </h3>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested On</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{formatDate(selectedRequest.requestedAt)}</p>
                    </div>
                    
                    {selectedRequest.resolvedAt && (
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved On</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{formatDate(selectedRequest.resolvedAt)}</p>
                      </div>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Reason for Request</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.reason}</p>
                    </div>
                    
                    {selectedRequest.adminNotes && (
                      <div className="bg-red-50 rounded-lg p-4 md:col-span-2 border border-red-200">
                        <label className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 block">Admin Notes</label>
                        <p className="text-sm text-red-900 font-medium">{selectedRequest.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons in Modal */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-yellow-200">
                      <button
                        onClick={async () => {
                          await handleApprove(selectedRequest.id, selectedRequest.userId);
                          setShowRequestModal(false);
                        }}
                        disabled={processingId === selectedRequest.id}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-semibold"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        {processingId === selectedRequest.id ? 'Processing...' : 'Approve Request'}
                      </button>
                      <button
                        onClick={async () => {
                          await handleReject(selectedRequest.id);
                          setShowRequestModal(false);
                        }}
                        disabled={processingId === selectedRequest.id}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-semibold"
                      >
                        <X className="h-5 w-5 mr-2" />
                        {processingId === selectedRequest.id ? 'Processing...' : 'Reject Request'}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Information */}
                {userDetails && (
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-red-600" />
                      User Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                        <p className="text-sm text-gray-900 font-semibold mt-1">
                          {userDetails.firstName} {userDetails.lastName}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{userDetails.email}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{userDetails.mobile || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {userDetails.projects?.find(p => p.projectId === selectedRequest.projectId)?.unit || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                        <p className="text-sm text-gray-900 font-medium mt-1 capitalize">
                          {userDetails.projects?.find(p => p.projectId === selectedRequest.projectId)?.role || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">National ID</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{userDetails.nationalId || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Device Key</label>
                        <code className="text-xs text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded mt-1 block break-all">
                          {userDetails.deviceKey || 'Not set'}
                        </code>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Login</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {formatDate(userDetails.lastLoginAt)}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Status</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                          userDetails.approvalStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : userDetails.approvalStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.approvalStatus || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request History */}
                {userRequestHistory.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <History className="h-5 w-5 mr-2 text-purple-600" />
                      Request History
                      <span className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                        {userRequestHistory.length}
                      </span>
                    </h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userRequestHistory.map((historyRequest, index) => {
                        const isCurrentRequest = historyRequest.id === selectedRequest.id;
                        return (
                          <div
                            key={historyRequest.id}
                            className={`rounded-lg p-4 border-2 transition-all ${
                              isCurrentRequest
                                ? 'bg-red-50 border-red-400 ring-2 ring-red-300'
                                : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isCurrentRequest && (
                                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                      Current
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">
                                    #{index + 1}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {historyRequest.projectName}
                                  </span>
                                </div>
                                {getStatusBadge(historyRequest.status)}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {formatDate(historyRequest.requestedAt)}
                              </div>
                            </div>
                            
                            <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                Reason
                              </label>
                              <p className="text-sm text-gray-900">{historyRequest.reason}</p>
                            </div>
                            
                            {historyRequest.resolvedAt && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white bg-opacity-70 rounded p-2">
                                  <span className="text-gray-500 font-medium">Resolved:</span>
                                  <p className="text-gray-900 font-semibold">{formatDate(historyRequest.resolvedAt)}</p>
                                </div>
                                {historyRequest.resolvedBy && (
                                  <div className="bg-white bg-opacity-70 rounded p-2">
                                    <span className="text-gray-500 font-medium">By Admin:</span>
                                    <p className="text-gray-900 font-semibold">{historyRequest.resolvedBy}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {historyRequest.adminNotes && (
                              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                                <label className="text-xs font-semibold text-red-700 uppercase tracking-wide block mb-1">
                                  Admin Notes
                                </label>
                                <p className="text-xs text-red-900">{historyRequest.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Statistics */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-purple-900">{userRequestHistory.length}</p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-yellow-900">
                            {userRequestHistory.filter(r => r.status === 'pending').length}
                          </p>
                          <p className="text-xs text-gray-600">Pending</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-900">
                            {userRequestHistory.filter(r => r.status === 'approved').length}
                          </p>
                          <p className="text-xs text-gray-600">Approved</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-900">
                            {userRequestHistory.filter(r => r.status === 'rejected').length}
                          </p>
                          <p className="text-xs text-gray-600">Rejected</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                      setUserDetails(null);
                      setUserRequestHistory([]);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  
                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          await handleApprove(selectedRequest.id, selectedRequest.userId);
                          setShowRequestModal(false);
                        }}
                        disabled={processingId === selectedRequest.id}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-semibold flex items-center"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        {processingId === selectedRequest.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={async () => {
                          await handleReject(selectedRequest.id);
                          setShowRequestModal(false);
                        }}
                        disabled={processingId === selectedRequest.id}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-semibold flex items-center"
                      >
                        <X className="h-5 w-5 mr-2" />
                        {processingId === selectedRequest.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceKeysManagement;
