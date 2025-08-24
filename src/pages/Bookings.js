import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  User,
  X
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = [];
      bookingsSnapshot.forEach(doc => {
        bookingsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.userName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.sport?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.courtName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.programName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      enrolled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enrolled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      court: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Court' },
      academy: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Academy' }
    };
    
    const config = typeConfig[type] || typeConfig.court;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeSlots) => {
    if (!timeSlots || !Array.isArray(timeSlots)) return 'N/A';
    return timeSlots.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all court and academy bookings in the PRE platform
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="enrolled">Enrolled</option>
            </select>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="court">Court</option>
              <option value="academy">Academy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Bookings ({filteredBookings.length})
            </h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-3">
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
                    {getTypeBadge(booking.type)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {booking.type === 'court' ? (
                        <div>
                          <div className="font-medium">{booking.sport}</div>
                          <div className="text-gray-500">{booking.courtName}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{booking.programName}</div>
                          <div className="text-gray-500">{booking.academyName}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(booking.date)}
                      </div>
                      {booking.type === 'court' && (
                        <div className="flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatTime(booking.timeSlots)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                            title="Confirm Booking"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedBooking.userName || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <div className="mt-1">{getTypeBadge(selectedBooking.type)}</div>
                </div>
                
                {selectedBooking.type === 'court' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sport</label>
                      <p className="text-sm text-gray-900">{selectedBooking.sport}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Court</label>
                      <p className="text-sm text-gray-900">{selectedBooking.courtName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBooking.date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Slots</label>
                      <p className="text-sm text-gray-900">{formatTime(selectedBooking.timeSlots)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Program</label>
                      <p className="text-sm text-gray-900">{selectedBooking.programName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Academy</label>
                      <p className="text-sm text-gray-900">{selectedBooking.academyName}</p>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
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
