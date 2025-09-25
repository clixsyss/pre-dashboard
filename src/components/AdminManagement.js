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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleSelectAllForEntity = (entity) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: Object.values(PERMISSION_ACTIONS)
      }
    }));
  };

  const handleDeselectAllForEntity = (entity) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: []
      }
    }));
  };

  const handleSelectAllPermissions = () => {
    const allPermissions = {};
    Object.values(PERMISSION_ENTITIES).forEach(entity => {
      allPermissions[entity] = Object.values(PERMISSION_ACTIONS);
    });
    setFormData(prev => ({
      ...prev,
      permissions: allPermissions
    }));
  };

  const handleDeselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: {}
    }));
  };

  // Approval permission handlers
  const handleApprovalSelectAllForEntity = (entity) => {
    setApprovalData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: Object.values(PERMISSION_ACTIONS)
      }
    }));
  };

  const handleApprovalDeselectAllForEntity = (entity) => {
    setApprovalData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: []
      }
    }));
  };

  const handleApprovalSelectAllPermissions = () => {
    const allPermissions = {};
    Object.values(PERMISSION_ENTITIES).forEach(entity => {
      allPermissions[entity] = Object.values(PERMISSION_ACTIONS);
    });
    setApprovalData(prev => ({
      ...prev,
      permissions: allPermissions
    }));
  };

  const handleApprovalDeselectAllPermissions = () => {
    setApprovalData(prev => ({
      ...prev,
      permissions: {}
    }));
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

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
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
    
    // Validate form data
    const validation = validateAdminData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingAdmin) {
        // Update existing admin
        await updateAdmin(editingAdmin.id, formData);
        setAdmins(prev => prev.map(admin => 
          admin.id === editingAdmin.id ? { ...admin, ...formData } : admin
        ));
        alert('Admin updated successfully!');
      } else {
        // Create new admin
        const newAdmin = await createAdmin(formData);
        setAdmins(prev => [newAdmin, ...prev]);
        // Alert is now shown in the service
      }
      
      closeAllModals();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId) => {
    try {
      await deleteAdmin(adminId);
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (adminId, isActive) => {
    try {
      await updateAdmin(adminId, { isActive: !isActive });
      setAdmins(prev => prev.map(admin => 
        admin.id === adminId ? { ...admin, isActive: !isActive } : admin
      ));
      alert(`Admin ${!isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      setError(err.message);
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
    // Validate approval data
    const validation = validateApprovalData(approvalData);
    if (!validation.isValid) {
      setApprovalErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      
      await approvePendingAdmin(selectedPendingAdmin.id, {
        ...approvalData,
        approvedBy: 'current-super-admin' // TODO: Get from auth context
      });
      
      // Refresh data
      await loadData();
      closeAllModals();
      alert('Admin request approved successfully!');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      
      await rejectPendingAdmin(selectedPendingAdmin.id, 'current-super-admin', rejectionReason);
      
      // Refresh data
      await loadData();
      closeAllModals();
      alert('Admin request rejected.');
      
    } catch (err) {
      setError(err.message);
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
          onSelectAllForEntity={handleSelectAllForEntity}
          onDeselectAllForEntity={handleDeselectAllForEntity}
          onSelectAllPermissions={handleSelectAllPermissions}
          onDeselectAllPermissions={handleDeselectAllPermissions}
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
          onSelectAllForEntity={handleApprovalSelectAllForEntity}
          onDeselectAllForEntity={handleApprovalDeselectAllForEntity}
          onSelectAllPermissions={handleApprovalSelectAllPermissions}
          onDeselectAllPermissions={handleApprovalDeselectAllPermissions}
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
  onSelectAllForEntity,
  onDeselectAllForEntity,
  onSelectAllPermissions,
  onDeselectAllPermissions,
  onSubmit,
  onClose,
  submitting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onSelectAllPermissions}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={onDeselectAllPermissions}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(PERMISSION_ENTITIES).map(([entityKey, entityValue]) => (
                  <div key={entityKey} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {entityValue.replace('_', ' ')}
                      </h4>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => onSelectAllForEntity(entityValue)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeselectAllForEntity(entityValue)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          None
                        </button>
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
  onApprove,
  onClose,
  submitting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {entityValue.replace('_', ' ')}
                    </h4>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
