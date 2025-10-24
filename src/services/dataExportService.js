import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class DataExportService {
  constructor() {
    this.auth = getAuth();
  }

  // Get current user ID
  getCurrentUserId() {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  // Get current project ID from localStorage
  getCurrentProjectId() {
    const selectedProject = localStorage.getItem('adminSelectedProject');
    if (!selectedProject) {
      throw new Error('No project selected');
    }
    return JSON.parse(selectedProject).id;
  }

  // Fetch user's gate passes
  async fetchUserGatePasses(projectId, userId) {
    try {
      const gatePassesQuery = query(
        collection(db, `projects/${projectId}/gatePasses`),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(gatePassesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        validFrom: doc.data().validFrom,
        validUntil: doc.data().validUntil,
        entryTime: doc.data().entryTime,
        exitTime: doc.data().exitTime
      }));
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      return [];
    }
  }

  // Fetch user's guest passes
  async fetchUserGuestPasses(projectId, userId) {
    try {
      const guestPassesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(guestPassesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        validFrom: doc.data().validFrom,
        validUntil: doc.data().validUntil
      }));
    } catch (error) {
      console.error('Error fetching guest passes:', error);
      return [];
    }
  }

  // Fetch user's orders/purchases
  async fetchUserOrders(projectId, userId) {
    try {
      const ordersQuery = query(
        collection(db, `projects/${projectId}/orders`),
        where('userId', '==', userId),
        orderBy('orderDate', 'desc')
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        orderDate: doc.data().orderDate,
        estimatedDelivery: doc.data().estimatedDelivery,
        actualDelivery: doc.data().actualDelivery
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Fetch user's bookings
  async fetchUserBookings(projectId, userId) {
    try {
      const bookingsQuery = query(
        collection(db, `projects/${projectId}/bookings`),
        where('userId', '==', userId),
        orderBy('bookingDate', 'desc')
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        bookingDate: doc.data().bookingDate,
        startTime: doc.data().startTime,
        endTime: doc.data().endTime
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  // Fetch user's profile data
  async fetchUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          ...userData,
          // Convert timestamps to readable format
          createdAt: userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
          updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
          lastLogin: userData.lastLogin?.toDate?.()?.toISOString() || userData.lastLogin
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Fetch user's project-specific data
  async fetchUserProjectData(projectId, userId) {
    try {
      const userProjectQuery = query(
        collection(db, `projects/${projectId}/users`),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(userProjectQuery);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          // Convert timestamps to readable format
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user project data:', error);
      return null;
    }
  }

  // Get all user data for export
  async getAllUserData(projectId, userId) {
    try {
      const [profile, projectData, gatePasses, guestPasses, orders, bookings] = await Promise.all([
        this.fetchUserProfile(userId),
        this.fetchUserProjectData(projectId, userId),
        this.fetchUserGatePasses(projectId, userId),
        this.fetchUserGuestPasses(projectId, userId),
        this.fetchUserOrders(projectId, userId),
        this.fetchUserBookings(projectId, userId)
      ]);

      return {
        profile,
        projectData,
        gatePasses,
        guestPasses,
        orders,
        bookings,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          projectId,
          userId,
          dataTypes: {
            profile: !!profile,
            projectData: !!projectData,
            gatePasses: gatePasses.length,
            guestPasses: guestPasses.length,
            orders: orders.length,
            bookings: bookings.length
          }
        }
      };
    } catch (error) {
      console.error('Error fetching all user data:', error);
      throw error;
    }
  }

  // Convert data to CSV format
  convertToCSV(data, dataType) {
    if (!data || data.length === 0) {
      return `No ${dataType} data found`;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Convert data to JSON format
  convertToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  // Download file
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export specific data type
  async exportData(dataType, format = 'json') {
    try {
      const projectId = this.getCurrentProjectId();
      const userId = this.getCurrentUserId();
      
      let data = null;
      let filename = '';
      
      switch (dataType) {
        case 'gatePasses':
          data = await this.fetchUserGatePasses(projectId, userId);
          filename = `gate-passes-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'guestPasses':
          data = await this.fetchUserGuestPasses(projectId, userId);
          filename = `guest-passes-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'orders':
          data = await this.fetchUserOrders(projectId, userId);
          filename = `orders-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'bookings':
          data = await this.fetchUserBookings(projectId, userId);
          filename = `bookings-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'profile':
          data = await this.fetchUserProfile(userId);
          filename = `profile-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'all':
          data = await this.getAllUserData(projectId, userId);
          filename = `all-data-${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      if (format === 'csv') {
        const csvContent = this.convertToCSV(Array.isArray(data) ? data : [data], dataType);
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(data);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
      }

      return { success: true, dataType, format, recordCount: Array.isArray(data) ? data.length : 1 };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

const dataExportService = new DataExportService();
export default dataExportService;
