import { db } from '../config/firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * User Service for Dashboard
 * Handles user data operations for admin dashboard
 */

/**
 * Get user details by user ID
 * @param {string} userId - The user's UID
 * @returns {Promise<Object|null>} - User details or null if not found
 */
export const getUserDetails = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        id: userSnap.id,
        ...userData,
        // Format dates for display
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt,
        lastLoginAt: userData.lastLoginAt?.toDate?.() || userData.lastLoginAt,
      };
    } else {
      console.log('No user found with ID:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * Get multiple users by their IDs
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array>} - Array of user details
 */
export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    const userPromises = userIds.map(userId => getUserDetails(userId));
    const users = await Promise.all(userPromises);
    
    // Filter out null results
    return users.filter(user => user !== null);
  } catch (error) {
    console.error('Error fetching multiple users:', error);
    throw error;
  }
};

/**
 * Get user's projects and units
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} - Array of user projects with units
 */
export const getUserProjects = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const userProjects = userData.projects || [];
      
      console.log('User data from Firestore:', userData);
      console.log('User projects array:', userProjects);
      
      if (userProjects.length === 0) {
        console.log('No user projects found');
        return [];
      }

      // Get all project IDs from user projects
      const projectIds = userProjects.map(up => up.projectId || up.id).filter(Boolean);
      console.log('Project IDs to fetch:', projectIds);
      
      if (projectIds.length === 0) {
        return [];
      }

      // Split into chunks of 10 (Firestore 'in' query limit)
      const chunks = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        chunks.push(projectIds.slice(i, i + 10));
      }

      // Fetch all chunks in parallel
      const chunkPromises = chunks.map(async (chunk) => {
        try {
          const projectsRef = collection(db, 'projects');
          const q = query(projectsRef, where('__name__', 'in', chunk));
          const snapshot = await getDocs(q);
          
          const projects = [];
          snapshot.forEach((doc) => {
            const projectData = doc.data();
            // Find the user's role and unit for this project
            const userProject = userProjects.find(up => (up.projectId || up.id) === doc.id);
            
            projects.push({
              id: doc.id,
              ...projectData,
              userRole: userProject?.userRole || 'Member',
              userUnit: userProject?.userUnit || 'N/A',
              joinedAt: userProject?.joinedAt?.toDate?.() || userProject?.joinedAt,
            });
          });
          
          return projects;
        } catch (error) {
          console.error('Error fetching project chunk:', error);
          return [];
        }
      });

      const projectChunks = await Promise.all(chunkPromises);
      const allProjects = projectChunks.flat();
      
      return allProjects;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
};

/**
 * Get user's bookings across all projects
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} - Array of user bookings
 */
export const getUserBookings = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // First get all projects
    const projectsRef = collection(db, 'projects');
    const projectsSnapshot = await getDocs(projectsRef);
    
    const allBookings = [];
    
    // Fetch bookings from each project
    const bookingPromises = projectsSnapshot.docs.map(async (projectDoc) => {
      try {
        const bookingsRef = collection(db, `projects/${projectDoc.id}/bookings`);
        const bookingsQuery = query(
          bookingsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(50) // Limit to recent bookings
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const projectBookings = bookingsSnapshot.docs.map(bookingDoc => ({
          id: bookingDoc.id,
          projectId: projectDoc.id,
          projectName: projectDoc.data().name || 'Unknown Project',
          ...bookingDoc.data(),
          createdAt: bookingDoc.data().createdAt?.toDate?.() || bookingDoc.data().createdAt,
          updatedAt: bookingDoc.data().updatedAt?.toDate?.() || bookingDoc.data().updatedAt,
        }));
        
        return projectBookings;
      } catch (error) {
        console.error(`Error fetching bookings for project ${projectDoc.id}:`, error);
        return [];
      }
    });

    const projectBookings = await Promise.all(bookingPromises);
    projectBookings.forEach(bookings => allBookings.push(...bookings));
    
    // Sort by creation date
    return allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Get user's complaints across all projects
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} - Array of user complaints
 */
