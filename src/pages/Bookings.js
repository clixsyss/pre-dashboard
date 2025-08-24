import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  Clock,
  DollarSign,
  User,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  MoreHorizontal,
  X
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, typeFilter]);
 
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date ? new Date(doc.data().date.seconds * 1000) : new Date()
      }));
      
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.serviceType === typeFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus
      });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      // Update selected booking if it's the same booking
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Failed to update booking status');
    }
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      court: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Court Booking' },
      academy: { bg: 'bg-green-100', text: 'text-green-800', label: 'Academy Program' }
    };
    
    const config = typeConfig[type] || typeConfig.court;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <button 
          onClick={fetchBookings}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all court and academy bookings
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings by user, service, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="court">Court Bookings</option>
              <option value="academy">Academy Programs</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.userName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.userEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          {booking.serviceType === 'court' ? (
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                          ) : (
                            <Building2 className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {getTypeBadge(booking.serviceType)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {booking.serviceName || 'Unknown Service'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {booking.date?.toLocaleDateString() || 'N/A'}
                        </div>
                        {booking.time && (
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {booking.time}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        ${booking.price || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openBookingModal(booking)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openBookingModal(booking)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Edit Booking"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                      ? 'No bookings match your filters' 
                      : 'No bookings found'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.userName || 'No Name'}</p>
                  <p className="mt-1 text-sm text-gray-500">{selectedBooking.userEmail}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <div className="mt-1">{getTypeBadge(selectedBooking.serviceType)}</div>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.date?.toLocaleDateString() || 'N/A'}
                  </p>
                  {selectedBooking.time && (
                    <p className="mt-1 text-sm text-gray-500">{selectedBooking.time}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedBooking.status || 'pending'}
                    onChange={(e) => handleStatusUpdate(selectedBooking.id, e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedBooking.price || '0'}</p>
                </div>
                
                {selectedBooking.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
