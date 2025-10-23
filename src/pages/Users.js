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
  UserCheck,
  Users as UsersIcon,
  Link2,
  Unlink
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  const [projects, setProjects] = useState([]);
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
  
  // Family member modal state
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [selectedParentUser, setSelectedParentUser] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
    fetchUsersAndProjects();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
      // Reset to page 1 when filters change
      setCurrentPage(1);
    }
  }, [users, searchTerm, roleFilter, statusFilter, approvalFilter, filterUsers]);

  const fetchUsersAndProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch users and projects in parallel
      const [usersData, projectsSnapshot] = await Promise.all([
        userService.getAllUsers(),
        getDocs(collection(db, 'projects'))
      ]);
      
      console.log('Fetched users:', usersData);
      setUsers(usersData);
      
      // Map projects to an array with id and data
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched projects:', projectsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching users and projects:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId; // Fallback to ID if name not found
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

  // Family Member Management Functions
  const openFamilyMemberModal = (parentUser) => {
    setSelectedParentUser(parentUser);
    setFamilySearchTerm('');
    setShowFamilyMemberModal(true);
  };

  const handleLinkFamilyMember = async (familyMemberId) => {
    try {
      if (!selectedParentUser) return;

      const linkData = {
        parentAccountId: selectedParentUser.id,
        updatedAt: new Date(),
        linkedBy: localStorage.getItem('adminUserId') || 'admin',
        linkedAt: new Date()
      };

      await userService.updateUser(familyMemberId, linkData);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === familyMemberId
            ? { ...u, ...linkData }
            : u
        )
      );

      // Refresh the selected user if they're still open
      if (selectedUser && selectedUser.id === selectedParentUser.id) {
        const updatedParent = users.find(u => u.id === selectedParentUser.id);
        setSelectedUser(updatedParent);
      }

      alert('Family member linked successfully!');
      setShowFamilyMemberModal(false);
      setFamilySearchTerm('');
      
    } catch (error) {
      console.error('Error linking family member:', error);
      showError('Failed to link family member. Please try again.');
    }
  };

  const handleUnlinkFamilyMember = async (familyMemberId) => {
    try {
      if (!window.confirm('Are you sure you want to unlink this family member?')) return;

      const unlinkData = {
        parentAccountId: null,
        updatedAt: new Date(),
        unlinkedBy: localStorage.getItem('adminUserId') || 'admin',
        unlinkedAt: new Date()
      };

      await userService.updateUser(familyMemberId, unlinkData);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === familyMemberId
            ? { ...u, ...unlinkData }
            : u
        )
      );

      // Refresh the selected user if they're still open
      if (selectedUser) {
        const updatedUser = users.find(u => u.id === selectedUser.id);
        setSelectedUser(updatedUser);
      }

      alert('Family member unlinked successfully!');
      
    } catch (error) {
      console.error('Error unlinking family member:', error);
      showError('Failed to unlink family member. Please try again.');
    }
  };

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
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
          onClick={fetchUsersAndProjects}
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

        {/* Results Count and Items Per Page Selector */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, totalUsers)} of {totalUsers} users
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
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
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalUsers)}</span> of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced User Details Modal - Super Admin View */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[75vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedUser.migrated === true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Migrated
                      </span>
                    )}
                    {selectedUser.oldId && selectedUser.migrated !== true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Needs Migration
                      </span>
                    )}
                    {selectedUser.projects && selectedUser.projects.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        {selectedUser.projects.length} Project{selectedUser.projects.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
                <button
                  onClick={() => setShowUserModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information Section - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-sm text-gray-900 font-semibold mt-1">
                      {selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.firstName || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.lastName || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1 break-all">{selectedUser.email || 'No email'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.mobile || selectedUser.phone || 'No phone'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">National ID</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.nationalId || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Birth</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                    <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUser.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Verified</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.emailVerified ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-red-600">Not Verified</span>
                      )}
                    </p>
                  </div>
                </div>
                  </div>
                  
              {/* All Projects Information - Super Admin can see all projects */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  All Projects ({selectedUser.projects?.length || 0})
                </h3>
                {selectedUser.projects && selectedUser.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.projects.map((project, index) => (
                      <div key={index} className="bg-white rounded-lg p-5 border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <span className="text-lg font-bold text-green-700">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-green-900">{getProjectName(project.projectId)}</p>
                              <p className="text-xs font-mono text-gray-500">{project.projectId}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            project.role === 'owner' 
                              ? 'bg-purple-100 text-purple-700'
                              : project.role === 'tenant'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {project.role?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-green-50 rounded-lg p-2">
                            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Unit Number</label>
                            <p className="text-base text-green-900 font-bold mt-1">{project.unit || 'N/A'}</p>
                          </div>
                          {project.status && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-semibold text-gray-900">{project.status}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-yellow-700 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      No projects associated with this user
                    </p>
                  </div>
                )}
                  </div>
                  
              {/* Status & Approval Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Account Status & Approvals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval Status</label>
                    <p className="text-sm text-gray-900 font-medium mt-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : selectedUser.approvalStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : selectedUser.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.approvalStatus || 'pending'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Status</label>
                    <p className="text-sm text-gray-900 font-medium mt-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.registrationStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedUser.registrationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.registrationStatus || 'Unknown'}
                      </span>
                    </p>
                </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile Complete</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.isProfileComplete ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Complete
                        </span>
                      ) : (
                        <span className="text-orange-600">Incomplete</span>
                      )}
                    </p>
                  </div>
                  {selectedUser.approvedBy && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved By</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.approvedBy}</p>
                    </div>
                  )}
                  {selectedUser.approvedAt && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {typeof selectedUser.approvedAt === 'string'
                          ? new Date(selectedUser.approvedAt).toLocaleDateString()
                          : selectedUser.approvedAt?.toDate
                            ? selectedUser.approvedAt.toDate().toLocaleDateString()
                            : selectedUser.approvedAt?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  )}
                  {selectedUser.role && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Role</label>
                      <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUser.role}</p>
                    </div>
                  )}
                  {selectedUser.rejectedBy && (
                    <div className="bg-white rounded-lg p-3 shadow-sm col-span-full">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejection Details</label>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="font-medium">Rejected By:</span> {selectedUser.rejectedBy}</p>
                        {selectedUser.rejectedAt && (
                          <p><span className="font-medium">Rejected At:</span> {new Date(selectedUser.rejectedAt).toLocaleString()}</p>
                        )}
                        {selectedUser.rejectionReason && (
                          <p><span className="font-medium">Reason:</span> {selectedUser.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Documents & Profile Pictures Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Documents & Profile Pictures
                </h3>
                
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <label className="text-sm font-medium text-indigo-700 block mb-2">Profile Picture</label>
                    <div className="mt-2">
                      {selectedUser.documents?.profilePictureUrl ? (
                        <div className="flex items-center space-x-4">
                          <img 
                            src={selectedUser.documents.profilePictureUrl} 
                            alt="Profile"
                            className="h-20 w-20 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                          />
                          <button
                            onClick={() => window.open(selectedUser.documents.profilePictureUrl, '_blank')}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Size
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-gray-500 text-sm">No profile picture uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* National ID Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front ID */}
                  <div>
                      <label className="text-sm font-medium text-indigo-700 block mb-2">Front National ID</label>
                    <div className="mt-2">
                      {selectedUser.documents?.frontIdUrl ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={selectedUser.documents.frontIdUrl}
                                alt="Front National ID"
                                className="w-full h-32 object-cover rounded-lg border-2 border-indigo-200 shadow-sm"
                              />
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Uploaded
                                </span>
                              </div>
                          </div>
                          <button
                            onClick={() => window.open(selectedUser.documents.frontIdUrl, '_blank')}
                              className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center"
                          >
                              <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </button>
                        </div>
                      ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-500 text-sm">Not uploaded</span>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                    {/* Back ID */}
                  <div>
                      <label className="text-sm font-medium text-indigo-700 block mb-2">Back National ID</label>
                    <div className="mt-2">
                      {selectedUser.documents?.backIdUrl ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={selectedUser.documents.backIdUrl}
                                alt="Back National ID"
                                className="w-full h-32 object-cover rounded-lg border-2 border-indigo-200 shadow-sm"
                              />
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Uploaded
                                </span>
                              </div>
                          </div>
                          <button
                            onClick={() => window.open(selectedUser.documents.backIdUrl, '_blank')}
                              className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center"
                          >
                              <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </button>
                        </div>
                      ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-500 text-sm">Not uploaded</span>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                  {/* Document Status Summary */}
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3">Document Status</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.profilePictureUrl ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-xs text-gray-600">Profile Picture</span>
                  </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.frontIdUrl ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-600">Front ID</span>
                  </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.backIdUrl ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-600">Back ID</span>
                  </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Account Status Section */}
              {(selectedUser.isDeleted || selectedUser.isSuspended) && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Account Status Alert
                  </h3>
                <div className="space-y-4">
                    {selectedUser.isDeleted ? (
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                            <UserX className="h-4 w-4 mr-2" />
                            Account Deleted
                    </span>
                  </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium text-gray-700">Deleted At:</span> <span className="text-gray-600">{selectedUser.deletedAt ? new Date(selectedUser.deletedAt).toLocaleString() : 'N/A'}</span></div>
                          <div><span className="font-medium text-gray-700">Deleted By:</span> <span className="text-gray-600">{selectedUser.deletedBy || 'N/A'}</span></div>
                          {selectedUser.restoredAt && (
                            <div><span className="font-medium text-gray-700">Restored At:</span> <span className="text-gray-600">{new Date(selectedUser.restoredAt).toLocaleString()}</span></div>
                          )}
                  </div>
                      </div>
                    ) : selectedUser.isSuspended && (
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                            <UserX className="h-4 w-4 mr-2" />
                            Account Suspended
                          </span>
                          <span className="text-sm text-gray-500">
                            {selectedUser.suspensionType === 'permanent' ? 'Permanent' : 'Temporary'}
                    </span>
                  </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium text-gray-700">Reason:</span> <p className="text-gray-600 mt-1">{selectedUser.suspensionReason}</p></div>
                          {selectedUser.suspensionType === 'temporary' && selectedUser.suspensionEndDate && (
                            <div><span className="font-medium text-gray-700">Suspension Ends:</span> <p className="text-gray-600 mt-1">{new Date(selectedUser.suspensionEndDate).toLocaleString()}</p></div>
                          )}
                          <div><span className="font-medium text-gray-700">Suspended At:</span> <span className="text-gray-600">{selectedUser.suspendedAt ? new Date(selectedUser.suspendedAt).toLocaleString() : 'N/A'}</span></div>
                          <div><span className="font-medium text-gray-700">Suspended By:</span> <span className="text-gray-600">{selectedUser.suspendedBy || 'N/A'}</span></div>
                  </div>
                  </div>
                    )}
                  </div>
                  </div>
              )}

              {/* Migration Information - Only show if user has migration data */}
              {(selectedUser.migrated || selectedUser.oldId || selectedUser.migratedAt || selectedUser.oldDocumentId) && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                  <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Migration Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migration Status</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.migrated === true ? (
                          <span className="text-teal-600 flex items-center font-semibold">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Migrated
                    </span>
                        ) : selectedUser.oldId ? (
                          <span className="text-orange-600 flex items-center font-semibold">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Needs Migration
                          </span>
                        ) : (
                          <span className="text-blue-600 font-semibold">New User</span>
                        )}
                      </p>
                        </div>
                    {selectedUser.oldId && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Old User ID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.oldId}</p>
                      </div>
                    )}
                    {selectedUser.oldDocumentId && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Old Document ID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.oldDocumentId}</p>
                        </div>
                    )}
                    {selectedUser.migratedAt && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migrated At</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {typeof selectedUser.migratedAt === 'string'
                            ? new Date(selectedUser.migratedAt).toLocaleString()
                            : selectedUser.migratedAt.toDate
                              ? selectedUser.migratedAt.toDate().toLocaleString()
                              : 'Unknown'}
                        </p>
                      </div>
                    )}
                    {selectedUser.migratedTo && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migrated To UID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.migratedTo}</p>
                  </div>
                    )}
                  </div>
                  </div>
              )}

              {/* Account Information & Timestamps */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Information & Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                    <p className="text-xs text-gray-900 font-mono mt-1 break-all">{selectedUser.id}</p>
                  </div>
                  {selectedUser.authUid && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auth UID</label>
                      <p className="text-xs text-gray-900 font-mono mt-1 break-all">{selectedUser.authUid}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.createdAt?.toLocaleString() || 'Unknown'}
                    </p>
                        </div>
                  {selectedUser.updatedAt && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updated At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.updatedAt?.toLocaleString() || 'Unknown'}
                    </p>
                      </div>
                  )}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Login</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.lastLoginAt?.toLocaleString() || 'Never'}
                    </p>
                        </div>
                  {selectedUser.registrationStep && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Step</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.registrationStep}</p>
                      </div>
                  )}
                  {selectedUser.createdByAdmin !== undefined && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By Admin</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.createdByAdmin ? (
                          <span className="text-blue-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-600">No</span>
                        )}
                      </p>
              </div>
                  )}
                  {selectedUser.accountType && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</label>
                      <p className="text-sm text-gray-900 font-medium mt-1 capitalize">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.accountType === 'temporary'
                            ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                          {selectedUser.accountType}
                      </span>
                      </p>
                        </div>
                    )}
                  {selectedUser.validityStartDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validity Start</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.validityStartDate}</p>
                  </div>
                  )}
                  {selectedUser.validityEndDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validity End</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.validityEndDate}</p>
                      </div>
                  )}
                </div>
              </div>
              
              {/* Family Members Section - ALWAYS VISIBLE - Super Admin View */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-6 border-2 border-pink-300 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-pink-900 flex items-center">
                    <svg className="h-6 w-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Family Account Management
                  </h3>
                  <button
                    onClick={() => openFamilyMemberModal(selectedUser)}
                    className="px-4 py-2 bg-pink-600 text-white text-sm font-bold rounded-lg hover:bg-pink-700 transition-all hover:scale-105 shadow-md flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Link Family Member
                  </button>
                  </div>
                
                {/* If this user is a family member of someone */}
                {selectedUser.parentAccountId && (() => {
                  const parentUser = users.find(u => u.id === selectedUser.parentAccountId);
                  return (
                    <div className="mb-4 bg-white rounded-lg p-5 border-2 border-blue-400 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-blue-900 flex items-center">
                          <Link2 className="h-4 w-4 mr-2" />
                          Linked to Parent Account
                        </h4>
                        <button
                          onClick={() => handleUnlinkFamilyMember(selectedUser.id)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                          title="Unlink from parent"
                        >
                          <Unlink className="h-4 w-4" />
                        </button>
                      </div>
                      {parentUser ? (
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-blue-300 flex items-center justify-center ring-2 ring-blue-400">
                              <span className="text-sm font-bold text-blue-900">
                                {parentUser.firstName?.charAt(0)}{parentUser.lastName?.charAt(0)}
                              </span>
                  </div>
                  <div>
                              <p className="text-sm font-bold text-gray-900">{parentUser.firstName} {parentUser.lastName}</p>
                              <p className="text-xs text-gray-600">{parentUser.email}</p>
                              <p className="text-xs text-blue-700 font-semibold mt-1">
                                {parentUser.projects?.length || 0} Project{parentUser.projects?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                          <button
                            onClick={() => openUserModal(parentUser)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-lg transition-colors"
                            title="View Parent Account"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
              </div>
                      ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">Parent ID: {selectedUser.parentAccountId}</p>
                      )}
                    </div>
                  );
                })()}
                
                {/* Family members linked to this account */}
                {(() => {
                  const linkedFamilyMembers = users.filter(user => user.parentAccountId === selectedUser.id);
                  if (linkedFamilyMembers.length > 0) {
                    return (
                      <div className="bg-white rounded-lg p-5 border-2 border-pink-400 shadow-md">
                        <h4 className="text-sm font-bold text-pink-900 mb-4 flex items-center">
                          <UsersIcon className="h-5 w-5 mr-2" />
                          Family Members ({linkedFamilyMembers.length}) - All Projects
                        </h4>
                        <div className="space-y-3">
                          {linkedFamilyMembers.map((familyMember) => {
                            return (
                              <div key={familyMember.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 hover:shadow-md transition-all">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="h-12 w-12 rounded-full bg-pink-300 flex items-center justify-center ring-2 ring-pink-400">
                                    <span className="text-sm font-bold text-pink-900">
                                      {familyMember.firstName?.charAt(0)}{familyMember.lastName?.charAt(0)}
                          </span>
                        </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">{familyMember.firstName} {familyMember.lastName}</p>
                                    <p className="text-xs text-gray-600">{familyMember.email}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                        {familyMember.projects?.length || 0} Project{familyMember.projects?.length !== 1 ? 's' : ''}
                                      </span>
                                      {familyMember.projects?.some(p => p.role === 'family') && (
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-pink-200 text-pink-800 ring-1 ring-pink-400">
                                          Family Role
                                        </span>
                                      )}
                        </div>
                      </div>
                  </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openUserModal(familyMember)}
                                    className="p-2 text-pink-600 hover:text-pink-900 hover:bg-pink-200 rounded-lg transition-colors"
                                    title="View Family Member"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleUnlinkFamilyMember(familyMember.id)}
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Unlink Family Member"
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </button>
                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-white rounded-lg p-6 border-2 border-dashed border-pink-300 text-center">
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                            <UsersIcon className="h-8 w-8 text-pink-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">No Family Members Yet</p>
                          <p className="text-xs text-gray-500 mb-4">This account doesn't have any family members linked</p>
                          <button
                            onClick={() => openFamilyMemberModal(selectedUser)}
                            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all hover:scale-105 shadow-md flex items-center"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Link First Family Member
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
              
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center space-x-3">
                {/* Approval Actions for Pending Users */}
                {!selectedUser.isDeleted && (selectedUser.approvalStatus || 'pending') === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </button>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        openDeclineModal(selectedUser);
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Decline User
                    </button>
                  </>
                )}
                
                {/* Regular Actions for Approved Users */}
                {!selectedUser.isDeleted && (selectedUser.approvalStatus || 'pending') === 'approved' && (
                  <>
                    {selectedUser.isSuspended ? (
                      <button
                        onClick={() => {
                          handleUnsuspendUser(selectedUser);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          openSuspendModal(selectedUser);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => {
                        openDeleteModal(selectedUser);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}

                {/* Show restore option for deleted users */}
                {selectedUser.isDeleted && (
                  <button
                    onClick={() => {
                      handleRestoreUser(selectedUser);
                      setShowUserModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Restore User
                  </button>
                )}
              </div>
                
                <button
                  onClick={() => setShowUserModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
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

      {/* Family Member Assignment Modal */}
      {showFamilyMemberModal && selectedParentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <UserPlus className="h-7 w-7 mr-3" />
                    Link Family Member
                  </h2>
                  <p className="text-pink-100 mt-1 text-sm">
                    Assign an existing user as family member to <strong>{selectedParentUser.firstName} {selectedParentUser.lastName}</strong>
                  </p>
                </div>
                <button onClick={() => setShowFamilyMemberModal(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={familySearchTerm}
                    onChange={(e) => setFamilySearchTerm(e.target.value)}
                    placeholder="Search users by name, email..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">💡 Only users who share the <strong>same unit</strong> in any project with this parent account will appear</p>
              </div>
              <div className="space-y-3">
                {(() => {
                  // Get all unit-project combinations for the parent user
                  const parentUnits = selectedParentUser.projects?.map(p => ({
                    projectId: p.projectId,
                    unit: p.unit
                  })) || [];

                  const availableUsers = users.filter(user => {
                    if (user.id === selectedParentUser.id) return false;
                    if (user.parentAccountId) return false;
                    
                    // Check if user shares at least one unit with parent in any project
                    const hasSharedUnit = user.projects?.some(userProject => 
                      parentUnits.some(parentUnit => 
                        parentUnit.projectId === userProject.projectId && 
                        parentUnit.unit === userProject.unit
                      )
                    );
                    
                    if (!hasSharedUnit) return false;
                    
                    if (familySearchTerm) {
                      const searchLower = familySearchTerm.toLowerCase();
                      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                      const email = user.email?.toLowerCase() || '';
                      if (!fullName.includes(searchLower) && !email.includes(searchLower)) return false;
                    }
                    return true;
                  });
                  if (availableUsers.length === 0) {
                    return (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-semibold">No Available Users</p>
                        <p className="text-sm text-gray-500 mt-1">{familySearchTerm ? 'Try a different search term' : 'All users are either already linked or unavailable'}</p>
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">{availableUsers.length} user{availableUsers.length !== 1 ? 's' : ''} available</p>
                        {familySearchTerm && (<button onClick={() => setFamilySearchTerm('')} className="text-xs text-pink-600 hover:text-pink-800 font-medium">Clear Search</button>)}
                      </div>
                      {availableUsers.map((user) => {
                        // Find shared units
                        const sharedUnits = user.projects?.filter(userProject => 
                          parentUnits.some(parentUnit => 
                            parentUnit.projectId === userProject.projectId && 
                            parentUnit.unit === userProject.unit
                          )
                        ).map(p => `${p.unit} (${projects.find(proj => proj.id === p.projectId)?.name || p.projectId})`);
                        
                        return (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border-2 border-gray-200 hover:border-pink-400 hover:shadow-md transition-all">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center ring-2 ring-pink-200">
                                <span className="text-lg font-bold text-white">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{user.projects?.length || 0} Project{user.projects?.length !== 1 ? 's' : ''}</span>
                                  {sharedUnits?.map((unitInfo, idx) => (
                                    <span key={idx} className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                      📍 {unitInfo}
                                    </span>
                                  ))}
                                  {user.approvalStatus === 'approved' && (<span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Approved</span>)}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => handleLinkFamilyMember(user.id)} className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all hover:scale-105 shadow-md flex items-center whitespace-nowrap">
                              <Link2 className="h-4 w-4 mr-2" />Link as Family
                            </button>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
              <button onClick={() => setShowFamilyMemberModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