export const getUserComplaints = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // First get all projects
    const projectsRef = collection(db, 'projects');
    const projectsSnapshot = await getDocs(projectsRef);
    
    const allComplaints = [];
    
    // Fetch complaints from each project
    const complaintPromises = projectsSnapshot.docs.map(async (projectDoc) => {
      try {
        const complaintsRef = collection(db, `projects/${projectDoc.id}/complaints`);
        const complaintsQuery = query(
          complaintsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20) // Limit to recent complaints
        );
        
        const complaintsSnapshot = await getDocs(complaintsQuery);
        const projectComplaints = complaintsSnapshot.docs.map(complaintDoc => ({
          id: complaintDoc.id,
          projectId: projectDoc.id,
          projectName: projectDoc.data().name || 'Unknown Project',
          ...complaintDoc.data(),
          createdAt: complaintDoc.data().createdAt?.toDate?.() || complaintDoc.data().createdAt,
          updatedAt: complaintDoc.data().updatedAt?.toDate?.() || complaintDoc.data().updatedAt,
        }));
        
        return projectComplaints;
      } catch (error) {
        console.error(`Error fetching complaints for project ${projectDoc.id}:`, error);
        return [];
      }
    });

    const projectComplaints = await Promise.all(complaintPromises);
    projectComplaints.forEach(complaints => allComplaints.push(...complaints));
    
    // Sort by creation date
    return allComplaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    throw error;
  }
};

/**
 * Get comprehensive user details including projects, bookings, and complaints
 * @param {string} userId - The user's UID
 * @returns {Promise<Object>} - Comprehensive user data
 */
export const getComprehensiveUserDetails = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch all user data in parallel
    const [userDetails, projects, bookings, complaints] = await Promise.all([
      getUserDetails(userId),
      getUserProjects(userId),
      getUserBookings(userId),
      getUserComplaints(userId)
    ]);

    if (!userDetails) {
      return null;
    }

    // Calculate activity metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentBookings = bookings.filter(booking => 
      new Date(booking.createdAt) >= thirtyDaysAgo
    );
    
    const recentComplaints = complaints.filter(complaint => 
      new Date(complaint.createdAt) >= thirtyDaysAgo
    );

    // Calculate booking statistics
    const bookingStats = {
      total: bookings.length,
      recent: recentBookings.length,
      byType: bookings.reduce((acc, booking) => {
        const type = booking.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      byStatus: bookings.reduce((acc, booking) => {
        const status = booking.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    };

    // Calculate complaint statistics
    const complaintStats = {
      total: complaints.length,
      recent: recentComplaints.length,
      byStatus: complaints.reduce((acc, complaint) => {
        const status = complaint.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    };

    return {
      ...userDetails,
      projects,
      bookings,
      complaints,
      activityMetrics: {
        totalProjects: projects.length,
        totalBookings: bookingStats.total,
        recentBookings: bookingStats.recent,
        totalComplaints: complaintStats.total,
        recentComplaints: complaintStats.recent,
        lastActivity: bookings.length > 0 ? bookings[0].createdAt : userDetails.createdAt
      },
      bookingStats,
      complaintStats
    };
  } catch (error) {
    console.error('Error fetching comprehensive user details:', error);
    throw error;
  }
};

/**
 * Format user data for display
 * @param {Object} user - User data object
 * @returns {Object} - Formatted user data
 */
export const formatUserForDisplay = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || 'N/A',
    firstName: user.firstName || 'N/A',
    lastName: user.lastName || 'N/A',
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
    mobile: user.mobile || 'N/A',
    dateOfBirth: user.dateOfBirth || 'N/A',
    gender: user.gender || 'N/A',
    nationalId: user.nationalId || 'N/A',
    isProfileComplete: user.isProfileComplete || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    // Additional fields that might be useful
    displayName: user.displayName || user.fullName || 'N/A',
    photoURL: user.photoURL || null,
    // Enhanced data
    projects: user.projects || [],
    bookings: user.bookings || [],
    complaints: user.complaints || [],
    activityMetrics: user.activityMetrics || {},
    bookingStats: user.bookingStats || {},
    complaintStats: user.complaintStats || {}
  };
};
