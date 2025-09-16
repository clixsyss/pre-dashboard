import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'projectGuidelines';

/**
 * Get all guidelines for a specific project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of guidelines
 */
export const getProjectGuidelines = async (projectId) => {
  try {
    const guidelinesRef = collection(db, 'projects', projectId, COLLECTION_NAME);
    const q = query(guidelinesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching project guidelines:', error);
    throw error;
  }
};

/**
 * Get a specific guideline by ID
 * @param {string} projectId - The project ID
 * @param {string} guidelineId - The guideline ID
 * @returns {Promise<Object|null>} The guideline data or null if not found
 */
export const getGuidelineById = async (projectId, guidelineId) => {
  try {
    const guidelineRef = doc(db, 'projects', projectId, COLLECTION_NAME, guidelineId);
    const guidelineSnap = await getDoc(guidelineRef);
    
    if (guidelineSnap.exists()) {
      return {
        id: guidelineSnap.id,
        ...guidelineSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching guideline:', error);
    throw error;
  }
};

/**
 * Create a new guideline
 * @param {string} projectId - The project ID
 * @param {Object} guidelineData - The guideline data
 * @returns {Promise<string>} The ID of the created guideline
 */
export const createGuideline = async (projectId, guidelineData) => {
  try {
    const guidelinesRef = collection(db, 'projects', projectId, COLLECTION_NAME);
    const docRef = await addDoc(guidelinesRef, {
      ...guidelineData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating guideline:', error);
    throw error;
  }
};

/**
 * Update an existing guideline
 * @param {string} projectId - The project ID
 * @param {string} guidelineId - The guideline ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateGuideline = async (projectId, guidelineId, updateData) => {
  try {
    const guidelineRef = doc(db, 'projects', projectId, COLLECTION_NAME, guidelineId);
    await updateDoc(guidelineRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating guideline:', error);
    throw error;
  }
};

/**
 * Delete a guideline
 * @param {string} projectId - The project ID
 * @param {string} guidelineId - The guideline ID
 * @returns {Promise<void>}
 */
export const deleteGuideline = async (projectId, guidelineId) => {
  try {
    const guidelineRef = doc(db, 'projects', projectId, COLLECTION_NAME, guidelineId);
    await deleteDoc(guidelineRef);
  } catch (error) {
    console.error('Error deleting guideline:', error);
    throw error;
  }
};

/**
 * Get guidelines by category
 * @param {string} projectId - The project ID
 * @param {string} category - The category to filter by
 * @returns {Promise<Array>} Array of guidelines in the category
 */
export const getGuidelinesByCategory = async (projectId, category) => {
  try {
    const guidelinesRef = collection(db, 'projects', projectId, COLLECTION_NAME);
    const q = query(
      guidelinesRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching guidelines by category:', error);
    throw error;
  }
};

/**
 * Search guidelines by title or content
 * @param {string} projectId - The project ID
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} Array of matching guidelines
 */
export const searchGuidelines = async (projectId, searchTerm) => {
  try {
    const guidelines = await getProjectGuidelines(projectId);
    const searchLower = searchTerm.toLowerCase();
    
    return guidelines.filter(guideline => 
      guideline.title.toLowerCase().includes(searchLower) ||
      (guideline.content && guideline.content.toLowerCase().includes(searchLower)) ||
      guideline.category.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching guidelines:', error);
    throw error;
  }
};

/**
 * Get PDF guidelines for a specific project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of PDF guidelines
 */
export const getPDFGuidelines = async (projectId) => {
  try {
    const guidelinesRef = collection(db, 'projects', projectId, COLLECTION_NAME);
    const q = query(
      guidelinesRef, 
      where('type', '==', 'pdf'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching PDF guidelines:', error);
    throw error;
  }
};

/**
 * Create a PDF guideline
 * @param {string} projectId - The project ID
 * @param {Object} pdfData - The PDF guideline data
 * @returns {Promise<string>} The ID of the created guideline
 */
export const createPDFGuideline = async (projectId, pdfData) => {
  try {
    const guidelinesRef = collection(db, 'projects', projectId, COLLECTION_NAME);
    const docRef = await addDoc(guidelinesRef, {
      ...pdfData,
      type: 'pdf',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating PDF guideline:', error);
    throw error;
  }
};

/**
 * Update a PDF guideline
 * @param {string} projectId - The project ID
 * @param {string} guidelineId - The guideline ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updatePDFGuideline = async (projectId, guidelineId, updateData) => {
  try {
    const guidelineRef = doc(db, 'projects', projectId, COLLECTION_NAME, guidelineId);
    await updateDoc(guidelineRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating PDF guideline:', error);
    throw error;
  }
};
