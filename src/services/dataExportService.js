import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAppDataStore } from '../stores/appDataStore';

/**
 * Data Export Service
 * OPTIMIZATION: Uses cached user data from appDataStore
 */

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

  // Get all users in the project - OPTIMIZED: Uses cached data
  async fetchProjectUsers(projectId) {
    try {
      console.log(`📊 DataExportService: Fetching users for project: ${projectId}`);
      
      // Get cached users from appDataStore
      const { getUsersByProject } = useAppDataStore.getState();
      const projectUsers = getUsersByProject(projectId);
      
      console.log(`✅ DataExportService: Found ${projectUsers.length} cached users in project ${projectId}`);
      
      const users = projectUsers.map(user => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || user.mobile || '',
        role: user.projects?.find(p => p.projectId === projectId)?.role || 'member',
        unit: user.projects?.find(p => p.projectId === projectId)?.unit || '',
        createdAt: user.createdAt?.toISOString?.() || user.createdAt,
        updatedAt: user.updatedAt?.toISOString?.() || user.updatedAt
      }));
      
      return users;
    } catch (error) {
      console.error('Error fetching project users:', error);
      return [];
    }
  }

  // Get current project ID from localStorage
  getCurrentProjectId() {
    const selectedProject = localStorage.getItem('adminSelectedProject');
    if (!selectedProject) {
      throw new Error('No project selected');
    }
    return JSON.parse(selectedProject).id;
  }

  // Get current project name from localStorage
  getCurrentProjectName() {
    const selectedProject = localStorage.getItem('adminSelectedProject');
    if (!selectedProject) {
      return 'Unknown Project';
    }
    const project = JSON.parse(selectedProject);
    return project.name || project.id;
  }

  // Fetch project details
  async fetchProjectDetails(projectId) {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        return {
          id: projectDoc.id,
          name: projectDoc.data().name || projectId,
          ...projectDoc.data()
        };
      }
      return { id: projectId, name: projectId };
    } catch (error) {
      console.error('Error fetching project details:', error);
      return { id: projectId, name: projectId };
    }
  }

  // Fetch user's gate passes
  async fetchUserGatePasses(projectId, userId) {
    try {
      console.log(`Fetching gate passes for project: ${projectId}, user: ${userId}`);
      
      const gatePassesQuery = query(
        collection(db, `projects/${projectId}/gatePasses`),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(gatePassesQuery);
      console.log(`Found ${querySnapshot.size} gate passes`);
      
      const gatePasses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        validFrom: doc.data().validFrom,
        validUntil: doc.data().validUntil,
        entryTime: doc.data().entryTime,
        exitTime: doc.data().exitTime
      })).sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('Gate passes data:', gatePasses);
      return gatePasses;
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      return [];
    }
  }

  // Fetch user's guest passes
  async fetchUserGuestPasses(projectId, userId) {
    try {
      console.log(`Fetching guest passes for project: ${projectId}, user: ${userId}`);
      
      const guestPassesQuery = query(
        collection(db, `projects/${projectId}/guestPasses`),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(guestPassesQuery);
      console.log(`Found ${querySnapshot.size} guest passes`);
      
      const guestPasses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        validFrom: doc.data().validFrom,
        validUntil: doc.data().validUntil
      })).sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('Guest passes data:', guestPasses);
      return guestPasses;
    } catch (error) {
      console.error('Error fetching guest passes:', error);
      return [];
    }
  }

  // Fetch user's orders/purchases
  async fetchUserOrders(projectId, userId) {
    try {
      console.log(`Fetching orders for project: ${projectId}, user: ${userId}`);
      
      const ordersQuery = query(
        collection(db, `projects/${projectId}/orders`),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      console.log(`Found ${querySnapshot.size} orders`);
      
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        orderDate: doc.data().orderDate,
        estimatedDelivery: doc.data().estimatedDelivery,
        actualDelivery: doc.data().actualDelivery
      })).sort((a, b) => {
        // Sort by orderDate descending (newest first)
        const dateA = new Date(a.orderDate || 0);
        const dateB = new Date(b.orderDate || 0);
        return dateB - dateA;
      });
      
      console.log('Orders data:', orders);
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Fetch user's bookings
  async fetchUserBookings(projectId, userId) {
    try {
      console.log(`Fetching bookings for project: ${projectId}, user: ${userId}`);
      
      const bookingsQuery = query(
        collection(db, `projects/${projectId}/bookings`),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      console.log(`Found ${querySnapshot.size} bookings`);
      
      const bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to readable format
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        bookingDate: doc.data().bookingDate,
        startTime: doc.data().startTime,
        endTime: doc.data().endTime
      })).sort((a, b) => {
        // Sort by bookingDate descending (newest first)
        const dateA = new Date(a.bookingDate || 0);
        const dateB = new Date(b.bookingDate || 0);
        return dateB - dateA;
      });
      
      console.log('Bookings data:', bookings);
      return bookings;
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

  // Check what data exists in the project
  async checkProjectData(projectId, userId) {
    try {
      console.log(`Checking data for project: ${projectId}, user: ${userId}`);
      
      // Check all collections
      const collections = ['gatePasses', 'guestPasses', 'orders', 'bookings'];
      const results = {};
      
      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, `projects/${projectId}/${collectionName}`);
          const snapshot = await getDocs(collectionRef);
          results[collectionName] = {
            total: snapshot.size,
            userSpecific: 0
          };
          
          // Check how many belong to this user
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.userId === userId) {
              results[collectionName].userSpecific++;
            }
          });
          
          console.log(`${collectionName}: ${results[collectionName].total} total, ${results[collectionName].userSpecific} for user`);
        } catch (error) {
          console.error(`Error checking ${collectionName}:`, error);
          results[collectionName] = { total: 0, userSpecific: 0, error: error.message };
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error checking project data:', error);
      return {};
    }
  }

  // Get all user data for export
  async getAllUserData(projectId, userId) {
    try {
      console.log(`Getting all user data for project: ${projectId}, user: ${userId}`);
      
      // First check what data exists
      const dataCheck = await this.checkProjectData(projectId, userId);
      console.log('Data check results:', dataCheck);
      
      const [profile, projectData, gatePasses, guestPasses, orders, bookings] = await Promise.all([
        this.fetchUserProfile(userId),
        this.fetchUserProjectData(projectId, userId),
        this.fetchUserGatePasses(projectId, userId),
        this.fetchUserGuestPasses(projectId, userId),
        this.fetchUserOrders(projectId, userId),
        this.fetchUserBookings(projectId, userId)
      ]);

      const result = {
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
          },
          dataCheck
        }
      };
      
      console.log('Final export result:', result);
      return result;
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

    // Flatten nested objects for better CSV readability
    const flattenedData = data.map(item => this.flattenObject(item));
    
    if (flattenedData.length === 0) {
      return `No ${dataType} data found`;
    }

    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle arrays and objects
          if (Array.isArray(value)) {
            return `"${value.join('; ')}"`;
          }
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

  // Helper function to flatten nested objects
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          // Recursively flatten nested objects
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
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

  // Export data for a specific user
  async exportUserData(targetUserId, format = 'json') {
    try {
      const projectId = this.getCurrentProjectId();
      const dateStr = new Date().toISOString().split('T')[0];
      
      const results = [];
      
      // Export each data type separately for the target user
      const dataTypes = ['profile', 'gatePasses', 'guestPasses', 'orders', 'bookings'];
      
      for (const dataType of dataTypes) {
        try {
          let data = null;
          let filename = '';
          
          switch (dataType) {
            case 'profile':
              data = await this.fetchUserProfile(targetUserId);
              filename = `user-${targetUserId}-profile-${dateStr}`;
              break;
            case 'gatePasses':
              data = await this.fetchUserGatePasses(projectId, targetUserId);
              filename = `user-${targetUserId}-gate-passes-${dateStr}`;
              break;
            case 'guestPasses':
              data = await this.fetchUserGuestPasses(projectId, targetUserId);
              filename = `user-${targetUserId}-guest-passes-${dateStr}`;
              break;
            case 'orders':
              data = await this.fetchUserOrders(projectId, targetUserId);
              filename = `user-${targetUserId}-orders-${dateStr}`;
              break;
            case 'bookings':
              data = await this.fetchUserBookings(projectId, targetUserId);
              filename = `user-${targetUserId}-bookings-${dateStr}`;
              break;
            default:
              console.warn(`Unknown data type: ${dataType}`);
              continue;
          }
          
          if (data && (Array.isArray(data) ? data.length > 0 : data)) {
            if (format === 'csv') {
              const csvContent = this.convertToCSV(Array.isArray(data) ? data : [data], dataType);
              this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
            } else {
              const jsonContent = this.convertToJSON(data);
              this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
            }
            
            results.push({
              dataType,
              filename,
              recordCount: Array.isArray(data) ? data.length : 1,
              success: true
            });
          } else {
            results.push({
              dataType,
              filename,
              recordCount: 0,
              success: true,
              message: 'No data found'
            });
          }
        } catch (error) {
          console.error(`Error exporting ${dataType} for user ${targetUserId}:`, error);
          results.push({
            dataType,
            success: false,
            error: error.message
          });
        }
      }
      
      // Create a summary file
      const summary = {
        exportDate: new Date().toISOString(),
        projectId,
        targetUserId,
        format,
        results: results,
        totalFiles: results.filter(r => r.success && r.recordCount > 0).length,
        totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0)
      };
      
      const summaryContent = format === 'csv' 
        ? this.createSummaryCSV(summary)
        : this.convertToJSON(summary);
      
      this.downloadFile(
        summaryContent, 
        `user-${targetUserId}-export-summary-${dateStr}.${format === 'csv' ? 'csv' : 'json'}`, 
        format === 'csv' ? 'text/csv' : 'application/json'
      );
      
      return { success: true, results, summary };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Export all data as separate files
  async exportAllDataSeparate(format = 'json') {
    try {
      const projectId = this.getCurrentProjectId();
      const userId = this.getCurrentUserId();
      const dateStr = new Date().toISOString().split('T')[0];
      
      const results = [];
      
      // Export each data type separately
      const dataTypes = ['profile', 'gatePasses', 'guestPasses', 'orders', 'bookings'];
      
      for (const dataType of dataTypes) {
        try {
          let data = null;
          let filename = '';
          
          switch (dataType) {
            case 'profile':
              data = await this.fetchUserProfile(userId);
              filename = `profile-${dateStr}`;
              break;
            case 'gatePasses':
              data = await this.fetchUserGatePasses(projectId, userId);
              filename = `gate-passes-${dateStr}`;
              break;
            case 'guestPasses':
              data = await this.fetchUserGuestPasses(projectId, userId);
              filename = `guest-passes-${dateStr}`;
              break;
            case 'orders':
              data = await this.fetchUserOrders(projectId, userId);
              filename = `orders-${dateStr}`;
              break;
            case 'bookings':
              data = await this.fetchUserBookings(projectId, userId);
              filename = `bookings-${dateStr}`;
              break;
            default:
              console.warn(`Unknown data type: ${dataType}`);
              continue;
          }
          
          if (data && (Array.isArray(data) ? data.length > 0 : data)) {
            if (format === 'csv') {
              const csvContent = this.convertToCSV(Array.isArray(data) ? data : [data], dataType);
              this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
            } else {
              const jsonContent = this.convertToJSON(data);
              this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
            }
            
            results.push({
              dataType,
              filename,
              recordCount: Array.isArray(data) ? data.length : 1,
              success: true
            });
          } else {
            results.push({
              dataType,
              filename,
              recordCount: 0,
              success: true,
              message: 'No data found'
            });
          }
        } catch (error) {
          console.error(`Error exporting ${dataType}:`, error);
          results.push({
            dataType,
            success: false,
            error: error.message
          });
        }
      }
      
      // Create a summary file
      const summary = {
        exportDate: new Date().toISOString(),
        projectId,
        userId,
        format,
        results: results,
        totalFiles: results.filter(r => r.success && r.recordCount > 0).length,
        totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0)
      };
      
      const summaryContent = format === 'csv' 
        ? this.createSummaryCSV(summary)
        : this.convertToJSON(summary);
      
      this.downloadFile(
        summaryContent, 
        `export-summary-${dateStr}.${format === 'csv' ? 'csv' : 'json'}`, 
        format === 'csv' ? 'text/csv' : 'application/json'
      );
      
      return { success: true, results, summary };
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw error;
    }
  }

  // Generate user activity report
  async generateUserActivityReport(projectId) {
    try {
      console.log('Generating user activity report for project:', projectId);
      
      const project = await this.fetchProjectDetails(projectId);
      const users = await this.fetchProjectUsers(projectId);
      
      const userActivity = [];
      
      for (const user of users) {
        const userId = user.id;
        const userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'Unknown User';
        
        // Fetch counts for each data type
        const [gatePasses, guestPasses, orders, bookings] = await Promise.all([
          this.fetchUserGatePasses(projectId, userId),
          this.fetchUserGuestPasses(projectId, userId),
          this.fetchUserOrders(projectId, userId),
          this.fetchUserBookings(projectId, userId)
        ]);
        
        userActivity.push({
          userId,
          userName,
          email: user.email || 'N/A',
          role: user.role || 'N/A',
          gatePasses: gatePasses.length,
          guestPasses: guestPasses.length,
          orders: orders.length,
          bookings: bookings.length,
          totalRequests: gatePasses.length + guestPasses.length + orders.length + bookings.length
        });
      }
      
      return {
        projectName: project.name,
        projectId: project.id,
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        userActivity
      };
    } catch (error) {
      console.error('Error generating user activity report:', error);
      throw error;
    }
  }

  // Export user activity report as CSV
  async exportUserActivityReport(format = 'csv') {
    try {
      const projectId = this.getCurrentProjectId();
      const dateStr = new Date().toISOString().split('T')[0];
      
      const report = await this.generateUserActivityReport(projectId);
      
      if (format === 'csv') {
        const csvContent = this.createUserActivityCSV(report);
        this.downloadFile(csvContent, `user-activity-report-${dateStr}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(report);
        this.downloadFile(jsonContent, `user-activity-report-${dateStr}.json`, 'application/json');
      }
      
      return { success: true, report };
    } catch (error) {
      console.error('Error exporting user activity report:', error);
      throw error;
    }
  }

  // Create user activity CSV
  createUserActivityCSV(report) {
    const headers = ['User Name', 'Email', 'Role', 'Gate Passes', 'Guest Passes', 'Orders', 'Bookings', 'Total Requests'];
    const rows = report.userActivity.map(user => [
      user.userName,
      user.email,
      user.role,
      user.gatePasses,
      user.guestPasses,
      user.orders,
      user.bookings,
      user.totalRequests
    ]);
    
    const csvContent = [
      'User Activity Report',
      `Project Name: ${report.projectName}`,
      `Project ID: ${report.projectId}`,
      `Export Date: ${report.exportDate}`,
      `Total Users: ${report.totalUsers}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Export detailed orders report
  async exportOrdersReport(format = 'csv') {
    try {
      const projectId = this.getCurrentProjectId();
      const project = await this.fetchProjectDetails(projectId);
      const users = await this.fetchProjectUsers(projectId);
      const dateStr = new Date().toISOString().split('T')[0];
      
      const report = {
        projectName: project.name,
        projectId: project.id,
        exportDate: new Date().toISOString(),
        userOrders: []
      };
      
      for (const user of users) {
        const orders = await this.fetchUserOrders(projectId, user.id);
        
        if (orders.length > 0) {
          const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
          
          report.userOrders.push({
            userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            role: user.role,
            totalOrders: orders.length,
            totalSpent: totalSpent,
            averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
            orders: orders.map(order => ({
              orderNumber: order.orderNumber || order.id,
              date: order.orderDate || order.createdAt,
              status: order.status,
              items: order.items?.length || 0,
              total: order.total || 0
            }))
          });
        }
      }
      
      if (format === 'csv') {
        const csvContent = this.createOrdersReportCSV(report);
        this.downloadFile(csvContent, `orders-report-${dateStr}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(report);
        this.downloadFile(jsonContent, `orders-report-${dateStr}.json`, 'application/json');
      }
      
      return { success: true, report };
    } catch (error) {
      console.error('Error exporting orders report:', error);
      throw error;
    }
  }

  // Create orders report CSV
  createOrdersReportCSV(report) {
    const summaryHeaders = ['User Name', 'Email', 'Role', 'Total Orders', 'Total Spent', 'Average Order Value'];
    const summaryRows = report.userOrders.map(user => [
      user.userName,
      user.email,
      user.role,
      user.totalOrders,
      user.totalSpent.toFixed(2),
      user.averageOrderValue.toFixed(2)
    ]);
    
    // Detailed orders
    const detailHeaders = ['User Name', 'Order Number', 'Date', 'Status', 'Items', 'Total'];
    const detailRows = [];
    
    report.userOrders.forEach(user => {
      user.orders.forEach(order => {
        detailRows.push([
          user.userName,
          order.orderNumber,
          order.date,
          order.status,
          order.items,
          order.total
        ]);
      });
    });
    
    const csvContent = [
      'Orders Report',
      `Project Name: ${report.projectName}`,
      `Project ID: ${report.projectId}`,
      `Export Date: ${report.exportDate}`,
      `Total Users with Orders: ${report.userOrders.length}`,
      '',
      'SUMMARY',
      ...summaryRows.length > 0 ? [summaryHeaders.join(','), ...summaryRows.map(row => row.join(','))] : [],
      '',
      'DETAILED ORDERS',
      ...detailRows.length > 0 ? [detailHeaders.join(','), ...detailRows.map(row => row.join(','))] : []
    ].join('\n');
    
    return csvContent;
  }

  // Export detailed bookings report
  async exportBookingsReport(format = 'csv') {
    try {
      const projectId = this.getCurrentProjectId();
      const project = await this.fetchProjectDetails(projectId);
      const users = await this.fetchProjectUsers(projectId);
      const dateStr = new Date().toISOString().split('T')[0];
      
      const report = {
        projectName: project.name,
        projectId: project.id,
        exportDate: new Date().toISOString(),
        userBookings: []
      };
      
      for (const user of users) {
        const bookings = await this.fetchUserBookings(projectId, user.id);
        
        if (bookings.length > 0) {
          const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalPrice || booking.totalCost || 0), 0);
          
          report.userBookings.push({
            userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            role: user.role,
            totalBookings: bookings.length,
            totalSpent: totalSpent,
            averageBookingValue: bookings.length > 0 ? totalSpent / bookings.length : 0,
            bookings: bookings.map(booking => ({
              type: booking.type,
              serviceName: booking.courtName || booking.academyName || 'Unknown',
              date: booking.date || booking.bookingDate,
              status: booking.status,
              total: booking.totalPrice || booking.totalCost || 0
            }))
          });
        }
      }
      
      if (format === 'csv') {
        const csvContent = this.createBookingsReportCSV(report);
        this.downloadFile(csvContent, `bookings-report-${dateStr}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(report);
        this.downloadFile(jsonContent, `bookings-report-${dateStr}.json`, 'application/json');
      }
      
      return { success: true, report };
    } catch (error) {
      console.error('Error exporting bookings report:', error);
      throw error;
    }
  }

  // Create bookings report CSV
  createBookingsReportCSV(report) {
    const summaryHeaders = ['User Name', 'Email', 'Role', 'Total Bookings', 'Total Spent', 'Average Booking Value'];
    const summaryRows = report.userBookings.map(user => [
      user.userName,
      user.email,
      user.role,
      user.totalBookings,
      user.totalSpent.toFixed(2),
      user.averageBookingValue.toFixed(2)
    ]);
    
    // Detailed bookings
    const detailHeaders = ['User Name', 'Service Type', 'Service Name', 'Date', 'Status', 'Total'];
    const detailRows = [];
    
    report.userBookings.forEach(user => {
      user.bookings.forEach(booking => {
        detailRows.push([
          user.userName,
          booking.type,
          booking.serviceName,
          booking.date,
          booking.status,
          booking.total
        ]);
      });
    });
    
    const csvContent = [
      'Bookings Report',
      `Project Name: ${report.projectName}`,
      `Project ID: ${report.projectId}`,
      `Export Date: ${report.exportDate}`,
      `Total Users with Bookings: ${report.userBookings.length}`,
      '',
      'SUMMARY',
      ...summaryRows.length > 0 ? [summaryHeaders.join(','), ...summaryRows.map(row => row.join(','))] : [],
      '',
      'DETAILED BOOKINGS',
      ...detailRows.length > 0 ? [detailHeaders.join(','), ...detailRows.map(row => row.join(','))] : []
    ].join('\n');
    
    return csvContent;
  }

  // Export detailed gate passes report
  async exportGatePassesReport(format = 'csv') {
    try {
      const projectId = this.getCurrentProjectId();
      const project = await this.fetchProjectDetails(projectId);
      const users = await this.fetchProjectUsers(projectId);
      const dateStr = new Date().toISOString().split('T')[0];
      
      const report = {
        projectName: project.name,
        projectId: project.id,
        exportDate: new Date().toISOString(),
        userGatePasses: []
      };
      
      for (const user of users) {
        const gatePasses = await this.fetchUserGatePasses(projectId, user.id);
        
        if (gatePasses.length > 0) {
          report.userGatePasses.push({
            userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            role: user.role,
            totalGatePasses: gatePasses.length,
            gatePasses: gatePasses.map(pass => ({
              passNumber: pass.passNumber || pass.id,
              type: pass.type,
              status: pass.status,
              validFrom: pass.validFrom,
              validUntil: pass.validUntil,
              purpose: pass.purpose || 'N/A'
            }))
          });
        }
      }
      
      if (format === 'csv') {
        const csvContent = this.createGatePassesReportCSV(report);
        this.downloadFile(csvContent, `gate-passes-report-${dateStr}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(report);
        this.downloadFile(jsonContent, `gate-passes-report-${dateStr}.json`, 'application/json');
      }
      
      return { success: true, report };
    } catch (error) {
      console.error('Error exporting gate passes report:', error);
      throw error;
    }
  }

  // Create gate passes report CSV
  createGatePassesReportCSV(report) {
    const summaryHeaders = ['User Name', 'Email', 'Role', 'Total Gate Passes'];
    const summaryRows = report.userGatePasses.map(user => [
      user.userName,
      user.email,
      user.role,
      user.totalGatePasses
    ]);
    
    // Detailed gate passes
    const detailHeaders = ['User Name', 'Pass Number', 'Type', 'Status', 'Valid From', 'Valid Until', 'Purpose'];
    const detailRows = [];
    
    report.userGatePasses.forEach(user => {
      user.gatePasses.forEach(pass => {
        detailRows.push([
          user.userName,
          pass.passNumber,
          pass.type,
          pass.status,
          pass.validFrom,
          pass.validUntil,
          pass.purpose
        ]);
      });
    });
    
    const csvContent = [
      'Gate Passes Report',
      `Project Name: ${report.projectName}`,
      `Project ID: ${report.projectId}`,
      `Export Date: ${report.exportDate}`,
      `Total Users with Gate Passes: ${report.userGatePasses.length}`,
      '',
      'SUMMARY',
      ...summaryRows.length > 0 ? [summaryHeaders.join(','), ...summaryRows.map(row => row.join(','))] : [],
      '',
      'DETAILED GATE PASSES',
      ...detailRows.length > 0 ? [detailHeaders.join(','), ...detailRows.map(row => row.join(','))] : []
    ].join('\n');
    
    return csvContent;
  }

  // Export detailed guest passes report
  async exportGuestPassesReport(format = 'csv') {
    try {
      const projectId = this.getCurrentProjectId();
      const project = await this.fetchProjectDetails(projectId);
      const users = await this.fetchProjectUsers(projectId);
      const dateStr = new Date().toISOString().split('T')[0];
      
      const report = {
        projectName: project.name,
        projectId: project.id,
        exportDate: new Date().toISOString(),
        userGuestPasses: []
      };
      
      for (const user of users) {
        const guestPasses = await this.fetchUserGuestPasses(projectId, user.id);
        
        if (guestPasses.length > 0) {
          report.userGuestPasses.push({
            userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            role: user.role,
            totalGuestPasses: guestPasses.length,
            guestPasses: guestPasses.map(pass => ({
              passId: pass.id,
              status: pass.sentStatus ? 'Sent' : 'Pending',
              createdAt: pass.createdAt,
              validFrom: pass.validFrom,
              validUntil: pass.validUntil
            }))
          });
        }
      }
      
      if (format === 'csv') {
        const csvContent = this.createGuestPassesReportCSV(report);
        this.downloadFile(csvContent, `guest-passes-report-${dateStr}.csv`, 'text/csv');
      } else {
        const jsonContent = this.convertToJSON(report);
        this.downloadFile(jsonContent, `guest-passes-report-${dateStr}.json`, 'application/json');
      }
      
      return { success: true, report };
    } catch (error) {
      console.error('Error exporting guest passes report:', error);
      throw error;
    }
  }

  // Create guest passes report CSV
  createGuestPassesReportCSV(report) {
    const summaryHeaders = ['User Name', 'Email', 'Role', 'Total Guest Passes'];
    const summaryRows = report.userGuestPasses.map(user => [
      user.userName,
      user.email,
      user.role,
      user.totalGuestPasses
    ]);
    
    // Detailed guest passes
    const detailHeaders = ['User Name', 'Pass ID', 'Status', 'Created Date', 'Valid From', 'Valid Until'];
    const detailRows = [];
    
    report.userGuestPasses.forEach(user => {
      user.guestPasses.forEach(pass => {
        detailRows.push([
          user.userName,
          pass.passId,
          pass.status,
          pass.createdAt,
          pass.validFrom,
          pass.validUntil
        ]);
      });
    });
    
    const csvContent = [
      'Guest Passes Report',
      `Project Name: ${report.projectName}`,
      `Project ID: ${report.projectId}`,
      `Export Date: ${report.exportDate}`,
      `Total Users with Guest Passes: ${report.userGuestPasses.length}`,
      '',
      'SUMMARY',
      ...summaryRows.length > 0 ? [summaryHeaders.join(','), ...summaryRows.map(row => row.join(','))] : [],
      '',
      'DETAILED GUEST PASSES',
      ...detailRows.length > 0 ? [detailHeaders.join(','), ...detailRows.map(row => row.join(','))] : []
    ].join('\n');
    
    return csvContent;
  }

  // Create a clean summary CSV
  createSummaryCSV(summary) {
    const headers = ['Data Type', 'Records Found', 'Status', 'File Name'];
    const rows = summary.results.map(result => [
      result.dataType,
      result.recordCount || 0,
      result.success ? 'Success' : 'Failed',
      result.filename || 'N/A'
    ]);
    
    const csvContent = [
      'Export Summary',
      `Export Date: ${summary.exportDate}`,
      `Project ID: ${summary.projectId}`,
      `User ID: ${summary.userId}`,
      `Total Files: ${summary.totalFiles}`,
      `Total Records: ${summary.totalRecords}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
}

const dataExportService = new DataExportService();
export default dataExportService;
