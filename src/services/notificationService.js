import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Request notification permission
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
        type: notificationData.type || 'info', // info, success, warning, error
        category: notificationData.category || 'general', // booking, academy, event, system
        userId: notificationData.userId || null,
        projectId: projectId,
        read: false,
        createdAt: serverTimestamp(),
        expiresAt: notificationData.expiresAt || null
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/notifications`), notification);
      
      // Send browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: docRef.id
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendBookingNotification(projectId, bookingData, type = 'confirmation') {
    let title, message;
    
    switch (type) {
      case 'confirmation':
        title = 'Booking Confirmed';
        message = `Your booking for ${bookingData.serviceName} on ${bookingData.date} has been confirmed.`;
        break;
      case 'reminder':
        title = 'Booking Reminder';
        message = `Reminder: You have a booking for ${bookingData.serviceName} tomorrow at ${bookingData.startTime}.`;
        break;
      case 'cancellation':
        title = 'Booking Cancelled';
        message = `Your booking for ${bookingData.serviceName} on ${bookingData.date} has been cancelled.`;
        break;
      default:
        title = 'Booking Update';
        message = `Your booking for ${bookingData.serviceName} has been updated.`;
    }

    return this.sendNotification(projectId, {
      title,
      message,
      type: type === 'cancellation' ? 'warning' : 'info',
      category: 'booking',
      userId: bookingData.userId
    });
  }

  async sendAcademyNotification(projectId, academyData, type = 'registration') {
    let title, message;
    
    switch (type) {
      case 'registration':
        title = 'Academy Registration';
        message = `You have been successfully registered for ${academyData.programName} at ${academyData.academyName}.`;
        break;
      case 'schedule':
        title = 'Schedule Update';
        message = `The schedule for ${academyData.programName} has been updated. Please check your account.`;
        break;
      case 'cancellation':
        title = 'Session Cancelled';
        message = `The session for ${academyData.programName} on ${academyData.date} has been cancelled.`;
        break;
      default:
        title = 'Academy Update';
        message = `There's an update regarding your academy program.`;
    }

    return this.sendNotification(projectId, {
      title,
      message,
      type: type === 'cancellation' ? 'warning' : 'info',
      category: 'academy',
      userId: academyData.userId
    });
  }

  async sendEventNotification(projectId, eventData, type = 'registration') {
    let title, message;
    
    switch (type) {
      case 'registration':
        title = 'Event Registration';
        message = `You have been successfully registered for ${eventData.eventName}.`;
        break;
      case 'reminder':
        title = 'Event Reminder';
        message = `Reminder: ${eventData.eventName} is tomorrow at ${eventData.startTime}.`;
        break;
      case 'update':
        title = 'Event Update';
        message = `There's an update regarding ${eventData.eventName}. Please check your account.`;
        break;
      case 'cancellation':
        title = 'Event Cancelled';
        message = `${eventData.eventName} has been cancelled.`;
        break;
      default:
        title = 'Event Update';
        message = `There's an update regarding your event.`;
    }

    return this.sendNotification(projectId, {
      title,
      message,
      type: type === 'cancellation' ? 'warning' : 'info',
      category: 'event',
      userId: eventData.userId
    });
  }

  async sendSystemNotification(projectId, message, type = 'info') {
    return this.sendNotification(projectId, {
      title: 'System Notification',
      message,
      type,
      category: 'system'
    });
  }

  async getNotifications(projectId, userId = null, filters = {}) {
    try {
      let q = collection(db, `projects/${projectId}/notifications`);
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.read !== undefined) {
        q = query(q, where('read', '==', filters.read));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(projectId, notificationId) {
    try {
      const notificationRef = doc(db, `projects/${projectId}/notifications`, notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(projectId, userId = null) {
    try {
      const notifications = await this.getNotifications(projectId, userId, { read: false });
      
      for (const notification of notifications) {
        await this.markAsRead(projectId, notification.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(projectId, notificationId) {
    try {
      const notificationRef = doc(db, `projects/${projectId}/notifications`, notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getUnreadCount(projectId, userId = null) {
    try {
      const notifications = await this.getNotifications(projectId, userId, { read: false });
      return notifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
