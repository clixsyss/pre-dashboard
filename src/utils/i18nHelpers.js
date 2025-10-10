/**
 * Helper functions for handling bilingual data in the dashboard
 */

/**
 * Get the text in the current locale from a bilingual field
 * @param {Object|String} field - The bilingual field object { en: '...', ar: '...' } or a string
 * @param {String} locale - The current locale (e.g., 'en' or 'ar')
 * @param {String} fallback - Fallback text if field is empty
 * @returns {String} The text in the current language
 */
export function getLocalizedText(field, locale = 'en', fallback = '') {
  // If field is null or undefined, return fallback
  if (!field) return fallback;

  // If field is a string (old format), return it as is
  if (typeof field === 'string') return field;

  // If field is an object with language keys
  if (typeof field === 'object' && !Array.isArray(field)) {
    // Try to get the text in the current language
    if (field[locale]) return field[locale];
    
    // Fallback to English
    if (field.en) return field.en;
    
    // Fallback to Arabic
    if (field.ar) return field.ar;
    
    // Return the first available value
    const values = Object.values(field);
    if (values.length > 0) return values[0];
  }

  return fallback;
}

/**
 * Create a bilingual field object
 * @param {String} enText - English text
 * @param {String} arText - Arabic text
 * @returns {Object} Bilingual field object { en: '...', ar: '...' }
 */
export function createBilingualField(enText, arText) {
  return {
    en: enText || '',
    ar: arText || ''
  };
}

/**
 * Check if a field is bilingual (has en and ar keys)
 * @param {*} field - The field to check
 * @returns {Boolean} True if field is bilingual
 */
export function isBilingualField(field) {
  return (
    field &&
    typeof field === 'object' &&
    !Array.isArray(field) &&
    ('en' in field && 'ar' in field)
  );
}

/**
 * Extract English and Arabic text from a bilingual field
 * Useful for forms
 * @param {Object|String} field - The bilingual field
 * @returns {Object} { en: '', ar: '' }
 */
export function extractBilingualValues(field) {
  if (!field) return { en: '', ar: '' };
  
  if (typeof field === 'string') {
    return { en: field, ar: '' };
  }
  
  if (isBilingualField(field)) {
    return { en: field.en || '', ar: field.ar || '' };
  }
  
  return { en: '', ar: '' };
}

/**
 * Validate that both English and Arabic values are provided
 * @param {Object} field - The bilingual field
 * @returns {Boolean} True if both languages have values
 */
export function validateBilingual(field) {
  if (!field) return false;
  
  if (typeof field === 'string') return false;
  
  return !!(field.en && field.en.trim() && field.ar && field.ar.trim());
}

/**
 * Convert form values to Firestore bilingual format
 * @param {Object} formData - Form data with separate fields like name_en, name_ar
 * @param {Array} bilingualFields - Array of field names that should be bilingual (without _en/_ar suffix)
 * @returns {Object} Firestore-ready data with bilingual fields
 */
export function prepareBilingualData(formData, bilingualFields = []) {
  const result = { ...formData };
  
  bilingualFields.forEach(fieldName => {
    const enValue = formData[`${fieldName}_en`] || formData[`${fieldName}En`];
    const arValue = formData[`${fieldName}_ar`] || formData[`${fieldName}Ar`];
    
    if (enValue !== undefined || arValue !== undefined) {
      result[fieldName] = createBilingualField(enValue, arValue);
      
      // Remove the separate _en and _ar fields
      delete result[`${fieldName}_en`];
      delete result[`${fieldName}_ar`];
      delete result[`${fieldName}En`];
      delete result[`${fieldName}Ar`];
    }
  });
  
  return result;
}

/**
 * Convert Firestore bilingual data to form-friendly format
 * @param {Object} firestoreData - Data from Firestore with bilingual fields
 * @param {Array} bilingualFields - Array of field names that are bilingual
 * @returns {Object} Form-friendly data with separate _en and _ar fields
 */
export function extractFormData(firestoreData, bilingualFields = []) {
  const result = { ...firestoreData };
  
  bilingualFields.forEach(fieldName => {
    if (firestoreData[fieldName] && isBilingualField(firestoreData[fieldName])) {
      result[`${fieldName}_en`] = firestoreData[fieldName].en || '';
      result[`${fieldName}_ar`] = firestoreData[fieldName].ar || '';
      
      // Keep the original bilingual field for reference
      result[fieldName] = firestoreData[fieldName];
    }
  });
  
  return result;
}

export default {
  getLocalizedText,
  createBilingualField,
  isBilingualField,
  extractBilingualValues,
  validateBilingual,
  prepareBilingualData,
  extractFormData
};

