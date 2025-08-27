import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  async sendNotification(projectId, notificationData) {
    try {
      const notification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        category: notificationData.category || 'general',
        userId: notificationData.userId || null,
        projectId: projectId,
        read: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/notifications`), notification);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async getNotifications(projectId, userId = null) {
    try {
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/notifications`));
      let notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (userId) {
        notifications = notifications.filter(n => n.userId === userId);
      }
      
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(projectId, notificationId) {
    try {
      const notificationRef = doc(db, `projects/${projectId}/notifications`, notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getUnreadCount(projectId, userId = null) {
    try {
      const notifications = await this.getNotifications(projectId, userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
