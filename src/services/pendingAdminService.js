import { 
  collection, 
  doc, 
  setDoc,
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTIONS = {
  PENDING_ADMINS: 'pendingAdmins',
  ADMINS: 'admins',
  PROJECTS: 'projects'
};

/**
 * Admin Account Types
 */
export const ADMIN_TYPES = {
  SUPER_ADMIN: 'super_admin',
  FULL_ACCESS: 'full_access',
  CUSTOM: 'custom'
};

/**
 * Permission Entities
 */
export const PERMISSION_ENTITIES = {
  USERS: 'users',
  UNITS: 'units',
  LOGS: 'logs',
  SERVICES: 'services',
  ACADEMIES: 'academies',
  COURTS: 'courts',
  BOOKINGS: 'bookings',
  COMPLAINTS: 'complaints',
  NEWS: 'news',
  NOTIFICATIONS: 'notifications',
  STORE: 'store',
  ORDERS: 'orders',
  GATE_PASS: 'gate_pass',
  GUIDELINES: 'guidelines',
  ADS: 'ads',
  FINES: 'fines',
  SUPPORT: 'support',
  GUARDS: 'guards',
  ADMIN_ACCOUNTS: 'admin_accounts'
};

/**
 * Permission Actions
 */
export const PERMISSION_ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  CREATE: 'create',
  SEND: 'send'
};

/**
 * Default permissions for each admin type
 */
export const DEFAULT_PERMISSIONS = {
  [ADMIN_TYPES.SUPER_ADMIN]: {
    [PERMISSION_ENTITIES.USERS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.UNITS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.LOGS]: [PERMISSION_ACTIONS.READ],
    [PERMISSION_ENTITIES.SERVICES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ACADEMIES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.COURTS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.BOOKINGS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.COMPLAINTS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.NEWS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.NOTIFICATIONS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE, PERMISSION_ACTIONS.SEND],
    [PERMISSION_ENTITIES.STORE]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ORDERS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GATE_PASS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GUIDELINES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ADS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.FINES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.SUPPORT]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GUARDS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ADMIN_ACCOUNTS]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE]
  },
  [ADMIN_TYPES.FULL_ACCESS]: {
    [PERMISSION_ENTITIES.USERS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.UNITS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.LOGS]: [PERMISSION_ACTIONS.READ],
    [PERMISSION_ENTITIES.SERVICES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ACADEMIES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.COURTS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.BOOKINGS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.COMPLAINTS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.NEWS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.NOTIFICATIONS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE, PERMISSION_ACTIONS.SEND],
    [PERMISSION_ENTITIES.STORE]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ORDERS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GATE_PASS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GUIDELINES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ADS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.FINES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.SUPPORT]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.GUARDS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE, PERMISSION_ACTIONS.DELETE],
    [PERMISSION_ENTITIES.ADMIN_ACCOUNTS]: [PERMISSION_ACTIONS.READ]
  },
  [ADMIN_TYPES.CUSTOM]: {}
};

/**
 * Get all pending admin requests
 */
export const getPendingAdmins = async () => {
  try {
    console.log('Fetching pending admins...');
    const pendingRef = collection(db, COLLECTIONS.PENDING_ADMINS);
    const q = query(pendingRef, orderBy('requestedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log('Pending admins query result:', querySnapshot.docs.length, 'documents found');
    
    const pendingAdmins = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Pending admin document:', doc.id, data);
      return {
        id: doc.id,
        ...data
      };
    });
    
    console.log('Processed pending admins:', pendingAdmins);
    return pendingAdmins;
  } catch (error) {
    console.error('Error fetching pending admins:', error);
    throw new Error('Failed to fetch pending admin requests');
  }
};

/**
 * Get pending admin by ID
 */
export const getPendingAdminById = async (pendingAdminId) => {
  try {
    const pendingRef = doc(db, COLLECTIONS.PENDING_ADMINS, pendingAdminId);
    const pendingSnap = await getDoc(pendingRef);
    
    if (pendingSnap.exists()) {
      return { id: pendingSnap.id, ...pendingSnap.data() };
    } else {
      throw new Error('Pending admin request not found');
    }
  } catch (error) {
    console.error('Error fetching pending admin:', error);
    throw new Error('Failed to fetch pending admin request');
  }
};

/**
 * Approve pending admin request
 */
export const approvePendingAdmin = async (pendingAdminId, approvalData) => {
  try {
    const { accountType, assignedProjects, permissions, approvedBy } = approvalData;
    
    // Get the pending admin data
    const pendingAdmin = await getPendingAdminById(pendingAdminId);
    
    // Create admin document
    const adminData = {
      firstName: pendingAdmin.firstName,
      lastName: pendingAdmin.lastName,
      email: pendingAdmin.email,
      mobile: pendingAdmin.mobile,
      nationalId: pendingAdmin.nationalId,
      firebaseUid: pendingAdmin.firebaseUid,
      accountType: accountType,
      assignedProjects: assignedProjects || [],
      permissions: permissions || {},
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      approvedBy: approvedBy,
      approvedAt: serverTimestamp()
    };
    
    // Add to admins collection using Firebase UID as document ID
    const adminRef = doc(db, COLLECTIONS.ADMINS, pendingAdmin.firebaseUid);
    await setDoc(adminRef, adminData);
    
    // Update pending admin status
    const pendingRef = doc(db, COLLECTIONS.PENDING_ADMINS, pendingAdminId);
    await updateDoc(pendingRef, {
      status: 'approved',
      approvedBy: approvedBy,
      approvedAt: serverTimestamp(),
      adminId: pendingAdmin.firebaseUid
    });
    
    return { 
      id: pendingAdmin.firebaseUid, 
      ...adminData 
    };
  } catch (error) {
    console.error('Error approving pending admin:', error);
    throw new Error('Failed to approve admin request');
  }
};

/**
 * Reject pending admin request
 */
export const rejectPendingAdmin = async (pendingAdminId, rejectedBy, reason = '') => {
  try {
    const pendingRef = doc(db, COLLECTIONS.PENDING_ADMINS, pendingAdminId);
    await updateDoc(pendingRef, {
      status: 'rejected',
      rejectedBy: rejectedBy,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting pending admin:', error);
    throw new Error('Failed to reject admin request');
  }
};

/**
 * Get all projects
 */
export const getAllProjects = async () => {
  try {
    const projectsRef = collection(db, COLLECTIONS.PROJECTS);
    const querySnapshot = await getDocs(projectsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
};

/**
 * Validate approval data
 */
export const validateApprovalData = (approvalData) => {
  const errors = {};
  
  if (!approvalData.accountType) {
    errors.accountType = 'Account type is required';
  }
  
  if (!approvalData.assignedProjects || approvalData.assignedProjects.length === 0) {
    errors.assignedProjects = 'At least one project must be assigned';
  }
  
  if (approvalData.accountType === ADMIN_TYPES.CUSTOM) {
    if (!approvalData.permissions || Object.keys(approvalData.permissions).length === 0) {
      errors.permissions = 'At least one permission must be assigned for custom accounts';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
