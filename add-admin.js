// Script to add current user as admin
// Run this in the browser console while logged into the dashboard

import { doc, setDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';
import { getAuth } from 'firebase/auth';

const addCurrentUserAsAdmin = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user logged in');
      return;
    }
    
    console.log('Adding user as admin:', user.uid, user.email);
    
    // Add user to admins collection
    await setDoc(doc(db, 'admins', user.uid), {
      email: user.email,
      displayName: user.displayName || 'Admin User',
      createdAt: new Date(),
      role: 'admin',
      permissions: ['all']
    });
    
    console.log('✅ User added as admin successfully!');
    console.log('Please refresh the page to see the changes.');
    
  } catch (error) {
    console.error('❌ Error adding user as admin:', error);
  }
};

// Run the function
addCurrentUserAsAdmin();
