import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is an approved admin or guard
  const checkAdminStatus = async (user) => {
    if (!user) return false;
    
    try {
      // Check if user exists in approved admins collection
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      
      if (adminSnap.exists()) {
        const adminData = adminSnap.data();
        return adminData.isActive !== false; // Return true if active (or undefined)
      }
      
      // If not an admin, check if user is a guard
      console.log('Not an admin, checking for guard account...');
      
      // Search for guard in all projects
      const projectsRef = collection(db, 'projects');
      const projectsSnap = await getDocs(projectsRef);
      
      for (const projectDoc of projectsSnap.docs) {
        const guardsRef = collection(db, 'projects', projectDoc.id, 'guards');
        const guardsQuery = query(guardsRef, where('firebaseUid', '==', user.uid));
        const guardsSnap = await getDocs(guardsQuery);
        
        if (!guardsSnap.empty) {
          const guardData = guardsSnap.docs[0].data();
          console.log('Guard account found in project:', projectDoc.id);
          // Guards are automatically approved
          return true;
        }
      }
      
      // If not a guard, check if they're pending admin
      const pendingRef = collection(db, 'pendingAdmins');
      const q = query(pendingRef, where('firebaseUid', '==', user.uid));
      const pendingSnap = await getDocs(q);
      
      if (!pendingSnap.empty) {
        const pendingData = pendingSnap.docs[0].data();
        if (pendingData.status === 'pending') {
          console.log('Admin account is pending approval');
          throw new Error('Your account is pending approval. Please wait for a super admin to approve your request.');
        } else if (pendingData.status === 'rejected') {
          console.log('Admin account was rejected');
          throw new Error('Your admin request has been rejected. Please contact a super admin for more information.');
        }
      }
      
      return false; // Not found in any collection
    } catch (error) {
      // Don't log as error for pending/rejected status - this is expected behavior
      if (!error.message.includes('pending approval') && !error.message.includes('rejected')) {
        console.error('Error checking admin status:', error);
      }
      throw error;
    }
  };

  async function login(email, password) {
    try {
      // Set loading to true to prevent multiple login attempts
      setLoading(true);
      
      // First, authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Then check if they're an approved admin
      const isApprovedAdmin = await checkAdminStatus(userCredential.user);
      
      if (!isApprovedAdmin) {
        // Sign them out if they're not approved
        await signOut(auth);
        throw new Error('Access denied. Your admin account is not approved or active.');
      }
      
      return userCredential;
    } catch (error) {
      // If it's our custom error, re-throw it
      if (error.message.includes('pending approval') || 
          error.message.includes('rejected') || 
          error.message.includes('Access denied')) {
        throw error;
      }
      
      // For Firebase auth errors, re-throw as is
      throw error;
    } finally {
      // Always set loading to false
      setLoading(false);
    }
  }

  function logout() {
    return signOut(auth);
  }

  function updateUserProfile(displayName) {
    return updateProfile(auth.currentUser, { displayName });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an approved admin
          const isApprovedAdmin = await checkAdminStatus(user);
          
          if (isApprovedAdmin) {
            setCurrentUser(user);
          } else {
            // If not approved, sign them out and clear current user
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (error) {
          // If there's an error checking status, sign them out
          console.log('Auth state check:', error.message);
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      // Set loading to false immediately to prevent refresh loops
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
