const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function to create a new user in Firebase Authentication
 * This is called from the admin dashboard when manually adding a user
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // Check if the request is authenticated (caller must be an admin)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Validate required fields
  if (!data.email || !data.displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email and display name are required.'
    );
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: data.email,
      displayName: data.displayName,
      emailVerified: false, // User needs to verify email
    });

    console.log('Successfully created new user:', userRecord.uid);

    // Generate password reset link (user will set their password via this)
    if (data.sendPasswordResetEmail) {
      try {
        const actionCodeSettings = {
          url: `${functions.config().app?.url || 'https://your-app-url.com'}/login`,
          handleCodeInApp: false,
        };
        
        const passwordResetLink = await admin.auth().generatePasswordResetLink(
          data.email,
          actionCodeSettings
        );

        // Send password reset email
        // You can use a custom email service here or Firebase's built-in email
        console.log('Password reset link generated:', passwordResetLink);
        
        // Note: In a production environment, you would send this link via email
        // using a service like SendGrid, Mailgun, or Firebase's email extension
      } catch (emailError) {
        console.error('Error generating password reset link:', emailError);
        // Don't fail the entire function if email fails
      }
    }

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        'A user with this email already exists.'
      );
    } else if (error.code === 'auth/invalid-email') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The email address is invalid.'
      );
    } else {
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create user: ${error.message}`
      );
    }
  }
});

/**
 * Scheduled function to check and disable expired temporary users
 * Runs every day at midnight
 */
exports.checkTemporaryUsers = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const now = new Date();

      // Query for temporary users whose validity has expired
      const expiredUsersSnapshot = await db.collection('users')
        .where('isTemporary', '==', true)
        .where('validityEndDate', '<=', now)
        .get();

      if (expiredUsersSnapshot.empty) {
        console.log('No expired temporary users found');
        return null;
      }

      const batch = db.batch();
      const authUpdates = [];

      expiredUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Mark user as expired in Firestore
        batch.update(doc.ref, {
          isExpired: true,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Disable user in Authentication
        if (userData.authUid) {
          authUpdates.push(
            admin.auth().updateUser(userData.authUid, {
              disabled: true
            }).catch(error => {
              console.error(`Failed to disable auth user ${userData.authUid}:`, error);
            })
          );
        }
      });

      // Execute Firestore batch update
      await batch.commit();

      // Execute Auth updates
      await Promise.allSettled(authUpdates);

      console.log(`Processed ${expiredUsersSnapshot.size} expired temporary users`);
      return null;
    } catch (error) {
      console.error('Error checking temporary users:', error);
      return null;
    }
  });

/**
 * Firestore trigger to validate temporary user access on authentication
 * This runs when a user document is read/accessed
 */
exports.validateUserAccess = functions.https.onCall(async (data, context) => {
  // Check if the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const db = admin.firestore();
    const userId = data.userId || context.auth.uid;

    // Get user document from Firestore
    const userDoc = await db.collection('users')
      .where('authUid', '==', userId)
      .limit(1)
      .get();

    if (userDoc.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const userData = userDoc.docs[0].data();

    // Check if user is temporary and expired
    if (userData.isTemporary) {
      const now = new Date();
      const validityEndDate = userData.validityEndDate?.toDate();

      if (validityEndDate && now > validityEndDate) {
        // User has expired - disable their account
        await admin.auth().updateUser(userId, {
          disabled: true
        });

        // Update Firestore
        await userDoc.docs[0].ref.update({
          isExpired: true,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        throw new functions.https.HttpsError(
          'permission-denied',
          'Your temporary account has expired. Please contact the administrator.'
        );
      }

      // Check if user is within validity period
      const validityStartDate = userData.validityStartDate?.toDate();
      if (validityStartDate && now < validityStartDate) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Your account is not yet active. Please wait until the start date.'
        );
      }
    }

    // Check if user is suspended
    if (userData.isSuspended) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Your account has been suspended. Reason: ${userData.suspensionReason || 'No reason provided'}`
      );
    }

    return {
      success: true,
      isValid: true,
      isTemporary: userData.isTemporary || false,
      validityEndDate: userData.validityEndDate || null
    };
  } catch (error) {
    if (error.code && error.code.startsWith('functions/')) {
      throw error; // Re-throw HttpsError
    }
    
    console.error('Error validating user access:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to validate user access: ${error.message}`
    );
  }
});

