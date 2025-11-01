/**
 * Quick script to check if users have active FCM tokens
 * Run with: node check-user-tokens.js <userId>
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserTokens(userId) {
  try {
    console.log(`\n🔍 Checking tokens for user: ${userId}\n`);
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found!');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User found:', userData.firstName, userData.lastName);
    console.log('   Email:', userData.email);
    console.log('   Projects:', userData.projects?.length || 0);
    
    // Get tokens
    const tokensSnapshot = await db
      .collection(`users/${userId}/tokens`)
      .get();
    
    console.log(`\n📱 Total tokens: ${tokensSnapshot.size}`);
    
    if (tokensSnapshot.empty) {
      console.log('\n⚠️  NO TOKENS FOUND!');
      console.log('\n💡 Solutions:');
      console.log('   1. User needs to open the mobile app');
      console.log('   2. Grant notification permissions');
      console.log('   3. Ensure FCM is properly configured in the app');
      return;
    }
    
    // Check active vs inactive tokens
    let activeCount = 0;
    let inactiveCount = 0;
    
    tokensSnapshot.docs.forEach((doc, index) => {
      const tokenData = doc.data();
      const isActive = tokenData.isActive !== false;
      
      if (isActive) activeCount++;
      else inactiveCount++;
      
      console.log(`\n   Token ${index + 1}:`);
      console.log(`   - Status: ${isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   - Token: ${tokenData.token?.substring(0, 30)}...`);
      console.log(`   - Device: ${tokenData.deviceType || 'Unknown'}`);
      console.log(`   - Platform: ${tokenData.platform || 'Unknown'}`);
      console.log(`   - Created: ${tokenData.createdAt?.toDate() || 'Unknown'}`);
      if (!isActive) {
        console.log(`   - Deactivated: ${tokenData.deactivatedAt?.toDate() || 'Unknown'}`);
        console.log(`   - Reason: ${tokenData.deactivationReason || 'Unknown'}`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Active tokens: ${activeCount}`);
    console.log(`   Inactive tokens: ${inactiveCount}`);
    
    if (activeCount === 0) {
      console.log('\n⚠️  NO ACTIVE TOKENS!');
      console.log('\n💡 Solutions:');
      console.log('   1. User needs to reopen the mobile app');
      console.log('   2. Check notification permissions in device settings');
      console.log('   3. Tokens may have expired - app will refresh on next login');
    } else {
      console.log('\n✅ User has active tokens and should receive notifications');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node check-user-tokens.js <userId>');
  console.log('\nExample: node check-user-tokens.js EZIzd7Csc3Y9gPBKUedKAwVYuY73');
  process.exit(1);
}

checkUserTokens(userId);

