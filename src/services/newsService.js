import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

class NewsService {
  /**
   * Get reaction counts for news items
   * @param {string} projectId - The project ID
   * @param {Array} newsItems - Array of news items
   * @returns {Promise<Array>} News items with reaction counts
   */
  async getNewsWithReactionCounts(projectId, newsItems) {
    try {
      const newsWithCounts = await Promise.all(
        newsItems.map(async (newsItem) => {
          try {
            // Get reactions for this news item
            const reactionsRef = collection(db, `projects/${projectId}/news/${newsItem.id}/reactions`)
            const reactionsSnapshot = await getDocs(reactionsRef)
            
            const reactionCounts = {
              likeCount: 0,
              loveCount: 0,
              laughCount: 0,
              wowCount: 0,
              sadCount: 0,
              angryCount: 0,
              commentCount: 0
            }
            
            // Count reactions
            reactionsSnapshot.forEach((doc) => {
              const reaction = doc.data()
              switch (reaction.emoji) {
                case 'like':
                case '👍':
                  reactionCounts.likeCount++
                  break
                case 'love':
                case '❤️':
                  reactionCounts.loveCount++
                  break
                case 'laugh':
                case '😂':
                  reactionCounts.laughCount++
                  break
                case 'wow':
                case '😮':
                  reactionCounts.wowCount++
                  break
                case 'sad':
                case '😢':
                  reactionCounts.sadCount++
                  break
                case 'angry':
                case '😡':
                  reactionCounts.angryCount++
                  break
              }
            })
            
            // Get comment count
            try {
              const commentsRef = collection(db, `projects/${projectId}/news/${newsItem.id}/comments`)
              const commentsSnapshot = await getDocs(commentsRef)
              reactionCounts.commentCount = commentsSnapshot.size
            } catch (commentError) {
              console.log('Error fetching comment count:', commentError)
            }
            
            return {
              ...newsItem,
              ...reactionCounts
            }
          } catch (error) {
            console.log(`Error fetching reactions for news ${newsItem.id}:`, error)
            return newsItem
          }
        })
      )
      
      return newsWithCounts
    } catch (error) {
      console.error('Error getting news with reaction counts:', error)
      return newsItems
    }
  }

  /**
   * Delete a comment and all its replies (cascade delete)
   * @param {string} projectId - Project ID
   * @param {string} newsId - The news item ID
   * @param {string} commentId - The comment ID to delete
   * @returns {Promise<void>}
   */
  async deleteCommentWithReplies(projectId, newsId, commentId) {
    try {
      const commentsRef = collection(db, `projects/${projectId}/news/${newsId}/comments`);
      
      // Get all comments to find replies
      const allCommentsSnapshot = await getDocs(commentsRef);
      const allComments = allCommentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Find all replies to this comment (recursively)
      const repliesToDelete = [];
      const findReplies = (parentId) => {
        const replies = allComments.filter(comment => comment.parentCommentId === parentId);
        replies.forEach(reply => {
          repliesToDelete.push(reply.id);
          findReplies(reply.id); // Recursively find replies to replies
        });
      };
      
      findReplies(commentId);
      
      // Delete the main comment
      const commentDoc = doc(commentsRef, commentId);
      await deleteDoc(commentDoc);
      
      // Delete all replies
      const deletePromises = repliesToDelete.map(replyId => {
        const replyDoc = doc(commentsRef, replyId);
        return deleteDoc(replyDoc);
      });
      
      await Promise.all(deletePromises);
      
      console.log(`Deleted comment ${commentId} and ${repliesToDelete.length} replies`);
    } catch (error) {
      console.error('Error deleting comment with replies:', error);
      throw error;
    }
  }
}

export default new NewsService()
