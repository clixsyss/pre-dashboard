import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, 
  Clock,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  X
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserDetails, getUserProjects } from '../services/userService';
import { sendStatusNotification } from '../services/statusNotificationService';

const ServiceBookingRequests = ({ projectId }) => {
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch service bookings
  const fetchBookings = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, `projects/${projectId}/serviceBookings`),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBookings();
  }, [projectId, fetchBookings]);

  // Fetch project-specific user details (only service bookings and current project)
  const fetchUserDetails = async (userId) => {
    if (!userId || !projectId) return;
    
    setLoadingUserDetails(true);
    try {
      // Get basic user details
      const userData = await getUserDetails(userId);
      if (!userData) {
        setUserDetails(null);
        return;
      }

      // Get user projects and filter for current project only
      const allProjects = await getUserProjects(userId);
      const currentProject = allProjects.find(project => project.id === projectId);

      // Get only service bookings for this project
      const serviceBookings = bookings.filter(booking => 
        booking.userId === userId && 
        booking.type === 'service' &&
        booking.categoryName && 
        booking.serviceName
      );

      // Calculate service-specific activity metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const recentServiceBookings = serviceBookings.filter(booking => 
        new Date(booking.createdAt) >= thirtyDaysAgo
      );

      // Calculate service booking statistics
      const serviceBookingStats = {
        total: serviceBookings.length,
        recent: recentServiceBookings.length,
        byStatus: serviceBookings.reduce((acc, booking) => {
          const status = booking.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      };

      // Prepare project-specific user details
      const projectSpecificUserDetails = {
        ...userData,
        projects: currentProject ? [currentProject] : [],
        serviceBookings: serviceBookings,
        activityMetrics: {
          totalProjects: currentProject ? 1 : 0,
          totalServiceBookings: serviceBookingStats.total,
          recentServiceBookings: serviceBookingStats.recent,
          lastActivity: serviceBookings.length > 0 ? serviceBookings[0].createdAt : userData.createdAt
        },
        serviceBookingStats: serviceBookingStats
      };

      setUserDetails(projectSpecificUserDetails);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    await fetchUserDetails(booking.userId);
  };

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      // Find the booking to get user details
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        console.error('Booking not found');
        return;
      }

      await updateDoc(doc(db, `projects/${projectId}/serviceBookings`, bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updatedAt: new Date() }
          : booking
      ));
      
      // Update selected booking if it's the same
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }

      // Send appropriate notification based on status
      try {
        const serviceName = booking.serviceName || 'the requested service';
        let title_en = 'Service Booking Update';
        let title_ar = 'تحديث حجز الخدمة';
        let body_en = '';
        let body_ar = '';
        
        switch (newStatus) {
          case 'confirmed':
            body_en = `Your service booking for "${serviceName}" has been confirmed! Our team will contact you soon to schedule the service.`;
            body_ar = `تم تأكيد حجز خدمتك لـ "${serviceName}"! سيتواصل معك فريقنا قريباً لجدولة الخدمة.`;
            break;
          case 'in_progress':
            body_en = `Work has started on your service booking for "${serviceName}". Our team is now working on your request.`;
            body_ar = `بدأ العمل على حجز خدمتك لـ "${serviceName}". فريقنا يعمل الآن على طلبك.`;
            break;
          case 'completed':
            body_en = `Your service booking for "${serviceName}" has been completed! Thank you for using our services.`;
            body_ar = `تم إكمال حجز خدمتك لـ "${serviceName}"! شكراً لاستخدام خدماتنا.`;
            break;
          case 'cancelled':
            body_en = `Your service booking for "${serviceName}" has been cancelled. Please contact the management office if you have any questions.`;
            body_ar = `تم إلغاء حجز خدمتك لـ "${serviceName}". يرجى الاتصال بمكتب الإدارة إذا كان لديك أي أسئلة.`;
            break;
          default:
            body_en = `Your service booking status has been updated to ${newStatus.toUpperCase()}.`;
            body_ar = `تم تحديث حالة حجز خدمتك إلى ${newStatus.toUpperCase()}.`;
        }
        
        await sendStatusNotification(projectId, booking.userId, title_en, body_en, title_ar, body_ar, 'booking');
        console.log(`Booking ${bookingId} status notification sent`);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't fail the status update if notification fails
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="service-booking-requests">
      <div className="page-header">
        <div className="header-content">
          <h2>Service Booking Requests</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <Filter className="h-4 w-4" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bookings-list">
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <MessageSquare className="h-12 w-12 text-gray-400" />
            <h3>No service bookings</h3>
            <p>Service booking requests will appear here</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-title">
                  <h3>{booking.serviceName}</h3>
                  <span className="category-badge">{booking.categoryName}</span>
                </div>
                <div className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span>{booking.status.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              
              <div className="booking-content">
                <div className="booking-info">
                  <div className="info-item">
                    <User className="h-4 w-4" />
                    <span>{booking.userName}</span>
                  </div>
                  <div className="info-item">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(booking.selectedDate)}</span>
                  </div>
                  <div className="info-item">
                    <DollarSign className="h-4 w-4" />
                    <span>AED {booking.servicePrice}</span>
                  </div>
                </div>
                
                {booking.message && (
                  <div className="booking-message">
                    <MessageSquare className="h-4 w-4" />
                    <p>{booking.message}</p>
                  </div>
                )}
              </div>
              
              <div className="booking-actions">
                <button
                  onClick={() => handleViewDetails(booking)}
                  className="btn-secondary"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                      className="btn-success"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                      className="btn-danger"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'in_progress')}
                    className="btn-primary"
                  >
                    Start Work
                  </button>
                )}
                
                {booking.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                    className="btn-success"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          userDetails={userDetails}
          loadingUserDetails={loadingUserDetails}
          onClose={() => setShowDetailsModal(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ booking, userDetails, loadingUserDetails, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(booking.status);

  const handleStatusChange = async (newStatus) => {
    await onStatusUpdate(booking.id, newStatus);
    setStatus(newStatus);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Booking Details</h3>
          <button onClick={onClose} className="close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="booking-details-content">
          {/* Service Information */}
          <div className="details-section">
            <h4>Service Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <label>Service Name:</label>
                <span>{booking.serviceName}</span>
              </div>
              <div className="detail-item">
                <label>Category:</label>
                <span>{booking.categoryName}</span>
              </div>
              <div className="detail-item">
                <label>Price:</label>
                <span>AED {booking.servicePrice}</span>
              </div>
              <div className="detail-item">
                <label>Selected Date:</label>
                <span>{formatDate(booking.selectedDate)}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status-text ${status}`}>{status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="details-section">
            <h4>User Information</h4>
            {loadingUserDetails ? (
              <div className="loading">Loading user details...</div>
            ) : userDetails ? (
              <div className="user-details">
                <div className="user-basic-info">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{userDetails.fullName || userDetails.displayName || userDetails.firstName + ' ' + userDetails.lastName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{userDetails.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{userDetails.mobile || userDetails.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth:</label>
                    <span>{userDetails.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gender:</label>
                    <span>{userDetails.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>National ID:</label>
                    <span>{userDetails.nationalId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Profile Complete:</label>
                    <span className={userDetails.isProfileComplete ? 'status-complete' : 'status-incomplete'}>
                      {userDetails.isProfileComplete ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Member Since:</label>
                    <span>{userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {userDetails.projects && userDetails.projects.length > 0 ? (
                  <div className="user-project-info">
                    <h5>Current Project Information</h5>
                    {userDetails.projects.map((project, index) => (
                      <div key={index} className="project-details">
                        <div className="detail-item">
                          <label>Project:</label>
                          <span>{project.name}</span>
                        </div>
                        <div className="detail-item">
                          <label>Unit:</label>
                          <span>{project.userUnit || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Role:</label>
                          <span>{project.userRole || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Location:</label>
                          <span>{project.location || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="user-project-info">
                    <h5>Project Information</h5>
                    <div className="project-details">
                      <div className="detail-item">
                        <label>Status:</label>
                        <span className="status-incomplete">Not a member of this project</span>
                      </div>
                    </div>
                  </div>
                )}

                {userDetails.activityMetrics && (
                  <div className="user-activity-info">
                    <h5>Service Activity Summary (This Project)</h5>
                    <div className="activity-grid">
                      <div className="activity-item">
                        <label>Project Status:</label>
                        <span>{userDetails.activityMetrics.totalProjects > 0 ? 'Active Member' : 'Not in Project'}</span>
                      </div>
                      <div className="activity-item">
                        <label>Total Service Bookings:</label>
                        <span>{userDetails.activityMetrics.totalServiceBookings || 0}</span>
                      </div>
                      <div className="activity-item">
                        <label>Recent Service Bookings (30 days):</label>
                        <span>{userDetails.activityMetrics.recentServiceBookings || 0}</span>
                      </div>
                      <div className="activity-item">
                        <label>Last Service Activity:</label>
                        <span>{userDetails.activityMetrics.lastActivity ? new Date(userDetails.activityMetrics.lastActivity).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {userDetails.serviceBookingStats && (
                  <div className="user-booking-stats">
                    <h5>Service Booking Statistics (This Project)</h5>
                    <div className="stats-grid">
                      <div className="stats-section">
                        <h6>By Status:</h6>
                        {Object.entries(userDetails.serviceBookingStats.byStatus || {}).map(([status, count]) => (
                          <div key={status} className="stat-item">
                            <span className="stat-label">{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}:</span>
                            <span className="stat-value">{count}</span>
                          </div>
                        ))}
                        {Object.keys(userDetails.serviceBookingStats.byStatus || {}).length === 0 && (
                          <div className="stat-item">
                            <span className="stat-label">No service bookings yet</span>
                            <span className="stat-value">0</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="error">Failed to load user details</div>
            )}
          </div>

          {/* Booking Message */}
          {booking.message && (
            <div className="details-section">
              <h4>Message</h4>
              <div className="message-content">
                <p>{booking.message}</p>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="details-section">
            <h4>Status Actions</h4>
            <div className="status-actions">
              {status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    className="btn-success"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="btn-danger"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Booking
                  </button>
                </>
              )}
              
              {status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="btn-primary"
                >
                  Start Work
                </button>
              )}
              
              {status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="btn-success"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceBookingRequests;
