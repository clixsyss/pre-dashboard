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
}

export default new NewsService()
