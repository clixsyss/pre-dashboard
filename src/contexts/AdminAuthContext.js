import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Load admin data when user changes
  useEffect(() => {
    const loadAdminData = async () => {
      if (!currentUser) {
        setCurrentAdmin(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get admin data from Firestore using Firebase UID
        const adminRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          console.log('Admin data loaded:', adminData);
          setCurrentAdmin({
            id: adminSnap.id,
            ...adminData
          });
        } else {
          console.log('Admin document not found for UID:', currentUser.uid);
          setCurrentAdmin(null);
          setError('Admin account not found');
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError(err.message);
        setCurrentAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [currentUser]);

  // Logout admin (uses AuthContext logout)
  const logoutAdmin = () => {
    setCurrentAdmin(null);
  };

  // Update admin data
  const updateAdminData = (updatedData) => {
    setCurrentAdmin(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  // Check if admin has permission
  const hasPermission = (entity, action) => {
    if (!currentAdmin) return false;
    
    if (currentAdmin.accountType === 'super_admin') {
      return true;
    }
    
    if (currentAdmin.accountType === 'full_access') {
      // Check against default full access permissions
      const defaultPermissions = {
        users: ['read', 'write', 'delete'],
        units: ['read', 'write', 'delete'],
        logs: ['read'],
        services: ['read', 'write', 'delete'],
        complaints: ['read', 'write', 'delete'],
        news: ['read', 'write', 'delete'],
        notifications: ['read', 'write', 'delete', 'send'],
        admin_accounts: ['read']
      };
      
      return defaultPermissions[entity]?.includes(action) || false;
    }
    
    if (currentAdmin.accountType === 'custom') {
      return currentAdmin.permissions?.[entity]?.includes(action) || false;
    }
    
    return false;
  };

  // Check if admin has access to project
  const hasProjectAccess = (projectId) => {
    if (!currentAdmin) return false;
    
    if (currentAdmin.accountType === 'super_admin') {
      return true;
    }
    
    return currentAdmin.assignedProjects?.includes(projectId) || false;
  };

  // Get filtered projects for current admin
  const getFilteredProjects = (allProjects) => {
    console.log('getFilteredProjects called with:', { currentAdmin, allProjects });
    
    if (!currentAdmin) {
      console.log('No current admin, returning empty array');
      return [];
    }
    
    if (currentAdmin.accountType === 'super_admin') {
      console.log('Super admin detected, returning all projects');
      return allProjects;
    }
    
    console.log('Regular admin, filtering by assigned projects:', currentAdmin.assignedProjects);
    const filtered = allProjects.filter(project => 
      currentAdmin.assignedProjects?.includes(project.id)
    );
    console.log('Filtered projects:', filtered);
    return filtered;
  };

  // Check if admin is super admin
  const isSuperAdmin = () => {
    return currentAdmin?.accountType === 'super_admin';
  };

  // Check if admin is active
  const isActive = () => {
    return currentAdmin?.isActive === true;
  };

  const value = {
    currentAdmin,
    loading,
    error,
    logoutAdmin,
    updateAdminData,
    hasPermission,
    hasProjectAccess,
    getFilteredProjects,
    isSuperAdmin,
    isActive
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
