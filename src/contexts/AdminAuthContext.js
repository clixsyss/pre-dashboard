import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
        
        // First check if user is an admin
        const adminRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          console.log('AdminAuthContext: Admin data loaded successfully', { 
            id: adminSnap.id, 
            accountType: adminData.accountType,
            isActive: adminData.isActive,
            assignedProjects: adminData.assignedProjects 
          });
          
          if (isMounted) {
            setCurrentAdmin({
              id: adminSnap.id,
              ...adminData
            });
          }
        } else {
          // If not an admin, check if user is a guard
          console.log('AdminAuthContext: Not an admin, checking for guard account...');
          
          // Search for guard in all projects
          const projectsRef = collection(db, 'projects');
          const projectsSnap = await getDocs(projectsRef);
          
          let guardFound = false;
          let guardData = null;
          let guardProjectId = null;
          
          for (const projectDoc of projectsSnap.docs) {
            const guardsRef = collection(db, 'projects', projectDoc.id, 'guards');
            const guardsQuery = query(guardsRef, where('firebaseUid', '==', currentUser.uid));
            const guardsSnap = await getDocs(guardsQuery);
            
            if (!guardsSnap.empty) {
              const guardDoc = guardsSnap.docs[0];
              guardData = guardDoc.data();
              guardProjectId = projectDoc.id;
              guardFound = true;
              console.log('AdminAuthContext: Guard found in project:', projectDoc.id);
              break;
            }
          }
          
          if (guardFound && guardData) {
            console.log('AdminAuthContext: Guard data loaded successfully', { 
              id: guardData.id,
              projectId: guardProjectId,
              email: guardData.email,
              role: guardData.role
            });
            
            if (isMounted) {
              setCurrentAdmin({
                id: currentUser.uid,
                ...guardData,
                projectId: guardProjectId,
                accountType: 'guard',
                isActive: true // Guards are automatically active
              });
            }
          } else {
            console.log('AdminAuthContext: Neither admin nor guard account found for UID:', currentUser.uid);
            if (isMounted) {
              setCurrentAdmin(null);
              setError('Access denied. Your account is not approved or active.');
            }
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
    
    // Handle guard permissions
    if (currentAdmin.accountType === 'guard') {
      // Guards can only read user data from their assigned project
      if (entity === 'users' && action === 'read') {
        return true;
      }
      // Guards cannot access any other entities
      return false;
    }
    
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
        requests: ['read', 'write', 'delete'],
        academies: ['read', 'write', 'delete'],
        sports: ['read', 'write', 'delete'],
        courts: ['read', 'write', 'delete'],
        bookings: ['read', 'write', 'delete'],
        complaints: ['read', 'write', 'delete'],
        news: ['read', 'write', 'delete'],
        events: ['read', 'write', 'delete'],
        notifications: ['read', 'write', 'delete', 'send'],
        email_newsletter: ['read', 'write', 'delete', 'send'],
        store: ['read', 'write', 'delete'],
        orders: ['read', 'write', 'delete'],
        gate_pass: ['read', 'write', 'delete'],
        guest_passes: ['read', 'write', 'delete'],
        guidelines: ['read', 'write', 'delete'],
        ads: ['read', 'write', 'delete'],
        fines: ['read', 'write', 'delete'],
        support: ['read', 'write', 'delete'],
        guards: ['read', 'write', 'delete'],
        device_keys: ['read', 'write', 'delete'],
        admin_accounts: ['read']
      };
      
      return defaultPermissions[entity]?.includes(action) || false;
    }
    
    if (currentAdmin.accountType === 'custom') {
      return currentAdmin.permissions?.[entity]?.includes(action) || false;
    }
    
    return false;
  }, [currentAdmin]);

  // Check if admin has access to project
  const hasProjectAccess = useCallback((projectId) => {
    if (!currentAdmin) return false;
    
    if (currentAdmin.accountType === 'super_admin') {
      return true;
    }
    
    // Guards can only access their assigned project
    if (currentAdmin.accountType === 'guard') {
      return currentAdmin.projectId === projectId;
    }
    
    return currentAdmin.assignedProjects?.includes(projectId) || false;
  }, [currentAdmin]);

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
  }, [currentAdmin]);

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
