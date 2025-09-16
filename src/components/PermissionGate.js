import React from 'react';
import { hasPermission, hasProjectAccess } from '../services/adminService';

/**
 * Permission Gate Component
 * Controls what content admins can see based on their permissions
 */
const PermissionGate = ({ 
  children, 
  entity, 
  action, 
  projectId, 
  admin, 
  fallback = null 
}) => {
  // Check if admin has permission for the specific action
  const hasEntityPermission = entity && action ? hasPermission(admin, entity, action) : true;
  
  // Check if admin has access to the specific project
  const hasProjectPermission = projectId ? hasProjectAccess(admin, projectId) : true;
  
  // Show content only if admin has both entity and project permissions
  if (hasEntityPermission && hasProjectPermission) {
    return <>{children}</>;
  }
  
  // Return fallback or null if no permissions
  return fallback;
};

/**
 * Hook to check permissions
 */
export const usePermissions = (admin) => {
  const canAccess = (entity, action, projectId = null) => {
    const hasEntityPermission = entity && action ? hasPermission(admin, entity, action) : true;
    const hasProjectPermission = projectId ? hasProjectAccess(admin, projectId) : true;
    return hasEntityPermission && hasProjectPermission;
  };

  const canRead = (entity, projectId = null) => canAccess(entity, 'read', projectId);
  const canWrite = (entity, projectId = null) => canAccess(entity, 'write', projectId);
  const canDelete = (entity, projectId = null) => canAccess(entity, 'delete', projectId);
  const canCreate = (entity, projectId = null) => canAccess(entity, 'create', projectId);
  const canSend = (entity, projectId = null) => canAccess(entity, 'send', projectId);

  return {
    canAccess,
    canRead,
    canWrite,
    canDelete,
    canCreate,
    canSend
  };
};

/**
 * Hook to get filtered projects for admin
 */
export const useFilteredProjects = (admin, allProjects) => {
  if (admin.accountType === 'super_admin') {
    return allProjects;
  }
  
  return allProjects.filter(project => 
    admin.assignedProjects?.includes(project.id)
  );
};

export default PermissionGate;
