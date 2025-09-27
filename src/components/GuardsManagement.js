import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Key,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

const GuardsManagement = ({ projectId }) => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    nationalId: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Load guards
  const loadGuards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const guardsRef = collection(db, 'projects', projectId, 'guards');
      const q = query(guardsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const guardsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setGuards(guardsData);
    } catch (err) {
      console.error('Error loading guards:', err);
      setError(`Failed to load guards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadGuards();
  }, [loadGuards]);

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

  // Filter guards
  const filteredGuards = guards.filter(guard => {
    const matchesSearch = 
      guard.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.mobile?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.mobile)) {
      errors.mobile = 'Invalid mobile number format';
    }

    if (!formData.nationalId.trim()) {
      errors.nationalId = 'National ID is required';
    }

    if (!editingGuard && !formData.password.trim()) {
      errors.password = 'Password is required for new guards';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      nationalId: '',
      password: ''
    });
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (guard) => {
    setFormData({
      firstName: guard.firstName || '',
      lastName: guard.lastName || '',
      email: guard.email || '',
      mobile: guard.mobile || '',
      nationalId: guard.nationalId || '',
      password: '' // Don't pre-fill password
    });
    setEditingGuard(guard);
    setShowEditModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingGuard(null);
    resetForm();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and messages
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingGuard) {
        // Update existing guard
        const guardRef = doc(db, 'projects', projectId, 'guards', editingGuard.id);
        await updateDoc(guardRef, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          nationalId: formData.nationalId.trim(),
          isActive: formData.isActive,
          updatedAt: serverTimestamp()
        });

        setGuards(prev => prev.map(guard => 
          guard.id === editingGuard.id 
            ? { ...guard, ...formData, updatedAt: new Date() }
            : guard
        ));

        setSuccessMessage('Guard updated successfully!');
      } else {
        // Create new guard
        // For now, create the guard document without Firebase Auth user
        // The admin can manually create the Firebase Auth user later
        
        const guardData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          nationalId: formData.nationalId.trim(),
          firebaseUid: null, // Will be set when Firebase Auth user is created
          role: 'guard',
          permissions: {
            users: ['read'] // Guards can only read user data
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: null,
          tempPassword: formData.password // Store password temporarily for Firebase Auth creation
        };

        // Create the guard document in the project's guards subcollection
        const docRef = await addDoc(collection(db, 'projects', projectId, 'guards'), guardData);
        
        setGuards(prev => [{ id: docRef.id, ...guardData }, ...prev]);
        setSuccessMessage('Guard created successfully! Use the "Create Auth" button to create the Firebase Auth user.');
      }

      closeModals();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to ${editingGuard ? 'update' : 'create'} guard: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (guardId) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      await deleteDoc(doc(db, 'projects', projectId, 'guards', guardId));
      setGuards(prev => prev.filter(guard => guard.id !== guardId));
      setDeleteConfirm(null);
      setSuccessMessage('Guard deleted successfully!');
    } catch (err) {
      console.error('Error deleting guard:', err);
      setError(`Failed to delete guard: ${err.message}`);
    }
  };


  // Handle password reset
  const handlePasswordReset = async (guard) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      await sendPasswordResetEmail(auth, guard.email);
      setSuccessMessage(`Password reset email sent to ${guard.email}`);
    } catch (err) {
      console.error('Error sending password reset:', err);
      setError(`Failed to send password reset: ${err.message}`);
    }
  };

  // Handle Firebase Auth user creation
  const handleCreateFirebaseAuth = async (guard) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      if (!guard.tempPassword) {
        setError('No temporary password found for this guard. Please recreate the guard account.');
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        guard.email, 
        guard.tempPassword
      );
      
      const firebaseUid = userCredential.user.uid;
      
      // Update the guard document with the Firebase UID
      const guardRef = doc(db, 'projects', projectId, 'guards', guard.id);
      await updateDoc(guardRef, {
        firebaseUid: firebaseUid,
        tempPassword: null // Remove temporary password
      });
      
      // Update local state
      setGuards(prev => prev.map(g => 
        g.id === guard.id 
          ? { ...g, firebaseUid: firebaseUid, tempPassword: null }
          : g
      ));
      
      // Sign out the guard user immediately
      await signOut(auth);
      
      setSuccessMessage('Firebase Auth user created successfully! The guard can now sign in. Please sign back in as admin to continue.');
      
    } catch (err) {
      console.error('Error creating Firebase Auth user:', err);
      setError(`Failed to create Firebase Auth user: ${err.message}`);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Guards Management</h2>
          <p className="text-gray-600">Manage guard accounts for this project</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Guard
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search guards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Guards List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guard
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuards.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {guard.firstName} {guard.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {guard.nationalId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{guard.email}</div>
                    <div className="text-sm text-gray-500">{guard.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guard.firebaseUid ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Auth Ready
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Auth Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {guard.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!guard.firebaseUid && guard.tempPassword && (
                      <button
                        onClick={() => handleCreateFirebaseAuth(guard)}
                        className="text-green-600 hover:text-green-900"
                        title="Create Firebase Auth User"
                      >
                        <User className="h-4 w-4" />
                      </button>
                    )}
                    {guard.firebaseUid && (
                      <button
                        onClick={() => handlePasswordReset(guard)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(guard)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(guard)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGuards.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No guards found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new guard account.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingGuard ? 'Edit Guard' : 'Create New Guard'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
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
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter mobile number"
                  />
                  {formErrors.mobile && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID *
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
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

              {!editingGuard && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password (min 6 characters)"
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                  )}
                </div>
              )}


              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Saving...' : editingGuard ? 'Update Guard' : 'Create Guard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Guard</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardsManagement;
