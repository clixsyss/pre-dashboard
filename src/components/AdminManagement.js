import React, { useState, useEffect, useCallback } from 'react';
import { 
  createAdmin, 
  getAllAdmins, 
  updateAdmin, 
  deleteAdmin, 
  getAllProjects,
  validateAdminData,
  ADMIN_TYPES,
  PERMISSION_ENTITIES,
  PERMISSION_ACTIONS
} from '../services/adminService';
import { 
  getPendingAdmins, 
  approvePendingAdmin, 
  rejectPendingAdmin,
  validateApprovalData
} from '../services/pendingAdminService';

const AdminManagement = () => {
  // State
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'pending'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [selectedPendingAdmin, setSelectedPendingAdmin] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    nationalId: '',
    accountType: ADMIN_TYPES.CUSTOM,
    assignedProjects: [],
    permissions: {}
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Approval form state
  const [approvalData, setApprovalData] = useState({
    accountType: ADMIN_TYPES.CUSTOM,
    assignedProjects: [],
    permissions: {}
  });
  const [approvalErrors, setApprovalErrors] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const [adminsData, pendingData, projectsData] = await Promise.all([
        getAllAdmins(),
        getPendingAdmins(),
        getAllProjects()
      ]);
      
      console.log('Loaded admins:', adminsData);
      console.log('Loaded pending admins:', pendingData);
      setAdmins(adminsData);
      setPendingAdmins(pendingData.filter(admin => admin.status === 'pending'));
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      admin.accountType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleProjectToggle = (projectId) => {
    setFormData(prev => ({
      ...prev,
      assignedProjects: prev.assignedProjects.includes(projectId)
        ? prev.assignedProjects.filter(id => id !== projectId)
        : [...prev.assignedProjects, projectId]
    }));
  };

  const handlePermissionToggle = (entity, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: prev.permissions[entity]?.includes(action)
          ? prev.permissions[entity].filter(a => a !== action)
          : [...(prev.permissions[entity] || []), action]
      }
    }));
  };

  const handleSelectAllPermissions = (entity) => {
    const allActions = Object.values(PERMISSION_ACTIONS);
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: allActions
      }
    }));
  };

  const handleDeselectAllPermissions = (entity) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: []
      }
    }));
  };

  const isAllPermissionsSelected = (entity) => {
    const allActions = Object.values(PERMISSION_ACTIONS);
    const selectedActions = formData.permissions[entity] || [];
    return allActions.every(action => selectedActions.includes(action));
  };

  const isAnyPermissionSelected = (entity) => {
    const selectedActions = formData.permissions[entity] || [];
    return selectedActions.length > 0;
  };

  // Approval-specific helper functions
  const handleApprovalSelectAllPermissions = (entity) => {
    const allActions = Object.values(PERMISSION_ACTIONS);
    setApprovalData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: allActions
      }
    }));
  };

  const handleApprovalDeselectAllPermissions = (entity) => {
    setApprovalData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: []
      }
    }));
  };

  const isApprovalAllPermissionsSelected = (entity) => {
    const allActions = Object.values(PERMISSION_ACTIONS);
    const selectedActions = approvalData.permissions[entity] || [];
    return allActions.every(action => selectedActions.includes(action));
  };

  const isApprovalAnyPermissionSelected = (entity) => {
    const selectedActions = approvalData.permissions[entity] || [];
    return selectedActions.length > 0;
  };

  // Select all permissions for all services
  const handleSelectAllServices = () => {
    const allEntities = Object.values(PERMISSION_ENTITIES);
    const allActions = Object.values(PERMISSION_ACTIONS);
    const allPermissions = {};
    
    allEntities.forEach(entity => {
      allPermissions[entity] = [...allActions];
    });
    
    setFormData(prev => ({
      ...prev,
      permissions: allPermissions
    }));
  };

  // Deselect all permissions for all services
  const handleDeselectAllServices = () => {
    setFormData(prev => ({
      ...prev,
      permissions: {}
    }));
  };

  // Check if all services have all permissions selected
  const isAllServicesSelected = () => {
    const allEntities = Object.values(PERMISSION_ENTITIES);
    const allActions = Object.values(PERMISSION_ACTIONS);
    
    return allEntities.every(entity => {
      const selectedActions = formData.permissions[entity] || [];
      return allActions.every(action => selectedActions.includes(action));
    });
  };

  // Check if any service has any permissions selected
  const isAnyServiceSelected = () => {
    const allEntities = Object.values(PERMISSION_ENTITIES);
    return allEntities.some(entity => {
      const selectedActions = formData.permissions[entity] || [];
      return selectedActions.length > 0;
    });
  };

  // Validate that all required permissions are assigned
  const validatePermissions = (permissions) => {
    const allEntities = Object.values(PERMISSION_ENTITIES);
    const allActions = Object.values(PERMISSION_ACTIONS);
    
    // Check if any entity has permissions assigned
    const hasAnyPermissions = allEntities.some(entity => 
      permissions[entity] && permissions[entity].length > 0
    );
    
    if (!hasAnyPermissions) {
      return { isValid: false, message: 'At least one permission must be assigned' };
    }
    
    // Check if all assigned permissions are valid
    for (const [entity, actions] of Object.entries(permissions)) {
      if (actions && actions.length > 0) {
        if (!allEntities.includes(entity)) {
          return { isValid: false, message: `Invalid entity: ${entity}` };
        }
        
        for (const action of actions) {
          if (!allActions.includes(action)) {
            return { isValid: false, message: `Invalid action: ${action} for entity: ${entity}` };
          }
        }
      }
    }
    
    return { isValid: true };
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      nationalId: '',
      accountType: ADMIN_TYPES.CUSTOM,
      assignedProjects: [],
      permissions: {}
    });
    setFormErrors({});
  };


  const openEditModal = (admin) => {
    setFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      email: admin.email || '',
      mobile: admin.mobile || '',
      nationalId: admin.nationalId || '',
      accountType: admin.accountType || ADMIN_TYPES.CUSTOM,
      assignedProjects: admin.assignedProjects || [],
      permissions: admin.permissions || {}
    });
    setEditingAdmin(admin);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingAdmin(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and messages
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
    
    // Validate form data
    const validation = validateAdminData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // Additional permission validation for custom accounts
    if (formData.accountType === ADMIN_TYPES.CUSTOM) {
      const permissionValidation = validatePermissions(formData.permissions);
      if (!permissionValidation.isValid) {
        setFormErrors(prev => ({ ...prev, permissions: permissionValidation.message }));
        return;
      }
    }

    try {
      setSubmitting(true);
      
      if (editingAdmin) {
        // Update existing admin
        await updateAdmin(editingAdmin.id, formData);
        setAdmins(prev => prev.map(admin => 
          admin.id === editingAdmin.id ? { ...admin, ...formData } : admin
        ));
        setSuccessMessage('Admin updated successfully!');
        closeAllModals();
      } else {
        // Create new admin
        const newAdmin = await createAdmin(formData);
        setAdmins(prev => [newAdmin, ...prev]);
        setSuccessMessage('Admin created successfully!');
        closeAllModals();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${editingAdmin ? 'update' : 'create'} admin: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await deleteAdmin(adminId);
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      setDeleteConfirm(null);
      setSuccessMessage('Admin deleted successfully!');
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError(`Failed to delete admin: ${err.message}`);
    }
  };

  const handleToggleActive = async (adminId, isActive) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await updateAdmin(adminId, { isActive: !isActive });
      setAdmins(prev => prev.map(admin => 
        admin.id === adminId ? { ...admin, isActive: !isActive } : admin
      ));
      setSuccessMessage(`Admin ${!isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError(`Failed to ${!isActive ? 'activate' : 'deactivate'} admin: ${err.message}`);
    }
  };

  // Approval handlers
  const openApprovalModal = (admin) => {
    setSelectedPendingAdmin(admin);
    setApprovalData({
      accountType: ADMIN_TYPES.CUSTOM,
      assignedProjects: [],
      permissions: {}
    });
    setApprovalErrors({});
    setShowApprovalModal(true);
  };

  const openRejectModal = (admin) => {
    setSelectedPendingAdmin(admin);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setApprovalErrors({});
      
      // Validate approval data
      const validation = validateApprovalData(approvalData);
      if (!validation.isValid) {
        setApprovalErrors(validation.errors);
        return;
      }

      // Additional permission validation for custom accounts
      if (approvalData.accountType === ADMIN_TYPES.CUSTOM) {
        const permissionValidation = validatePermissions(approvalData.permissions);
        if (!permissionValidation.isValid) {
          setApprovalErrors(prev => ({ ...prev, permissions: permissionValidation.message }));
          return;
        }
      }
      
      await approvePendingAdmin(selectedPendingAdmin.id, {
        ...approvalData,
        approvedBy: 'current-super-admin' // TODO: Get from auth context
      });
      
      // Refresh data
      await loadData();
      setSuccessMessage('Admin request approved successfully!');
      closeAllModals();
      
    } catch (err) {
      console.error('Error approving admin:', err);
      setError(`Failed to approve admin: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      if (!rejectionReason.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }
      
      await rejectPendingAdmin(selectedPendingAdmin.id, 'current-super-admin', rejectionReason);
      
      // Refresh data
      await loadData();
      setSuccessMessage('Admin request rejected successfully!');
      closeAllModals();
      
    } catch (err) {
      console.error('Error rejecting admin:', err);
      setError(`Failed to reject admin: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowApprovalModal(false);
    setShowRejectModal(false);
    setEditingAdmin(null);
    setSelectedPendingAdmin(null);
    setDeleteConfirm(null);
    resetForm();
    setApprovalData({
      accountType: ADMIN_TYPES.CUSTOM,
      assignedProjects: [],
      permissions: {}
    });
    setApprovalErrors({});
    setRejectionReason('');
  };

  const getAccountTypeLabel = (type) => {
    const labels = {
      [ADMIN_TYPES.SUPER_ADMIN]: 'Super Admin',
      [ADMIN_TYPES.FULL_ACCESS]: 'Full Access',
      [ADMIN_TYPES.CUSTOM]: 'Custom'
    };
    return labels[type] || type;
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      [ADMIN_TYPES.SUPER_ADMIN]: 'bg-red-100 text-red-800',
      [ADMIN_TYPES.FULL_ACCESS]: 'bg-blue-100 text-blue-800',
      [ADMIN_TYPES.CUSTOM]: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage admin accounts, permissions, and pending requests</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approved'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approved Admins ({admins.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Requests ({pendingAdmins.length})
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value={ADMIN_TYPES.SUPER_ADMIN}>Super Admin</option>
          <option value={ADMIN_TYPES.FULL_ACCESS}>Full Access</option>
          <option value={ADMIN_TYPES.CUSTOM}>Custom</option>
        </select>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === 'approved' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
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
                {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-red-600">
                            {admin.firstName?.[0]}{admin.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.firstName} {admin.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {admin.nationalId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email}</div>
                    <div className="text-sm text-gray-500">{admin.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(admin.accountType)}`}>
                      {getAccountTypeLabel(admin.accountType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.assignedProjects?.length || 0} projects
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(admin.id, admin.isActive)}
                        className={`${
                          admin.isActive 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(admin)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {admin.firstName?.[0]}{admin.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {admin.nationalId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.email}</div>
                      <div className="text-sm text-gray-500">{admin.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.requestedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openApprovalModal(admin)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(admin)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <AdminForm
          isOpen={showCreateModal || showEditModal}
          isEdit={showEditModal}
          formData={formData}
          formErrors={formErrors}
          projects={projects}
          onInputChange={handleInputChange}
          onProjectToggle={handleProjectToggle}
          onPermissionToggle={handlePermissionToggle}
          onSelectAllPermissions={handleSelectAllPermissions}
          onDeselectAllPermissions={handleDeselectAllPermissions}
          isAllPermissionsSelected={isAllPermissionsSelected}
          isAnyPermissionSelected={isAnyPermissionSelected}
          onSelectAllServices={handleSelectAllServices}
          onDeselectAllServices={handleDeselectAllServices}
          isAllServicesSelected={isAllServicesSelected}
          isAnyServiceSelected={isAnyServiceSelected}
          onSubmit={handleSubmit}
          onClose={closeModals}
          submitting={submitting}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPendingAdmin && (
        <ApprovalModal
          admin={selectedPendingAdmin}
          approvalData={approvalData}
          formErrors={approvalErrors}
          projects={projects}
          onInputChange={(field, value) => {
            setApprovalData(prev => ({ ...prev, [field]: value }));
            if (approvalErrors[field]) {
              setApprovalErrors(prev => ({ ...prev, [field]: null }));
            }
          }}
          onProjectToggle={(projectId) => {
            setApprovalData(prev => ({
              ...prev,
              assignedProjects: prev.assignedProjects.includes(projectId)
                ? prev.assignedProjects.filter(id => id !== projectId)
                : [...prev.assignedProjects, projectId]
            }));
          }}
          onPermissionToggle={(entity, action) => {
            setApprovalData(prev => ({
              ...prev,
              permissions: {
                ...prev.permissions,
                [entity]: prev.permissions[entity]?.includes(action)
                  ? prev.permissions[entity].filter(a => a !== action)
                  : [...(prev.permissions[entity] || []), action]
              }
            }));
          }}
          onSelectAllPermissions={handleApprovalSelectAllPermissions}
          onDeselectAllPermissions={handleApprovalDeselectAllPermissions}
          isAllPermissionsSelected={isApprovalAllPermissionsSelected}
          isAnyPermissionSelected={isApprovalAnyPermissionSelected}
          onApprove={handleApprove}
          onClose={closeAllModals}
          submitting={submitting}
        />
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedPendingAdmin && (
        <RejectionModal
          admin={selectedPendingAdmin}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          onReject={handleReject}
          onClose={closeAllModals}
          submitting={submitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          admin={deleteConfirm}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

// Admin Form Component
const AdminForm = ({
  isOpen,
  isEdit,
  formData,
  formErrors,
  projects,
  onInputChange,
  onProjectToggle,
  onPermissionToggle,
  onSelectAllPermissions,
  onDeselectAllPermissions,
  isAllPermissionsSelected,
  isAnyPermissionSelected,
  onSelectAllServices,
  onDeselectAllServices,
  isAllServicesSelected,
  isAnyServiceSelected,
  onSubmit,
  onClose,
  submitting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[75vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Admin' : 'Create New Admin'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => onInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {formErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => onInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {formErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile *
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => onInputChange('mobile', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter mobile number"
              />
              {formErrors.mobile && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID *
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) => onInputChange('nationalId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  formErrors.nationalId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter national ID"
              />
              {formErrors.nationalId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nationalId}</p>
              )}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => onInputChange('accountType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                formErrors.accountType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={ADMIN_TYPES.SUPER_ADMIN}>Super Admin</option>
              <option value={ADMIN_TYPES.FULL_ACCESS}>Full Access</option>
              <option value={ADMIN_TYPES.CUSTOM}>Custom</option>
            </select>
            {formErrors.accountType && (
              <p className="text-red-500 text-xs mt-1">{formErrors.accountType}</p>
            )}
          </div>

          {/* Project Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Projects *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assignedProjects.includes(project.id)}
                    onChange={() => onProjectToggle(project.id)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{project.name}</span>
                </label>
              ))}
            </div>
            {formErrors.assignedProjects && (
              <p className="text-red-500 text-xs mt-1">{formErrors.assignedProjects}</p>
            )}
          </div>

          {/* Custom Permissions */}
          {formData.accountType === ADMIN_TYPES.CUSTOM && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Permissions *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={isAllServicesSelected() ? onDeselectAllServices : onSelectAllServices}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      isAllServicesSelected() 
                        ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isAllServicesSelected() ? 'Deselect All Services' : 'Select All Services'}
                  </button>
                  {isAnyServiceSelected() && !isAllServicesSelected() && (
                    <button
                      type="button"
                      onClick={onDeselectAllServices}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(PERMISSION_ENTITIES).map(([entityKey, entityValue]) => (
                  <div key={entityKey} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {entityValue.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={isAllPermissionsSelected(entityValue)}
                            onChange={() => isAllPermissionsSelected(entityValue) 
                              ? onDeselectAllPermissions(entityValue)
                              : onSelectAllPermissions(entityValue)
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2">Select All</span>
                        </label>
                        {isAnyPermissionSelected(entityValue) && !isAllPermissionsSelected(entityValue) && (
                          <button
                            type="button"
                            onClick={() => onDeselectAllPermissions(entityValue)}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.values(PERMISSION_ACTIONS).map((action) => (
                        <label key={action} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions[entityValue]?.includes(action) || false}
                            onChange={() => onPermissionToggle(entityValue, action)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {formErrors.permissions && (
                <p className="text-red-500 text-xs mt-1">{formErrors.permissions}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving...' : (isEdit ? 'Update Admin' : 'Create Admin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Approval Modal Component
const ApprovalModal = ({
  admin,
  approvalData,
  formErrors,
  projects,
  onInputChange,
  onProjectToggle,
  onPermissionToggle,
  onSelectAllPermissions,
  onDeselectAllPermissions,
  isAllPermissionsSelected,
  isAnyPermissionSelected,
  onApprove,
  onClose,
  submitting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[75vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Approve Admin Request
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {admin.firstName} {admin.lastName} ({admin.email})
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              value={approvalData.accountType}
              onChange={(e) => onInputChange('accountType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                formErrors.accountType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={ADMIN_TYPES.SUPER_ADMIN}>Super Admin</option>
              <option value={ADMIN_TYPES.FULL_ACCESS}>Full Access</option>
              <option value={ADMIN_TYPES.CUSTOM}>Custom</option>
            </select>
            {formErrors.accountType && (
              <p className="text-red-500 text-xs mt-1">{formErrors.accountType}</p>
            )}
          </div>

          {/* Project Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Projects *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={approvalData.assignedProjects.includes(project.id)}
                    onChange={() => onProjectToggle(project.id)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{project.name}</span>
                </label>
              ))}
            </div>
            {formErrors.assignedProjects && (
              <p className="text-red-500 text-xs mt-1">{formErrors.assignedProjects}</p>
            )}
          </div>

          {/* Custom Permissions */}
          {approvalData.accountType === ADMIN_TYPES.CUSTOM && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions *
              </label>
              <div className="space-y-4">
                {Object.entries(PERMISSION_ENTITIES).map(([entityKey, entityValue]) => (
                  <div key={entityKey} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {entityValue.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={isAllPermissionsSelected(entityValue)}
                            onChange={() => isAllPermissionsSelected(entityValue) 
                              ? onDeselectAllPermissions(entityValue)
                              : onSelectAllPermissions(entityValue)
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2">Select All</span>
                        </label>
                        {isAnyPermissionSelected(entityValue) && !isAllPermissionsSelected(entityValue) && (
                          <button
                            type="button"
                            onClick={() => onDeselectAllPermissions(entityValue)}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.values(PERMISSION_ACTIONS).map((action) => (
                        <label key={action} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={approvalData.permissions[entityValue]?.includes(action) || false}
                            onChange={() => onPermissionToggle(entityValue, action)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {formErrors.permissions && (
                <p className="text-red-500 text-xs mt-1">{formErrors.permissions}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Approving...' : 'Approve Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rejection Modal Component
const RejectionModal = ({
  admin,
  reason,
  onReasonChange,
  onReject,
  onClose,
  submitting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reject Admin Request</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to reject <strong>{admin.firstName} {admin.lastName}</strong>'s admin request?
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="3"
              placeholder="Enter reason for rejection..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onReject}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ admin, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Admin</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <strong>{admin.firstName} {admin.lastName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
