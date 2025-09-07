import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function updateUserProfile(displayName) {
    return updateProfile(auth.currentUser, { displayName });
  }

  useEffect(() => {
    let timeoutId;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set loading to false with a small delay to prevent flash
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, 100);
    });

    // Fallback timeout in case auth state never resolves
    const fallbackTimeout = setTimeout(() => {
      console.log('Auth state check timeout - setting loading to false');
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
    };
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
