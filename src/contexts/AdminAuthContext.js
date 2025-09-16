import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAdminById } from '../services/adminService';

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

  // Load admin data from localStorage on mount
  useEffect(() => {
    const loadAdminFromStorage = async () => {
      try {
        setLoading(true);
        const storedAdminId = localStorage.getItem('adminId');
        
        if (storedAdminId) {
          const admin = await getAdminById(storedAdminId);
          setCurrentAdmin(admin);
        }
      } catch (err) {
        console.error('Error loading admin from storage:', err);
        setError(err.message);
        // Clear invalid admin data
        localStorage.removeItem('adminId');
      } finally {
        setLoading(false);
      }
    };

    loadAdminFromStorage();
  }, []);

  // Login admin
  const loginAdmin = async (adminId) => {
    try {
      setLoading(true);
      setError(null);
      
      const admin = await getAdminById(adminId);
      setCurrentAdmin(admin);
      localStorage.setItem('adminId', adminId);
      
      return admin;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout admin
  const logoutAdmin = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('adminId');
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
    if (!currentAdmin) return [];
    
    if (currentAdmin.accountType === 'super_admin') {
      return allProjects;
    }
    
    return allProjects.filter(project => 
      currentAdmin.assignedProjects?.includes(project.id)
    );
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
    loginAdmin,
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
