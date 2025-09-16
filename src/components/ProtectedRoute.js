import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import PermissionGate from './PermissionGate';

/**
 * Protected Route Component
 * Wraps components that require specific permissions
 */
const ProtectedRoute = ({ 
  children, 
  entity, 
  action, 
  projectId, 
  fallback = <AccessDenied />,
  requireActive = true 
}) => {
  const { currentAdmin, isActive } = useAdminAuth();

  // Check if admin is logged in
  if (!currentAdmin) {
    return <LoginRequired />;
  }

  // Check if admin is active (if required)
  if (requireActive && !isActive()) {
    return <InactiveAccount />;
  }

  // Use PermissionGate for permission checking
  return (
    <PermissionGate
      entity={entity}
      action={action}
      projectId={projectId}
      admin={currentAdmin}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
};

/**
 * Access Denied Component
 */
const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this resource.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

/**
 * Login Required Component
 */
const LoginRequired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
      <p className="text-gray-600 mb-4">
        Please log in to access this resource.
      </p>
      <button
        onClick={() => window.location.href = '/login'}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Login
      </button>
    </div>
  </div>
);

/**
 * Inactive Account Component
 */
const InactiveAccount = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Account Inactive</h3>
      <p className="text-gray-600 mb-4">
        Your admin account is currently inactive. Please contact a super admin for assistance.
      </p>
      <button
        onClick={() => window.location.href = '/login'}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
      >
        Go to Login
      </button>
    </div>
  </div>
);

export default ProtectedRoute;
