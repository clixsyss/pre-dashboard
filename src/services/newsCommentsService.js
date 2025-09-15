import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  increment
} from 'firebase/firestore';

/**
 * News Comments Service for Dashboard
 * Handles admin moderation of news comments
 */

/**
 * Get all comments for a specific news item
 * @param {string} projectId - Project ID
 * @param {string} newsId - News item ID
 * @returns {Promise<Array>} - Array of comments
 */
export const getNewsComments = async (projectId, newsId) => {
  try {
    const commentsRef = collection(db, `projects/${projectId}/news/${newsId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const comments = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        deletedAt: data.deletedAt?.toDate?.() || data.deletedAt,
      });
    });
    
    return comments;
  } catch (error) {
    console.error('Error fetching news comments:', error);
    throw error;
  }
};

/**
 * Get all comments across all news items in a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of all comments with news context
 */
export const getAllProjectComments = async (projectId) => {
  try {
    // First get all news items
    const newsRef = collection(db, `projects/${projectId}/news`);
    const newsSnapshot = await getDocs(newsRef);
    
    const allComments = [];
    
    // Fetch comments from each news item
    const commentPromises = newsSnapshot.docs.map(async (newsDoc) => {
      try {
        const commentsRef = collection(db, `projects/${projectId}/news/${newsDoc.id}/comments`);
        const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        
        const newsComments = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          newsId: newsDoc.id,
          newsTitle: newsDoc.data().title || 'Untitled News',
          ...commentDoc.data(),
          createdAt: commentDoc.data().createdAt?.toDate?.() || commentDoc.data().createdAt,
          updatedAt: commentDoc.data().updatedAt?.toDate?.() || commentDoc.data().updatedAt,
          deletedAt: commentDoc.data().deletedAt?.toDate?.() || commentDoc.data().deletedAt,
        }));
        
        return newsComments;
      } catch (error) {
        console.error(`Error fetching comments for news ${newsDoc.id}:`, error);
        return [];
      }
    });

    const commentArrays = await Promise.all(commentPromises);
    commentArrays.forEach(comments => allComments.push(...comments));
    
    // Sort by creation date
    return allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching all project comments:', error);
    throw error;
  }
};

/**
 * Delete a comment (admin only)
 * @param {string} projectId - Project ID
 * @param {string} newsId - News item ID
 * @param {string} commentId - Comment ID
 * @param {string} adminId - Admin ID
 * @param {string} reason - Deletion reason
 * @returns {Promise<void>}
 */
export const deleteComment = async (projectId, newsId, commentId, adminId, reason = 'Violation of community guidelines') => {
  try {
    const commentRef = doc(db, `projects/${projectId}/news/${newsId}/comments`, commentId);
    
    await updateDoc(commentRef, {
      isDeleted: true,
      deletedBy: adminId,
      deletedAt: new Date(),
      deletionReason: reason,
      updatedAt: new Date()
    });
    
    // Update news item comment count
    await updateNewsCommentCount(projectId, newsId, -1);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Restore a deleted comment (admin only)
 * @param {string} projectId - Project ID
 * @param {string} newsId - News item ID
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
export const restoreComment = async (projectId, newsId, commentId) => {
  try {
    const commentRef = doc(db, `projects/${projectId}/news/${newsId}/comments`, commentId);
    
    await updateDoc(commentRef, {
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
      deletionReason: null,
      updatedAt: new Date()
    });
    
    // Update news item comment count
    await updateNewsCommentCount(projectId, newsId, 1);
  } catch (error) {
    console.error('Error restoring comment:', error);
    throw error;
  }
};

/**
 * Update news item comment count
 * @param {string} projectId - Project ID
 * @param {string} newsId - News item ID
 * @param {number} change - Change in count (1 or -1)
 * @returns {Promise<void>}
 */
const updateNewsCommentCount = async (projectId, newsId, change) => {
  try {
    const newsRef = doc(db, `projects/${projectId}/news`, newsId);
    await updateDoc(newsRef, {
      commentCount: increment(change),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating comment count:', error);
    // Don't throw error as this is not critical
  }
};

/**
 * Get comment statistics for admin dashboard
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Comment statistics
 */
export const getCommentStats = async (projectId) => {
  try {
    const allComments = await getAllProjectComments(projectId);
    
    const stats = {
      total: allComments.length,
      active: allComments.filter(c => !c.isDeleted).length,
      deleted: allComments.filter(c => c.isDeleted).length,
      withReactions: allComments.filter(c => Object.keys(c.reactions || {}).length > 0).length,
      totalReactions: allComments.reduce((sum, c) => {
        return sum + Object.values(c.reactions || {}).reduce((emojiSum, emoji) => emojiSum + emoji.count, 0);
      }, 0),
      byNews: {}
    };
    
    // Group by news item
    allComments.forEach(comment => {
      if (!stats.byNews[comment.newsId]) {
        stats.byNews[comment.newsId] = {
          newsTitle: comment.newsTitle,
          total: 0,
          active: 0,
          deleted: 0
        };
      }
      
      stats.byNews[comment.newsId].total++;
      if (comment.isDeleted) {
        stats.byNews[comment.newsId].deleted++;
      } else {
        stats.byNews[comment.newsId].active++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time comments updates
 * @param {string} projectId - Project ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAllComments = (projectId, callback) => {
  try {
    // This would need to be implemented with a more complex approach
    // since we need to listen to multiple collections
    // For now, we'll return a simple implementation
    return () => {};
  } catch (error) {
    console.error('Error setting up comments subscription:', error);
    throw error;
  }
};
