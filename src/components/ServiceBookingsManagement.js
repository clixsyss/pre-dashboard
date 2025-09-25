import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Edit,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Send,
  X,
  Settings
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ServiceBookingsManagement = ({ projectId }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [updateType, setUpdateType] = useState(''); // 'status' or 'details'
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Update form states
  const [updateData, setUpdateData] = useState({
    status: '',
    reason: '',
    servicePrice: '',
    selectedDate: '',
    selectedTime: ''
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    processing: 0,
    closed: 0
  });

  // Load service bookings
  const loadServiceBookings = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const bookingsRef = collection(db, `projects/${projectId}/serviceBookings`);
      const q = query(bookingsRef, orderBy('lastMessageAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBookings(bookingsData);
      updateStats(bookingsData);
    } catch (error) {
      console.error('Error loading service bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Update stats
  const updateStats = (bookingsData) => {
    const stats = {
      total: bookingsData.length,
      open: bookingsData.filter(b => b.status === 'open').length,
      processing: bookingsData.filter(b => b.status === 'processing').length,
      closed: bookingsData.filter(b => b.status === 'closed').length
    };
    setStats(stats);
  };

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter]);

  // Load data on mount
  useEffect(() => {
    loadServiceBookings();
  }, [loadServiceBookings]);

  // Real-time updates for selected booking
  useEffect(() => {
    if (!selectedBooking?.id || !projectId) return;

    const bookingRef = doc(db, `projects/${projectId}/serviceBookings`, selectedBooking.id);
    const unsubscribe = onSnapshot(bookingRef, (doc) => {
      if (doc.exists()) {
        const updatedBooking = { id: doc.id, ...doc.data() };
        setSelectedBooking(updatedBooking);
        
        // Update in main bookings list
        setBookings(prev => prev.map(b => 
          b.id === updatedBooking.id ? updatedBooking : b
        ));
      }
    });

    return () => unsubscribe();
  }, [selectedBooking?.id, projectId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedBooking || sending) return;

    try {
      setSending(true);
      const bookingRef = doc(db, `projects/${projectId}/serviceBookings`, selectedBooking.id);
      
      const now = new Date();
      const message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderType: 'admin',
        senderId: 'admin',
        senderName: 'Admin',
        timestamp: now,
        messageType: 'chat'
      };

      await updateDoc(bookingRef, {
        messages: [...(selectedBooking.messages || []), message],
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async () => {
    if (!selectedBooking || !updateData.status) return;

    try {
      const bookingRef = doc(db, `projects/${projectId}/serviceBookings`, selectedBooking.id);
      
      const now = new Date();
      const systemMessage = {
        id: Date.now().toString(),
        text: `Booking status updated to "${updateData.status.toUpperCase()}"${updateData.reason ? `. Reason: ${updateData.reason}` : ''}`,
        senderType: 'system',
        timestamp: now,
        messageType: 'status_update'
      };

      await updateDoc(bookingRef, {
        status: updateData.status,
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messages: [...(selectedBooking.messages || []), systemMessage]
      });

      setShowUpdateModal(false);
      setUpdateData({ status: '', reason: '', servicePrice: '', selectedDate: '', selectedTime: '' });
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Update booking details
  const updateBookingDetails = async () => {
    if (!selectedBooking) return;

    try {
      const bookingRef = doc(db, `projects/${projectId}/serviceBookings`, selectedBooking.id);
      
      // Create system message for the update
      let updateMessage = 'Booking details updated:';
      const changes = [];
      
      if (updateData.servicePrice && updateData.servicePrice !== selectedBooking.servicePrice) {
        changes.push(`Price: EGP ${selectedBooking.servicePrice} → EGP ${updateData.servicePrice}`);
      }
      if (updateData.selectedDate && updateData.selectedDate !== selectedBooking.selectedDate) {
        changes.push(`Date: ${selectedBooking.selectedDate} → ${updateData.selectedDate}`);
      }
      if (updateData.selectedTime && updateData.selectedTime !== selectedBooking.selectedTime) {
        changes.push(`Time: ${selectedBooking.selectedTime || 'Not set'} → ${updateData.selectedTime}`);
      }
      
      if (changes.length > 0) {
        updateMessage += '\n' + changes.join('\n');
        if (updateData.reason) {
          updateMessage += `\nReason: ${updateData.reason}`;
        }
      }

      const now = new Date();
      const systemMessage = {
        id: Date.now().toString(),
        text: updateMessage,
        senderType: 'system',
        timestamp: now,
        messageType: 'details_update'
      };

      const updates = {};
      if (updateData.servicePrice) updates.servicePrice = updateData.servicePrice;
      if (updateData.selectedDate) updates.selectedDate = updateData.selectedDate;
      if (updateData.selectedTime) updates.selectedTime = updateData.selectedTime;

      await updateDoc(bookingRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messages: [...(selectedBooking.messages || []), systemMessage]
      });

      setShowUpdateModal(false);
      setUpdateData({ status: '', reason: '', servicePrice: '', selectedDate: '', selectedTime: '' });
    } catch (error) {
      console.error('Error updating booking details:', error);
    }
  };

  // Open booking detail
  const openBookingDetail = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetail(true);
  };

  // Open chat
  const openChat = (booking) => {
    setSelectedBooking(booking);
    setShowChat(true);
  };

  // Open update modal
  const openUpdateModal = (booking, type) => {
    setSelectedBooking(booking);
    setUpdateType(type);
    setUpdateData({
      status: type === 'status' ? booking.status : '',
      reason: '',
      servicePrice: type === 'details' ? booking.servicePrice : '',
      selectedDate: type === 'details' ? booking.selectedDate : '',
      selectedTime: type === 'details' ? booking.selectedTime || '' : ''
    });
    setShowUpdateModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    // Handle both ISO date strings and formatted date strings
    let date;
    if (dateString.includes('-')) {
      // ISO format (2025-01-15)
      date = new Date(dateString + 'T00:00:00');
    } else {
      // Already formatted or other format
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date and time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Not available';
    
    let date;
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      // Firestore timestamp object
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get last message preview
  const getLastMessagePreview = (booking) => {
    if (!booking.messages || booking.messages.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = booking.messages[booking.messages.length - 1];
    
    if (lastMessage.messageType === 'status_update') {
      return 'Status updated';
    } else if (lastMessage.messageType === 'details_update') {
      return 'Details updated';
    } else {
      return lastMessage.text || 'New message';
    }
  };

  // Generate time slot options based on category configuration
  const generateTimeSlotOptions = (booking) => {
    if (!booking) return [];
    
    // Check if booking has new category-level time slot configuration
    if (booking.categoryTimeSlotInterval) {
      // Use category's time slot configuration from booking
      const startTime = booking.categoryStartTime || '09:00';
      const endTime = booking.categoryEndTime || '17:00';
      const interval = booking.categoryTimeSlotInterval || 30;
      
      return generateTimeSlots(startTime, endTime, interval);
    }
    
    // Fallback: Use default time slots for older bookings
    return generateTimeSlots('09:00', '17:00', 30);
  };

  // Helper function to generate time slots
  const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    // Use a fixed date to avoid timezone issues
    const baseDate = new Date('2000-01-01T00:00:00');
    const start = new Date(baseDate);
    start.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);
    
    const end = new Date(baseDate);
    end.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
    
    while (start < end) {
      slots.push(start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
      start.setMinutes(start.getMinutes() + interval);
    }
    
    return slots;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Loading service bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Bookings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and communicate with service booking requests
          </p>
        </div>
        <button
          onClick={loadServiceBookings}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${statusFilter === 'open' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setStatusFilter('open')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open</dt>
                  <dd className="text-lg font-medium text-green-600">{stats.open}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${statusFilter === 'processing' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setStatusFilter('processing')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                  <dd className="text-lg font-medium text-yellow-600">{stats.processing}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${statusFilter === 'closed' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setStatusFilter('closed')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Closed</dt>
                  <dd className="text-lg font-medium text-gray-600">{stats.closed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service, user, or email..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="processing">Processing</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No service bookings</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No bookings match your current filters.' 
                : 'Service bookings will appear here when users make requests.'
              }
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <li key={booking.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => openBookingDetail(booking)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {booking.serviceName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {booking.userName} ({booking.userEmail})
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(booking.selectedDate)}
                          {booking.selectedTime && (
                            <span className="ml-1 text-gray-400">• {booking.selectedTime}</span>
                          )}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          EGP {booking.servicePrice}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Category:</span> {booking.categoryName}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Last activity:</span> {getLastMessagePreview(booking)} • {formatTime(booking.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openChat(booking); }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openUpdateModal(booking, 'status'); }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Status
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openUpdateModal(booking, 'details'); }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col h-96">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Chat: {selectedBooking.serviceName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedBooking.userName} ({selectedBooking.userEmail})
                  </p>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(selectedBooking.messages || []).map((message, index) => (
                  <div key={index} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderType === 'admin' 
                        ? 'bg-blue-600 text-white' 
                        : message.senderType === 'system'
                        ? 'bg-gray-100 text-gray-700 border-l-4 border-blue-500'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      {message.messageType === 'system' && (
                        <div className="flex items-center mb-1">
                          <Settings className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">System Update</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp?.seconds 
                          ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString()
                          : 'Sending...'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {updateType === 'status' ? 'Update Status' : 'Update Details'}
              </h3>
              
              {updateType === 'status' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="processing">Processing</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
                    <textarea
                      value={updateData.reason}
                      onChange={(e) => setUpdateData({...updateData, reason: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explain why you're updating the status..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={updateData.servicePrice}
                      onChange={(e) => setUpdateData({...updateData, servicePrice: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={updateData.selectedDate}
                      onChange={(e) => setUpdateData({...updateData, selectedDate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <select
                      value={updateData.selectedTime}
                      onChange={(e) => setUpdateData({...updateData, selectedTime: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select time slot</option>
                      {generateTimeSlotOptions(selectedBooking).map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Changes</label>
                    <textarea
                      value={updateData.reason}
                      onChange={(e) => setUpdateData({...updateData, reason: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explain why you're making these changes..."
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateType === 'status' ? updateBookingStatus : updateBookingDetails}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              {/* Detail Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedBooking.serviceName}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                    <span className="text-gray-500">{selectedBooking.categoryName}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBooking.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBooking.userEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-medium text-xs">{selectedBooking.userId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-green-600" />
                      Booking Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{selectedBooking.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedBooking.categoryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium text-green-600">EGP {selectedBooking.servicePrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled Date:</span>
                        <span className="font-medium">{formatDate(selectedBooking.selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled Time:</span>
                        <span className="font-medium">
                          {selectedBooking.selectedTime ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                              {selectedBooking.selectedTime}
                            </span>
                          ) : (
                            'Not specified'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-600" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDateTime(selectedBooking.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDateTime(selectedBooking.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Message:</span>
                        <span className="font-medium">{formatDateTime(selectedBooking.lastMessageAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Communication Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2 text-indigo-600" />
                      Communication
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Messages:</span>
                        <span className="font-medium">{selectedBooking.messages?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Message:</span>
                        <span className="font-medium text-sm">{getLastMessagePreview(selectedBooking)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedBooking.notes && (
                  <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBookingDetail(false);
                      openChat(selectedBooking);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open Chat
                  </button>
                  <button
                    onClick={() => {
                      setShowBookingDetail(false);
                      openUpdateModal(selectedBooking, 'status');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Status
                  </button>
                  <button
                    onClick={() => {
                      setShowBookingDetail(false);
                      openUpdateModal(selectedBooking, 'details');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingsManagement;
