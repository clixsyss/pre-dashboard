import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from '../config/firebase';

const COLLECTIONS = {
  ADMINS: 'admins',
  PERMISSIONS: 'permissions',
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
 * Create a new admin account with temporary password
 */
export const createAdmin = async (adminData) => {
  try {
    const tempPassword = generateTemporaryPassword();
    
    // Create admin document in Firestore
    const adminRef = collection(db, COLLECTIONS.ADMINS);
    const adminDoc = {
      ...adminData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      lastLogin: null,
      passwordSetupRequired: true,
      tempPassword: tempPassword,
      firebaseUid: null
    };
    
    const docRef = await addDoc(adminRef, adminDoc);
    
    // Send password setup email
    await sendPasswordSetupEmail(adminData.email, tempPassword);
    
    return { 
      id: docRef.id, 
      ...adminDoc
    };
  } catch (error) {
    console.error('Error creating admin:', error);
    throw new Error('Failed to create admin account');
  }
};


/**
 * Generate a temporary password for admin setup
 */
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Send password setup email to admin
 */
const sendPasswordSetupEmail = async (email, tempPassword) => {
  try {
    // Log the credentials for now (since we don't have email service set up)
    console.log(`\n=== ADMIN SETUP CREDENTIALS ===`);
    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(`Login URL: ${window.location.origin}/login`);
    console.log(`===============================\n`);
    
    // Show alert to admin creator with the credentials
    alert(`Admin created successfully!\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\nLogin URL: ${window.location.origin}/login\n\nPlease share these credentials with the admin.`);
    
    // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
    // await sendEmail({
    //   to: email,
    //   subject: 'Admin Account Setup',
    //   template: 'admin-setup',
    //   data: { tempPassword, loginUrl: `${window.location.origin}/login` }
    // });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password setup email:', error);
    throw new Error('Failed to send password setup email');
  }
};

/**
 * Get all admin accounts
 */
export const getAllAdmins = async () => {
  try {
    const adminsRef = collection(db, COLLECTIONS.ADMINS);
    const q = query(adminsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw new Error('Failed to fetch admin accounts');
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (adminId) => {
  try {
    const adminRef = doc(db, COLLECTIONS.ADMINS, adminId);
    const adminSnap = await getDoc(adminRef);
    
    if (adminSnap.exists()) {
      return { id: adminSnap.id, ...adminSnap.data() };
    } else {
      throw new Error('Admin not found');
    }
  } catch (error) {
    console.error('Error fetching admin:', error);
    throw new Error('Failed to fetch admin account');
  }
};

/**
 * Update admin account
 */
export const updateAdmin = async (adminId, updateData) => {
  try {
    const adminRef = doc(db, COLLECTIONS.ADMINS, adminId);
    await updateDoc(adminRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return { id: adminId, ...updateData };
  } catch (error) {
    console.error('Error updating admin:', error);
    throw new Error('Failed to update admin account');
  }
};

/**
 * Delete admin account
 */
export const deleteAdmin = async (adminId) => {
  try {
    const adminRef = doc(db, COLLECTIONS.ADMINS, adminId);
    await deleteDoc(adminRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw new Error('Failed to delete admin account');
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
 * Check if admin has permission for specific action
 */
export const hasPermission = (admin, entity, action) => {
  if (admin.accountType === ADMIN_TYPES.SUPER_ADMIN) {
    return true;
  }
  
  if (admin.accountType === ADMIN_TYPES.FULL_ACCESS) {
    return DEFAULT_PERMISSIONS[ADMIN_TYPES.FULL_ACCESS][entity]?.includes(action) || false;
  }
  
  if (admin.accountType === ADMIN_TYPES.CUSTOM) {
    return admin.permissions?.[entity]?.includes(action) || false;
  }
  
  return false;
};

/**
 * Check if admin has access to specific project
 */
export const hasProjectAccess = (admin, projectId) => {
  if (admin.accountType === ADMIN_TYPES.SUPER_ADMIN) {
    return true;
  }
  
  return admin.assignedProjects?.includes(projectId) || false;
};

/**
 * Get filtered projects for admin
 */
export const getFilteredProjects = (admin, allProjects) => {
  if (admin.accountType === ADMIN_TYPES.SUPER_ADMIN) {
    return allProjects;
  }
  
  return allProjects.filter(project => 
    admin.assignedProjects?.includes(project.id)
  );
};

/**
 * Login admin (simplified - just validates admin exists)
 */
export const loginAdmin = async (email, password) => {
  try {
    const adminData = await getAdminByEmail(email);
    
    if (!adminData) {
      throw new Error('No admin account found with this email');
    }
    
    if (!adminData.isActive) {
      throw new Error('Admin account is inactive');
    }
    
    // For now, just return admin data - you can add password validation later
    return adminData;
  } catch (error) {
    console.error('Error logging in admin:', error);
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Get admin by email
 */
export const getAdminByEmail = async (email) => {
  try {
    const adminsRef = collection(db, COLLECTIONS.ADMINS);
    const q = query(adminsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching admin by email:', error);
    throw new Error('Failed to fetch admin account');
  }
};


/**
 * Send password reset email to admin
 */
export const sendAdminPasswordReset = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No admin account found with this email');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else {
      throw new Error('Failed to send password reset email');
    }
  }
};


/**
 * Validate admin data
 */
export const validateAdminData = (adminData) => {
  const errors = {};
  
  // Required fields
  if (!adminData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!adminData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!adminData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!adminData.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!/^[0-9+\-\s()]+$/.test(adminData.mobile)) {
    errors.mobile = 'Invalid mobile number format';
  }
  
  if (!adminData.nationalId?.trim()) {
    errors.nationalId = 'National ID is required';
  }
  
  if (!adminData.accountType) {
    errors.accountType = 'Account type is required';
  }
  
  // Custom permissions validation
  if (adminData.accountType === ADMIN_TYPES.CUSTOM) {
    if (!adminData.permissions || Object.keys(adminData.permissions).length === 0) {
      errors.permissions = 'At least one permission must be assigned for custom accounts';
    }
  }
  
  // Project assignment validation
  if (!adminData.assignedProjects || adminData.assignedProjects.length === 0) {
    errors.assignedProjects = 'At least one project must be assigned';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
