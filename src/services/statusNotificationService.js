/**
 * Status Notification Service
 * Simple service to send notifications when statuses are updated
 * Uses the existing projects/{projectId}/notifications collection
 * which is already processed by the sendNotificationOnCreate Cloud Function
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Send a status update notification to a specific user
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to send notification to
 * @param {string} title_en - English title
 * @param {string} title_ar - Arabic title (optional, will use English if not provided)
 * @param {string} body_en - English message
 * @param {string} body_ar - Arabic message (optional, will use English if not provided)
 * @param {string} type - Notification type (default: 'alert')
 * @returns {Promise<string>} Notification ID
 */
export const sendStatusNotification = async (
  projectId,
  userId,
  title_en,
  body_en,
  title_ar = null,
  body_ar = null,
  type = 'alert'
) => {
  try {
    // Get project name
    let projectName = 'PRE Group';
    try {
      const projectQuery = query(collection(db, 'projects'), where('__name__', '==', projectId));
      const projectDoc = await getDocs(projectQuery);
      if (!projectDoc.empty) {
        projectName = projectDoc.docs[0].data().name || 'PRE Group';
      }
    } catch (err) {
      console.warn('Could not fetch project name:', err);
    }

    // Create notification document (same structure as NotificationManagement)
    const notificationDoc = {
      projectId: projectId,
      projectName: projectName,
      title_en: title_en,
      title_ar: title_ar || title_en, // Use English if Arabic not provided
      body_en: body_en,
      body_ar: body_ar || body_en, // Use English if Arabic not provided
      type: type,
      sendNow: true,
      scheduledAt: null,
      audience: {
        all: false,
        uids: [userId], // Send to specific user only
        topic: null
      },
      createdBy: 'system',
      createdAt: serverTimestamp(),
      status: 'pending',
      sentAt: null,
      meta: {
        image: null,
        deepLink: null,
        adminEmail: 'system@pre.com',
        adminName: 'System',
        source: 'status_update'
      }
    };

    // Add to project's notifications collection
    // The sendNotificationOnCreate Cloud Function will automatically process this
    const notificationsRef = collection(db, `projects/${projectId}/notifications`);
    const docRef = await addDoc(notificationsRef, notificationDoc);

    console.log('Status notification queued:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('Error sending status notification:', error);
    throw error;
  }
};

const statusNotificationService = {
  sendStatusNotification
};

export default statusNotificationService;

