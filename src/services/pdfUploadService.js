import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload a PDF file to Firebase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} projectId - The project ID
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadPDF = async (file, projectId, fileName = null) => {
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    // Generate file name if not provided
    const timestamp = Date.now();
    const sanitizedFileName = fileName || file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = '.pdf';
    const finalFileName = `${sanitizedFileName}_${timestamp}${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `projects/${projectId}/guidelines/${finalFileName}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      fileName: finalFileName,
      originalName: file.name,
      size: file.size,
      path: snapshot.ref.fullPath,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

/**
 * Delete a PDF file from Firebase Storage
 * @param {string} filePath - The storage path of the file to delete
 * @returns {Promise<void>}
 */
export const deletePDF = async (filePath) => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting PDF:', error);
    throw error;
  }
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate PDF file
 * @param {File} file - The file to validate
 * @returns {Object} Validation result
 */
export const validatePDFFile = (file) => {
  const errors = [];
  
  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
  }
  
  // Check file name length
  if (file.name.length > 100) {
    errors.push('File name must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
