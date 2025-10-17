# 🚨 CRITICAL FIXES FOR MOBILE APP INTEGRATION

## ⚠️ URGENT: User Blocking and Pass Limits Not Working

### 🔍 **Root Cause Analysis**

The mobile app is likely **NOT using the centralized API** functions, causing:

1. **User blocking not working** - Mobile app bypasses block status checks
2. **Wrong pass limits** - Using 10 instead of 100 passes per month
3. **Inconsistent data** - Direct Firebase queries may return stale data

---

## 🛠️ **REQUIRED FIXES**

### 1. **MANDATORY: Use API Functions Only**

#### ✅ **CORRECT Implementation:**
```javascript
// ALWAYS import and use these functions
import { 
  checkUserEligibility, 
  createGuestPass, 
  markPassAsSent 
} from './api/guestPassAPI';

// STEP 1: ALWAYS check eligibility first
const eligibility = await checkUserEligibility(projectId, userId);

if (!eligibility.success || !eligibility.data.canGenerate) {
  // User is blocked or has reached limit
  alert(`Cannot generate pass: ${eligibility.message}`);
  return;
}

// STEP 2: Only create pass if eligibility check passes
const passResult = await createGuestPass(projectId, userId, userName);
```

#### ❌ **WRONG Implementation (Current Problem):**
```javascript
// DON'T DO THIS - This bypasses all security checks!
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data();
if (userData.guestPassData?.blocked) {
  // This might be outdated or not reflect admin changes!
}
```

### 2. **Pass Limit Fix**

The pass limits are now properly controlled by the **dashboard settings**, not hardcoded values.

**How it works:**
- **Global Limit**: Set in dashboard Admin Controls → Global Settings
- **User-Specific Limits**: Set in dashboard Admin Controls → User Management
- **Default Behavior**: If user has no custom limit, uses global limit
- **Dynamic Updates**: Changes in dashboard immediately affect mobile app

**Updated in:**
- `src/services/guestPassesService.js` - Now fetches global settings
- `src/api/guestPassAPI.js` - Enhanced validation
- `MOBILE_APP_INTEGRATION.md` - Updated documentation

### 3. **Enhanced Logging**

Added comprehensive logging to help debug issues:

```javascript
// Check browser console for these logs:
🔍 [API] Checking eligibility for user...
✅ [Service] User found in database
📊 [Service] User guest pass data: {blocked: false, monthlyLimit: 100}
🚫 [Service] User is BLOCKED from generating passes
```

---

## 🧪 **Testing Instructions**

### Test User Blocking:
1. **Dashboard**: Block a user in Admin Controls
2. **Mobile App**: Try to generate a pass
3. **Expected**: Should show error message and prevent generation
4. **Console**: Should show `🚫 [Service] User is BLOCKED`

### Test Pass Limits:
1. **Dashboard**: Set global limit (e.g., 50 passes) in Admin Controls → Global Settings
2. **Dashboard**: Set custom limit for specific user (e.g., 20 passes) in Admin Controls → User Management
3. **Mobile App**: Try to generate passes for that user
4. **Expected**: Should respect the custom limit (20) not global limit (50)
5. **Test Default**: For users without custom limits, should use global limit

---

## 📱 **Mobile App Implementation Checklist**

### Before Generating Any Pass:
- [ ] Import API functions from `./api/guestPassAPI`
- [ ] Call `checkUserEligibility(projectId, userId)` first
- [ ] Check `result.success` and `result.data.canGenerate`
- [ ] Show error message if user is blocked or at limit
- [ ] Only call `createGuestPass()` if eligibility check passes

### After Sending Pass:
- [ ] Call `markPassAsSent(projectId, passId, qrCodeUrl)` to update status

### Debugging:
- [ ] Check browser console for API logs
- [ ] Verify user data structure in Firebase
- [ ] Test with both blocked and unblocked users

---

## 🔧 **Firebase Data Structure**

### User Document Structure:
```javascript
{
  // ... existing user data ...
  guestPassData: {
    monthlyLimit: 50,         // ✅ Custom limit set by admin (optional)
    usedThisMonth: 0,         // Count of passes used this month
    blocked: false,           // ✅ Admin can set this to true
    updatedAt: timestamp
  },
  projects: [
    {
      projectId: "your-project-id",
      role: "member",
      // ... other project data
    }
  ]
}
```

### Global Settings Structure:
```javascript
// Collection: guestPassSettings
// Document ID: projectId
{
  monthlyLimit: 100,          // ✅ Global default limit for all users
  autoReset: true,            // Auto-reset monthly usage
  allowOverrides: true,       // Allow custom user limits
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**How Limits Work:**
- If user has `guestPassData.monthlyLimit` → Use that value
- If user has no custom limit → Use global `monthlyLimit`
- Admin can override any user's limit in dashboard

---

## 🚀 **Quick Fix Steps**

1. **Update Mobile App Code:**
   ```javascript
   // Replace direct Firebase queries with API calls
   import { checkUserEligibility, createGuestPass } from './api/guestPassAPI';
   ```

2. **Test Blocking:**
   - Block user in dashboard
   - Try generating pass in mobile app
   - Should fail with clear error message

3. **Verify Limits:**
   - Check user has 100 passes per month (not 10)
   - Generate passes until limit reached

4. **Check Logs:**
   - Open browser console
   - Look for API logging messages
   - Verify eligibility checks are working

---

## 📞 **Support**

If issues persist:
1. Check browser console for error logs
2. Verify Firebase rules allow read/write access
3. Ensure mobile app is using the correct project ID
4. Test with a fresh user account

**Remember: The mobile app MUST use the API functions to ensure security and consistency!**
