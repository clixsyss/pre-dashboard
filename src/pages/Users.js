import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  X,
  UserX,
  UserCheck
} from 'lucide-react';
import { useUINotificationStore } from '../stores/uiNotificationStore';
import userService from '../services/userService';

const Users = () => {
  const navigate = useNavigate();
  const { error: showError } = useUINotificationStore();
  
  // Check if a project is selected, if not redirect to project selection
  useEffect(() => {
    const selectedProject = localStorage.getItem('adminSelectedProject');
    if (!selectedProject) {
      navigate('/project-selection');
      return;
    }
  }, [navigate]);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // active, deleted, all
  const [approvalFilter, setApprovalFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7'); // days
  const [suspensionType, setSuspensionType] = useState('temporary'); // temporary or permanent
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [userToDecline, setUserToDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const filterUsers = useCallback(() => {
    let filtered = users;
    console.log('Filtering users:', { usersCount: users.length, searchTerm, roleFilter, statusFilter, approvalFilter });

    // Apply status filter (active, deleted, all)
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => !user.isDeleted);
    } else if (statusFilter === 'deleted') {
      filtered = filtered.filter(user => user.isDeleted);
    }
    // If statusFilter === 'all', show all users

    // Apply approval filter
    if (approvalFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userApprovalStatus = user.approvalStatus || 'pending';
        return userApprovalStatus === approvalFilter;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const fullName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.toLowerCase()
          : user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const phone = user.phone || '';
        
        return fullName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               phone.includes(searchTerm);
      });
    }

    // Apply role filter - check if user has the role in any of their projects
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (!user.projects || !Array.isArray(user.projects)) return false;
        return user.projects.some(project => project.role === roleFilter);
      });
    }

    console.log('Filtered users result:', filtered.length);
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, approvalFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [users, searchTerm, roleFilter, filterUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use the user service to fetch all users
      const usersData = await userService.getAllUsers();
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Perform soft delete - mark user as deleted and remove from all projects
      const softDeleteData = {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: localStorage.getItem('adminUserId') || 'admin',
        // Clear all projects to disable access to all projects
        projects: [],
        // Update registration status to indicate deletion
        registrationStatus: 'deleted',
        updatedAt: new Date()
      };

      // Update user document with soft delete data
      await userService.updateUser(userToDelete.id, softDeleteData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userToDelete.id 
            ? { ...user, ...softDeleteData }
            : user
        )
      );

      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Refresh filtered users
      filterUsers();
      
      console.log('User soft deleted successfully');
    } catch (err) {
      console.error('Error soft deleting user:', err);
      showError('Failed to delete user');
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const openSuspendModal = (user) => {
    setUserToSuspend(user);
    setSuspensionReason('');
    setSuspensionDuration('7');
    setSuspensionType('temporary');
    setShowSuspendModal(true);
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend || !suspensionReason.trim()) {
      showError('Please provide a reason for suspension');
      return;
    }

    try {
      const suspensionData = {
        isSuspended: true,
        suspensionReason: suspensionReason.trim(),
        suspensionType: suspensionType,
        suspendedAt: new Date(),
        suspendedBy: localStorage.getItem('adminUserId') || 'admin'
      };

      if (suspensionType === 'temporary') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + parseInt(suspensionDuration));
        suspensionData.suspensionEndDate = endDate;
      }

      // Update user in Firestore
      await userService.updateUser(userToSuspend.id, suspensionData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userToSuspend.id 
            ? { ...user, ...suspensionData }
            : user
        )
      );

      setShowSuspendModal(false);
      setUserToSuspend(null);
      setSuspensionReason('');
      setSuspensionDuration('7');
      setSuspensionType('temporary');
      
      // Refresh filtered users
      filterUsers();
      
    } catch (error) {
      console.error('Error suspending user:', error);
      showError('Failed to suspend user. Please try again.');
    }
  };

  const handleUnsuspendUser = async (user) => {
    try {
      const unsuspensionData = {
        isSuspended: false,
        suspensionReason: null,
        suspensionType: null,
        suspendedAt: null,
        suspendedBy: null,
        suspensionEndDate: null,
        unsuspendedAt: new Date(),
        unsuspendedBy: localStorage.getItem('adminUserId') || 'admin'
      };

      // Update user in Firestore
      await userService.updateUser(user.id, unsuspensionData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, ...unsuspensionData }
            : u
        )
      );

      // Refresh filtered users
      filterUsers();
      
    } catch (error) {
      console.error('Error unsuspending user:', error);
      showError('Failed to unsuspend user. Please try again.');
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      const restoreData = {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: localStorage.getItem('adminUserId') || 'admin',
        // Restore registration status to pending for re-approval
        registrationStatus: 'pending',
        updatedAt: new Date()
      };

      // Update user in Firestore
      await userService.updateUser(user.id, restoreData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, ...restoreData }
            : u
        )
      );

      // Refresh filtered users
      filterUsers();
      
      console.log('User restored successfully');
    } catch (error) {
      console.error('Error restoring user:', error);
      showError('Failed to restore user. Please try again.');
    }
  };

  const handleApproveUser = async (user) => {
    try {
      const approvalData = {
        approvalStatus: 'approved',
        approvedBy: localStorage.getItem('adminUserId') || 'admin',
        approvedAt: new Date(),
        registrationStatus: 'completed',
        updatedAt: new Date()
      };

      // Update user in Firestore
      await userService.updateUser(user.id, approvalData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, ...approvalData }
            : u
        )
      );

      // Refresh filtered users
      filterUsers();
      
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      showError('Failed to approve user. Please try again.');
    }
  };

  const openDeclineModal = (user) => {
    setUserToDecline(user);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineUser = async () => {
    if (!userToDecline || !declineReason.trim()) {
      showError('Please provide a reason for declining the user');
      return;
    }

    try {
      const declineData = {
        approvalStatus: 'rejected',
        rejectedBy: localStorage.getItem('adminUserId') || 'admin',
        rejectedAt: new Date(),
        rejectionReason: declineReason.trim(),
        registrationStatus: 'rejected',
        updatedAt: new Date()
      };

      // Update user in Firestore
      await userService.updateUser(userToDecline.id, declineData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userToDecline.id 
            ? { ...u, ...declineData }
            : u
        )
      );

      setShowDeclineModal(false);
      setUserToDecline(null);
      setDeclineReason('');
      
      // Refresh filtered users
      filterUsers();
      
      console.log('User declined successfully');
    } catch (error) {
      console.error('Error declining user:', error);
      showError('Failed to decline user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <button 
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active Users</option>
              <option value="deleted">Deleted Users</option>
              <option value="all">All Users</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div className="sm:w-48">
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Approvals</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {user.firstName?.charAt(0) || user.lastName?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.fullName || 'No Name'
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                        {user.mobile && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {user.mobile}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.documents?.profilePictureUrl ? 'bg-green-400' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-xs text-gray-600">Profile</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.documents?.frontIdUrl ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-xs text-gray-600">Front ID</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.documents?.backIdUrl ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-xs text-gray-600">Back ID</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.projects && user.projects.length > 0 ? (
                          <div className="flex flex-col space-y-1">
                            {user.projects.map((project, index) => (
                              <div key={index} className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  {project.role || 'Unknown'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No projects</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const approvalStatus = user.approvalStatus || 'pending';
                        if (approvalStatus === 'approved') {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approved
                            </span>
                          );
                        } else if (approvalStatus === 'rejected') {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.isDeleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Deleted
                        </span>
                      ) : user.isSuspended ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <UserX className="h-3 w-3 mr-1" />
                            Suspended
                          </span>
                          {user.suspensionType === 'temporary' && user.suspensionEndDate && (
                            <span className="text-xs text-gray-500">
                              Until {new Date(user.suspensionEndDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="View All Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Show approve/decline buttons for pending users */}
                        {!user.isDeleted && (user.approvalStatus || 'pending') === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                              title="Approve User"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openDeclineModal(user)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                              title="Decline User"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        {/* Only show edit/suspend/delete actions for non-deleted, approved users */}
                        {!user.isDeleted && (user.approvalStatus || 'pending') === 'approved' && (
                          <>
                            <button
                              onClick={() => openUserModal(user)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.isSuspended ? (
                              <button
                                onClick={() => handleUnsuspendUser(user)}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Unsuspend User"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openSuspendModal(user)}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded"
                                title="Suspend User"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {/* Show restore option for deleted users */}
                        {user.isDeleted && (
                          <button
                            onClick={() => handleRestoreUser(user)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Restore User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || roleFilter !== 'all' || approvalFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.fullName || 'No Name'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.mobile || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.dateOfBirth || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.gender || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.nationalId || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Documents Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Documents & Profile</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    <div className="mt-2">
                      {selectedUser.documents?.profilePictureUrl ? (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={selectedUser.documents.profilePictureUrl} 
                            alt="Profile"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                          />
                          <button
                            onClick={() => window.open(selectedUser.documents.profilePictureUrl, '_blank')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Full Size
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Front National ID</label>
                    <div className="mt-2">
                      {selectedUser.documents?.frontIdUrl ? (
                        <div className="flex items-center space-x-3">
                          <div className="h-16 w-16 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200">
                            <Eye className="h-6 w-6 text-blue-600" />
                          </div>
                          <button
                            onClick={() => window.open(selectedUser.documents.frontIdUrl, '_blank')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Document
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Not Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Back National ID</label>
                    <div className="mt-2">
                      {selectedUser.documents?.backIdUrl ? (
                        <div className="flex items-center space-x-3">
                          <div className="h-16 w-16 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200">
                            <Eye className="h-6 w-6 text-blue-600" />
                          </div>
                          <button
                            onClick={() => window.open(selectedUser.documents.backIdUrl, '_blank')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Document
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Not Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* System Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">System Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Auth UID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.authUid || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.registrationStatus === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : selectedUser.registrationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.registrationStatus || 'pending'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.approvalStatus === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : selectedUser.approvalStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.approvalStatus || 'pending'}
                    </span>
                    {selectedUser.approvalStatus === 'approved' && selectedUser.approvedBy && (
                      <div className="mt-1 text-xs text-gray-600">
                        <div>Approved by: {selectedUser.approvedBy}</div>
                        {selectedUser.approvedAt && (
                          <div>At: {new Date(selectedUser.approvedAt).toLocaleString()}</div>
                        )}
                      </div>
                    )}
                    {selectedUser.approvalStatus === 'rejected' && selectedUser.rejectionReason && (
                      <div className="mt-1 text-xs text-gray-600">
                        <div>Rejected by: {selectedUser.rejectedBy || 'N/A'}</div>
                        {selectedUser.rejectedAt && (
                          <div>At: {new Date(selectedUser.rejectedAt).toLocaleString()}</div>
                        )}
                        <div className="mt-1"><strong>Reason:</strong> {selectedUser.rejectionReason}</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Step</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.registrationStep || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verification</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.emailVerified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.emailVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Complete</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.isProfileComplete 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.isProfileComplete ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                    {selectedUser.isDeleted ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Deleted
                        </span>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div><strong>Deleted At:</strong> {selectedUser.deletedAt ? new Date(selectedUser.deletedAt).toLocaleString() : 'N/A'}</div>
                          <div><strong>Deleted By:</strong> {selectedUser.deletedBy || 'N/A'}</div>
                          {selectedUser.restoredAt && (
                            <div><strong>Restored At:</strong> {new Date(selectedUser.restoredAt).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ) : selectedUser.isSuspended ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Suspended
                        </span>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div><strong>Reason:</strong> {selectedUser.suspensionReason}</div>
                          <div><strong>Type:</strong> {selectedUser.suspensionType === 'permanent' ? 'Permanent' : 'Temporary'}</div>
                          {selectedUser.suspensionType === 'temporary' && selectedUser.suspensionEndDate && (
                            <div><strong>Until:</strong> {new Date(selectedUser.suspensionEndDate).toLocaleString()}</div>
                          )}
                          <div><strong>Suspended At:</strong> {selectedUser.suspendedAt ? new Date(selectedUser.suspendedAt).toLocaleString() : 'N/A'}</div>
                          <div><strong>Suspended By:</strong> {selectedUser.suspendedBy || 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Timestamps */}
              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Timestamps</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.createdAt?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.updatedAt?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.lastLoginAt?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Properties/Projects */}
              {selectedUser.enhancedProjects && selectedUser.enhancedProjects.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Properties & Projects</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.enhancedProjects.map((project, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-blue-900">{project.projectName}</h5>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            project.role === 'owner' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {project.role}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-blue-800">
                          <div><strong>Type:</strong> {project.projectType}</div>
                          <div><strong>Location:</strong> {project.projectLocation}</div>
                          <div><strong>Unit:</strong> {project.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-between items-center">
                {/* Approval Actions for Pending Users */}
                {!selectedUser.isDeleted && (selectedUser.approvalStatus || 'pending') === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      ✓ Approve User
                    </button>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        openDeclineModal(selectedUser);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      ✗ Decline User
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowUserModal(false)}
                  className="ml-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>? 
                    This will disable their access to all projects but preserve their account data.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && userToSuspend && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <UserX className="h-6 w-6 text-orange-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Suspend User</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Suspend <strong>{userToSuspend.firstName} {userToSuspend.lastName}</strong>?
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suspension Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="temporary"
                        checked={suspensionType === 'temporary'}
                        onChange={(e) => setSuspensionType(e.target.value)}
                        className="mr-2"
                      />
                      Temporary
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="permanent"
                        checked={suspensionType === 'permanent'}
                        onChange={(e) => setSuspensionType(e.target.value)}
                        className="mr-2"
                      />
                      Permanent
                    </label>
                  </div>
                </div>

                {suspensionType === 'temporary' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days)
                    </label>
                    <select
                      value={suspensionDuration}
                      onChange={(e) => setSuspensionDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">1 week</option>
                      <option value="14">2 weeks</option>
                      <option value="30">1 month</option>
                      <option value="90">3 months</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Suspension *
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendUser}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline User Modal */}
      {showDeclineModal && userToDecline && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Decline User Registration</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Decline registration for <strong>{userToDecline.firstName} {userToDecline.lastName}</strong>?
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Declining *
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining the registration..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="4"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Decline User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
