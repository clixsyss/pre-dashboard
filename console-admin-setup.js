// Copy and paste this code into your browser console while on the dashboard
// This will add the current user as an admin

(async function addCurrentUserAsAdmin() {
  try {
    // Import Firebase functions
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    // Get current user
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }
    
    console.log('👤 Current user:', user.email, user.uid);
    
    // Initialize Firestore
    const db = firebase.firestore();
    
    // Add user to admins collection
    await setDoc(doc(db, 'admins', user.uid), {
      email: user.email,
      displayName: user.displayName || 'Admin User',
      createdAt: new Date(),
      role: 'admin',
      permissions: ['all']
    });
    
    console.log('✅ User added to admins collection');
    
    // Also update users collection
    await setDoc(doc(db, 'users', user.uid), {
      role: 'admin'
    }, { merge: true });
    
    console.log('✅ User role updated in users collection');
    console.log('🎉 Admin setup complete! Please refresh the page.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('💡 Make sure you are on the dashboard page and Firebase is loaded');
  }
})();
