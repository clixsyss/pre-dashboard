import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Sign up a new admin with basic information
 */
export const signUpAdmin = async (adminData) => {
  try {
    console.log('Starting admin signup process...', { email: adminData.email });
    const { firstName, lastName, email, password, mobile, nationalId } = adminData;

    // Create Firebase Auth user
    console.log('Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    console.log('Firebase Auth user created:', userCredential.user.uid);

    // Update user profile with display name
    console.log('Updating user profile...');
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    });
    console.log('User profile updated');

    // Send email verification
    console.log('Sending email verification...');
    await sendEmailVerification(userCredential.user);
    console.log('Email verification sent');

    // Wait for the auth state to be properly set
    console.log('Waiting for auth state to update...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check auth state
    console.log('Auth state check:', {
      currentUser: auth.currentUser?.uid,
      credentialUser: userCredential.user.uid,
      isAuthenticated: !!auth.currentUser
    });
    
    // Force refresh the user token
    console.log('Refreshing user token...');
    await userCredential.user.getIdToken(true);
    console.log('Token refreshed');

    // Create pending admin document with Firebase UID as document ID
    const pendingAdminData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      mobile: mobile,
      nationalId: nationalId,
      firebaseUid: userCredential.user.uid,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
      requestedAt: serverTimestamp(),
      approvedBy: null,
      approvedAt: null,
      accountType: null, // Will be set by super admin
      assignedProjects: [], // Will be set by super admin
      permissions: {} // Will be set by super admin
    };

    console.log('Creating pending admin document for UID:', userCredential.user.uid);
    console.log('Pending admin data:', pendingAdminData);

    // Try a different approach - use setDoc with a simple document ID
    console.log('Creating pending admin document...');
    console.log('Document data to save:', {
      ...pendingAdminData,
      firebaseUid: userCredential.user.uid
    });
    
    try {
      // Try using setDoc with a simple document ID instead of addDoc
      const docId = `pending_${userCredential.user.uid}_${Date.now()}`;
      console.log('Using document ID:', docId);
      
      const docRef = doc(db, 'pendingAdmins', docId);
      await setDoc(docRef, {
        ...pendingAdminData,
        firebaseUid: userCredential.user.uid // Store the UID in the document data
      });
      console.log('Successfully created pending admin document with ID:', docId);
      
      // Verify the document was created by reading it back
      console.log('Verifying document creation...');
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        console.log('Document verified:', verifyDoc.data());
      } else {
        console.error('Document verification failed - document does not exist');
      }
    } catch (firestoreError) {
      console.error('Firestore write error details:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      
      // If setDoc fails, try addDoc as fallback
      console.log('setDoc failed, trying addDoc as fallback...');
      try {
        const docRef = await addDoc(collection(db, 'pendingAdmins'), {
          ...pendingAdminData,
          firebaseUid: userCredential.user.uid
        });
        console.log('Fallback addDoc successful:', docRef.id);
      } catch (fallbackError) {
        console.error('Both setDoc and addDoc failed:', fallbackError);
        throw firestoreError; // Throw the original error
      }
    }

    // Sign out the user (they need to wait for approval)
    console.log('Signing out user...');
    await auth.signOut();
    console.log('User signed out successfully');

    return { 
      success: true, 
      message: 'Registration successful! Your account is pending approval from a super admin. You will receive an email once approved.',
      userId: userCredential.user.uid
    };

  } catch (error) {
    console.error('Sign up error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled.';
    } else if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please check your account permissions.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Validate sign up data
 */
export const validateSignUpData = (adminData) => {
  const errors = {};

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

  if (!adminData.password) {
    errors.password = 'Password is required';
  } else if (adminData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (adminData.password !== adminData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!adminData.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  }

  if (!adminData.nationalId?.trim()) {
    errors.nationalId = 'National ID is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
