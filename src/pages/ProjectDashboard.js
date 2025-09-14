import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  MapPin,
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  School,
  Trophy,
  Target,
  ShoppingBag,
  Package,
  Key,
  BarChart3,
  Clock,
  Truck,
  Newspaper,
  Star,
  DollarSign,
  ShoppingCart,
  X,
  MessageCircle,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import CourtsManagement from '../components/CourtsManagement';
import AcademiesManagement from '../components/AcademiesManagement';
import StoreManagement from '../components/StoreManagement';
import NotificationManagement from '../components/NotificationManagement';
import NewsManagementSystem from '../components/NewsManagementSystem';
import ComplaintsManagement from '../components/ComplaintsManagement';
import AdminSetup from '../components/AdminSetup';
import { useBookingStore } from '../stores/bookingStore';
import { useStoreManagementStore } from '../stores/storeManagementStore';
import { useNotificationStore } from '../stores/notificationStore';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Booking store integration
  const {
    bookings: projectBookings,
    fetchBookings,
    loading: bookingsLoading,
    error: bookingsError,
    confirmBooking,
    cancelBooking,
    completeBooking
  } = useBookingStore();

  // Store management store integration
  const {
    orders: projectOrders,
    fetchOrders,
    updateOrderStatus,
    loading: ordersLoading,
    error: storeError
  } = useStoreManagementStore();

  // Alias for orders error to maintain compatibility
  const ordersError = storeError;

  // Notification store integration
  const {
    fetchNotifications,
    getNotificationStats
  } = useNotificationStore();

  // Booking search and filters
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [bookingServiceFilter, setBookingServiceFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [academyFilter, setAcademyFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Order search and filters
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderStoreFilter, setOrderStoreFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [orderDateRange, setOrderDateRange] = useState({ start: '', end: '' });

  // Modal state
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedStoreForModal, setSelectedStoreForModal] = useState(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeOrders, setStoreOrders] = useState([]);
  const [storeReviews, setStoreReviews] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingStoreData, setLoadingStoreData] = useState(false);
  
  // Store modal order filtering
  const [storeOrderSearchTerm, setStoreOrderSearchTerm] = useState('');
  const [storeOrderStatusFilter, setStoreOrderStatusFilter] = useState('all');
  const [storeOrderPaymentFilter, setStoreOrderPaymentFilter] = useState('all');
  const [storeOrderDateFilter, setStoreOrderDateFilter] = useState('all');
  const [storeOrderDateRange, setStoreOrderDateRange] = useState({ start: '', end: '' });
  


  // Service tabs configuration
  const serviceTabs = [
    { id: 'dashboard', name: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'users', name: 'Users', icon: Users, color: 'indigo' },
    { id: 'academies', name: 'Academies', icon: School, color: 'green' },
    { id: 'courts', name: 'Courts', icon: MapPin, color: 'orange' },
    { id: 'bookings', name: 'Bookings', icon: Calendar, color: 'pink' },
    { id: 'events', name: 'Notifications', icon: Target, color: 'red' },
    { id: 'news', name: 'News', icon: Newspaper, color: 'emerald' },
    { id: 'complaints', name: 'Complaints', icon: MessageCircle, color: 'purple' },
    { id: 'store', name: 'Store', icon: ShoppingBag, color: 'teal' },
    { id: 'orders', name: 'Orders', icon: Package, color: 'cyan' },
    { id: 'gatepass', name: 'Gate Pass', icon: Key, color: 'amber' }
  ];

  useEffect(() => {
    if (projectId) {
      const loadData = async () => {
        try {
          const projectDoc = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
          if (!projectDoc.empty) {
            const projectData = { id: projectId, ...projectDoc.docs[0].data() };
            setProject(projectData);
          }

          // Fetch users who belong to this project
          setLoading(true);
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter users who belong to this specific project
          const projectUsersData = usersData.filter(user => {
            if (user.projects && Array.isArray(user.projects)) {
              return user.projects.some(project => project.projectId === projectId);
            }
            return false;
          });

          setProjectUsers(projectUsersData);
          setFilteredUsers(projectUsersData);
        } catch (err) {
          console.error('Error loading project data:', err);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [projectId]);



  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      let filtered = [...projectUsers];

      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.registrationStatus === statusFilter);
      }

      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(projectUsers);
    }
  }, [searchTerm, statusFilter, projectUsers]);

  // Fetch project bookings when bookings tab is active
  useEffect(() => {
    if (activeTab === 'bookings' && projectId) {
      console.log('Fetching bookings for project:', projectId);
      // Reset filters when fetching new data
      setCourtFilter('all');
      setAcademyFilter('all');
      setBookingServiceFilter('all');
      setBookingStatusFilter('all');
      setBookingSearchTerm('');
      fetchBookings(projectId);
    }
  }, [activeTab, projectId, fetchBookings]);

  // Fetch project orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && projectId) {
      console.log('Fetching orders for project:', projectId);
      // Reset filters when fetching new data
      setOrderStatusFilter('all');
      setOrderStoreFilter('all');
      setOrderPaymentFilter('all');
      setOrderDateFilter('all');
      setOrderDateRange({ start: '', end: '' });
      setOrderSearchTerm('');
      fetchOrders(projectId);
    }
  }, [activeTab, projectId, fetchOrders]);

  // Fetch project notifications when events tab is active
  useEffect(() => {
    if (activeTab === 'events' && projectId) {
      console.log('Fetching notifications for project:', projectId);
      fetchNotifications(projectId);
    }
  }, [activeTab, projectId, fetchNotifications]);

  // Get unique store names from orders
  const getUniqueStoreNames = useCallback(() => {
    if (!projectOrders) return [];
    
    // Get unique store names, filtering out undefined/null values
    const storeNames = projectOrders
      .map(order => order.storeName)
      .filter(storeName => storeName && storeName !== 'Unknown Store');
    
    return [...new Set(storeNames)];
  }, [projectOrders]);


  useEffect(() => {
    if (projectOrders && projectOrders.length > 0) {
      console.log('Orders loaded:', projectOrders);
      console.log('Sample order structure:', projectOrders[0]);
      console.log('Store names found:', getUniqueStoreNames());
    }
  }, [projectOrders, getUniqueStoreNames]);

  // Filter bookings based on search and filters
  const getFilteredBookings = () => {
    if (!projectBookings || projectBookings.length === 0) return [];

    let filtered = [...projectBookings];

    if (bookingSearchTerm) {
      filtered = filtered.filter(booking =>
        (booking.userName && booking.userName.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
        (booking.userEmail && booking.userEmail.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
        (booking.date && booking.date.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
        (booking.courtName && booking.courtName.toLowerCase().includes(bookingSearchTerm.toLowerCase())) ||
        (booking.academyName && booking.academyName.toLowerCase().includes(bookingSearchTerm.toLowerCase()))
      );
    }

    if (bookingServiceFilter !== 'all') {
      filtered = filtered.filter(booking => {
        if (bookingServiceFilter === 'court') {
          // Check if it's a court booking
          return booking.type === 'court' || booking.courtId || booking.courtName;
        } else if (bookingServiceFilter === 'academy') {
          // Check if it's an academy booking
          return booking.type === 'academy' || booking.academyId || booking.academyName;
        }
        return true;
      });
    }

    if (courtFilter !== 'all') {
      filtered = filtered.filter(booking => {
        // Only filter court bookings
        const isCourt = booking.type === 'court' || booking.courtId || booking.courtName;
        return isCourt && booking.courtName === courtFilter;
      });
    }

    if (academyFilter !== 'all') {
      filtered = filtered.filter(booking => {
        // Only filter academy bookings
        const isAcademy = booking.type === 'academy' || booking.academyId || booking.academyName;
        return isAcademy && (booking.academyName === academyFilter || booking.academyId === academyFilter);
      });
    }

    if (bookingStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === bookingStatusFilter);
    }

    return filtered;
  };

  // Separate upcoming and past bookings
  const getUpcomingBookings = () => {
    const filtered = getFilteredBookings();
    const now = new Date();

    return filtered.filter(booking => {
      // Skip completed or cancelled bookings
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return false;
      }

      // If booking has a date, check if it's in the future
      if (booking.date) {
        try {
          const bookingDate = new Date(booking.date);
          return bookingDate >= now;
        } catch (error) {
          // If date parsing fails, consider it upcoming
          return true;
        }
      }

      // If no date but status is pending or confirmed, consider it upcoming
      return booking.status === 'pending' || booking.status === 'confirmed';
    });
  };

  const getPastBookings = () => {
    const filtered = getFilteredBookings();
    const now = new Date();

    return filtered.filter(booking => {
      // Include completed or cancelled bookings
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return true;
      }

      // If booking has a date, check if it's in the past
      if (booking.date) {
        try {
          const bookingDate = new Date(booking.date);
          return bookingDate < now;
        } catch (error) {
          // If date parsing fails, don't include in past
          return false;
        }
      }

      // If no date, don't include in past
      return false;
    });
  };

  // Admin status change function
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      // Update the booking status in the store
      if (newStatus === 'confirmed') {
        await confirmBooking(projectId, bookingId);
      } else if (newStatus === 'cancelled') {
        await cancelBooking(projectId, bookingId);
      } else if (newStatus === 'completed') {
        await completeBooking(projectId, bookingId);
      }

      // Refresh bookings to get updated data
      await fetchBookings(projectId);
    } catch (error) {
      console.error('Error changing booking status:', error);
      // You could add a toast notification here
    }
  };

  // Order management functions
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(projectId, orderId, newStatus);
      // Refresh orders to get updated data
      await fetchOrders(projectId);
    } catch (error) {
      console.error('Error changing order status:', error);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrderForModal(order);
    setIsOrderModalOpen(true);
  };

  // Store modal order filtering functions
  const getFilteredStoreOrders = () => {
    if (!storeOrders || storeOrders.length === 0) return [];

    let filtered = [...storeOrders];

    if (storeOrderSearchTerm) {
      filtered = filtered.filter(order =>
        (order.orderNumber && order.orderNumber.toLowerCase().includes(storeOrderSearchTerm.toLowerCase())) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(storeOrderSearchTerm.toLowerCase())) ||
        (order.userName && order.userName.toLowerCase().includes(storeOrderSearchTerm.toLowerCase()))
      );
    }

    if (storeOrderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === storeOrderStatusFilter);
    }

    if (storeOrderPaymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === storeOrderPaymentFilter);
    }

    // Date filtering
    if (storeOrderDateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
      });
    } else if (storeOrderDateFilter === 'week') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= weekAgo;
      });
    } else if (storeOrderDateFilter === 'month') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= monthAgo;
      });
    } else if (storeOrderDateFilter === 'custom' && storeOrderDateRange.start && storeOrderDateRange.end) {
      const startDate = new Date(storeOrderDateRange.start);
      const endDate = new Date(storeOrderDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    return filtered;
  };

  const getStoreOrderStats = () => {
    if (!storeOrders) return { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
    
    const total = storeOrders.length;
    const pending = storeOrders.filter(order => order.status === 'pending').length;
    const processing = storeOrders.filter(order => order.status === 'processing').length;
    const delivered = storeOrders.filter(order => order.status === 'delivered').length;
    const cancelled = storeOrders.filter(order => order.status === 'cancelled').length;

    return { total, pending, processing, delivered, cancelled };
  };

  // Store modal functions
  const handleViewStore = async (store) => {
    console.log('Opening store modal for:', store);
    console.log('Store data:', store);
    console.log('Store keys:', Object.keys(store));
    console.log('Store status value:', store.status);
    console.log('Store status type:', typeof store.status);
    setSelectedStoreForModal(store);
    setIsStoreModalOpen(true);
    setLoadingStoreData(true);
    
    // Reset filters when opening modal
    setStoreOrderSearchTerm('');
    setStoreOrderStatusFilter('all');
    setStoreOrderPaymentFilter('all');
    setStoreOrderDateFilter('all');
    setStoreOrderDateRange({ start: '', end: '' });
    
    try {
      // Fetch store orders using the same approach as the main orders section
      console.log(`Fetching orders for store: ${store.id}`);
      
      // Get all orders and filter by storeId in items (same as main fetchOrders)
      const querySnapshot = await getDocs(
        query(
          collection(db, `projects/${projectId}/orders`),
          orderBy('createdAt', 'desc')
        )
      );
      
      const allOrders = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      console.log(`Total orders in project: ${allOrders.length}`);
      console.log('Sample order structure:', allOrders[0]);
      
      // Filter orders that have items from this store
      const ordersData = allOrders.filter(order => {
        const hasStoreItem = order.items && order.items.some(item => item.storeId === store.id);
        if (hasStoreItem) {
          console.log('Found order with store item:', order);
        }
        return hasStoreItem;
      });
      
      console.log(`Found ${ordersData.length} orders for store ${store.id}`);
      
      // Enrich orders with user information (same as main fetchOrders)
      const ordersWithUserInfo = await Promise.all(
        ordersData.map(async (order) => {
          let orderWithInfo = { ...order };
          
          // Fetch user information (same as main orders section)
          if (order.userId) {
            try {
              const userDoc = await getDocs(
                query(
                  collection(db, `projects/${projectId}/users`),
                  where('__name__', '==', order.userId)
                )
              );
              
              if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                console.log(`Found user data for ${order.userId}:`, userData);
                orderWithInfo = {
                  ...orderWithInfo,
                  customerName: userData.firstName && userData.lastName ? 
                    `${userData.firstName} ${userData.lastName}` : 
                    userData.fullName || userData.displayName || 'Unknown User',
                  customerEmail: userData.email || 'No email',
                  customerPhone: userData.phone || userData.phoneNumber || 'No phone'
                };
              } else {
                console.log(`No user found for ID: ${order.userId}`);
                orderWithInfo = {
                  ...orderWithInfo,
                  customerName: 'Unknown User',
                  customerEmail: 'No email',
                  customerPhone: 'No phone'
                };
              }
            } catch (userError) {
              console.error(`Error fetching user info for order ${order.id}:`, userError);
              orderWithInfo = {
                ...orderWithInfo,
                customerName: 'Unknown User',
                customerEmail: 'No email',
                customerPhone: 'No phone'
              };
            }
          }
          
          return orderWithInfo;
        })
      );
      
      setStoreOrders(ordersWithUserInfo);

      // Fetch store reviews with user information
      const reviewsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/ratings`), where('storeId', '==', store.id))
      );
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${reviewsData.length} reviews for store ${store.id}`);
      console.log('Sample review data:', reviewsData[0]);
      
      // Fetch user information for each review
      const reviewsWithUserInfo = await Promise.all(
        reviewsData.map(async (review) => {
          try {
            // Try to get user info from the main users collection
            const userSnapshot = await getDocs(
              query(collection(db, 'users'), where('authUid', '==', review.userId))
            );
            
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              const userName = userData.fullName || 
                              `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
                              userData.email?.split('@')[0] || 
                              'Unknown User';
              
              return {
                ...review,
                userName: userName,
                userEmail: review.userEmail || userData.email || 'No email',
                userId: review.userId
              };
            } else {
              // Fallback to review data - try to extract name from email
              const emailName = review.userEmail ? review.userEmail.split('@')[0] : 'Unknown User';
              return {
                ...review,
                userName: emailName,
                userEmail: review.userEmail || 'No email',
                userId: review.userId
              };
            }
          } catch (error) {
            console.error('Error fetching user info for review:', error);
            const emailName = review.userEmail ? review.userEmail.split('@')[0] : 'Unknown User';
            return {
              ...review,
              userName: emailName,
              userEmail: review.userEmail || 'No email',
              userId: review.userId
            };
          }
        })
      );
      
      console.log('Reviews with user info:', reviewsWithUserInfo);
      setStoreReviews(reviewsWithUserInfo);

      // Fetch store products
      const productsSnapshot = await getDocs(
        collection(db, `projects/${projectId}/stores/${store.id}/products`)
      );
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStoreProducts(productsData);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoadingStoreData(false);
    }
  };

  // Filter orders based on search and filters
  const getFilteredOrders = () => {
    if (!projectOrders || projectOrders.length === 0) return [];

    let filtered = [...projectOrders];

    if (orderSearchTerm) {
      filtered = filtered.filter(order =>
        (order.orderNumber && order.orderNumber.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
        (order.storeName && order.storeName.toLowerCase().includes(orderSearchTerm.toLowerCase()))
      );
    }

    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderStatusFilter);
    }

    if (orderStoreFilter !== 'all') {
      filtered = filtered.filter(order => order.storeName === orderStoreFilter);
    }

    if (orderPaymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === orderPaymentFilter);
    }

    // Date filtering
    if (orderDateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
      });
    } else if (orderDateFilter === 'week') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= weekAgo;
      });
    } else if (orderDateFilter === 'month') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= monthAgo;
      });
    } else if (orderDateFilter === 'custom' && orderDateRange.start && orderDateRange.end) {
      const startDate = new Date(orderDateRange.start);
      const endDate = new Date(orderDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    return filtered;
  };

  const getOrderStats = () => {
    if (!projectOrders) return { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
    
    const total = projectOrders.length;
    const pending = projectOrders.filter(order => order.status === 'pending').length;
    const processing = projectOrders.filter(order => order.status === 'processing').length;
    const delivered = projectOrders.filter(order => order.status === 'delivered').length;
    const cancelled = projectOrders.filter(order => order.status === 'cancelled').length;

    return { total, pending, processing, delivered, cancelled };
  };


  const getProjectStats = () => {
    const totalUsers = projectUsers.length;
    const activeUsers = projectUsers.filter(user => user.registrationStatus === 'completed').length;
    const pendingUsers = projectUsers.filter(user => user.registrationStatus === 'pending').length;
    const notificationStats = getNotificationStats();
    const totalNotifications = notificationStats.total;
    const activeNotifications = notificationStats.active;

    return { totalUsers, activeUsers, pendingUsers, totalNotifications, activeNotifications };
  };

  const handleBackToProjects = () => {
    window.location.href = '/projects';
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Stay within the ProjectDashboard - no external navigation
  };

  const handleUserAction = (action, user) => {
    switch (action) {
      case 'view':
        // TODO: Implement user view modal
        break;
      case 'edit':
        // TODO: Implement user edit modal
        break;
      case 'delete':
        // TODO: Implement user delete confirmation
        break;
      default:
        break;
    }
  };

  const getTabColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
      amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    };
    return colorMap[color] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  };

  // Booking action handlers
  const handleViewBooking = (booking) => {
    setSelectedBookingForModal(booking);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await confirmBooking(projectId, bookingId);
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelBooking(projectId, bookingId);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await completeBooking(projectId, bookingId);
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Show admin setup if there are permission errors
  if (storeError && (storeError.includes('permission') || storeError.includes('unauthorized'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AdminSetup />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <button
            onClick={handleBackToProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToProjects}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{project.location}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{project.type}</span>
                </div>
              </div>
            </div>
            {/* <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="h-4 w-4 mr-2 inline" />
                Settings
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                Quick Add
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Fixed Service Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40 pt-4 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-7 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {serviceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorClasses = getTabColorClasses(tab.color);

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 whitespace-nowrap ${isActive
                    ? `${colorClasses} border-current shadow-sm`
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Users className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Notifications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeNotifications}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {serviceTabs.slice(1, 5).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className={`p-3 rounded-xl mb-3 ${getTabColorClasses(tab.color)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {serviceTabs.slice(5, 10).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <div className={`p-2 rounded-lg mb-2 ${getTabColorClasses(tab.color)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Project dashboard loaded successfully</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>{stats.totalUsers} users found in project</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span>{stats.activeNotifications} active notifications</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span>Ready to manage project services</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Users</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage users and their project access
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                Add User
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
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
                    {filteredUsers.map((user) => {
                      const userProject = user.projects?.find(p => p.projectId === projectId);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userProject?.unit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="capitalize">{userProject?.role || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${user.registrationStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : user.registrationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {user.registrationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUserAction('view', user)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('edit', user)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction('delete', user)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">No users match your search criteria in this project.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'academies' && (
          <AcademiesManagement projectId={projectId} />
        )}

        {activeTab === 'sports' && (
          <div className="space-y-6">
            {/* Sports Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Sports</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage sports and activities available for booking
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                Add Sport
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sports by name, description, or category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Categories</option>
                  <option value="team">Team Sports</option>
                  <option value="individual">Individual Sports</option>
                  <option value="water">Water Sports</option>
                  <option value="indoor">Indoor Sports</option>
                  <option value="outdoor">Outdoor Sports</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Sports Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Players
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
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
                    {/* Sample Sports Data */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Football</div>
                            <div className="text-sm text-gray-500">Soccer</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Team Sport
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>11 players</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Ball, Goals, Field
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Tennis</div>
                            <div className="text-sm text-gray-500">Individual</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Individual
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>1-4 players</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rackets, Balls, Court
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sports found</h3>
                <p className="text-gray-600">Get started by adding your first sport.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courts' && (
          <CourtsManagement projectId={projectId} />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">

            {/* Bookings Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Bookings</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage court and academy bookings
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchBookings(projectId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  New Booking
                </button>
              </div>
            </div>

            {/* Bookings Summary */}
            {!bookingsLoading && !bookingsError && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{projectBookings?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-gray-900">{getUpcomingBookings().length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Past</p>
                      <p className="text-2xl font-bold text-gray-900">{getPastBookings().length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <School className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Academy</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {projectBookings?.filter(b => b.type === 'academy' || b.academyId || b.academyName).length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings by user, service, or date..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Service Type Filter */}
                <select
                  value={bookingServiceFilter}
                  onChange={(e) => setBookingServiceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  <option value="court">Court Booking</option>
                  <option value="academy">Academy Program</option>
                </select>

                {/* Status Filter */}
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Additional Filters Row */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Court Filter */}
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Courts</option>
                  {projectBookings && [...new Set(
                    projectBookings
                      .filter(b => {
                        // Check if it's a court booking
                        const isCourt = b.type === 'court' || b.courtId || b.courtName;
                        return isCourt && b.courtName;
                      })
                      .map(b => b.courtName)
                      .filter(Boolean) // Remove any undefined/null values
                  )].map(courtName => (
                    <option key={courtName} value={courtName}>{courtName}</option>
                  ))}
                </select>

                {/* Academy Filter */}
                <select
                  value={academyFilter || 'all'}
                  onChange={(e) => setAcademyFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Academies</option>
                  {projectBookings && [...new Set(
                    projectBookings
                      .filter(b => {
                        // Check if it's an academy booking
                        const isAcademy = b.type === 'academy' || b.academyId || b.academyName;
                        return isAcademy && (b.academyName || b.academyId);
                      })
                      .map(b => b.academyName || b.academyId)
                      .filter(Boolean) // Remove any undefined/null values
                  )].map(academyName => (
                    <option key={academyName} value={academyName}>{academyName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {bookingsLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading bookings...</p>
                </div>
              </div>
            )}

            {/* Upcoming Bookings Section */}
            {!bookingsLoading && !bookingsError && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {getUpcomingBookings().length}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Court</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Academy</span>
                    </div>
                  </div>
                </div>

                {getUpcomingBookings().length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getUpcomingBookings().map((booking) => (
                            <tr key={booking.id} className={`hover:transition-colors ${
                              booking.type === 'academy' 
                                ? 'hover:bg-green-50 bg-green-25 border-l-4 border-l-green-500' 
                                : 'hover:bg-blue-50 border-l-4 border-l-blue-500'
                            }`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-3 min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                      {booking.userName || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {booking.userEmail || 'No email'}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                      {booking.userPhone || 'No phone'}
                                    </div>

                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    booking.type === 'academy' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}></div>
                                  <span>
                                    {booking.type === 'court'
                                      ? `${booking.courtName || 'Unknown Court'} - ${booking.sport || 'Unknown Sport'}`
                                      : booking.type === 'academy'
                                        ? `${booking.academyName || 'Unknown Academy'} - ${booking.programName || 'Unknown Program'}`
                                        : 'Unknown Service'
                                    }
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.courtLocation || 'No location'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className='flex flex-col'>{booking.date || 'No date'}</span> <br />
                                  {booking.timeSlots && booking.timeSlots.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-500 flex flex-col">
                                      ({booking.timeSlots.join(', ')})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-medium text-green-600">
                                  ${booking.totalPrice || booking.totalCost || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {booking.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewBooking(booking)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  {/* Status Change Dropdown */}
                                  <select
                                    value={booking.status || 'pending'}
                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                      <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                      <p className="text-gray-600">All upcoming bookings have been completed or cancelled.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Past Bookings Section */}
            {!bookingsLoading && !bookingsError && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-gray-400 rounded-full"></div>
                  <h3 className="text-xl font-semibold text-gray-900">Past Bookings</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {getPastBookings().length}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Court</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Academy</span>
                    </div>
                  </div>
                </div>

                {getPastBookings().length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
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
                          {getPastBookings().map((booking) => (
                            <tr key={booking.id} className={`hover:transition-colors ${
                              booking.type === 'academy' 
                                ? 'hover:bg-green-50 bg-green-25 border-l-4 border-l-green-500' 
                                : 'hover:bg-gray-50 border-l-4 border-l-blue-500'
                            }`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Users className="h-5 w-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-3 min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                      {booking.userName || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {booking.userEmail || 'No email'}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                      {booking.userPhone || 'No phone'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    booking.type === 'academy' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}></div>
                                  <span>
                                    {booking.type === 'court'
                                      ? `${booking.courtName || 'Unknown Court'} - ${booking.sport || 'Unknown Sport'}`
                                      : booking.type === 'academy'
                                        ? `${booking.academyName || 'Unknown Academy'} - ${booking.programName || 'Unknown Program'}`
                                        : 'Unknown Service'
                                    }
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.courtLocation || 'No location'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.date || 'No date'}</span>
                                  {booking.timeSlots && booking.timeSlots.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({booking.timeSlots.join(', ')})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-medium text-green-600">
                                  ${booking.totalPrice || booking.totalCost || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {booking.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewBooking(booking)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  {/* Status Change Dropdown */}
                                  <select
                                    value={booking.status || 'pending'}
                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No past bookings</h3>
                      <p className="text-gray-600">No completed or cancelled bookings found.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State for All Bookings */}
            {!bookingsLoading && !bookingsError && getFilteredBookings().length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600">
                    {projectBookings && projectBookings.length > 0
                      ? 'No bookings match your search criteria.'
                      : 'Get started by creating your first booking.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <NotificationManagement projectId={projectId} />
        )}

        {activeTab === 'news' && (
          <NewsManagementSystem projectId={projectId} />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsManagement projectId={projectId} />
        )}

        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* Store Management Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Store Management</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage stores, products, and orders
                </p>
              </div>
            </div>

            {/* Store Management Component */}
            <StoreManagement projectId={projectId} onViewStore={handleViewStore} />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Orders Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Orders</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage incoming orders and track shipments
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchOrders(projectId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Orders Summary */}
            {!ordersLoading && !ordersError && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{getOrderStats().total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{getOrderStats().pending}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Truck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Processing</p>
                      <p className="text-2xl font-bold text-gray-900">{getOrderStats().processing}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-2xl font-bold text-gray-900">{getOrderStats().delivered}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Package className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Cancelled</p>
                      <p className="text-2xl font-bold text-gray-900">{getOrderStats().cancelled}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* Search Input */}
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders by order number, customer, or store..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Store Filter */}
                <select
                  value={orderStoreFilter}
                  onChange={(e) => setOrderStoreFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Stores</option>
                  {getUniqueStoreNames().length > 0 ? (
                    getUniqueStoreNames().map(storeName => (
                      <option key={storeName} value={storeName}>{storeName}</option>
                    ))
                  ) : (
                    <option value="no-stores" disabled>No stores available</option>
                  )}
                </select>

                {/* Status Filter */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Payment Method Filter */}
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              {/* Additional Filters Row */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Filter */}
                <select
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>

                {/* Custom Date Range - Only show when custom is selected */}
                {orderDateFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={orderDateRange.start}
                      onChange={(e) => setOrderDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={orderDateRange.end}
                      onChange={(e) => setOrderDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End Date"
                    />
                  </>
                )}

                {/* Clear Filters Button */}
                {(orderSearchTerm || orderStatusFilter !== 'all' || orderStoreFilter !== 'all' || 
                  orderPaymentFilter !== 'all' || orderDateFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setOrderSearchTerm('');
                      setOrderStatusFilter('all');
                      setOrderStoreFilter('all');
                      setOrderPaymentFilter('all');
                      setOrderDateFilter('all');
                      setOrderDateRange({ start: '', end: '' });
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {ordersLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              </div>
            )}

            {/* Orders Table */}
            {!ordersLoading && !ordersError && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
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
                      {getFilteredOrders().map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.orderNumber || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.items?.length || 0} items
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.userName || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.userPhone || 'No phone'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.userEmail || 'No email'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.storeName || `Store ID: ${order.storeId || 'N/A'}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.location || 'No location'}
                            </div>
                            {order.storeId && !order.storeName && (
                              <div className="text-xs text-orange-600 mt-1">
                                Store info loading...
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>
                                {order.createdAt ? 
                                  (order.createdAt.toDate ? 
                                    order.createdAt.toDate().toLocaleDateString() : 
                                    new Date(order.createdAt).toLocaleDateString()
                                  ) : 'No date'
                                }
                              </span>
                            </div>
                            {order.estimatedDelivery && (
                              <div className="text-xs text-gray-500 mt-1">
                                Est: {order.estimatedDelivery}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="space-y-1">
                              <div className="text-green-600 font-medium">
                                ${(order.total || 0).toFixed(2)}
                              </div>
                              {order.deliveryFee && (
                                <div className="text-xs text-gray-500">
                                  +${(order.deliveryFee || 0).toFixed(2)} delivery
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'shipped'
                                    ? 'bg-purple-100 text-purple-800'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Status Change Dropdown */}
                              <select
                                value={order.status || 'pending'}
                                onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {getFilteredOrders().length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-600">
                      {projectOrders && projectOrders.length > 0
                        ? 'No orders match your search criteria.'
                        : 'No orders have been placed yet.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {ordersError && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center text-red-600">
                  <p className="font-medium">Error loading orders:</p>
                  <p className="text-sm">{ordersError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gatepass' && (
          <div className="space-y-6">
            {/* Gate Pass Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Gate Pass</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage visitor access and entry permissions
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                New Gate Pass
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search gate passes by visitor name, ID, or date..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Types</option>
                  <option value="visitor">Visitor</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>

            {/* Gate Pass Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gate Pass ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
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
                    {/* Sample Gate Pass Data */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        GP001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Visitor
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Mr. Smith</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>2023-06-15</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gate passes found</h3>
                <p className="text-gray-600">Get started by issuing your first gate pass.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {bookingsError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading bookings:</p>
              <p className="text-sm">{bookingsError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {isBookingModalOpen && selectedBookingForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedBookingForModal.type === 'court' ? 'Court Booking' : 'Academy Program'}
                </p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.userName || 'Unknown User'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.userEmail || 'No email'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.userPhone || 'No phone'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.userUnit || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academy-specific Information Section */}
              {selectedBookingForModal.type === 'academy' && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <School className="h-5 w-5 mr-2 text-blue-600" />
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Name</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedBookingForModal.studentName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Age</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedBookingForModal.studentAge || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent/Guardian</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedBookingForModal.parentName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedBookingForModal.category || 'N/A'}
                      </p>
                    </div>
                    {selectedBookingForModal.notes && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedBookingForModal.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Booking Details Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  {selectedBookingForModal.type === 'court' ? 'Court Details' : 'Program Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBookingForModal.type === 'court' ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Court Name</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.courtName || 'Unknown Court'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sport</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.sport || 'Unknown Sport'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.courtLocation || 'No location'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Court Type</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.courtType || 'N/A'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academy</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.academyName || 'Unknown Academy'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.programName || 'Unknown Program'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age Group</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.ageGroup || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pricing Type</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedBookingForModal.pricingType || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.date || 'No date'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time Slots</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.timeSlots && selectedBookingForModal.timeSlots.length > 0
                        ? selectedBookingForModal.timeSlots.join(', ')
                        : 'No time slots'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.duration || '1 hour'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Price</label>
                    <p className="text-sm text-green-600 font-bold mt-1">
                      ${selectedBookingForModal.totalPrice || selectedBookingForModal.totalCost || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Actions Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status & Actions
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Status</label>
                    <div className="mt-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${selectedBookingForModal.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : selectedBookingForModal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedBookingForModal.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : selectedBookingForModal.status === 'completed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                        {selectedBookingForModal.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {selectedBookingForModal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleConfirmBooking(selectedBookingForModal.id);
                            setIsBookingModalOpen(false);
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            handleCancelBooking(selectedBookingForModal.id);
                            setIsBookingModalOpen(false);
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </>
                    )}
                    {selectedBookingForModal.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          handleCompleteBooking(selectedBookingForModal.id);
                          setIsBookingModalOpen(false);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booking ID</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">
                      {selectedBookingForModal.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedBookingForModal.createdAt ? new Date(selectedBookingForModal.createdAt.toDate()).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  {selectedBookingForModal.notes && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedBookingForModal.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrderForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Order #{selectedOrderForModal.orderNumber || selectedOrderForModal.id}
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Order Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Status</label>
                    <p className="text-sm text-blue-900 font-medium mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedOrderForModal.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrderForModal.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedOrderForModal.status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : selectedOrderForModal.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrderForModal.status || 'pending'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Amount</label>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      ${(selectedOrderForModal.total || 0).toFixed(2)}
                    </p>
                    {selectedOrderForModal.deliveryFee && (
                      <p className="text-sm text-blue-600">
                        +${(selectedOrderForModal.deliveryFee || 0).toFixed(2)} delivery fee
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Items</label>
                    <p className="text-sm text-blue-900 font-medium mt-1">
                      {selectedOrderForModal.items?.length || 0} items
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedOrderForModal.userName || 'Unknown User'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedOrderForModal.userEmail || 'No email'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedOrderForModal.userPhone || 'No phone'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">
                      {selectedOrderForModal.userId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Information */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Store Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Store Name</label>
                    <p className="text-sm text-green-900 font-medium mt-1">
                      {selectedOrderForModal.storeName || 'Unknown Store'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Location</label>
                    <p className="text-sm text-green-900 font-medium mt-1">
                      {selectedOrderForModal.location || 'No location'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Delivery Fee</label>
                    <p className="text-sm text-green-900 font-medium mt-1">
                      ${selectedOrderForModal.deliveryFee || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrderForModal.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName || 'Unknown Product'}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${(item.price || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total: ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Details - Only show if order is cancelled */}
              {selectedOrderForModal.status === 'cancelled' && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  Cancellation Details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancellation Reason</label>
                        <p className="text-sm text-red-900 font-medium mt-1">
                          {selectedOrderForModal.cancellationReason || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancelled By</label>
                        <p className="text-sm text-red-900 font-medium mt-1">
                          {selectedOrderForModal.cancelledBy === 'customer' ? 'Customer' : 
                           selectedOrderForModal.cancelledBy === 'admin' ? 'Admin' : 
                           selectedOrderForModal.cancelledBy || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {selectedOrderForModal.customCancellationReason && (
                      <div>
                        <label className="text-xs font-medium text-red-700 uppercase tracking-wide">Custom Reason</label>
                        <p className="text-sm text-red-900 mt-1 p-2 bg-red-100 rounded-lg">
                          {selectedOrderForModal.customCancellationReason}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancelled At</label>
                      <p className="text-sm text-red-900 font-medium mt-1">
                        {selectedOrderForModal.cancelledAt ? 
                          (selectedOrderForModal.cancelledAt.toDate ? 
                            selectedOrderForModal.cancelledAt.toDate().toLocaleString() : 
                            new Date(selectedOrderForModal.cancelledAt).toLocaleString()
                          ) : 'Unknown date'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Order Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Order Placed</p>
                      <p className="text-xs text-purple-600">
                        {selectedOrderForModal.createdAt ? 
                          (selectedOrderForModal.createdAt.toDate ? 
                            selectedOrderForModal.createdAt.toDate().toLocaleString() : 
                            new Date(selectedOrderForModal.createdAt).toLocaleString()
                          ) : 'Unknown date'
                        }
                      </p>
                    </div>
                  </div>
                  {selectedOrderForModal.estimatedDelivery && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">Estimated Delivery</p>
                        <p className="text-xs text-purple-600">{selectedOrderForModal.estimatedDelivery}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrderForModal.status === 'cancelled' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">Order Cancelled</p>
                        <p className="text-xs text-purple-600">
                          {selectedOrderForModal.cancelledAt ? 
                            (selectedOrderForModal.cancelledAt.toDate ? 
                              selectedOrderForModal.cancelledAt.toDate().toLocaleString() : 
                              new Date(selectedOrderForModal.cancelledAt).toLocaleString()
                            ) : 'Unknown date'
                          }
                        </p>
                        {selectedOrderForModal.cancellationReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {selectedOrderForModal.cancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Details Modal */}
      {isStoreModalOpen && selectedStoreForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStoreForModal.name}</h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedStoreForModal.location || 'No location'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Delivery: ${selectedStoreForModal.deliveryFee || 0}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (selectedStoreForModal.status === 'active' || 
                         selectedStoreForModal.status === 'Active' || 
                         selectedStoreForModal.status === 'ACTIVE' ||
                         selectedStoreForModal.status === true) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStoreForModal.status || selectedStoreForModal.isActive || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsStoreModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingStoreData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading store data...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Store Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-200 rounded-lg">
                          <Package className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-700">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-900">{storeOrders.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-200 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-green-700" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-700">Products</p>
                          <p className="text-2xl font-bold text-green-900">{storeProducts.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-200 rounded-lg">
                          <Star className="h-6 w-6 text-yellow-700" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-700">Average Rating</p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {storeReviews.length > 0 
                              ? (storeReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / storeReviews.length).toFixed(1)
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-200 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-purple-700" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-700">Reviews</p>
                          <p className="text-2xl font-bold text-purple-900">{storeReviews.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                      Store Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Store Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{selectedStoreForModal.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{selectedStoreForModal.location || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Delivery Fee</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">${selectedStoreForModal.deliveryFee || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                          (selectedStoreForModal.status === 'active' || 
                           selectedStoreForModal.status === 'Active' || 
                           selectedStoreForModal.status === 'ACTIVE' ||
                           selectedStoreForModal.status === true) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedStoreForModal.status || selectedStoreForModal.isActive || 'Unknown'}
                        </span>
                      </div>
                      {selectedStoreForModal.description && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">Description</label>
                          <p className="text-gray-900 mt-1">{selectedStoreForModal.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Products Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                        Products ({storeProducts.length})
                      </h3>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </button>
                    </div>
                    
                    {storeProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {storeProducts.map((product) => (
                          <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{product.description || 'No description'}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-lg font-bold text-green-600">${product.price || 0}</span>
                                  <span className="text-sm text-gray-500">Stock: {product.stock || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600">This store doesn't have any products yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Store Orders Management Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Store Orders ({storeOrders.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setStoreOrderSearchTerm('');
                            setStoreOrderStatusFilter('all');
                            setStoreOrderPaymentFilter('all');
                            setStoreOrderDateFilter('all');
                            setStoreOrderDateRange({ start: '', end: '' });
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    {/* Order Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-900">{getStoreOrderStats().total}</p>
                        <p className="text-xs text-blue-700">Total</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-900">{getStoreOrderStats().pending}</p>
                        <p className="text-xs text-yellow-700">Pending</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-purple-900">{getStoreOrderStats().processing}</p>
                        <p className="text-xs text-purple-700">Processing</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-900">{getStoreOrderStats().delivered}</p>
                        <p className="text-xs text-green-700">Delivered</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-900">{getStoreOrderStats().cancelled}</p>
                        <p className="text-xs text-red-700">Cancelled</p>
                      </div>
                    </div>

                    {/* Order Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search orders..."
                          value={storeOrderSearchTerm}
                          onChange={(e) => setStoreOrderSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <select
                        value={storeOrderStatusFilter}
                        onChange={(e) => setStoreOrderStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={storeOrderPaymentFilter}
                        onChange={(e) => setStoreOrderPaymentFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Payment</option>
                        <option value="cash">Cash on Delivery</option>
                        <option value="online">Online Payment</option>
                      </select>

                      <select
                        value={storeOrderDateFilter}
                        onChange={(e) => setStoreOrderDateFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {/* Custom Date Range */}
                    {storeOrderDateFilter === 'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input
                          type="date"
                          value={storeOrderDateRange.start}
                          onChange={(e) => setStoreOrderDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          value={storeOrderDateRange.end}
                          onChange={(e) => setStoreOrderDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="End Date"
                        />
                      </div>
                    )}

                    {/* Orders Table */}
                    {getFilteredStoreOrders().length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order Details
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
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
                            {getFilteredStoreOrders().map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Package className="h-5 w-5 text-blue-600" />
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {order.orderNumber || 'N/A'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {order.items?.length || 0} items
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {order.userName || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.userPhone || 'No phone'}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {order.userEmail || 'No email'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>
                                      {order.createdAt ? 
                                        (order.createdAt.toDate ? 
                                          order.createdAt.toDate().toLocaleDateString() : 
                                          new Date(order.createdAt).toLocaleDateString()
                                        ) : 'No date'
                                      }
                                    </span>
                                  </div>
                                  {order.estimatedDelivery && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Est: {order.estimatedDelivery}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="space-y-1">
                                    <div className="text-green-600 font-medium">
                                      ${(order.total || 0).toFixed(2)}
                                    </div>
                                    {order.deliveryFee && (
                                      <div className="text-xs text-gray-500">
                                        +${(order.deliveryFee || 0).toFixed(2)} delivery
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    order.status === 'delivered'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'processing'
                                        ? 'bg-blue-100 text-blue-800'
                                        : order.status === 'shipped'
                                          ? 'bg-purple-100 text-purple-800'
                                          : order.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.status || 'pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewOrder(order)}
                                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <select
                                      value={order.status || 'pending'}
                                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                      className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-600">
                          {storeOrders.length > 0
                            ? 'No orders match your search criteria.'
                            : 'This store hasn\'t received any orders yet.'
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reviews Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-600" />
                      Customer Reviews ({storeReviews.length})
                    </h3>
                    
                    {storeReviews.length > 0 ? (
                      <div className="space-y-4">
                        {storeReviews.map((review) => (
                          <div key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600">
                                    {(review.userName || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{review.userName || 'Anonymous'}</p>
                                  <p className="text-xs text-gray-500">{review.userEmail || 'No email'}</p>
                                  <p className="text-xs text-gray-400">ID: {review.userId || 'N/A'}</p>
                                  <div className="flex items-center mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < (review.rating || 0) 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">({review.rating || 0}/5)</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-gray-500">
                                  {review.createdAt ? 
                                    (review.createdAt.toDate ? 
                                      review.createdAt.toDate().toLocaleDateString() : 
                                      new Date(review.createdAt).toLocaleDateString()
                                    ) : 'Unknown date'
                                  }
                                </span>
                                {review.orderNumber && (
                                  <p className="text-xs text-gray-400 mt-1">Order: {review.orderNumber}</p>
                                )}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-gray-700">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600">This store hasn't received any reviews yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                {/* <div className="flex items-center space-x-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Store
                  </button>
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in App
                  </button>
                </div> */}
                <button
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
}

export default ProjectDashboard;
