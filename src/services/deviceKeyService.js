/**
 * Device Key Service
 * Utilities for managing device restrictions and session tokens
 */

/**
 * Generate a unique device key using crypto.randomUUID()
 * @returns {string} A unique device key
 */
export const generateDeviceKey = () => {
  return crypto.randomUUID();
};

/**
 * Generate a session token for a user
 * @param {string} userId - The user's ID
 * @returns {string} A JWT-like session token
 */
export const generateSessionToken = (userId) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ id: userId, iat: Date.now() }));
  const signature = btoa(Math.random().toString(36).substring(2, 12));
  return `${header}.${payload}.${signature}`;
};

/**
 * Validate if a device key matches
 * @param {string} storedKey - The device key stored in Firestore
 * @param {string} localKey - The device key stored on the device
 * @returns {boolean} True if keys match
 */
export const validateDeviceKey = (storedKey, localKey) => {
  if (!storedKey || !localKey) return false;
  return storedKey === localKey;
};

/**
 * Parse session token to extract user ID
 * @param {string} token - The session token
 * @returns {object|null} Parsed payload or null if invalid
 */
export const parseSessionToken = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error parsing session token:', error);
    return null;
  }
};

/**
 * Check if session token is expired
 * @param {string} token - The session token
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns {boolean} True if token is expired
 */
export const isSessionExpired = (token, maxAgeMs = 30 * 24 * 60 * 60 * 1000) => {
  try {
    const payload = parseSessionToken(token);
    if (!payload || !payload.iat) return true;
    
    const now = Date.now();
    const tokenAge = now - payload.iat;
    
    return tokenAge > maxAgeMs;
  } catch (error) {
    console.error('Error checking session expiration:', error);
    return true;
  }
};

/**
 * Generate both device key and session token for a user
 * @param {string} userId - The user's ID
 * @returns {object} Object containing deviceKey and session
 */
export const generateDeviceCredentials = (userId) => {
  return {
    deviceKey: generateDeviceKey(),
    session: generateSessionToken(userId)
  };
};

