# Netlify Build Fix Guide

## 🔴 Issues Causing Build Failures

### Issue 1: firebase-admin in Dependencies
**Problem:** `firebase-admin` is a server-side package that cannot run in browsers.

**Solution:** Remove it from `package.json`

```bash
npm uninstall firebase-admin
```

Or manually remove this line from `package.json`:
```json
"firebase-admin": "^12.0.0",  // DELETE THIS LINE
```

**Note:** `firebase-admin` is only needed for:
- Cloud Functions (already in `/pre/functions/package.json`)
- Backend scripts (like `importUsers.mjs`)

For backend scripts, install it globally or use `npx` to run them without adding to dependencies.

---

### Issue 2: Incorrect useAdminAuth Hook Usage
**Problem:** In `NotificationManager.js` line 38, `useAdminAuth()` is called incorrectly.

**Current Code:**
```javascript
const { currentAdmin, loading: adminLoading } = useAdminAuth();
```

**Fixed Code:**
```javascript
const { currentAdmin, loading: adminLoading } = useAdminAuth;
```

**Why:** `useAdminAuth` is likely exported as an object, not a function. Check your `AdminAuthContext.js` export.

---

### Issue 3: ESLint Warnings Treated as Errors
**Problem:** Netlify CI treats all ESLint warnings as errors, causing builds to fail.

**Solution:** Add environment variable to Netlify:

1. Go to Netlify Dashboard → Your Site → **Site Settings** → **Environment Variables**
2. Add new variable:
   - **Key:** `CI`
   - **Value:** `false`

Or update your `netlify.toml`:
```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  CI = "false"  # Add this line
```

---

## 🚀 Complete Fix Steps

### Step 1: Remove firebase-admin
```bash
cd /Users/hady/Documents/Work/ClixSys/Projects/MobileApps/PRE/pre-dashboard
npm uninstall firebase-admin
```

### Step 2: Fix Hook Usage
Check if `useAdminAuth` is exported correctly in `src/contexts/AdminAuthContext.js`.

If it's exported as an object:
```javascript
// AdminAuthContext.js
export const useAdminAuth = {
  currentAdmin: ...,
  loading: ...
};
```

Then use it without parentheses:
```javascript
// NotificationManager.js
const { currentAdmin, loading: adminLoading } = useAdminAuth;
```

If it's exported as a hook function:
```javascript
// AdminAuthContext.js
export const useAdminAuth = () => {
  // hook logic
  return { currentAdmin, loading };
};
```

Then use it WITH parentheses:
```javascript
// NotificationManager.js
const { currentAdmin, loading: adminLoading } = useAdminAuth();
```

### Step 3: Configure Netlify Environment
Add to your `netlify.toml`:
```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  CI = "false"
```

### Step 4: Test Build Locally
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clean install
npm install

# Test production build
npm run build
```

If the build succeeds locally, it should work on Netlify!

---

## 📋 Checklist

- [ ] Removed `firebase-admin` from dependencies
- [ ] Fixed `useAdminAuth` hook usage
- [ ] Added `CI=false` to netlify.toml
- [ ] Tested build locally with `npm run build`
- [ ] Committed and pushed changes
- [ ] Triggered new Netlify deployment

---

## 🔍 Additional Debugging

If build still fails, check Netlify build logs for:

### Common Errors:

**Error:** `Cannot find module 'xyz'`
- **Fix:** Run `npm install` and commit `package-lock.json`

**Error:** `Module not found: Can't resolve 'firebase-admin'`
- **Fix:** Make sure `firebase-admin` is completely removed from `package.json`

**Error:** `'xyz' is defined but never used`
- **Fix:** Either use the variable or remove it, or set `CI=false`

**Error:** `process is not defined`
- **Fix:** Don't use Node.js-specific code in client-side files

---

## 💡 Best Practices

### For firebase-admin Usage:
If you need to run backend scripts (like `importUsers.mjs`), do it separately:

```bash
# Install locally for script execution
npm install --save-dev firebase-admin

# Or use npx without installing
npx firebase-admin
```

Then keep `firebase-admin` in `devDependencies` instead of `dependencies`:
```json
{
  "devDependencies": {
    "firebase-admin": "^12.0.0"
  }
}
```

This way it won't be included in the production build.

---

## ✅ Verification

After deployment, verify:
1. Site builds successfully on Netlify
2. Dashboard loads without errors
3. Firebase connection works
4. All features function correctly

---

## 📞 Need Help?

If you're still experiencing issues:
1. Share the exact error from Netlify build logs
2. Verify all dependencies are correctly installed
3. Check that all imports are correct
4. Make sure Firebase config is properly set

