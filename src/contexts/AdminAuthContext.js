import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    let isMounted = true;
    
    const loadAdminData = async () => {
      if (!currentUser) {
        if (isMounted) {
          setCurrentAdmin(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Get admin data from Firestore using Firebase UID
        const adminRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (isMounted) {
          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            console.log('AdminAuthContext: Admin data loaded successfully', { 
              id: adminSnap.id, 
              accountType: adminData.accountType,
              isActive: adminData.isActive,
              assignedProjects: adminData.assignedProjects 
            });
            setCurrentAdmin({
              id: adminSnap.id,
              ...adminData
            });
          } else {
            console.log('AdminAuthContext: Admin account not found for UID:', currentUser.uid);
            setCurrentAdmin(null);
            setError('Admin account not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading admin data:', err);
          setError(err.message);
          setCurrentAdmin(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAdminData();
    
    return () => {
      isMounted = false;
    };
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
  const hasPermission = useCallback((entity, action) => {
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
        academies: ['read', 'write', 'delete'],
        courts: ['read', 'write', 'delete'],
        bookings: ['read', 'write', 'delete'],
        complaints: ['read', 'write', 'delete'],
        news: ['read', 'write', 'delete'],
        notifications: ['read', 'write', 'delete', 'send'],
        store: ['read', 'write', 'delete'],
        orders: ['read', 'write', 'delete'],
        gate_pass: ['read', 'write', 'delete'],
        guidelines: ['read', 'write', 'delete'],
        ads: ['read', 'write', 'delete'],
        fines: ['read', 'write', 'delete'],
        support: ['read', 'write', 'delete'],
        admin_accounts: ['read']
      };
      
      return defaultPermissions[entity]?.includes(action) || false;
    }
    
    if (currentAdmin.accountType === 'custom') {
      return currentAdmin.permissions?.[entity]?.includes(action) || false;
    }
    
    return false;
  }, [currentAdmin?.accountType, currentAdmin?.permissions]);

  // Check if admin has access to project
  const hasProjectAccess = useCallback((projectId) => {
    if (!currentAdmin) return false;
    
    if (currentAdmin.accountType === 'super_admin') {
      return true;
    }
    
    return currentAdmin.assignedProjects?.includes(projectId) || false;
  }, [currentAdmin?.accountType, currentAdmin?.assignedProjects]);

  // Get filtered projects for current admin
  const getFilteredProjects = useCallback((allProjects) => {
    if (!currentAdmin) {
      return [];
    }
    
    if (currentAdmin.accountType === 'super_admin') {
      return allProjects;
    }
    
    return allProjects.filter(project => 
      currentAdmin.assignedProjects?.includes(project.id)
    );
  }, [currentAdmin?.accountType, currentAdmin?.assignedProjects]);

  // Check if admin is super admin
  const isSuperAdmin = useCallback(() => {
    return currentAdmin?.accountType === 'super_admin';
  }, [currentAdmin?.accountType]);

  // Check if admin is active
  const isActive = useCallback(() => {
    return currentAdmin?.isActive === true;
  }, [currentAdmin?.isActive]);

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
