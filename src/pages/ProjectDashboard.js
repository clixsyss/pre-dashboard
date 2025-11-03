import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Wrench,
  Menu,
  Bell,
  UserX,
  UserCheck,
  AlertTriangle,
  Settings,
  FileText,
  Building,
  Shield,
  UserPlus,
  Link2,
  Unlink,
  Tag,
  Smartphone,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc, setDoc, serverTimestamp, onSnapshot, limit, startAfter } from 'firebase/firestore';
import userService from '../services/userService';
import { db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import CourtsManagement from '../components/CourtsManagement';
import AcademiesManagement from '../components/AcademiesManagement';
import StoreManagement from '../components/StoreManagement';
import NotificationManagement from '../components/NotificationManagement';
import NewsManagementSystem from '../components/NewsManagementSystem';
import NewsCategoriesManagement from '../components/NewsCategoriesManagement';
import ComplaintsManagement from '../components/ComplaintsManagement';
import ComplaintCategoriesManagement from '../components/ComplaintCategoriesManagement';
import ServicesManagement from '../components/ServicesManagement';
import RequestsManagement from '../components/RequestsManagement';
import ServiceBookingsManagement from '../components/ServiceBookingsManagement';
import AdminSetup from '../components/AdminSetup';
import PDFGuidelines from '../components/PDFGuidelines';
import AdsManagement from '../components/AdsManagement';
import SupportManagement from '../components/SupportManagement';
import FinesManagement from '../components/FinesManagement';
import GuardsManagement from '../components/GuardsManagement';
import AdminManagement from '../components/AdminManagement';
import GuestPasses from './GuestPasses';
import DeviceKeysManagement from '../components/DeviceKeysManagement';
import ExportButton from '../components/ExportButton';
import { useBookingStore } from '../stores/bookingStore';
import { useStoreManagementStore } from '../stores/storeManagementStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import PermissionGate from '../components/PermissionGate';
import customUserNotificationService from '../services/customUserNotificationService';
import { sendStatusNotification } from '../services/statusNotificationService';
import '../styles/servicesManagement.css';
import '../styles/projectSidebar.css';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  // filteredUsers is now memoized for better performance
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [migrationStatusFilter, setMigrationStatusFilter] = useState('all');
  const [deletionStatusFilter, setDeletionStatusFilter] = useState('active'); // active, deleted, all
  const [activeTab, setActiveTab] = useState('dashboard');
  const [servicesSubTab, setServicesSubTab] = useState('categories');
  const [requestsSubTab, setRequestsSubTab] = useState('categories');
  const [complaintsSubTab, setComplaintsSubTab] = useState('complaints');
  const [newsSubTab, setNewsSubTab] = useState('news');
  const [unitsSubTab, setUnitsSubTab] = useState('units');
  // Notification counts are now memoized for better performance
  
  // Data state for notification counts and comprehensive analytics
  const [notifications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [fines, setFines] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [requestSubmissions, setRequestSubmissions] = useState([]);
  const [requestCategories, setRequestCategories] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [adsItems, setAdsItems] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [courts, setCourts] = useState([]);
  const [guards, setGuards] = useState([]);
  const [stores, setStores] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [projectAdmins, setProjectAdmins] = useState([]);
  const [pendingAdminsCount, setPendingAdminsCount] = useState(0);
  const [deviceResetRequests, setDeviceResetRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsLastDoc, setUnitsLastDoc] = useState(null);
  const [unitsHasMore, setUnitsHasMore] = useState(false);
  const [unitRequests, setUnitRequests] = useState([]);
  const [unitRequestsLoading, setUnitRequestsLoading] = useState(false);
  
  // Units filters
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [unitBuildingFilter, setUnitBuildingFilter] = useState('all');
  const [unitOccupancyFilter, setUnitOccupancyFilter] = useState('all');
  const [unitFloorFilter, setUnitFloorFilter] = useState('all');
  const [unitDeveloperFilter, setUnitDeveloperFilter] = useState('all');
  
  // Unit requests filters
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestRoleFilter, setRequestRoleFilter] = useState('all');
  
  // Units pagination
  const [unitsCurrentPage, setUnitsCurrentPage] = useState(1);
  const [unitsPerPage, setUnitsPerPage] = useState(100);
  
  // Unit requests pagination
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [requestsPerPage] = useState(20);
  
  // Building details modal
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  
  // Track which unit's tooltip is open (unitId-owners or unitId-family)
  const [openTooltip, setOpenTooltip] = useState(null);
  
  // Unit/Building notification and suspension modals
  const [showUnitNotificationModal, setShowUnitNotificationModal] = useState(false);
  const [showUnitSuspensionModal, setShowUnitSuspensionModal] = useState(false);
  const [selectedUnitForAction, setSelectedUnitForAction] = useState(null);
  const [actionTargetType, setActionTargetType] = useState('unit'); // 'unit' or 'building'
  const [unitNotificationTitle, setUnitNotificationTitle] = useState('');
  const [unitNotificationMessage, setUnitNotificationMessage] = useState('');
  const [unitSuspensionReason, setUnitSuspensionReason] = useState('');
  const [unitSuspensionDuration, setUnitSuspensionDuration] = useState('7');
  const [unitSuspensionType, setUnitSuspensionType] = useState('temporary');
  
  // Unit request modals
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [selectedUserFullData, setSelectedUserFullData] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  
  const { currentAdmin, hasPermission, hasProjectAccess, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

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

  // Check if admin has access to this project
  useEffect(() => {
    if (currentAdmin && projectId && !hasProjectAccess(projectId)) {
      navigate('/admin/projects');
      return;
    }
  }, [currentAdmin, projectId, hasProjectAccess, navigate]);

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // User modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Family member modal state
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [selectedParentUser, setSelectedParentUser] = useState(null);
  
  // Edit user modal state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  
  // Edit user file upload state
  const [editFrontIdFile, setEditFrontIdFile] = useState(null);
  const [editBackIdFile, setEditBackIdFile] = useState(null);
  const [editFrontIdPreview, setEditFrontIdPreview] = useState(null);
  const [editBackIdPreview, setEditBackIdPreview] = useState(null);
  const [editUploadingFiles, setEditUploadingFiles] = useState(false);
  
  // Suspension modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7'); // days
  const [suspensionType, setSuspensionType] = useState('temporary'); // temporary or permanent

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Default to 50 for better performance

  // Add User modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'male', // male, female, other
    projectUnit: '', // unit for the specific project
    projectRole: 'owner', // owner, tenant, resident, family
    accountType: 'permanent', // permanent or temporary
    validityStartDate: '',
    validityEndDate: ''
  });
  
  // File upload state
  const [frontIdFile, setFrontIdFile] = useState(null);
  const [backIdFile, setBackIdFile] = useState(null);
  const [frontIdPreview, setFrontIdPreview] = useState(null);
  const [backIdPreview, setBackIdPreview] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);



  // Sidebar navigation configuration with categories
  const sidebarNavigation = [
    {
      category: 'Overview',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Project overview & analytics', permission: null } // Always visible
      ]
    },
    {
      category: 'User Management',
      items: [
        { id: 'users', name: 'Users', icon: Users, description: 'Manage user accounts', permission: 'users' },
        { id: 'units', name: 'Units', icon: Building, description: 'View project units & occupancy', permission: 'users' }
      ]
    },
    {
      category: 'Facilities & Services',
      items: [
        { id: 'services', name: 'Services', icon: Wrench, description: 'Service categories & bookings', permission: 'services' },
        { id: 'requests', name: 'Requests', icon: FileText, description: 'Request categories & submissions', permission: 'requests' },
        { id: 'academies', name: 'Academies', icon: School, description: 'Academy programs', permission: 'academies' },
        { id: 'courts', name: 'Courts', icon: MapPin, description: 'Court bookings', permission: 'courts' },
        { id: 'bookings', name: 'Bookings', icon: Calendar, description: 'All bookings overview', permission: 'bookings' }
      ]
    },
    {
      category: 'Communication',
      items: [
        { id: 'events', name: 'Notifications', icon: Target, description: 'Push notifications', permission: 'notifications' },
        { id: 'news', name: 'News', icon: Newspaper, description: 'News & announcements', permission: 'news' },
        { id: 'complaints', name: 'Complaints', icon: MessageCircle, description: 'User complaints', permission: 'complaints' },
        { id: 'guidelines', name: 'Guidelines', icon: FileText, description: 'Project rules & procedures', permission: 'guidelines' },
        { id: 'ads', name: 'Ads', icon: Star, description: 'Promotional banners & advertisements', permission: 'ads' }
      ]
    },
    {
      category: 'E-commerce',
      items: [
        { id: 'store', name: 'Store', icon: ShoppingBag, description: 'Store management', permission: 'store' },
        { id: 'orders', name: 'Orders', icon: Package, description: 'Order management', permission: 'orders' }
      ]
    },
    {
      category: 'Security',
      items: [
        { id: 'gatepass', name: 'Gate Pass', icon: Key, description: 'Gate pass management', permission: 'gate_pass' },
        { id: 'fines', name: 'Fines & Violations', icon: AlertTriangle, description: 'Issue and manage user fines', permission: 'fines' },
        { id: 'guards', name: 'Guards', icon: Shield, description: 'Guard account management', permission: 'guards' },
        { id: 'support', name: 'Support', icon: MessageCircle, description: 'Customer support management', permission: 'support' },
        { id: 'guestpasses', name: 'Guest Passes', icon: UserX, description: 'Manage guest passes and user limits', permission: 'guest_passes' },
        { id: 'device_keys', name: 'Device Keys', icon: Smartphone, description: 'Manage device restrictions and reset requests', permission: 'device_keys' }
      ]
    },
    {
      category: 'Administration',
      items: [
        { id: 'admins', name: 'Admin Accounts', icon: UserPlus, description: 'Manage admin accounts & permissions', permission: 'admin_accounts' }
      ]
    }
  ];

  // Filter sidebar navigation based on permissions
  const getFilteredSidebarNavigation = () => {
    return sidebarNavigation.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.permission === null || hasPermission(item.permission, 'read')
      )
    })).filter(category => category.items.length > 0);
  };

  // Flattened tabs for backward compatibility
  const serviceTabs = getFilteredSidebarNavigation().flatMap(category => category.items);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    if (projectId) {
      const loadData = async () => {
        try {
          // Load project data and users in parallel for instant loading
          console.log('📊 ProjectDashboard: Loading project data with optimization...');
          const [projectDoc, usersSnapshot] = await Promise.all([
            getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId))),
            // OPTIMIZATION: Limit users to 2000 for better performance
            getDocs(query(collection(db, 'users'), limit(2000)))
          ]);
          
          console.log(`✅ ProjectDashboard: Loaded ${usersSnapshot.size} users (limited)`);

          // Set project data
          if (!projectDoc.empty) {
            const projectData = { id: projectId, ...projectDoc.docs[0].data() };
            setProject(projectData);
          }

          // Process users data
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
          setLoading(false); // Set loading to false immediately after data is loaded
          setDataLoaded(true); // Mark that initial data is loaded
        } catch (err) {
          console.error('Error loading project data:', err);
          setLoading(false);
        }
      };

      loadData();
    }
  }, [projectId]);

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    if (searchTerm || statusFilter !== 'all' || userStatusFilter !== 'all' || migrationStatusFilter !== 'all' || deletionStatusFilter !== 'all') {
      let filtered = [...projectUsers];

      // Deletion status filter (active, deleted, all)
      if (deletionStatusFilter === 'active') {
        filtered = filtered.filter(user => !user.isDeleted);
      } else if (deletionStatusFilter === 'deleted') {
        filtered = filtered.filter(user => user.isDeleted);
      }
      // If deletionStatusFilter === 'all', show all users

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
          user.firstName?.toLowerCase().includes(term) ||
          user.lastName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.registrationStatus === statusFilter);
      }

      if (userStatusFilter !== 'all') {
        if (userStatusFilter === 'awaiting_password') {
          // Filter for admin-created users awaiting password setup
          filtered = filtered.filter(user => 
            user.createdByAdmin && 
            user.registrationStatus === 'in_progress' && 
            user.registrationStep === 'awaiting_password'
          );
        } else {
          filtered = filtered.filter(user => user.approvalStatus === userStatusFilter);
        }
      }

      // Migration status filter
      if (migrationStatusFilter !== 'all') {
        if (migrationStatusFilter === 'migrated') {
          // Users who have been migrated (have migrated: true)
          filtered = filtered.filter(user => user.migrated === true);
        } else if (migrationStatusFilter === 'needs_migration') {
          // Users who have oldId but not migrated yet
          filtered = filtered.filter(user => user.oldId && user.migrated !== true);
        } else if (migrationStatusFilter === 'new_users') {
          // Users who don't have oldId (registered directly in new system)
          filtered = filtered.filter(user => !user.oldId);
        }
      }

      return filtered;
    } else {
      return projectUsers;
    }
  }, [searchTerm, statusFilter, userStatusFilter, migrationStatusFilter, deletionStatusFilter, projectUsers]);

  // Filter users function - now just returns the memoized value
  const filterUsers = useCallback(() => {
    return filteredUsers;
  }, [filteredUsers]);

  // Memoized filtered bookings for better performance
  const filteredBookings = useMemo(() => {
    if (!projectBookings || projectBookings.length === 0) return [];
        
    let filtered = [...projectBookings];

    if (bookingSearchTerm) {
      const term = bookingSearchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        (booking.userName && booking.userName.toLowerCase().includes(term)) ||
        (booking.userEmail && booking.userEmail.toLowerCase().includes(term)) ||
        (booking.date && booking.date.toLowerCase().includes(term)) ||
        (booking.courtName && booking.courtName.toLowerCase().includes(term)) ||
        (booking.academyName && booking.academyName.toLowerCase().includes(term))
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
  }, [projectBookings, bookingSearchTerm, bookingServiceFilter, courtFilter, academyFilter, bookingStatusFilter]);

  // Filter bookings function - now just returns the memoized value
  const getFilteredBookings = useCallback(() => {
    return filteredBookings;
  }, [filteredBookings]);

  // Memoized upcoming bookings for better performance
  const upcomingBookings = useMemo(() => {
    const filtered = filteredBookings;
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
  }, [filteredBookings]);

  // Separate upcoming and past bookings - now just returns memoized value
  const getUpcomingBookings = useCallback(() => {
    return upcomingBookings;
  }, [upcomingBookings]);

  // Memoized calculations for better performance
  const pendingUsersCount = useMemo(() => 
    projectUsers.filter(user => 
      user.approvalStatus === 'pending' && !user.isDeleted
    ).length, [projectUsers]
  );

  const upcomingBookingsCount = useMemo(() => 
    upcomingBookings.length, [upcomingBookings]
  );

  const pendingServiceRequestsCount = useMemo(() => {
    const count = serviceBookings?.filter(booking => 
      booking.status === 'open' || booking.status === 'processing'
    ).length || 0;
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Bookings:', serviceBookings?.length || 0, 'Open/Processing:', count);
    }
    return count;
  }, [serviceBookings]);

  const pendingOrdersCount = useMemo(() => 
    projectOrders?.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length || 0, [projectOrders]
  );

  const unreadNotificationsCount = useMemo(() => 
    notifications?.filter(notification => 
      !notification.read || notification.read === false
    ).length || 0, [notifications]
  );

  const openComplaintsCount = useMemo(() => 
    complaints?.filter(complaint => 
      complaint.status === 'Open' || complaint.status === 'In Progress'
    ).length || 0, [complaints]
  );

  const openSupportTicketsCount = useMemo(() => 
    supportTickets?.filter(ticket => 
      ticket.status === 'open' || !ticket.status
    ).length || 0, [supportTickets]
  );

  const pendingFinesCount = useMemo(() => 
    fines?.filter(fine => 
      fine.status === 'issued' || fine.status === 'disputed'
    ).length || 0, [fines]
  );

  const pendingGatePassCount = useMemo(() => 
    gatePasses?.filter(pass => 
      pass.status === 'pending' || pass.status === 'requested' || pass.status === 'active'
    ).length || 0, [gatePasses]
  );

  const pendingDeviceKeyResetRequestsCount = useMemo(() => {
    const count = deviceResetRequests?.filter(request => request.status === 'pending').length || 0;
    return count;
  }, [deviceResetRequests]);

  const pendingUnitRequestsCount = useMemo(() => {
    const count = unitRequests?.filter(request => request.status === 'pending').length || 0;
    
    if (process.env.NODE_ENV === 'development' && count > 0) {
      console.log('🏢 Calculating pendingUnitRequestsCount:', {
        total: unitRequests?.length || 0,
        pending: count,
        statuses: unitRequests?.map(r => r.status).join(', ') || 'none'
      });
    }
    
    return count;
  }, [unitRequests]);

  // Update all notification counts - now just logs analytics (counts are memoized)
  const updateAllNotificationCounts = useCallback(() => {
    // Analytics update (silent - only log errors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count pending users (legacy function for compatibility)
  const updatePendingUsersCount = useCallback(() => {
    updateAllNotificationCounts();
  }, [updateAllNotificationCounts]);

  // Get notification count for a specific service
  const getNotificationCount = useCallback((serviceId) => {
    const count = (() => {
      switch (serviceId) {
        case 'users':
          return pendingUsersCount; // Users awaiting approval
        case 'services':
          return pendingServiceRequestsCount; // Pending service bookings
        case 'bookings':
          // Show only pending bookings (new bookings awaiting action)
          return projectBookings?.filter(b => b.status === 'pending').length || 0;
        case 'orders':
          return pendingOrdersCount; // Orders needing processing
        case 'events': // notifications
          return unreadNotificationsCount; // Unread notifications
        case 'complaints':
          return openComplaintsCount; // Open complaints
        case 'support':
          return openSupportTicketsCount; // Open support tickets
        case 'fines':
          return pendingFinesCount; // Unpaid/disputed fines
        case 'gatepass':
          return pendingGatePassCount; // Active gate passes
        case 'academies':
          // Show upcoming academy bookings
          return projectBookings?.filter(b => 
            (b.type === 'academy' || b.academyId || b.academyName) && 
            (b.status === 'pending' || b.status === 'confirmed')
          ).length || 0;
        case 'courts':
          // No indicator for courts tab
          return 0;
        case 'requests':
          // Show pending request submissions
          return requestSubmissions?.filter(r => r.status === 'pending').length || 0;
        case 'store':
          // Show active stores
          return stores?.filter(s => s.status === 'active' || s.isActive).length || 0;
        case 'news':
          // Show active/published news items
          return newsItems?.filter(n => n.status === 'active' || n.published).length || 0;
        case 'ads':
          // Show active ads
          return adsItems?.filter(a => a.status === 'active' || a.isActive).length || 0;
        case 'guards':
          // Show active guards
          return guards?.filter(g => g.status === 'active' || g.isActive).length || 0;
        case 'guidelines':
          // No indicator needed for static content
          return 0;
        case 'admins':
          // Show pending admin requests (super admins only)
          return isSuperAdmin() ? pendingAdminsCount : 0;
        case 'device_keys':
          // Show pending device reset requests
          return pendingDeviceKeyResetRequestsCount;
        case 'units':
          // Show pending unit requests
          return pendingUnitRequestsCount;
        case 'dashboard':
          // Dashboard shows total pending items requiring action
          return pendingUsersCount + pendingServiceRequestsCount + pendingOrdersCount + 
                 openComplaintsCount + pendingFinesCount + 
                 (requestSubmissions?.filter(r => r.status === 'pending').length || 0) +
                 openSupportTicketsCount +
                 (isSuperAdmin() ? pendingAdminsCount : 0) +
                 pendingDeviceKeyResetRequestsCount +
                 pendingUnitRequestsCount;
        default:
          return 0;
      }
    })();
    
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingUsersCount, 
    pendingServiceRequestsCount, 
    pendingOrdersCount, 
    unreadNotificationsCount, 
    openComplaintsCount, 
    openSupportTicketsCount, 
    pendingFinesCount, 
    pendingGatePassCount,
    pendingDeviceKeyResetRequestsCount,
    pendingUnitRequestsCount,
    pendingAdminsCount,
    isSuperAdmin
  ]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filteredUsers]);

  // Debounced search for units (like the app)
  useEffect(() => {
    if (!projectId) return;
    
    // Debounce search - wait 500ms after user stops typing
    const searchTimeout = setTimeout(() => {
      if (unitSearchTerm && unitSearchTerm.length >= 2) {
        // Search Firestore when user types 2+ characters
        searchUnitsInFirestore(projectId, unitSearchTerm);
      } else if (!unitSearchTerm) {
        // Load first 50 units when search is cleared
        fetchUnits(projectId);
      }
    }, 500);
    
    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitSearchTerm, projectId]);

  useEffect(() => {
    // Reset to page 1 when units filters change
    setUnitsCurrentPage(1);
  }, [unitSearchTerm, unitBuildingFilter, unitOccupancyFilter, unitFloorFilter, unitDeveloperFilter]);

  // Memoize unit-to-users lookup map for performance
  const unitUsersMap = useMemo(() => {
    const map = {};
    
    projectUsers.forEach(user => {
      user.projects?.forEach(p => {
        if (p.projectId === projectId && p.unit) {
          if (!map[p.unit]) {
            map[p.unit] = { owners: [], family: [] };
          }
          if (p.role === 'owner') {
            map[p.unit].owners.push(user);
          } else if (p.role === 'family') {
            map[p.unit].family.push(user);
          }
        }
      });
    });
    
    return map;
  }, [projectUsers, projectId]);

  // Memoize enriched units data with owner/family counts
  const enrichedUnits = useMemo(() => {
    return units.map(unit => {
      const unitIdentifier = `${unit.buildingNum}-${unit.unitNum}`;
      const unitUsers = unitUsersMap[unitIdentifier] || { owners: [], family: [] };
      
      return {
        ...unit,
        ownersCount: unitUsers.owners.length,
        familyCount: unitUsers.family.length,
        owners: unitUsers.owners,
        family: unitUsers.family,
        isOccupied: unitUsers.owners.length > 0
      };
    });
  }, [units, unitUsersMap]);

  // Update all notification counts when data changes
  useEffect(() => {
    updateAllNotificationCounts();
  }, [updateAllNotificationCounts]);

  // Update pending users count when project users change (legacy)
  useEffect(() => {
    updatePendingUsersCount();
  }, [updatePendingUsersCount]);

  // Fetch additional data for notification counts
  const fetchComplaints = useCallback(async (projectId) => {
    try {
      const complaintsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/complaints`), orderBy('createdAt', 'desc'))
      );
      const complaintsData = complaintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
    }
  }, []);

  const fetchSupportTickets = useCallback(async (projectId) => {
    try {
      const supportSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/support`), orderBy('createdAt', 'desc'))
      );
      const supportData = supportSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupportTickets(supportData);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setSupportTickets([]);
    }
  }, []);

  const fetchFines = useCallback(async (projectId) => {
    try {
      const finesSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/fines`), orderBy('createdAt', 'desc'))
      );
      const finesData = finesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFines(finesData);
    } catch (error) {
      console.error('Error fetching fines:', error);
      setFines([]);
    }
  }, []);

  const fetchGatePasses = useCallback(async (projectId) => {
    try {
      const gatePassSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/gatepass`), orderBy('createdAt', 'desc'))
      );
      const gatePassData = gatePassSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGatePasses(gatePassData);
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      setGatePasses([]);
    }
  }, []);

  const fetchServiceBookings = useCallback(async (projectId) => {
    try {
      const serviceBookingsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/serviceBookings`), orderBy('createdAt', 'desc'))
      );
      const serviceBookingsData = serviceBookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServiceBookings(serviceBookingsData);
    } catch (error) {
      console.error('Error fetching service bookings:', error);
      setServiceBookings([]);
    }
  }, []);

  // Fetch request submissions
  const fetchRequestSubmissions = useCallback(async (projectId) => {
    try {
      const submissionsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/requestSubmissions`), orderBy('createdAt', 'desc'))
      );
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequestSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching request submissions:', error);
      setRequestSubmissions([]);
    }
  }, []);

  // Fetch request categories
  const fetchRequestCategories = useCallback(async (projectId) => {
    try {
      const categoriesSnapshot = await getDocs(
        collection(db, `projects/${projectId}/requestCategories`)
      );
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequestCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching request categories:', error);
      setRequestCategories([]);
    }
  }, []);

  // Fetch news items
  const fetchNews = useCallback(async (projectId) => {
    try {
      const newsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/news`), orderBy('createdAt', 'desc'))
      );
      const newsData = newsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNewsItems(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsItems([]);
    }
  }, []);

  // Fetch ads
  const fetchAds = useCallback(async (projectId) => {
    try {
      const adsSnapshot = await getDocs(
        query(collection(db, `projects/${projectId}/ads`), orderBy('createdAt', 'desc'))
      );
      const adsData = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdsItems(adsData);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAdsItems([]);
    }
  }, []);

  // Fetch academies
  const fetchAcademies = useCallback(async (projectId) => {
    try {
      const academiesSnapshot = await getDocs(
        collection(db, `projects/${projectId}/academies`)
      );
      const academiesData = academiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAcademies(academiesData);
    } catch (error) {
      console.error('Error fetching academies:', error);
      setAcademies([]);
    }
  }, []);

  // Fetch courts
  const fetchCourts = useCallback(async (projectId) => {
    try {
      const courtsSnapshot = await getDocs(
        collection(db, `projects/${projectId}/courts`)
      );
      const courtsData = courtsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourts(courtsData);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setCourts([]);
    }
  }, []);

  // Fetch guards
  const fetchGuards = useCallback(async (projectId) => {
    try {
      const guardsSnapshot = await getDocs(
        collection(db, `projects/${projectId}/guards`)
      );
      const guardsData = guardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuards(guardsData);
    } catch (error) {
      console.error('Error fetching guards:', error);
      setGuards([]);
    }
  }, []);

  // Fetch stores
  const fetchStores = useCallback(async (projectId) => {
    try {
      const storesSnapshot = await getDocs(
        collection(db, `projects/${projectId}/stores`)
      );
      const storesData = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  }, []);

  // Fetch service categories
  const fetchServiceCategories = useCallback(async (projectId) => {
    try {
      const categoriesSnapshot = await getDocs(
        collection(db, `projects/${projectId}/serviceCategories`)
      );
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServiceCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      setServiceCategories([]);
    }
  }, []);

  // Fetch project admins (admins with access to this project)
  const fetchProjectAdmins = useCallback(async (projectId) => {
    try {
      // Fetch all admins
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      const allAdmins = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter admins who have access to this project
      const projectSpecificAdmins = allAdmins.filter(admin => 
        admin.accountType === 'super_admin' || 
        admin.assignedProjects?.includes(projectId)
      );
      
      setProjectAdmins(projectSpecificAdmins);
    } catch (error) {
      console.error('Error fetching project admins:', error);
      setProjectAdmins([]);
    }
  }, []);

  // Fetch pending admin requests
  const fetchPendingAdmins = useCallback(async () => {
    try {
      const pendingSnapshot = await getDocs(
        query(collection(db, 'pendingAdmins'), where('status', '==', 'pending'))
      );
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingAdminsCount(pendingData.length);
    } catch (error) {
      console.error('Error fetching pending admins:', error);
      setPendingAdminsCount(0);
    }
  }, [setPendingAdminsCount]);

  // Fetch device reset requests
  const fetchDeviceResetRequests = useCallback(async (projectId) => {
    try {
      if (!projectId) {
        setDeviceResetRequests([]);
        return;
      }
      
      // Read from project subcollection: projects/{projectId}/deviceKeyResetRequests
      const requestsSnapshot = await getDocs(
        query(
          collection(db, 'projects', projectId, 'deviceKeyResetRequests'),
          orderBy('requestedAt', 'desc')
        )
      );
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeviceResetRequests(requestsData);
    } catch (error) {
      console.error('Error fetching device reset requests:', error);
      setDeviceResetRequests([]);
    }
  }, []);

  // Search units dynamically from Firestore (like the app)
  const searchUnitsInFirestore = useCallback(async (projectId, searchTerm) => {
    try {
      setUnitsLoading(true);
      
      // Search by unitNum field using range query
      const unitsQuery = query(
        collection(db, `projects/${projectId}/units`),
        where('unitNum', '>=', searchTerm),
        where('unitNum', '<=', searchTerm + '\uf8ff'),
        limit(50)
      );
      
      const unitsSnapshot = await getDocs(unitsQuery);
      
      const unitsData = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUnits(unitsData);
      setUnitsHasMore(false); // No pagination for search results
      setUnitsLastDoc(null);
      
      console.log(`✅ Search results: ${unitsData.length} units found for "${searchTerm}"`);
    } catch (error) {
      console.error('❌ Error searching units:', error);
      setUnits([]);
      setUnitsHasMore(false);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  // Fetch units with limit - OPTIMIZED
  const fetchUnits = useCallback(async (projectId, isLoadMore = false) => {
    try {
      setUnitsLoading(true);
      
      // OPTIMIZATION: Load only 50 units at a time
      let unitsQuery;
      
      if (isLoadMore && unitsLastDoc) {
        unitsQuery = query(
          collection(db, `projects/${projectId}/units`),
          startAfter(unitsLastDoc),
          limit(50)
        );
      } else {
        unitsQuery = query(
          collection(db, `projects/${projectId}/units`),
          limit(50)
        );
      }
      
      const unitsSnapshot = await getDocs(unitsQuery);
      
      const unitsData = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update state
      if (isLoadMore) {
        setUnits(prev => [...prev, ...unitsData]);
      } else {
        setUnits(unitsData);
      }
      
      // Track pagination state
      const lastVisible = unitsSnapshot.docs[unitsSnapshot.docs.length - 1];
      setUnitsLastDoc(lastVisible);
      setUnitsHasMore(unitsSnapshot.docs.length === 50); // Has more if we got exactly 50
      
      console.log(`✅ Units loaded: ${unitsData.length}`);
    } catch (error) {
      console.error('❌ Error fetching units:', error);
      if (!isLoadMore) {
        setUnits([]);
        setUnitsHasMore(false);
      }
    } finally {
      setUnitsLoading(false);
    }
  }, [unitsLastDoc]);

  const fetchUnitRequests = useCallback(async (projectId) => {
    try {
      setUnitRequestsLoading(true);
      console.log('📋 Fetching unit requests...');
      
      const requestsQuery = query(
        collection(db, 'unitRequests'),
        where('projectId', '==', projectId),
        orderBy('requestedAt', 'desc')
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Loaded ${requestsData.length} unit requests`);
      setUnitRequests(requestsData);
    } catch (error) {
      console.error('Error fetching unit requests:', error);
      setUnitRequests([]);
    } finally {
      setUnitRequestsLoading(false);
    }
  }, []);

  // Load all data on mount for best user experience
  useEffect(() => {
    if (projectId && dataLoaded) {
      const loadAllData = async () => {
        try {
          // Load all data in parallel for instant access
          await Promise.all([
            fetchBookings(projectId),
            fetchOrders(projectId),
            fetchNotifications(projectId),
            fetchComplaints(projectId),
            fetchSupportTickets(projectId),
            fetchFines(projectId),
            fetchGatePasses(projectId),
            fetchServiceBookings(projectId),
            fetchRequestSubmissions(projectId),
            fetchRequestCategories(projectId),
            fetchNews(projectId),
            fetchAds(projectId),
            fetchAcademies(projectId),
            fetchCourts(projectId),
            fetchGuards(projectId),
            fetchStores(projectId),
            fetchServiceCategories(projectId),
            fetchProjectAdmins(projectId),
            fetchPendingAdmins(),
            fetchDeviceResetRequests(projectId),
            fetchUnits(projectId),
            fetchUnitRequests(projectId)
          ]);
          console.log('✅ All dashboard data loaded successfully - comprehensive analytics ready!');
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      };

      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dataLoaded]);

  // Set up real-time listener for device reset requests (same as other tabs)
  useEffect(() => {
    if (!projectId) return;

    console.log('🔄 Setting up real-time listener for device reset requests...');
    
    const requestsRef = collection(db, 'projects', projectId, 'deviceKeyResetRequests');
    // Try without orderBy first to avoid index issues
    const q = query(requestsRef);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort manually by requestedAt (newest first)
        requestsData.sort((a, b) => {
          const aTime = a.requestedAt?.toMillis?.() || a.requestedAt?.seconds * 1000 || 0;
          const bTime = b.requestedAt?.toMillis?.() || b.requestedAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });
        
        setDeviceResetRequests(requestsData);
      },
      (error) => {
        console.error('❌ Error in device reset requests listener:', error);
        console.error('❌ Error details:', error.message, error.code);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up device reset requests listener');
      unsubscribe();
    };
  }, [projectId]);

  // Refresh all data function
  const refreshAllData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      await Promise.all([
        fetchBookings(projectId),
        fetchOrders(projectId),
        fetchNotifications(projectId),
        fetchComplaints(projectId),
        fetchSupportTickets(projectId),
        fetchFines(projectId),
        fetchGatePasses(projectId),
        fetchServiceBookings(projectId),
        fetchRequestSubmissions(projectId),
        fetchRequestCategories(projectId),
        fetchNews(projectId),
        fetchAds(projectId),
        fetchAcademies(projectId),
        fetchCourts(projectId),
        fetchGuards(projectId),
        fetchStores(projectId),
        fetchServiceCategories(projectId),
        fetchProjectAdmins(projectId),
        fetchPendingAdmins(),
        fetchDeviceResetRequests(projectId),
        fetchUnitRequests(projectId)
      ]);
      console.log('✅ All data refreshed successfully - Dashboard updated!');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [projectId, fetchBookings, fetchOrders, fetchNotifications, fetchComplaints, fetchSupportTickets, fetchFines, fetchGatePasses, fetchServiceBookings, fetchRequestSubmissions, fetchRequestCategories, fetchNews, fetchAds, fetchAcademies, fetchCourts, fetchGuards, fetchStores, fetchServiceCategories, fetchProjectAdmins, fetchPendingAdmins, fetchDeviceResetRequests, fetchUnitRequests]);

  // Reset filters when switching tabs (no data fetching needed)
  useEffect(() => {
    if (activeTab === 'bookings') {
      setCourtFilter('all');
      setAcademyFilter('all');
      setBookingServiceFilter('all');
      setBookingStatusFilter('all');
      setBookingSearchTerm('');
    } else if (activeTab === 'orders') {
      setOrderStatusFilter('all');
      setOrderStoreFilter('all');
      setOrderPaymentFilter('all');
      setOrderDateFilter('all');
      setOrderDateRange({ start: '', end: '' });
      setOrderSearchTerm('');
    }
  }, [activeTab]);

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

  // Unit request approval handlers
  const handleApproveRequest = async (request) => {
    if (!window.confirm(`Approve unit request for ${request.userName} - Unit ${request.unit}?`)) {
      return;
    }

    try {
      setApprovalLoading(true);

      // Update the unit request status
      await updateDoc(doc(db, 'unitRequests', request.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentAdmin?.email || 'admin'
      });

      // Update the user's project array to mark as approved
      const userDoc = await getDoc(doc(db, 'users', request.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedProjects = (userData.projects || []).map(p => {
          if (p.projectId === request.projectId && p.unit === request.unit) {
            return {
              ...p,
              approvalStatus: 'approved',
              approvedAt: new Date()
            };
          }
          return p;
        });

        await updateDoc(doc(db, 'users', request.userId), {
          projects: updatedProjects
        });
      }

      // Send notification to user about approval
      try {
        const unitInfo = `Unit ${request.unit} in ${request.projectName}`;
        await sendStatusNotification(
          request.projectId,
          request.userId,
          'Unit Access Approved',
          `Great news! Your request to access ${unitInfo} has been approved. You can now access this unit and all its features.`,
          'تمت الموافقة على طلب الوحدة',
          `أخبار رائعة! تمت الموافقة على طلبك للوصول إلى ${unitInfo}. يمكنك الآن الوصول إلى هذه الوحدة وجميع ميزاتها.`,
          'success'
        );
        console.log('Unit approval notification sent to user');
      } catch (notifError) {
        console.warn('Failed to send approval notification:', notifError);
      }

      // Refresh the unit requests
      await fetchUnitRequests(projectId);
      alert(`Unit request approved successfully for ${request.userName}. A notification has been sent to the user.`);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = window.prompt(`Reject unit request for ${request.userName} - Unit ${request.unit}?\n\nPlease provide a reason:`);
    if (!reason) {
      return;
    }

    try {
      setApprovalLoading(true);

      // Update the unit request status
      await updateDoc(doc(db, 'unitRequests', request.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentAdmin?.email || 'admin',
        rejectionReason: reason
      });

      // Remove the project from the user's projects array
      const userDoc = await getDoc(doc(db, 'users', request.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedProjects = (userData.projects || []).filter(p => {
          return !(p.projectId === request.projectId && p.unit === request.unit);
        });

        await updateDoc(doc(db, 'users', request.userId), {
          projects: updatedProjects
        });
      }

      // Send notification to user about rejection
      try {
        const unitInfo = `Unit ${request.unit} in ${request.projectName}`;
        await sendStatusNotification(
          request.projectId,
          request.userId,
          'Unit Access Request Declined',
          `We regret to inform you that your request to access ${unitInfo} has been declined.\n\nReason: ${reason}\n\nIf you believe this is an error or have questions, please contact the management team.`,
          'تم رفض طلب الوصول للوحدة',
          `يؤسفنا إبلاغك بأنه تم رفض طلبك للوصول إلى ${unitInfo}.\n\nالسبب: ${reason}\n\nإذا كنت تعتقد أن هذا خطأ أو لديك أسئلة، يرجى الاتصال بفريق الإدارة.`,
          'alert'
        );
        console.log('Unit rejection notification sent to user');
      } catch (notifError) {
        console.warn('Failed to send rejection notification:', notifError);
      }

      // Refresh the unit requests
      await fetchUnitRequests(projectId);
      alert(`Unit request rejected for ${request.userName}. A notification has been sent to the user.`);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setApprovalLoading(false);
    }
  };

  // Fetch full user details for the modal
  const fetchUserDetailsForRequest = async (request) => {
    try {
      setLoadingUserDetails(true);
      const userDoc = await getDoc(doc(db, 'users', request.userId));
      if (userDoc.exists()) {
        const userData = {
          id: userDoc.id,
          ...userDoc.data()
        };
        setSelectedUserFullData(userData);
      } else {
        setSelectedUserFullData(null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSelectedUserFullData(null);
    } finally {
      setLoadingUserDetails(false);
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
        setSelectedUser(user);
        setShowUserModal(true);
        break;
      case 'edit':
        // Open edit modal with user data
        const userProject = user.projects?.find(p => p.projectId === projectId);
        setEditUserData({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          mobile: user.mobile || '',
          nationalId: user.nationalId || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || 'male',
          projectUnit: userProject?.unit || '',
          projectRole: userProject?.role || 'owner',
          currentFrontIdUrl: user.documents?.frontIdUrl || '',
          currentBackIdUrl: user.documents?.backIdUrl || ''
        });
        // Reset edit file uploads
        setEditFrontIdFile(null);
        setEditBackIdFile(null);
        setEditFrontIdPreview(null);
        setEditBackIdPreview(null);
        setShowEditUserModal(true);
        break;
      case 'suspend':
        setUserToSuspend(user);
        setSuspensionReason('');
        setSuspensionDuration('7');
        setSuspensionType('temporary');
        setShowSuspendModal(true);
        break;
      case 'unsuspend':
        handleUnsuspendUser(user);
        break;
      case 'approve':
        handleApproveUser(user);
        break;
      case 'reject':
        handleRejectUser(user);
        break;
      case 'resend_email':
        if (window.confirm(`Resend password setup email to ${user.email}?`)) {
          handleResendPasswordEmail(user);
        }
        break;
      case 'remove':
        if (window.confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName} from this project? This will not delete their account.`)) {
          handleRemoveUserFromProject(user);
        }
        break;
      case 'soft_delete':
        if (window.confirm(`Delete account for ${user.firstName} ${user.lastName}? This will soft-delete and revoke access to all projects.`)) {
          handleSoftDeleteUser(user);
        }
        break;
      case 'restore':
        if (window.confirm(`Restore account for ${user.firstName} ${user.lastName}?`)) {
          handleRestoreUser(user);
        }
        break;
      default:
        break;
    }
  };

  // Soft delete user (global) and update local project list
  const handleSoftDeleteUser = async (user) => {
    try {
      const softDeleteData = {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentAdmin?.uid || 'admin',
        registrationStatus: 'deleted',
        projects: [],
        updatedAt: new Date()
      };

      await userService.updateUser(user.id, softDeleteData);

      // Update local project users state
      setProjectUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...softDeleteData } : u));
    } catch (e) {
      console.error('Soft delete failed:', e);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Restore user (global) and update local project list
  const handleRestoreUser = async (user) => {
    try {
      const restoreData = {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: currentAdmin?.uid || 'admin',
        registrationStatus: 'pending',
        updatedAt: new Date()
      };

      await userService.updateUser(user.id, restoreData);
      setProjectUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...restoreData } : u));
    } catch (e) {
      console.error('Restore failed:', e);
      alert('Failed to restore user.');
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend || !suspensionReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      const suspensionData = {
        suspensionReason: suspensionReason.trim(),
        suspensionType: suspensionType,
        suspendedAt: new Date(),
        suspendedBy: currentAdmin?.uid || 'admin'
      };

      if (suspensionType === 'temporary') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + parseInt(suspensionDuration));
        suspensionData.suspensionEndDate = endDate;
      }

      // Get current user data
      const userRef = doc(db, 'users', userToSuspend.id);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      // Update the projects array to mark this specific project as suspended
      const updatedProjects = (userData.projects || []).map(proj => {
        if (proj.projectId === projectId) {
          return {
            ...proj,
            isSuspended: true,
            ...suspensionData
          };
        }
        return proj;
      });

      // Update user in Firestore with project-specific suspension
      await updateDoc(userRef, {
        projects: updatedProjects,
        updatedAt: new Date()
      });
      
      console.log('✅ User suspended for project:', projectId);
      
      // Update local state
      setProjectUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userToSuspend.id) {
            const userProjects = (user.projects || []).map(proj => {
              if (proj.projectId === projectId) {
                return { ...proj, isSuspended: true, ...suspensionData };
              }
              return proj;
            });
            return { ...user, projects: userProjects };
          }
          return user;
        })
      );

      setShowSuspendModal(false);
      setUserToSuspend(null);
      setSuspensionReason('');
      setSuspensionDuration('7');
      setSuspensionType('temporary');
      
      // Refresh filtered users
      filterUsers();
      
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const handleUnsuspendUser = async (user) => {
    try {
      const unsuspensionData = {
        isSuspended: false,
        suspensionReason: null,
        suspensionType: null,
        suspendedAt: null,
        suspendedBy: null,
        suspensionEndDate: null,
        unsuspendedAt: new Date(),
        unsuspendedBy: currentAdmin?.uid || 'admin'
      };

      // Get current user data
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      // Update the projects array to remove suspension for this specific project
      const updatedProjects = (userData.projects || []).map(proj => {
        if (proj.projectId === projectId) {
          return {
            ...proj,
            ...unsuspensionData
          };
        }
        return proj;
      });

      // Update user in Firestore with project-specific unsuspension
      await updateDoc(userRef, {
        projects: updatedProjects,
        updatedAt: new Date()
      });
      
      console.log('✅ User unsuspended for project:', projectId);
      
      // Update local state
      setProjectUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.id === user.id) {
            const userProjects = (u.projects || []).map(proj => {
              if (proj.projectId === projectId) {
                return { ...proj, ...unsuspensionData };
              }
              return proj;
            });
            return { ...u, projects: userProjects };
          }
          return u;
        })
      );

      // Refresh filtered users
      filterUsers();
      
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user. Please try again.');
    }
  };

  // Unit/Building notification and suspension functions
  const handleOpenUnitNotificationModal = (unit, targetType) => {
    setSelectedUnitForAction(unit);
    setActionTargetType(targetType);
    setUnitNotificationTitle('');
    setUnitNotificationMessage('');
    setShowUnitNotificationModal(true);
  };

  const handleOpenUnitSuspensionModal = (unit, targetType) => {
    setSelectedUnitForAction(unit);
    setActionTargetType(targetType);
    setUnitSuspensionReason('');
    setUnitSuspensionDuration('7');
    setUnitSuspensionType('temporary');
    setShowUnitSuspensionModal(true);
  };

  const handleSendUnitNotification = async () => {
    if (!selectedUnitForAction || !unitNotificationMessage.trim()) {
      alert('Please provide a notification message');
      return;
    }

    try {
      // Get all users to notify based on target type
      let usersToNotify = [];
      
      if (actionTargetType === 'unit') {
        // Get all users in this specific unit
        const unitIdentifier = `${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`;
        usersToNotify = projectUsers.filter(user => 
          user.projects?.some(p => 
            p.projectId === projectId && 
            p.unit === unitIdentifier
          )
        );
      } else {
        // Get all users in this building
        usersToNotify = projectUsers.filter(user => 
          user.projects?.some(p => {
            if (p.projectId === projectId && p.unit) {
              const [building] = p.unit.split('-');
              return building === String(selectedUnitForAction.buildingNum);
            }
            return false;
          })
        );
      }

      if (usersToNotify.length === 0) {
        alert(`No users found in this ${actionTargetType}`);
        return;
      }

      // Send notifications to all users
      let successCount = 0;
      let errorCount = 0;

      for (const user of usersToNotify) {
        try {
          await customUserNotificationService.sendCustomUserNotification({
            userId: user.id,
            projectId: projectId,
            actionType: 'announcement',
            message: unitNotificationMessage.trim(),
            options: {
              title: unitNotificationTitle.trim() || `${actionTargetType === 'unit' ? 'Unit' : 'Building'} Notification`,
              type: 'info',
              category: 'general',
              priority: 'normal'
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Error sending notification to user ${user.id}:`, error);
          errorCount++;
        }
      }

      alert(`Notification sent to ${successCount} user(s)${errorCount > 0 ? `. Failed to send to ${errorCount} user(s).` : ''}`);
      
      setShowUnitNotificationModal(false);
      setSelectedUnitForAction(null);
      setUnitNotificationTitle('');
      setUnitNotificationMessage('');
      
    } catch (error) {
      console.error('Error sending unit notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleSuspendUnitUsers = async () => {
    if (!selectedUnitForAction || !unitSuspensionReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      // Get all users to suspend based on target type
      let usersToSuspend = [];
      
      if (actionTargetType === 'unit') {
        // Get all users in this specific unit
        const unitIdentifier = `${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`;
        usersToSuspend = projectUsers.filter(user => 
          user.projects?.some(p => 
            p.projectId === projectId && 
            p.unit === unitIdentifier
          )
        );
      } else {
        // Get all users in this building
        usersToSuspend = projectUsers.filter(user => 
          user.projects?.some(p => {
            if (p.projectId === projectId && p.unit) {
              const [building] = p.unit.split('-');
              return building === String(selectedUnitForAction.buildingNum);
            }
            return false;
          })
        );
      }

      if (usersToSuspend.length === 0) {
        alert(`No users found in this ${actionTargetType}`);
        return;
      }

      if (!window.confirm(`Are you sure you want to suspend ${usersToSuspend.length} user(s) in this ${actionTargetType}?`)) {
        return;
      }

      const suspensionData = {
        suspensionReason: unitSuspensionReason.trim(),
        suspensionType: unitSuspensionType,
        suspendedAt: new Date(),
        suspendedBy: currentAdmin?.uid || 'admin'
      };

      if (unitSuspensionType === 'temporary') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + parseInt(unitSuspensionDuration));
        suspensionData.suspensionEndDate = endDate;
      }

      // Suspend all users
      let successCount = 0;
      let errorCount = 0;

      for (const user of usersToSuspend) {
        try {
          const userRef = doc(db, 'users', user.id);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          
          // Update the projects array to mark this specific project as suspended
          const updatedProjects = (userData.projects || []).map(proj => {
            if (proj.projectId === projectId) {
              return {
                ...proj,
                isSuspended: true,
                ...suspensionData
              };
            }
            return proj;
          });

          await updateDoc(userRef, {
            projects: updatedProjects,
            updatedAt: new Date()
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error suspending user ${user.id}:`, error);
          errorCount++;
        }
      }

      alert(`Suspended ${successCount} user(s)${errorCount > 0 ? `. Failed to suspend ${errorCount} user(s).` : ''}`);
      
      // Update local state
      setProjectUsers(prevUsers => 
        prevUsers.map(user => {
          const shouldSuspend = usersToSuspend.some(u => u.id === user.id);
          if (shouldSuspend) {
            const userProjects = (user.projects || []).map(proj => {
              if (proj.projectId === projectId) {
                return { ...proj, isSuspended: true, ...suspensionData };
              }
              return proj;
            });
            return { ...user, projects: userProjects };
          }
          return user;
        })
      );

      setShowUnitSuspensionModal(false);
      setSelectedUnitForAction(null);
      setUnitSuspensionReason('');
      setUnitSuspensionDuration('7');
      setUnitSuspensionType('temporary');
      
      // Refresh data
      filterUsers();
      
    } catch (error) {
      console.error('Error suspending unit users:', error);
      alert('Failed to suspend users. Please try again.');
    }
  };

  const handleApproveUser = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      const approvalData = {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: currentAdmin?.uid || 'system',
        updatedAt: new Date()
      };

      await updateDoc(userDocRef, approvalData);

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, ...approvalData }
            : u
        )
      );

      // Refresh filtered users
      filterUsers();
      
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user. Please try again.');
    }
  };

  const handleRejectUser = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      const rejectionData = {
        approvalStatus: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: currentAdmin?.uid || 'system',
        updatedAt: new Date()
      };

      await updateDoc(userDocRef, rejectionData);

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, ...rejectionData }
            : u
        )
      );

      // Refresh filtered users
      filterUsers();
      
      console.log('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user. Please try again.');
    }
  };

  // Family Member Management Functions
  const openFamilyMemberModal = (parentUser) => {
    setSelectedParentUser(parentUser);
    setFamilySearchTerm('');
    setShowFamilyMemberModal(true);
  };

  const handleLinkFamilyMember = async (familyMemberId) => {
    try {
      if (!selectedParentUser) return;

      const familyMemberDocRef = doc(db, 'users', familyMemberId);
      
      await updateDoc(familyMemberDocRef, {
        parentAccountId: selectedParentUser.id,
        updatedAt: new Date(),
        linkedBy: currentAdmin?.uid || 'system',
        linkedAt: new Date()
      });

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === familyMemberId
            ? { ...u, parentAccountId: selectedParentUser.id }
            : u
        )
      );

      // Refresh the selected user if they're still open
      if (selectedUser && selectedUser.id === selectedParentUser.id) {
        const updatedParent = projectUsers.find(u => u.id === selectedParentUser.id);
        setSelectedUser(updatedParent);
      }

      alert('Family member linked successfully!');
      setShowFamilyMemberModal(false);
      setFamilySearchTerm('');
      
    } catch (error) {
      console.error('Error linking family member:', error);
      alert('Failed to link family member. Please try again.');
    }
  };

  const handleUnlinkFamilyMember = async (familyMemberId) => {
    try {
      if (!window.confirm('Are you sure you want to unlink this family member?')) return;

      const familyMemberDocRef = doc(db, 'users', familyMemberId);
      
      await updateDoc(familyMemberDocRef, {
        parentAccountId: null,
        updatedAt: new Date(),
        unlinkedBy: currentAdmin?.uid || 'system',
        unlinkedAt: new Date()
      });

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === familyMemberId
            ? { ...u, parentAccountId: null }
            : u
        )
      );

      // Refresh the selected user if they're still open
      if (selectedUser) {
        const updatedUser = projectUsers.find(u => u.id === selectedUser.id);
        setSelectedUser(updatedUser);
      }

      alert('Family member unlinked successfully!');
      
    } catch (error) {
      console.error('Error unlinking family member:', error);
      alert('Failed to unlink family member. Please try again.');
    }
  };

  // const getTabColorClasses = (color) => {
  //   const colorMap = {
  //     blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  //     indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  //     green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  //     purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  //     orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  //     pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  //     red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  //     teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  //     cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  //     amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  //     emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
  //   };
  //   return colorMap[color] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  // };

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

  const handleRemoveUserFromProject = async (user) => {
    try {
      // Get the user's current projects
      const userDocRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        return;
      }
      
      const userData = userDoc.data();
      const currentProjects = userData.projects || [];
      
      // Remove the current project from the user's projects array
      const updatedProjects = currentProjects.filter(project => project.projectId !== projectId);
      
      // Update the user document with the new projects array
      await updateDoc(userDocRef, {
        projects: updatedProjects,
        updatedAt: new Date()
      });
      
      // Update local state - remove user from project users list
      setProjectUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      
      console.log('User removed from project successfully');
    } catch (error) {
      console.error('Error removing user from project:', error);
      alert('Failed to remove user from project. Please try again.');
    }
  };

  const handleResendPasswordEmail = async (user) => {
    try {
      // Create secondary Firebase instance to avoid interfering with admin session
      const secondaryApp = initializeApp({
        apiKey: "AIzaSyDpYVhP_uLDecqds0VD7g409N_AMj-OMF8",
        authDomain: "pre-group.firebaseapp.com",
        projectId: "pre-group",
        storageBucket: "pre-group.firebasestorage.app",
        messagingSenderId: "871778209250",
        appId: "1:871778209250:web:79e726a4f5b5579bfc7dbb"
      }, `resend-${Date.now()}`);

      const secondaryAuth = getAuth(secondaryApp);
      
      // Send password reset email
      const continueUrl = window.location.origin + '/password-reset-success.html';
      
      await sendPasswordResetEmail(secondaryAuth, user.email, {
        url: continueUrl,
        handleCodeInApp: false,
      });
      
      // Clean up secondary app
      await deleteApp(secondaryApp);
      
      // Update user document to track email resend
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        passwordResetSentAt: serverTimestamp(),
        passwordResetCount: (user.passwordResetCount || 0) + 1,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, passwordResetSentAt: new Date(), passwordResetCount: (u.passwordResetCount || 0) + 1 }
            : u
        )
      );

      alert(`✅ Password reset email sent successfully to:\n${user.email}\n\nThe user should receive it within a few seconds.`);
      console.log('✅ Password reset email resent to:', user.email);
    } catch (error) {
      console.error('Error resending password email:', error);
      alert(`Failed to send password reset email: ${error.message}`);
    }
  };

  const handleEditUser = async () => {
    // Validate required fields
    if (!editUserData.firstName || !editUserData.lastName || !editUserData.email || !editUserData.mobile || !editUserData.projectUnit || !editUserData.nationalId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUserData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setEditingUser(true);

    try {
      const userDocRef = doc(db, 'users', editUserData.id);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentUserData = userDoc.data();
      
      // Update basic user information
      const updateData = {
        firstName: editUserData.firstName,
        lastName: editUserData.lastName,
        fullName: `${editUserData.firstName} ${editUserData.lastName}`,
        email: editUserData.email,
        mobile: editUserData.mobile,
        nationalId: editUserData.nationalId,
        dateOfBirth: editUserData.dateOfBirth || '',
        gender: editUserData.gender || 'male',
        updatedAt: new Date().toISOString()
      };

      // Update project-specific information in the projects array
      const updatedProjects = currentUserData.projects.map(project => 
        project.projectId === projectId
          ? {
              ...project,
              unit: editUserData.projectUnit,
              role: editUserData.projectRole,
              updatedAt: new Date().toISOString()
            }
          : project
      );

      updateData.projects = updatedProjects;

      // Upload new ID documents if provided
      if (editFrontIdFile || editBackIdFile) {
        console.log('Uploading new ID documents...');
        const uploadedUrls = await uploadEditIdDocuments(editUserData.id);
        
        // Update documents URLs
        updateData.documents = {
          frontIdUrl: uploadedUrls.frontIdUrl,
          backIdUrl: uploadedUrls.backIdUrl,
          profilePictureUrl: currentUserData.documents?.profilePictureUrl || ''
        };
      }

      // Save to Firestore
      await updateDoc(userDocRef, updateData);

      // Update local state
      setProjectUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === editUserData.id
            ? { ...u, ...updateData }
            : u
        )
      );

      // Reset edit modal state
      setShowEditUserModal(false);
      setEditUserData(null);
      setEditFrontIdFile(null);
      setEditBackIdFile(null);
      setEditFrontIdPreview(null);
      setEditBackIdPreview(null);
      
      const successMessage = (editFrontIdFile || editBackIdFile)
        ? 'User updated successfully with new ID documents!'
        : 'User updated successfully!';
      
      alert(successMessage);
      console.log('User updated:', editUserData.id);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setEditingUser(false);
    }
  };

  const handleEditUserInputChange = (field, value) => {
    setEditUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file upload for edit modal
  const handleEditFileUpload = (file, type) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setEditFrontIdFile(file);
          setEditFrontIdPreview(reader.result);
        } else {
          setEditBackIdFile(file);
          setEditBackIdPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded file from edit modal
  const handleEditRemoveFile = (type) => {
    if (type === 'front') {
      setEditFrontIdFile(null);
      setEditFrontIdPreview(null);
    } else {
      setEditBackIdFile(null);
      setEditBackIdPreview(null);
    }
  };

  // Upload files for edit modal
  const uploadEditIdDocuments = async (userId) => {
    const uploadedUrls = {
      frontIdUrl: editUserData.currentFrontIdUrl || '',
      backIdUrl: editUserData.currentBackIdUrl || ''
    };

    try {
      setEditUploadingFiles(true);

      // Upload new front ID if provided
      if (editFrontIdFile) {
        const frontIdRef = ref(storage, `users/${userId}/documents/front_id_${Date.now()}.${editFrontIdFile.name.split('.').pop()}`);
        await uploadBytes(frontIdRef, editFrontIdFile);
        uploadedUrls.frontIdUrl = await getDownloadURL(frontIdRef);
      }

      // Upload new back ID if provided
      if (editBackIdFile) {
        const backIdRef = ref(storage, `users/${userId}/documents/back_id_${Date.now()}.${editBackIdFile.name.split('.').pop()}`);
        await uploadBytes(backIdRef, editBackIdFile);
        uploadedUrls.backIdUrl = await getDownloadURL(backIdRef);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new Error('Failed to upload ID documents');
    } finally {
      setEditUploadingFiles(false);
    }
  };

  const handleAddNewUser = async () => {
    // Validate required fields
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.mobile || !newUserData.projectUnit || !newUserData.nationalId) {
      alert('Please fill in all required fields (First Name, Last Name, Email, Mobile, Unit, and National ID)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate temporary user fields
    if (newUserData.accountType === 'temporary') {
      if (!newUserData.validityStartDate || !newUserData.validityEndDate) {
        alert('Please set validity dates for temporary user');
        return;
      }
      
      const startDate = new Date(newUserData.validityStartDate);
      const endDate = new Date(newUserData.validityEndDate);
      
      if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
      }
    }

    setAddingUser(true);

    try {
      // Step 1: Create a secondary Firebase app instance for user creation
      // This prevents logging out the admin
      const secondaryApp = initializeApp({
        apiKey: "AIzaSyDpYVhP_uLDecqds0VD7g409N_AMj-OMF8",
        authDomain: "pre-group.firebaseapp.com",
        projectId: "pre-group",
        storageBucket: "pre-group.firebasestorage.app",
        messagingSenderId: "871778209250",
        appId: "1:871778209250:web:79e726a4f5b5579bfc7dbb"
      }, `secondary-${Date.now()}`);

      const secondaryAuth = getAuth(secondaryApp);
      
      // Step 2: Create user in Firebase Authentication with temporary password
      const temporaryPassword = `Temp${Math.random().toString(36).substring(2, 10)}${Date.now()}!@#`;
      
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          newUserData.email,
          temporaryPassword
        );
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Please use a different email.');
        }
        throw authError;
      }

      const authUid = userCredential.user.uid;
      console.log('User created in Auth:', authUid);

      // Step 3: Send password reset email immediately (using secondary auth)
      try {
        // URL where user will be redirected after setting password
        const continueUrl = window.location.origin + '/password-reset-success.html';
        
        await sendPasswordResetEmail(secondaryAuth, newUserData.email, {
          url: continueUrl,
          handleCodeInApp: false,
        });
        console.log('✅ Password reset email sent to:', newUserData.email);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue anyway - user can request password reset later
      }

      // Step 4: Delete the secondary app to clean up
      await deleteApp(secondaryApp);
      console.log('Secondary app instance deleted');

      // Step 5: Create user document in Firestore using authUid as document ID
      const initialUserData = {
        // Personal Information
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        fullName: `${newUserData.firstName} ${newUserData.lastName}`,
        email: newUserData.email,
        mobile: newUserData.mobile,
        nationalId: newUserData.nationalId,
        dateOfBirth: newUserData.dateOfBirth || '',
        gender: newUserData.gender || 'male',
        
        // Authentication
        authUid: authUid,
        emailVerified: false,
        passwordResetSent: true, // Flag to indicate password reset email was sent
        passwordResetSentAt: serverTimestamp(),
        passwordResetCount: 1,
        
        // Status fields
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentAdmin?.uid || 'system',
        registrationStatus: 'in_progress', // Will change to 'completed' when user sets password
        registrationStep: 'awaiting_password',
        isProfileComplete: false, // Will be true when user completes password setup
        isSuspended: false,
        createdByAdmin: true,
        
        // Projects array - matching exact structure
        projects: [{
          projectId: projectId,
          role: newUserData.projectRole,
          unit: newUserData.projectUnit,
          updatedAt: new Date().toISOString()
        }],
        
        // Top-level role and unit (empty as per structure)
        role: '',
        unit: '',
        
        // Timestamps
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: new Date().toISOString(),
        
        // Suspension fields (null as per structure)
        suspendedAt: null,
        suspendedBy: null,
        suspensionEndDate: null,
        suspensionReason: null,
        suspensionType: null,
        unsuspendedAt: null,
        unsuspendedBy: null,
        
        // Documents placeholder
        documents: {
          backIdUrl: '',
          frontIdUrl: '',
          profilePictureUrl: ''
        }
      };

      // Add temporary user specific fields
      if (newUserData.accountType === 'temporary') {
        initialUserData.isTemporary = true;
        initialUserData.validityStartDate = new Date(newUserData.validityStartDate);
        initialUserData.validityEndDate = new Date(newUserData.validityEndDate);
        initialUserData.accountType = 'temporary';
      } else {
        initialUserData.isTemporary = false;
        initialUserData.accountType = 'permanent';
      }

      // Create user document in Firestore with authUid as document ID
      const userDocRef = doc(db, 'users', authUid);
      await setDoc(userDocRef, initialUserData);
      console.log('User document created with ID:', authUid);

      // Upload ID documents if provided
      if (frontIdFile || backIdFile) {
        console.log('Uploading ID documents...');
        const uploadedUrls = await uploadIdDocuments(authUid);
        
        // Update user document with uploaded URLs
        await updateDoc(userDocRef, {
          documents: {
            frontIdUrl: uploadedUrls.frontIdUrl || '',
            backIdUrl: uploadedUrls.backIdUrl || '',
            profilePictureUrl: ''
          },
          updatedAt: new Date().toISOString()
        });
        
        console.log('ID documents uploaded successfully');
      }

      // Update local state
      const newUser = {
        id: authUid,
        ...initialUserData
      };
      
      setProjectUsers(prevUsers => [...prevUsers, newUser]);

      // Reset form and close modal
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        nationalId: '',
        dateOfBirth: '',
        gender: 'male',
        projectUnit: '',
        projectRole: 'owner',
        accountType: 'permanent',
        validityStartDate: '',
        validityEndDate: ''
      });
      
      // Reset file uploads
      setFrontIdFile(null);
      setBackIdFile(null);
      setFrontIdPreview(null);
      setBackIdPreview(null);
      
      setShowAddUserModal(false);
      
      // Show success message with instructions
      const successMessage = frontIdFile || backIdFile 
        ? `✅ User Created Successfully!\n\n📧 Email Sent To: ${newUserData.email}\n\nWhat happened:\n• User account created in Firebase\n• Password reset email sent automatically\n• ID documents uploaded\n• Profile pre-approved\n\nWhat the user should do:\n1. Check their email inbox (${newUserData.email})\n2. Click the password reset link\n3. Set their new password\n4. Download the mobile app and login\n\n${newUserData.accountType === 'temporary' ? `⚠️ Account expires: ${new Date(newUserData.validityEndDate).toLocaleDateString()}` : ''}`
        : `✅ User Created Successfully!\n\n📧 Email Sent To: ${newUserData.email}\n\nWhat happened:\n• User account created in Firebase\n• Password reset email sent automatically\n• Profile pre-approved\n\nWhat the user should do:\n1. Check their email inbox (${newUserData.email})\n2. Click the password reset link\n3. Set their new password\n4. Download the mobile app and login\n5. Upload ID documents during first login\n\n${newUserData.accountType === 'temporary' ? `⚠️ Account expires: ${new Date(newUserData.validityEndDate).toLocaleDateString()}` : ''}`;
      
      alert(successMessage);
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error.message}`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleNewUserInputChange = (field, value) => {
    setNewUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file upload for ID documents
  const handleFileUpload = (file, type) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setFrontIdFile(file);
          setFrontIdPreview(reader.result);
        } else {
          setBackIdFile(file);
          setBackIdPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (type) => {
    if (type === 'front') {
      setFrontIdFile(null);
      setFrontIdPreview(null);
    } else {
      setBackIdFile(null);
      setBackIdPreview(null);
    }
  };

  // Upload files to Firebase Storage
  const uploadIdDocuments = async (userId) => {
    const uploadedUrls = {
      frontIdUrl: '',
      backIdUrl: ''
    };

    try {
      setUploadingFiles(true);

      // Upload front ID
      if (frontIdFile) {
        const frontIdRef = ref(storage, `users/${userId}/documents/front_id_${Date.now()}.${frontIdFile.name.split('.').pop()}`);
        await uploadBytes(frontIdRef, frontIdFile);
        uploadedUrls.frontIdUrl = await getDownloadURL(frontIdRef);
      }

      // Upload back ID
      if (backIdFile) {
        const backIdRef = ref(storage, `users/${userId}/documents/back_id_${Date.now()}.${backIdFile.name.split('.').pop()}`);
        await uploadBytes(backIdRef, backIdFile);
        uploadedUrls.backIdUrl = await getDownloadURL(backIdRef);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new Error('Failed to upload ID documents');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Pagination calculations (with safety check)
  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : [];
  const totalUsersCount = safeFilteredUsers.length;
  const totalPages = Math.ceil(totalUsersCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = safeFilteredUsers.slice(startIndex, endIndex);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to users section
    const usersSection = document.getElementById('users-section');
    if (usersSection) {
      usersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
          <p className="text-sm text-gray-500 mt-2">This will only take a moment</p>
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

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between h-24 px-8 border-b border-gray-100 bg-gradient-to-r from-pre-red via-pre-red to-pre-red">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToProjects}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                title="Back to Projects List"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{project?.name || 'Loading...'}</h1>
              </div>
            </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-white hover:bg-white hover:bg-opacity-20 transition-colors"
            title="Close Sidebar"
          >
            <X className="h-6 w-6" />
          </button>
      </div>

        <nav className="mt-10 px-6 overflow-y-auto h-full pb-32">
          <div className="space-y-6">
            {getFilteredSidebarNavigation().map((category) => (
              <div key={category.category}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const isActive = activeTab === item.id;
              return (
                <button
                        key={item.id}
                        onClick={() => {
                          handleTabChange(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-5 py-4 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left ${isActive
                          ? 'bg-red-50 text-pre-red border-r-4 border-pre-red shadow-lg shadow-red-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                          }`}
                      >
                        <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-pre-red' : 'text-gray-400 group-hover:text-gray-500'
                          }`} />
                        <div className="flex-1">
                          <div className="font-semibold text-base flex items-center justify-between">
                            {item.name}
                            {getNotificationCount(item.id) > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse shadow-lg">
                                {getNotificationCount(item.id)}
                              </span>
                            )}
                          </div>
                          <div className={`text-sm mt-1 ${isActive ? 'text-pre-red' : 'text-gray-400'
                            }`}>
                            {item.description}
                          </div>
                        </div>
                </button>
              );
            })}
                </div>
              </div>
            ))}
          </div>
          </nav>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-0'
        }`}>
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white shadow-lg border-b border-gray-200 top-header">
          <div className="flex items-center justify-between h-24 px-8 lg:px-10">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title={sidebarOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              >
                <Menu className="h-7 w-7" />
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {serviceTabs.find(tab => tab.id === activeTab)?.name || 'Dashboard'}
                </h2>
                  {getNotificationCount(activeTab) > 0 && (
                    <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                      {getNotificationCount(activeTab)}
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-500 mt-1">
                  {serviceTabs.find(tab => tab.id === activeTab)?.description || 'Manage your project'}
                </p>
        </div>
      </div>

            <div className="flex items-center space-x-4">
              {/* Total Pending Items Indicator */}
              {(pendingUsersCount + pendingServiceRequestsCount + pendingOrdersCount + openComplaintsCount + pendingFinesCount + pendingGatePassCount + openSupportTicketsCount + (isSuperAdmin() ? pendingAdminsCount : 0) + (deviceResetRequests?.filter(r => r.status === 'pending').length || 0)) > 0 && (
                <button 
                  onClick={() => handleTabChange('dashboard')}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all hover:scale-105"
                  title="View all pending items"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-red-600">Pending Actions</p>
                    <p className="text-sm font-bold text-red-700">
                      {pendingUsersCount + pendingServiceRequestsCount + pendingOrdersCount + openComplaintsCount + pendingFinesCount + pendingGatePassCount + openSupportTicketsCount + (isSuperAdmin() ? pendingAdminsCount : 0) + (deviceResetRequests?.filter(r => r.status === 'pending').length || 0)} Items
                    </p>
                  </div>
                </button>
              )}
              
              <button 
                onClick={() => handleTabChange('events')}
                className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg min-w-[20px] h-5 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button 
                className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Project Settings"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-8">
          <div className="max-w-10xl mx-auto px-8 lg:px-20">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Stats - Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users Overview */}
              <div 
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border-2 border-red-200 p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer" 
                onClick={() => handleTabChange('users')}
                title="Click to manage users"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Users</p>
                    <p className="text-4xl font-bold text-red-900 mt-2">{stats.totalUsers}</p>
                    <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                        <span className="text-xs font-medium text-gray-700">{stats.activeUsers} Active</span>
                  </div>
                      {pendingUsersCount > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-bold text-amber-700">{pendingUsersCount} Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-red-200 rounded-2xl">
                    <Users className="h-10 w-10 text-red-700" />
                  </div>
                </div>
              </div>

              {/* Bookings Overview */}
              <div 
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-blue-200 p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer" 
                onClick={() => handleTabChange('bookings')}
                title="Click to manage bookings"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Bookings</p>
                    <p className="text-4xl font-bold text-blue-900 mt-2">{projectBookings?.length || 0}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      {upcomingBookingsCount > 0 && (
                <div className="flex items-center">
                          <Calendar className="w-3 h-3 text-blue-600 mr-1.5" />
                          <span className="text-xs font-bold text-blue-700">{upcomingBookingsCount} Upcoming</span>
                  </div>
                      )}
                      {pendingServiceRequestsCount > 0 && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 text-amber-600 mr-1.5 animate-pulse" />
                          <span className="text-xs font-bold text-amber-700">{pendingServiceRequestsCount} Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-200 rounded-2xl">
                    <Calendar className="h-10 w-10 text-blue-700" />
                  </div>
                </div>
              </div>

              {/* Orders Overview */}
              <div 
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border-2 border-green-200 p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer" 
                onClick={() => handleTabChange('orders')}
                title="Click to manage orders"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Orders</p>
                    <p className="text-4xl font-bold text-green-900 mt-2">{projectOrders?.length || 0}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      {pendingOrdersCount > 0 && (
                <div className="flex items-center">
                          <Package className="w-3 h-3 text-amber-600 mr-1.5 animate-pulse" />
                          <span className="text-xs font-bold text-amber-700">{pendingOrdersCount} Pending</span>
                  </div>
                      )}
                      <div className="flex items-center">
                        <Truck className="w-3 h-3 text-green-600 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700">{getOrderStats().processing} Processing</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-200 rounded-2xl">
                    <Package className="h-10 w-10 text-green-700" />
                  </div>
                </div>
              </div>

              {/* Support Overview */}
              <div 
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border-2 border-purple-200 p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer" 
                onClick={() => handleTabChange('complaints')}
                title="Click to view support & complaints"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Support</p>
                    <p className="text-4xl font-bold text-purple-900 mt-2">{complaints?.length || 0}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      {openComplaintsCount > 0 && (
                <div className="flex items-center">
                          <MessageCircle className="w-3 h-3 text-amber-600 mr-1.5 animate-pulse" />
                          <span className="text-xs font-bold text-amber-700">{openComplaintsCount} Open</span>
                        </div>
                      )}
                      {openSupportTicketsCount > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-600 rounded-full mr-1.5"></div>
                          <span className="text-xs font-medium text-gray-700">{openSupportTicketsCount} Tickets</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-200 rounded-2xl">
                    <MessageCircle className="h-10 w-10 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue/Financial */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Revenue This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      EGP {projectOrders?.filter(order => {
                        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
                        const now = new Date();
                        return orderDate.getMonth() === now.getMonth() && 
                               orderDate.getFullYear() === now.getFullYear() &&
                               order.status !== 'cancelled';
                      }).reduce((sum, order) => sum + (order.total || 0), 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      From {projectOrders?.filter(order => {
                        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
                        const now = new Date();
                        return orderDate.getMonth() === now.getMonth() && 
                               orderDate.getFullYear() === now.getFullYear() &&
                               order.status !== 'cancelled';
                      }).length || 0} orders
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Active Bookings Today */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bookings Today</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {projectBookings?.filter(booking => {
                        if (!booking.date) return false;
                        const bookingDate = new Date(booking.date);
                        const today = new Date();
                        return bookingDate.toDateString() === today.toDateString();
                      }).length || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Active for today</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Avg. Response Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {openComplaintsCount > 0 ? '< 24h' : '< 2h'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {openComplaintsCount > 0 ? 'Some delays' : 'On track'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  </div>
                </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Order Completion</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {projectOrders && projectOrders.length > 0 
                        ? Math.round((getOrderStats().delivered / projectOrders.length) * 100) 
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getOrderStats().delivered} of {projectOrders?.length || 0} delivered
                    </p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <Trophy className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Breakdown */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Bookings Breakdown
                </h3>
                    <button
                  onClick={() => handleTabChange('bookings')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition-colors"
                  title="View all bookings in detail"
                    >
                  View All Bookings
                </button>
                      </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border-2 border-blue-200">
                  <div className="flex justify-center mb-2">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {projectBookings?.filter(b => b.type === 'court' || b.courtId).length || 0}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Court Bookings</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {projectBookings?.filter(b => (b.type === 'court' || b.courtId) && b.status === 'confirmed').length || 0} confirmed
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border-2 border-purple-200">
                  <div className="flex justify-center mb-2">
                    <School className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {projectBookings?.filter(b => b.type === 'academy' || b.academyId).length || 0}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Academy Bookings</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {projectBookings?.filter(b => (b.type === 'academy' || b.academyId) && b.status === 'confirmed').length || 0} confirmed
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 text-center border-2 border-teal-200">
                  <div className="flex justify-center mb-2">
                    <Wrench className="h-6 w-6 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-teal-900">{serviceBookings?.length || 0}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Service Bookings</p>
                  <p className="text-xs text-teal-600 mt-1">
                    {serviceBookings?.filter(b => b.status === 'pending').length || 0} pending
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border-2 border-green-200">
                  <div className="flex justify-center mb-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{upcomingBookingsCount}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Upcoming</p>
                  <p className="text-xs text-green-600 mt-1">
                    {projectBookings?.filter(b => {
                      if (!b.date) return false;
                      const bookingDate = new Date(b.date);
                      const today = new Date();
                      const weekFromNow = new Date(today);
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      return bookingDate >= today && bookingDate <= weekFromNow;
                    }).length || 0} this week
                  </p>
                </div>
              </div>
            </div>

            {/* Orders & Revenue Analytics */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                  E-Commerce Analytics
                </h3>
                <button 
                  onClick={() => handleTabChange('orders')}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition-colors"
                  title="View all orders in detail"
                >
                  View All Orders
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 text-center border-2 border-green-200">
                  <p className="text-2xl font-bold text-green-900">{projectOrders?.length || 0}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Total Orders</p>
                  <p className="text-xs text-green-600 mt-1">All time</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg p-4 text-center border-2 border-amber-200">
                  <p className="text-2xl font-bold text-amber-900">{getOrderStats().pending}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Pending</p>
                  <p className="text-xs text-amber-600 mt-1">Needs action</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg p-4 text-center border-2 border-blue-200">
                  <p className="text-2xl font-bold text-blue-900">{getOrderStats().processing}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Processing</p>
                  <p className="text-xs text-blue-600 mt-1">In progress</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg p-4 text-center border-2 border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-900">{getOrderStats().delivered}</p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Delivered</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {projectOrders && projectOrders.length > 0 
                      ? Math.round((getOrderStats().delivered / projectOrders.length) * 100) 
                      : 0}% success
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg p-4 text-center border-2 border-teal-200">
                  <p className="text-xl font-bold text-teal-900">
                    EGP {projectOrders?.reduce((sum, order) => order.status !== 'cancelled' ? sum + (order.total || 0) : sum, 0).toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">Total Revenue</p>
                  <p className="text-xs text-teal-600 mt-1">All orders</p>
                </div>
              </div>
              
              {/* Store-wise breakdown */}
              {stores && stores.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-green-600" />
                    Store Performance
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stores.slice(0, 4).map((store) => {
                      const storeOrders = projectOrders?.filter(order => 
                        order.items?.some(item => item.storeId === store.id)
                      ) || [];
                      const storeRevenue = storeOrders.reduce((sum, order) => 
                        order.status !== 'cancelled' ? sum + (order.total || 0) : sum, 0
                      );
                      
                      return (
                        <div 
                          key={store.id} 
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer" 
                          onClick={() => handleTabChange('store')}
                          title={`View ${store.name} store details`}
                        >
                          <p className="text-sm font-semibold text-gray-900 truncate">{store.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-600">{storeOrders.length} orders</span>
                            <span className="text-xs font-bold text-green-700">EGP {storeRevenue.toFixed(0)}</span>
                          </div>
                        </div>
                  );
                })}
                    {stores.length > 4 && (
                      <div 
                        className="bg-gray-100 rounded-lg p-3 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" 
                        onClick={() => handleTabChange('store')}
                        title="View all stores"
                      >
                        <p className="text-sm font-bold text-gray-600">+{stores.length - 4} more</p>
              </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Items & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Actions */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                    Pending Actions
                  </h3>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-bold rounded-full">
                    {pendingUsersCount + pendingServiceRequestsCount + pendingOrdersCount + openComplaintsCount + pendingFinesCount + pendingGatePassCount + (requestSubmissions?.filter(r => r.status === 'pending').length || 0) + (isSuperAdmin() ? pendingAdminsCount : 0) + (deviceResetRequests?.filter(r => r.status === 'pending').length || 0)} Total
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingUsersCount > 0 && (
                      <button
                      onClick={() => handleTabChange('users')}
                      className="w-full flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      >
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">User Approvals</p>
                          <p className="text-xs text-gray-600">Pending user registrations</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingUsersCount}
                      </span>
                      </button>
                  )}
                  
                  {pendingServiceRequestsCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('services')}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="h-5 w-5 text-blue-600" />
                </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Service Requests</p>
                          <p className="text-xs text-gray-600">Pending service bookings</p>
              </div>
            </div>
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingServiceRequestsCount}
                      </span>
                    </button>
                  )}

                  {requestSubmissions?.filter(r => r.status === 'pending').length > 0 && (
                    <button 
                      onClick={() => handleTabChange('requests')}
                      className="w-full flex items-center justify-between p-4 bg-cyan-50 border-l-4 border-cyan-500 rounded-lg hover:bg-cyan-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <FileText className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">User Requests</p>
                          <p className="text-xs text-gray-600">Request submissions pending review</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-cyan-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {requestSubmissions.filter(r => r.status === 'pending').length}
                      </span>
                    </button>
                  )}

                  {pendingOrdersCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('orders')}
                      className="w-full flex items-center justify-between p-4 bg-green-50 border-l-4 border-green-500 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">New Orders</p>
                          <p className="text-xs text-gray-600">Orders to process</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingOrdersCount}
                      </span>
                    </button>
                  )}

                  {openComplaintsCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('complaints')}
                      className="w-full flex items-center justify-between p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Open Complaints</p>
                          <p className="text-xs text-gray-600">Complaints to resolve</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {openComplaintsCount}
                      </span>
                    </button>
                  )}

                  {pendingFinesCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('fines')}
                      className="w-full flex items-center justify-between p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Pending Fines</p>
                          <p className="text-xs text-gray-600">Fines to review</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingFinesCount}
                      </span>
                    </button>
                  )}

                  {pendingGatePassCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('gatepass')}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Key className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Gate Pass Requests</p>
                          <p className="text-xs text-gray-600">Passes to approve</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingGatePassCount}
                      </span>
                    </button>
                  )}

                  {isSuperAdmin() && pendingAdminsCount > 0 && (
                    <button 
                      onClick={() => handleTabChange('admins')}
                      className="w-full flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <UserPlus className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Admin Requests</p>
                          <p className="text-xs text-gray-600">New admin accounts to approve</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {pendingAdminsCount}
                      </span>
                    </button>
                  )}

                  {deviceResetRequests?.filter(r => r.status === 'pending').length > 0 && (
                    <button 
                      onClick={() => handleTabChange('device_keys')}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Smartphone className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-bold text-gray-900">Device Reset Requests</p>
                          <p className="text-xs text-gray-600">Users requesting new device access</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full animate-pulse">
                        {deviceResetRequests.filter(r => r.status === 'pending').length}
                      </span>
                    </button>
                  )}

                  {(pendingUsersCount + pendingServiceRequestsCount + pendingOrdersCount + openComplaintsCount + pendingFinesCount + pendingGatePassCount + (requestSubmissions?.filter(r => r.status === 'pending').length || 0) + (isSuperAdmin() ? pendingAdminsCount : 0) + (deviceResetRequests?.filter(r => r.status === 'pending').length || 0)) === 0 && (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-lg">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-gray-900">🎉 All Caught Up!</p>
                      <p className="text-sm text-gray-600 mt-2">No pending actions at the moment</p>
                      <p className="text-xs text-gray-500 mt-1">Your team is doing great!</p>
                    </div>
                  )}
              </div>
            </div>

              {/* Comprehensive System Status */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-red-600" />
                    System Overview
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center shadow-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    All Systems Online
                  </span>
                </div>
              <div className="space-y-3">
                  {/* Users System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('users')}
                    title="Click to manage users"
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Users className="h-5 w-5 text-red-600" />
                </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Users Management</p>
                        {pendingUsersCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {pendingUsersCount}
                          </span>
                        )}
                </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {stats.totalUsers} total • {stats.activeUsers} active • {stats.pendingUsers} pending • 
                        {projectUsers.filter(u => u.createdByAdmin && u.registrationStep === 'awaiting_password').length > 0 && (
                          <span className="text-purple-700 font-bold"> {projectUsers.filter(u => u.createdByAdmin && u.registrationStep === 'awaiting_password').length} awaiting password</span>
                        )}
                      </p>
                </div>
                </div>

                  {/* Bookings System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('bookings')}
                    title="Click to manage bookings"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
              </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Bookings System</p>
                        {upcomingBookingsCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {upcomingBookingsCount}
                          </span>
                        )}
            </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {projectBookings?.length || 0} total • {projectBookings?.filter(b => b.type === 'court').length || 0} courts • {projectBookings?.filter(b => b.type === 'academy').length || 0} academies • {serviceBookings?.length || 0} services
                      </p>
          </div>
                  </div>

                  {/* Orders System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('orders')}
                    title="Click to manage e-commerce orders"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">E-Commerce</p>
                        {pendingOrdersCount > 0 && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {pendingOrdersCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {projectOrders?.length || 0} orders • {getOrderStats().pending} pending • {getOrderStats().processing} processing • {getOrderStats().delivered} delivered • {stores?.length || 0} stores
                      </p>
                    </div>
                  </div>

                  {/* Requests System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border-l-4 border-cyan-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('requests')}
                    title="Click to manage user requests"
                  >
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <FileText className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Requests System</p>
                        {requestSubmissions?.filter(r => r.status === 'pending').length > 0 && (
                          <span className="px-2 py-0.5 bg-cyan-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {requestSubmissions.filter(r => r.status === 'pending').length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {requestCategories?.length || 0} categories • {requestSubmissions?.length || 0} submissions • 
                        {requestSubmissions?.filter(r => r.status === 'approved').length || 0} approved
                      </p>
                    </div>
                  </div>

                  {/* Communications */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('events')}
                    title="Click to manage notifications & communications"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Communications</p>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {stats.activeNotifications} notifications • {newsItems?.length || 0} news articles • {adsItems?.length || 0} ads
                      </p>
                    </div>
                  </div>

                  {/* Support System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('complaints')}
                    title="Click to manage support tickets & complaints"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Support & Complaints</p>
                        {(openComplaintsCount + openSupportTicketsCount) > 0 && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {openComplaintsCount + openSupportTicketsCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {complaints?.length || 0} complaints ({openComplaintsCount} open) • {supportTickets?.length || 0} tickets • 
                        {complaints && complaints.length > 0 && (
                          <span className="text-green-700 font-bold">
                            {Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100)}% resolved
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Security System */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border-l-4 border-slate-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('fines')}
                    title="Click to manage security, fines & gate passes"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Shield className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Security & Compliance</p>
                        {(pendingFinesCount + pendingGatePassCount) > 0 && (
                          <span className="px-2 py-0.5 bg-slate-600 text-white text-xs font-bold rounded-full animate-pulse">
                            {pendingFinesCount + pendingGatePassCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {guards?.length || 0} guards • {fines?.length || 0} fines • {gatePasses?.length || 0} gate passes • {guards?.filter(g => g.status === 'active' || g.isActive).length || 0} on duty
                      </p>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div 
                    className="flex items-start p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-all cursor-pointer" 
                    onClick={() => handleTabChange('courts')}
                    title="Click to manage sports facilities"
                  >
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-gray-900">Sports Facilities</p>
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">
                        {courts?.length || 0} courts • {academies?.length || 0} academies • 
                        {academies?.reduce((sum, academy) => sum + (academy.programs?.length || 0), 0) || 0} programs
                      </p>
                    </div>
                  </div>

                  {/* Admin Accounts - Super Admin or Full Access Only */}
                  {(isSuperAdmin() || currentAdmin?.accountType === 'full_access') && (
                    <div 
                      className="flex items-start p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500 hover:shadow-md transition-all cursor-pointer" 
                      onClick={() => handleTabChange('admins')}
                      title="Click to manage admin accounts"
                    >
                      <div className="p-2 bg-red-100 rounded-lg">
                        <UserPlus className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900">Admin Accounts</p>
                          {isSuperAdmin() && pendingAdminsCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                              {pendingAdminsCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 mt-1.5 font-medium">
                          {projectAdmins?.length || 0} total • {projectAdmins?.filter(a => a.isActive).length || 0} active • 
                          {isSuperAdmin() && pendingAdminsCount > 0 && (
                            <span className="text-red-700 font-bold"> {pendingAdminsCount} pending approval</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Facilities & Services Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Courts & Academies */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg border-2 border-indigo-200 p-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                  Sports Facilities
                </h3>
              <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">Courts</p>
                          <p className="text-xs text-gray-600">{courts?.filter(c => c.active).length || 0} active courts</p>
                </div>
                </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">{courts?.length || 0}</p>
                        {getNotificationCount('courts') > 0 && (
                          <span className="text-xs font-bold text-amber-700">{getNotificationCount('courts')} bookings</span>
                        )}
                </div>
              </div>
            </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <School className="h-5 w-5 text-purple-600" />
          </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">Academies</p>
                          <p className="text-xs text-gray-600">
                            {academies?.reduce((sum, academy) => sum + (academy.programs?.length || 0), 0) || 0} programs
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-900">{academies?.length || 0}</p>
                        {getNotificationCount('academies') > 0 && (
                          <span className="text-xs font-bold text-amber-700">{getNotificationCount('academies')} bookings</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services & Requests */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg border-2 border-teal-200 p-6">
                <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-teal-600" />
                  Services & Requests
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Wrench className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">Service Categories</p>
                          <p className="text-xs text-gray-600">{serviceBookings?.length || 0} total bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-900">{serviceCategories?.length || 0}</p>
                        {pendingServiceRequestsCount > 0 && (
                          <span className="text-xs font-bold text-red-700 animate-pulse">{pendingServiceRequestsCount} pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <FileText className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">Request Categories</p>
                          <p className="text-xs text-gray-600">{requestSubmissions?.length || 0} submissions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-900">{requestCategories?.length || 0}</p>
                        {requestSubmissions?.filter(r => r.status === 'pending').length > 0 && (
                          <span className="text-xs font-bold text-red-700 animate-pulse">
                            {requestSubmissions.filter(r => r.status === 'pending').length} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Communication & Content */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg border-2 border-pink-200 p-6">
                <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center">
                  <Newspaper className="h-5 w-5 mr-2 text-pink-600" />
                  Communication
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Newspaper className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">News Articles</p>
                          <p className="text-xs text-gray-600">
                            {newsItems?.filter(n => n.status === 'active' || n.published).length || 0} published
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{newsItems?.length || 0}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">Advertisements</p>
                          <p className="text-xs text-gray-600">
                            {adsItems?.filter(a => a.status === 'active' || a.isActive).length || 0} active
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">{adsItems?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Compliance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Gate Passes */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-indigo-500 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Key className="h-7 w-7 text-indigo-600" />
                  </div>
                  {pendingGatePassCount > 0 && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      {pendingGatePassCount}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Gate Passes</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">{gatePasses?.length || 0}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {gatePasses?.filter(p => p.status === 'active').length || 0} active
                  </span>
                  <span className="text-amber-700 font-bold">
                    {gatePasses?.filter(p => {
                      if (!p.validFrom) return false;
                      const passDate = new Date(p.validFrom);
                      const today = new Date();
                      return passDate.toDateString() === today.toDateString();
                    }).length || 0} today
                  </span>
                </div>
              </div>

              {/* Fines */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <AlertTriangle className="h-7 w-7 text-orange-600" />
                  </div>
                  {pendingFinesCount > 0 && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      {pendingFinesCount}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Fines & Violations</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">{fines?.length || 0}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {fines?.filter(f => f.status === 'paid').length || 0} paid
                  </span>
                  <span className="text-red-700 font-bold">
                    EGP {fines?.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.amount || 0), 0).toFixed(0) || 0} unpaid
                  </span>
                </div>
              </div>

              {/* Guards */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-slate-500 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Shield className="h-7 w-7 text-slate-600" />
                  </div>
                  {guards?.filter(g => g.status === 'active' || g.isActive).length > 0 && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                      {guards.filter(g => g.status === 'active' || g.isActive).length}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Security Guards</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">{guards?.length || 0}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-bold">
                    {guards?.filter(g => g.status === 'active' || g.isActive).length || 0} on duty
                  </span>
                  <span className="text-gray-600">
                    {guards?.filter(g => g.status === 'inactive' || !g.isActive).length || 0} off duty
                  </span>
                </div>
              </div>

              {/* Stores */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <ShoppingBag className="h-7 w-7 text-green-600" />
                  </div>
                  {stores?.filter(s => s.status === 'active' || s.isActive).length > 0 && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                      {stores.filter(s => s.status === 'active' || s.isActive).length}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Stores</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stores?.length || 0}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-bold">
                    {stores?.filter(s => s.status === 'active' || s.isActive).length || 0} active
                  </span>
                  <span className="text-gray-600">
                    {projectOrders?.length || 0} total orders
                  </span>
                </div>
              </div>

              {/* Admin Accounts */}
              <div 
                className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-5 hover:shadow-lg transition-all cursor-pointer" 
                onClick={() => handleTabChange('admins')}
                title="Click to manage admin accounts & permissions"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <UserPlus className="h-7 w-7 text-red-600" />
                  </div>
                  {isSuperAdmin() && pendingAdminsCount > 0 && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      {pendingAdminsCount}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Admin Accounts</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">{projectAdmins?.length || 0}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-bold">
                    {projectAdmins?.filter(a => a.isActive).length || 0} active
                  </span>
                  {isSuperAdmin() && (
                    <span className="text-red-700 font-bold">
                      {pendingAdminsCount > 0 ? `${pendingAdminsCount} pending` : 'All approved'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request System Analytics */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-cyan-600" />
                    Request System
                  </h3>
                  {requestSubmissions?.filter(r => r.status === 'pending').length > 0 && (
                    <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                      {requestSubmissions.filter(r => r.status === 'pending').length} Pending
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cyan-50 rounded-lg p-4 text-center border border-cyan-200">
                    <p className="text-3xl font-bold text-cyan-900">{requestCategories?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Categories</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <p className="text-3xl font-bold text-blue-900">{requestSubmissions?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Submissions</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-900">
                      {requestSubmissions?.filter(r => r.status === 'approved' || r.status === 'completed').length || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Approved</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                    <p className="text-3xl font-bold text-amber-900">
                      {requestSubmissions?.filter(r => r.status === 'pending').length || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Pending Review</p>
                  </div>
                </div>
                {requestSubmissions && requestSubmissions.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <p className="text-xs text-gray-700 flex items-center justify-between">
                      <span className="font-semibold">Recent Activity:</span>
                      <span className="text-cyan-700 font-bold">
                        {requestSubmissions.filter(r => {
                          const createdDate = r.createdAt?.toDate?.() || new Date(r.createdAt);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return createdDate >= weekAgo;
                        }).length} this week
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Support & Complaints Analytics */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                    Support System
                  </h3>
                  {(openComplaintsCount + openSupportTicketsCount) > 0 && (
                    <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                      {openComplaintsCount + openSupportTicketsCount} Open
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                    <p className="text-3xl font-bold text-purple-900">{complaints?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Total Complaints</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                    <p className="text-3xl font-bold text-amber-900">{openComplaintsCount}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Open/In Progress</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <p className="text-3xl font-bold text-blue-900">{supportTickets?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Support Tickets</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-900">
                      {complaints?.filter(c => c.status === 'Resolved' || c.status === 'Closed').length || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">Resolved</p>
                  </div>
                </div>
                {complaints && complaints.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-700 flex items-center justify-between">
                      <span className="font-semibold">Resolution Rate:</span>
                      <span className="text-purple-700 font-bold">
                        {Math.round((complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length / complaints.length) * 100)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-red-600" />
                  Recent Activity
                </h3>
                <button 
                  onClick={refreshAllData}
                  className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center"
                >
                  <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  // Gather all recent activities
                  const activities = [];
                  
                  // Recent orders
                  if (projectOrders && projectOrders.length > 0) {
                    projectOrders.slice(0, 3).forEach(order => {
                      activities.push({
                        type: 'order',
                        icon: Package,
                        color: 'green',
                        title: `New order #${order.orderNumber || order.id.slice(0, 8)}`,
                        description: `${order.items?.length || 0} items • EGP ${order.total || 0}`,
                        time: order.createdAt,
                        status: order.status
                      });
                    });
                  }
                  
                  // Recent bookings
                  if (projectBookings && projectBookings.length > 0) {
                    projectBookings.slice(0, 3).forEach(booking => {
                      activities.push({
                        type: 'booking',
                        icon: Calendar,
                        color: 'blue',
                        title: booking.type === 'court' ? `Court booking: ${booking.courtName}` : `Academy: ${booking.academyName}`,
                        description: `${booking.date} • ${booking.status}`,
                        time: booking.createdAt,
                        status: booking.status
                      });
                    });
                  }
                  
                  // Recent complaints
                  if (complaints && complaints.length > 0) {
                    complaints.slice(0, 2).forEach(complaint => {
                      activities.push({
                        type: 'complaint',
                        icon: MessageCircle,
                        color: 'purple',
                        title: `Complaint: ${complaint.title || 'Untitled'}`,
                        description: `${complaint.category || 'General'} • ${complaint.status}`,
                        time: complaint.createdAt,
                        status: complaint.status
                      });
                    });
                  }
                  
                  // Recent request submissions
                  if (requestSubmissions && requestSubmissions.length > 0) {
                    requestSubmissions.slice(0, 2).forEach(request => {
                      activities.push({
                        type: 'request',
                        icon: FileText,
                        color: 'cyan',
                        title: `New request submission`,
                        description: `Category: ${request.categoryName || 'Unknown'} • ${request.status}`,
                        time: request.createdAt,
                        status: request.status
                      });
                    });
                  }
                  
                  // Recent users
                  if (projectUsers && projectUsers.length > 0) {
                    projectUsers
                      .sort((a, b) => {
                        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
                        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
                        return bTime - aTime;
                      })
                      .slice(0, 2)
                      .forEach(user => {
                        activities.push({
                          type: 'user',
                          icon: Users,
                          color: 'red',
                          title: `New user: ${user.firstName} ${user.lastName}`,
                          description: `${user.email} • ${user.approvalStatus}`,
                          time: user.createdAt,
                          status: user.approvalStatus
                        });
                      });
                  }
                  
                  // Sort all activities by time
                  activities.sort((a, b) => {
                    const aTime = a.time?.toDate?.() || new Date(a.time);
                    const bTime = b.time?.toDate?.() || new Date(b.time);
                    return bTime - aTime;
                  });
                  
                  // Display recent activities
                  return activities.slice(0, 10).map((activity, index) => {
                    const Icon = activity.icon;
                    const colorClasses = {
                      red: 'bg-red-50 border-red-200',
                      blue: 'bg-blue-50 border-blue-200',
                      green: 'bg-green-50 border-green-200',
                      purple: 'bg-purple-50 border-purple-200',
                      cyan: 'bg-cyan-50 border-cyan-200',
                      orange: 'bg-orange-50 border-orange-200'
                    };
                    
                    const iconColorClasses = {
                      red: 'bg-red-100 text-red-600',
                      blue: 'bg-blue-100 text-blue-600',
                      green: 'bg-green-100 text-green-600',
                      purple: 'bg-purple-100 text-purple-600',
                      cyan: 'bg-cyan-100 text-cyan-600',
                      orange: 'bg-orange-100 text-orange-600'
                    };
                    
                    const timeAgo = activity.time ? (() => {
                      const activityTime = activity.time?.toDate?.() || new Date(activity.time);
                      const now = new Date();
                      const diffMs = now - activityTime;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 1) return 'Just now';
                      if (diffMins < 60) return `${diffMins}m ago`;
                      if (diffHours < 24) return `${diffHours}h ago`;
                      return `${diffDays}d ago`;
                    })() : 'Unknown';
                    
                    return (
                      <div key={index} className={`flex items-start p-3 rounded-lg border ${colorClasses[activity.color]} hover:shadow-md transition-all`}>
                        <div className={`p-2 rounded-lg ${iconColorClasses[activity.color]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                            <span className="text-xs text-gray-500">{timeAgo}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {(!projectOrders || projectOrders.length === 0) && 
                 (!projectBookings || projectBookings.length === 0) && 
                 (!complaints || complaints.length === 0) && (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Activity will appear here as it happens</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-600" />
                Quick Navigation
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {serviceTabs.slice(1).map((tab) => {
                  const Icon = tab.icon;
                  const notificationCount = getNotificationCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className="relative flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all hover:scale-105 group"
                    >
                      {notificationCount > 0 && (
                        <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                          {notificationCount}
                        </span>
                      )}
                      <div className="p-3 bg-gray-100 rounded-xl mb-2 group-hover:bg-red-100 transition-colors">
                        <Icon className="h-6 w-6 text-gray-600 group-hover:text-red-600 transition-colors" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-red-700 transition-colors">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
              <PermissionGate entity="users" action="read" showMessage={true}>
          <div id="users-section" className="space-y-6">
            {/* Users Header */}
            <div className="flex items-center justify-between">
              <div>
                      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="mt-1 text-sm text-gray-500">
                        Manage user accounts, approvals, and project access
                </p>
              </div>
                    <PermissionGate entity="users" action="create">
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                title="Create a new user account for this project"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </button>
                    </PermissionGate>
                  </div>

                  {/* Deletion Status Tabs */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-4">
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setDeletionStatusFilter('active')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          deletionStatusFilter === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Active Users ({projectUsers.filter(u => !u.isDeleted).length})
                      </button>
                      <button
                        onClick={() => setDeletionStatusFilter('deleted')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          deletionStatusFilter === 'deleted'
                            ? 'bg-red-100 text-red-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Deleted Users ({projectUsers.filter(u => u.isDeleted).length})
                      </button>
                      <button
                        onClick={() => setDeletionStatusFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          deletionStatusFilter === 'all'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All Users ({projectUsers.length})
                      </button>
                    </div>
                  </div>

                  {/* User Status Tabs */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    <div className="grid grid-cols-5 gap-1">
                      <button
                        onClick={() => setUserStatusFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          userStatusFilter === 'all'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All Users ({projectUsers.length})
                      </button>
                      <button
                        onClick={() => setUserStatusFilter('pending')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          userStatusFilter === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Pending ({projectUsers.filter(user => user.approvalStatus === 'pending').length})
                      </button>
                      <button
                        onClick={() => setUserStatusFilter('approved')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          userStatusFilter === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Approved ({projectUsers.filter(user => user.approvalStatus === 'approved').length})
                      </button>
                      <button
                        onClick={() => setUserStatusFilter('rejected')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          userStatusFilter === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Rejected ({projectUsers.filter(user => user.approvalStatus === 'rejected').length})
                      </button>
                      <button
                        onClick={() => setUserStatusFilter('awaiting_password')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          userStatusFilter === 'awaiting_password'
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Awaiting Password ({projectUsers.filter(user => 
                          user.createdByAdmin && 
                          user.registrationStatus === 'in_progress' && 
                          user.registrationStep === 'awaiting_password'
                        ).length})
                      </button>
                    </div>
            </div>

            {/* Migration Status Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Migration Status
                </h3>
              </div>
              <div className="p-1">
                <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setMigrationStatusFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    migrationStatusFilter === 'all'
                      ? 'bg-gray-100 text-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Users ({projectUsers.length})
                </button>
                <button
                  onClick={() => setMigrationStatusFilter('migrated')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    migrationStatusFilter === 'migrated'
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ✅ Migrated ({projectUsers.filter(user => user.migrated === true).length})
                </button>
                <button
                  onClick={() => setMigrationStatusFilter('needs_migration')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    migrationStatusFilter === 'needs_migration'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ⚠️ Needs Migration ({projectUsers.filter(user => user.oldId && user.migrated !== true).length})
                </button>
                <button
                  onClick={() => setMigrationStatusFilter('new_users')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    migrationStatusFilter === 'new_users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🆕 New Users ({projectUsers.filter(user => !user.oldId).length})
                </button>
              </div>
              </div>
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
                <select
                  value={migrationStatusFilter}
                  onChange={(e) => setMigrationStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="migrated">✅ Migrated</option>
                  <option value="needs_migration">⚠️ Needs Migration</option>
                  <option value="new_users">🆕 New Users</option>
                </select>
              </div>
              
              {/* Pagination Info and Items Per Page Selector */}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalUsersCount)} of {totalUsersCount} users
                  </div>
                  
                  {/* Clear Filters Button */}
                  {(searchTerm || statusFilter !== 'all' || userStatusFilter !== 'all' || migrationStatusFilter !== 'all' || deletionStatusFilter !== 'active') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setUserStatusFilter('all');
                        setMigrationStatusFilter('all');
                        setDeletionStatusFilter('active');
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center font-medium"
                      title="Reset all filters to show all users"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All Filters
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={50}>50 (Recommended)</option>
                    <option value={20}>20</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-500">per page</span>
                </div>
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
                    {!dataLoaded ? (
                      // Skeleton loading for users
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`skeleton-${index}`} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                              </div>
                              <div className="ml-4">
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-48"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-8 bg-gray-200 rounded w-20"></div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => {
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
                                {userProject?.isSuspended ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <UserX className="h-3 w-3 mr-1" />
                                      Suspended
                                    </span>
                                    {userProject.suspensionType === 'temporary' && userProject.suspensionEndDate && (
                                      <span className="text-xs text-gray-500">
                                        Until {new Date(userProject.suspensionEndDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-1">
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                      user.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                                        : user.approvalStatus === 'pending'
                                          ? 'bg-amber-100 text-amber-800'
                                          : user.approvalStatus === 'rejected'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.approvalStatus || 'pending'}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                                      user.registrationStatus === 'completed'
                                        ? 'bg-blue-100 text-blue-700'
                              : user.registrationStatus === 'in_progress'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : user.registrationStatus === 'pending'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-700'
                              }`}>
                              {user.registrationStatus}
                            </span>
                                    {/* Migration status badge */}
                                    {user.migrated === true && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">
                                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Migrated
                                      </span>
                                    )}
                                    {user.oldId && user.migrated !== true && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Needs Migration
                                      </span>
                                    )}
                                    {/* Show awaiting password indicator for admin-created users */}
                                    {user.createdByAdmin && user.registrationStatus === 'in_progress' && user.registrationStep === 'awaiting_password' && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                          Awaiting Password
                                        </span>
                                        {user.passwordResetCount > 1 && (
                                          <span className="block text-xs text-gray-500 mt-1">
                                            Email sent {user.passwordResetCount}x
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-1">
                                  <PermissionGate entity="users" action="read">
                              <button
                                onClick={() => handleUserAction('view', user)}
                                className="group relative text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                      title="View user details and full profile"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs font-medium hidden xl:inline">View</span>
                              </button>
                                  </PermissionGate>
                                  
                                  {/* Resend Email for Admin-Created Users Awaiting Password */}
                                  {user.createdByAdmin && user.registrationStatus === 'in_progress' && user.registrationStep === 'awaiting_password' && (
                                    <PermissionGate entity="users" action="write">
                                      <button
                                        onClick={() => handleUserAction('resend_email', user)}
                                        className="group relative text-purple-600 hover:text-purple-900 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1 animate-pulse"
                                        title="Resend password setup email to user"
                                      >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs font-medium hidden xl:inline">Resend</span>
                                      </button>
                                    </PermissionGate>
                                  )}
                                  
                                  {/* Approval Actions for Pending Users */}
                                  {user.approvalStatus === 'pending' && (
                                    <>
                                      <PermissionGate entity="users" action="write">
                                        <button
                                          onClick={() => handleUserAction('approve', user)}
                                          className="group relative text-green-600 hover:text-green-900 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                                          title="Approve this user's registration"
                                        >
                                          <UserCheck className="h-4 w-4" />
                                          <span className="text-xs font-medium hidden xl:inline">Approve</span>
                                        </button>
                                      </PermissionGate>
                                      <PermissionGate entity="users" action="write">
                                        <button
                                          onClick={() => handleUserAction('reject', user)}
                                          className="group relative text-red-600 hover:text-red-900 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                                          title="Reject this user's registration"
                                        >
                                          <UserX className="h-4 w-4" />
                                          <span className="text-xs font-medium hidden xl:inline">Reject</span>
                                        </button>
                                      </PermissionGate>
                                    </>
                                  )}

                                  {/* Regular Actions for Approved Users */}
                                  {user.approvalStatus === 'approved' && (
                                    <>
                                      <PermissionGate entity="users" action="write">
                              <button
                                onClick={() => handleUserAction('edit', user)}
                                className="group relative text-green-600 hover:text-green-900 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                                          title="Edit user information"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="text-xs font-medium hidden xl:inline">Edit</span>
                              </button>
                                      </PermissionGate>
                                      {userProject?.isSuspended ? (
                                        <PermissionGate entity="users" action="write">
                              <button
                                            onClick={() => handleUserAction('unsuspend', user)}
                                            className="group relative text-green-600 hover:text-green-900 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                                            title="Restore user account access for this project"
                                          >
                                            <UserCheck className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden xl:inline">Unsuspend</span>
                                          </button>
                                        </PermissionGate>
                                      ) : (
                                        <PermissionGate entity="users" action="write">
                                          <button
                                            onClick={() => handleUserAction('suspend', user)}
                                            className="group relative text-orange-600 hover:text-orange-900 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
                                            title="Suspend user from this project only"
                                          >
                                            <UserX className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden xl:inline">Suspend</span>
                                          </button>
                                        </PermissionGate>
                                      )}

                                      {/* Soft Delete / Restore */}
                                      {!user.isDeleted ? (
                                        <PermissionGate entity="users" action="delete">
                                          <button
                                            onClick={() => handleUserAction('soft_delete', user)}
                                            className="group relative text-red-600 hover:text-red-900 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                                            title="Soft delete user (revoke all access)"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden xl:inline">Delete</span>
                                          </button>
                                        </PermissionGate>
                                      ) : (
                                        <PermissionGate entity="users" action="write">
                                          <button
                                            onClick={() => handleUserAction('restore', user)}
                                            className="group relative text-green-600 hover:text-green-900 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                                            title="Restore user account"
                                          >
                                            <UserCheck className="h-4 w-4" />
                                            <span className="text-xs font-medium hidden xl:inline">Restore</span>
                                          </button>
                                        </PermissionGate>
                                      )}
                                    </>
                                  )}

                                  <PermissionGate entity="users" action="delete">
                                    <button
                                      onClick={() => handleUserAction('remove', user)}
                                      className="group relative text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                                      title="Remove user from this project only"
                              >
                                      <Unlink className="h-4 w-4" />
                                      <span className="text-xs font-medium hidden xl:inline">Remove from Project</span>
                              </button>
                                  </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                    )}
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, totalUsersCount)}</span> of{' '}
                        <span className="font-medium">{totalUsersCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {getPageNumbers().map((pageNum, index) => (
                          pageNum === '...' ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
              </PermissionGate>
        )}

        {activeTab === 'units' && (
          <PermissionGate entity="users" action="read" showMessage={true}>
            <div className="services-management">
              {/* Units Header */}
              <div className="page-header bg-gradient-to-r from-red-600 to-red-700 text-white">
                <div className="header-content">
                  <div className="header-left">
                    <div className="header-icon">
                      <Building className="h-6 w-6" />
                </div>
                    <div className="header-text">
                      <h1>Units Management</h1>
                      <p>View all project units, occupancy status, and manage unit access requests</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Navigation Cards */}
              <div className="services-nav-grid">
                <div 
                  className={`nav-card ${unitsSubTab === 'units' ? 'active' : ''}`}
                  onClick={() => setUnitsSubTab('units')}
                >
                  <div className="nav-card-icon">
                    <Building className="h-6 w-6" />
                  </div>
                  <div className="nav-card-content">
                    <h3>Units & Occupancy</h3>
                    <p>View all project units and their current occupancy status</p>
                    <div className="nav-card-badge">{units.length} Units</div>
                  </div>
                </div>
                
                <div 
                  className={`nav-card ${unitsSubTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setUnitsSubTab('requests')}
                >
                  <div className="nav-card-icon">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="nav-card-content">
                    <h3>Unit Requests</h3>
                    <p>Review and approve user requests to add new units</p>
                    {unitRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div className="nav-card-badge badge-warning">
                        {unitRequests.filter(r => r.status === 'pending').length} Pending
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Units Content */}
              <div className="services-content">

              {unitsSubTab === 'units' && (
                <>
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Total Units</p>
                    <p className="text-3xl font-bold text-gray-900">{units.length}</p>
                  </div>
                  </div>
                  <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowBuildingModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg font-medium"
                    title="View building breakdown"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    View Buildings
                  </button>
                  <ExportButton dataType="units" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg" />
                  <button
                    onClick={() => fetchUnits(projectId)}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors flex items-center font-medium"
                    title="Refresh units data"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Search Input */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by unit number or building..."
                      value={unitSearchTerm}
                      onChange={(e) => setUnitSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Building Filter */}
                  <select
                    value={unitBuildingFilter}
                    onChange={(e) => setUnitBuildingFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Buildings</option>
                    {[...new Set(enrichedUnits.map(u => u.buildingNum))].sort((a, b) => a - b).map(building => (
                      <option key={building} value={building}>Building {building}</option>
                    ))}
                  </select>

                  {/* Occupancy Filter */}
                  <select
                    value={unitOccupancyFilter}
                    onChange={(e) => setUnitOccupancyFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="occupied">Occupied Only</option>
                    <option value="vacant">Vacant Only</option>
                  </select>

                  {/* Floor Filter */}
                  <select
                    value={unitFloorFilter}
                    onChange={(e) => setUnitFloorFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Floors</option>
                    {[...new Set(enrichedUnits.map(u => u.floor).filter(Boolean))].sort().map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>

                {/* Second Row - Developer Filter and Clear Filters */}
                <div className="mt-4 flex items-center space-x-4">
                  <select
                    value={unitDeveloperFilter}
                    onChange={(e) => setUnitDeveloperFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Developers</option>
                    {[...new Set(enrichedUnits.map(u => u.developer).filter(Boolean))].sort().map(developer => (
                      <option key={developer} value={developer}>{developer}</option>
                    ))}
                  </select>

                  {/* Clear Filters Button */}
                  {(unitSearchTerm || unitBuildingFilter !== 'all' || unitOccupancyFilter !== 'all' || 
                    unitFloorFilter !== 'all' || unitDeveloperFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setUnitSearchTerm('');
                        setUnitBuildingFilter('all');
                        setUnitOccupancyFilter('all');
                        setUnitFloorFilter('all');
                        setUnitDeveloperFilter('all');
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center font-semibold border border-red-200 shadow-sm hover:shadow-md"
                      title="Reset all filters to show all units"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </button>
                  )}

                  {/* Items Per Page Selector */}
                  <div className="flex-1 flex items-center justify-end space-x-4">
                    <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                      <span className="text-sm text-red-700 font-semibold">Show:</span>
                      <select
                        value={unitsPerPage}
                        onChange={(e) => {
                          setUnitsPerPage(Number(e.target.value));
                          setUnitsCurrentPage(1);
                        }}
                        className="px-3 py-1.5 border-2 border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-bold text-red-900 bg-white"
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                      <span className="text-sm text-red-700 font-semibold">units per page</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Stats Row */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                    <Building className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-900">{enrichedUnits.length}</p>
                    <p className="text-xs font-semibold text-red-700 uppercase mt-1">Total Units</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-900">
                      {enrichedUnits.filter(unit => unit.isOccupied).length}
                    </p>
                    <p className="text-xs font-semibold text-green-700 uppercase mt-1">Occupied</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border-2 border-gray-200">
                    <Building className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">
                      {enrichedUnits.filter(unit => !unit.isOccupied).length}
                    </p>
                    <p className="text-xs font-semibold text-gray-600 uppercase mt-1">Vacant</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-900">
                      {[...new Set(enrichedUnits.map(u => u.buildingNum))].length}
                    </p>
                    <p className="text-xs font-semibold text-blue-700 uppercase mt-1">Buildings</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-purple-900">
                      {Math.round((enrichedUnits.filter(u => u.isOccupied).length / (enrichedUnits.length || 1)) * 100)}%
                    </p>
                    <p className="text-xs font-semibold text-purple-700 uppercase mt-1">Occupancy</p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {unitsLoading && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
                    <p className="text-xl font-bold text-gray-900">Loading units...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait</p>
                  </div>
                </div>
              )}

              {/* Units Table */}
              {!unitsLoading && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-red-50 to-pink-50 border-b-2 border-red-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Building
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Building-Unit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Floor
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Developer
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Owners
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Family Members
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-red-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrichedUnits.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="px-6 py-12 text-center">
                              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
                              <p className="text-gray-600">No units have been added to this project yet.</p>
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            // Apply filters
                            let filtered = enrichedUnits;
                            
                            if (unitSearchTerm) {
                              const term = unitSearchTerm.toLowerCase();
                              filtered = filtered.filter(unit => {
                                const unitIdentifier = `${unit.buildingNum}-${unit.unitNum}`.toLowerCase();
                                return String(unit.unitNum).toLowerCase().includes(term) ||
                                       String(unit.buildingNum).toLowerCase().includes(term) ||
                                       unitIdentifier.includes(term);
                              });
                            }
                            
                            if (unitBuildingFilter !== 'all') {
                              filtered = filtered.filter(unit => String(unit.buildingNum) === unitBuildingFilter);
                            }
                            
                            if (unitFloorFilter !== 'all') {
                              filtered = filtered.filter(unit => unit.floor === unitFloorFilter);
                            }
                            
                            if (unitDeveloperFilter !== 'all') {
                              filtered = filtered.filter(unit => unit.developer === unitDeveloperFilter);
                            }
                            
                            if (unitOccupancyFilter !== 'all') {
                              filtered = filtered.filter(unit => {
                                return unitOccupancyFilter === 'occupied' ? unit.isOccupied : !unit.isOccupied;
                              });
                            }
                            
                            const sorted = filtered.sort((a, b) => {
                              // Sort by building number, then by unit number
                              const buildingCompare = (a.buildingNum || 0) - (b.buildingNum || 0);
                              if (buildingCompare !== 0) return buildingCompare;
                              return String(a.unitNum).localeCompare(String(b.unitNum));
                            });
                            
                            // Check if filtered results are empty
                            if (sorted.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="9" className="px-6 py-12 text-center">
                                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No units match your filters</h3>
                                    <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                                    <button
                                      onClick={() => {
                                        setUnitSearchTerm('');
                                        setUnitBuildingFilter('all');
                                        setUnitOccupancyFilter('all');
                                        setUnitFloorFilter('all');
                                        setUnitDeveloperFilter('all');
                                      }}
                                      className="mt-4 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold"
                                    >
                                      Clear All Filters
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                            
                            // Pagination
                            const startIndex = (unitsCurrentPage - 1) * unitsPerPage;
                            const endIndex = startIndex + unitsPerPage;
                            const paginatedUnits = sorted.slice(startIndex, endIndex);
                            
                            return paginatedUnits.map((unit) => {
                              // Use pre-calculated data from enrichedUnits
                              const ownersCount = unit.ownersCount;
                              const familyCount = unit.familyCount;
                              const unitOwners = unit.owners;
                              const unitFamily = unit.family;
                              const isOccupied = unit.isOccupied;

                              return (
                                <tr key={unit.id} className="hover:bg-red-50 transition-colors border-l-2 hover:border-l-red-500">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-sm">
                                          <Building className="h-5 w-5 text-red-700" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-semibold text-gray-900">
                                           {unit.buildingNum}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-base font-bold text-red-900">{unit.unitNum}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 shadow-sm">
                                      {unit.buildingNum}-{unit.unitNum}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{unit.floor || 'N/A'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{unit.developer || 'N/A'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                        ownersCount > 0 
                                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
                                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                                      }`}>
                                        <Users className="h-4 w-4 mr-1.5" />
                                        {ownersCount}
                                      </span>
                                      {ownersCount > 0 && (
                                        <div className="relative">
                                          <Eye 
                                            className="h-4 w-4 text-red-400 hover:text-red-600 cursor-pointer transition-colors" 
                                            onClick={() => setOpenTooltip(openTooltip === `${unit.id}-owners` ? null : `${unit.id}-owners`)}
                                          />
                                          {openTooltip === `${unit.id}-owners` && (
                                            <div className="absolute z-20 w-64 p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl shadow-2xl -top-2 left-6 border border-gray-700">
                                              <div className="flex justify-between items-center mb-2">
                                                <p className="font-bold text-green-400 flex items-center">
                                                  <UserCheck className="h-3 w-3 mr-1.5" />
                                                  Owners:
                                                </p>
                                                <button onClick={() => setOpenTooltip(null)} className="text-gray-400 hover:text-white">
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </div>
                                              <div className="flex flex-col space-y-1">
                                                {unitOwners.map(owner => (
                                                  <button
                                                    key={owner.id}
                                                    onClick={() => {
                                                      setSelectedUser(owner);
                                                      setShowUserModal(true);
                                                      setOpenTooltip(null);
                                                    }}
                                                    className="w-full text-left py-2 border-b border-gray-700 last:border-0 hover:bg-gray-700 hover:bg-opacity-50 rounded px-2 transition-colors block"
                                                  >
                                                    <div className="block">
                                                      • {owner.firstName} {owner.lastName}
                                                    </div>
                                                    <div className="text-gray-400 text-xs mt-1">
                                                      {owner.email}
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                        familyCount > 0 
                                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-300' 
                                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                                      }`}>
                                        <Users className="h-4 w-4 mr-1.5" />
                                        {familyCount}
                                      </span>
                                      {familyCount > 0 && (
                                        <div className="relative">
                                          <Eye 
                                            className="h-4 w-4 text-red-400 hover:text-red-600 cursor-pointer transition-colors" 
                                            onClick={() => setOpenTooltip(openTooltip === `${unit.id}-family` ? null : `${unit.id}-family`)}
                                          />
                                          {openTooltip === `${unit.id}-family` && (
                                            <div className="absolute z-20 w-64 p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl shadow-2xl -top-2 left-6 border border-gray-700">
                                              <div className="flex justify-between items-center mb-2">
                                                <p className="font-bold text-purple-400 flex items-center">
                                                  <Users className="h-3 w-3 mr-1.5" />
                                                  Family Members:
                                                </p>
                                                <button onClick={() => setOpenTooltip(null)} className="text-gray-400 hover:text-white">
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </div>
                                              <div className="flex flex-col space-y-1">
                                                {unitFamily.map(member => (
                                                  <button
                                                    key={member.id}
                                                    onClick={() => {
                                                      setSelectedUser(member);
                                                      setShowUserModal(true);
                                                      setOpenTooltip(null);
                                                    }}
                                                    className="w-full text-left py-2 border-b border-gray-700 last:border-0 hover:bg-gray-700 hover:bg-opacity-50 rounded px-2 transition-colors block"
                                                  >
                                                    <div className="block">
                                                      • {member.firstName} {member.lastName}
                                                    </div>
                                                    <div className="text-gray-400 text-xs mt-1">
                                                      {member.email}
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                      isOccupied
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                                        : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border border-gray-300'
                                    }`}>
                                      {isOccupied ? (
                                        <>
                                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                          Occupied
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                          Vacant
                                        </>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-2">
                                      {/* Notify Unit Users */}
                                      <button
                                        onClick={() => handleOpenUnitNotificationModal(unit, 'unit')}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors group relative"
                                        title="Notify all users in this unit"
                                      >
                                        <Bell className="h-4 w-4" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                          Notify Unit
                                        </span>
                                      </button>
                                      
                                      {/* Notify Building Users */}
                                      <button
                                        onClick={() => handleOpenUnitNotificationModal(unit, 'building')}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors group relative"
                                        title="Notify all users in this building"
                                      >
                                        <Building className="h-4 w-4" />
                                        <Bell className="h-3 w-3 absolute -top-0.5 -right-0.5" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                          Notify Building
                                        </span>
                                      </button>
                                      
                                      {/* Suspend Unit Users */}
                                      <button
                                        onClick={() => handleOpenUnitSuspensionModal(unit, 'unit')}
                                        className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors group relative"
                                        title="Suspend all users in this unit"
                                      >
                                        <UserX className="h-4 w-4" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                          Suspend Unit
                                        </span>
                                      </button>
                                      
                                      {/* Suspend Building Users */}
                                      <button
                                        onClick={() => handleOpenUnitSuspensionModal(unit, 'building')}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors group relative"
                                        title="Suspend all users in this building"
                                      >
                                        <Building className="h-4 w-4" />
                                        <UserX className="h-3 w-3 absolute -top-0.5 -right-0.5" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                          Suspend Building
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Load More Button for Units */}
                  {!unitSearchTerm && unitsHasMore && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-t-2 border-red-200 text-center">
                      <button
                        onClick={() => fetchUnits(projectId, true)}
                        disabled={unitsLoading}
                        className="inline-flex items-center px-6 py-3 border-2 border-red-600 text-sm font-semibold rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      >
                        {unitsLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading more units...
                          </>
                        ) : (
                          <>
                            <Building className="w-5 h-5 mr-2" />
                            Load More Units (50)
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-600 mt-2 font-medium">
                        📦 Showing {units.length} units. Click to load 50 more.
                      </p>
                    </div>
                  )}
                  
                  {/* Pagination Controls (for filtered view only - when using search/filters) */}
                  {(() => {
                    // Only show pagination if user is filtering (not for load more)
                    if (!unitSearchTerm && unitBuildingFilter === 'all' && unitOccupancyFilter === 'all' && unitFloorFilter === 'all' && unitDeveloperFilter === 'all') {
                      return null; // Let Load More button handle pagination
                    }
                    
                    // Calculate filtered units for pagination (use enrichedUnits)
                    let filtered = enrichedUnits;
                    
                    if (unitSearchTerm) {
                      const term = unitSearchTerm.toLowerCase();
                      filtered = filtered.filter(unit => {
                        const unitIdentifier = `${unit.buildingNum}-${unit.unitNum}`.toLowerCase();
                        return String(unit.unitNum).toLowerCase().includes(term) ||
                               String(unit.buildingNum).toLowerCase().includes(term) ||
                               unitIdentifier.includes(term);
                      });
                    }
                    
                    if (unitBuildingFilter !== 'all') {
                      filtered = filtered.filter(unit => String(unit.buildingNum) === unitBuildingFilter);
                    }
                    
                    if (unitFloorFilter !== 'all') {
                      filtered = filtered.filter(unit => unit.floor === unitFloorFilter);
                    }
                    
                    if (unitDeveloperFilter !== 'all') {
                      filtered = filtered.filter(unit => unit.developer === unitDeveloperFilter);
                    }
                    
                    if (unitOccupancyFilter !== 'all') {
                      filtered = filtered.filter(unit => {
                        return unitOccupancyFilter === 'occupied' ? unit.isOccupied : !unit.isOccupied;
                      });
                    }
                    
                    const totalFiltered = filtered.length;
                    const totalPages = Math.ceil(totalFiltered / unitsPerPage);
                    const startIndex = (unitsCurrentPage - 1) * unitsPerPage;
                    const endIndex = Math.min(startIndex + unitsPerPage, totalFiltered);
                    
                    if (totalPages <= 1) return null;
                    
                    return (
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 flex items-center justify-center border-t-2 border-red-200">
                        <div className="flex items-center space-x-4">
                          {/* First Page */}
                          <button
                            onClick={() => setUnitsCurrentPage(1)}
                            disabled={unitsCurrentPage === 1}
                            className="p-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
                            title="Go to first page"
                          >
                            <ChevronsLeft className="h-5 w-5" />
                          </button>
                          
                          {/* Previous Page */}
                          <button
                            onClick={() => setUnitsCurrentPage(unitsCurrentPage - 1)}
                            disabled={unitsCurrentPage === 1}
                            className="p-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
                            title="Previous page"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {/* Page Indicator */}
                          <div className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg border-2 border-red-500">
                            <span className="text-lg font-bold">
                              {unitsCurrentPage} / {totalPages}
                            </span>
                          </div>
                          
                          {/* Next Page */}
                          <button
                            onClick={() => setUnitsCurrentPage(unitsCurrentPage + 1)}
                            disabled={unitsCurrentPage === totalPages}
                            className="p-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
                            title="Next page"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          
                          {/* Last Page */}
                          <button
                            onClick={() => setUnitsCurrentPage(totalPages)}
                            disabled={unitsCurrentPage === totalPages}
                            className="p-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
                            title="Go to last page"
                          >
                            <ChevronsRight className="h-5 w-5" />
                          </button>
                          
                          {/* Results Info */}
                          <div className="ml-6 text-sm text-gray-700 font-medium bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm">
                            Showing <span className="font-bold text-red-700">{startIndex + 1}-{endIndex}</span> of{' '}
                            <span className="font-bold text-red-700">{totalFiltered}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
                </>
              )}

              {unitsSubTab === 'requests' && (
                <div className="space-y-6">
                  {/* Unit Requests Header Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Unit Access Requests</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Review and approve user requests to add new units
                      </p>
                    </div>
                    <button
                      onClick={() => fetchUnitRequests(projectId)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors flex items-center font-medium"
                      title="Refresh unit requests"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search Input */}
                      <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by user name, email, or unit..."
                          value={requestSearchTerm}
                          onChange={(e) => setRequestSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Status Filter */}
                      <select
                        value={requestStatusFilter}
                        onChange={(e) => setRequestStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      {/* Role Filter */}
                      <select
                        value={requestRoleFilter}
                        onChange={(e) => setRequestRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Roles</option>
                        <option value="owner">Owner</option>
                        <option value="tenant">Tenant</option>
                        <option value="family">Family</option>
                      </select>
                    </div>
                  </div>

                  {/* Unit Requests List */}
                  {unitRequestsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (() => {
                    const filteredRequests = unitRequests.filter(request => {
                      const matchesSearch = !requestSearchTerm || 
                        request.userName?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                        request.userEmail?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
                        request.unit?.toLowerCase().includes(requestSearchTerm.toLowerCase());
                      
                      const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
                      const matchesRole = requestRoleFilter === 'all' || request.role === requestRoleFilter;
                      
                      return matchesSearch && matchesStatus && matchesRole;
                    });

                    const paginatedRequests = filteredRequests.slice(
                      (requestsCurrentPage - 1) * requestsPerPage,
                      requestsCurrentPage * requestsPerPage
                    );

                    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

                    return (
                      <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {filteredRequests.filter(r => r.status === 'pending').length}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <UserCheck className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {filteredRequests.filter(r => r.status === 'approved').length}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <UserX className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {filteredRequests.filter(r => r.status === 'rejected').length}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Requests Table */}
                        {paginatedRequests.length === 0 ? (
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No unit requests found</h3>
                            <p className="text-gray-500">
                              {requestSearchTerm || requestStatusFilter !== 'all' || requestRoleFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No users have submitted unit access requests yet'}
                            </p>
                          </div>
                        ) : (
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
                                      Requested
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
                                  {paginatedRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                                            <div className="text-sm text-gray-500">{request.userEmail}</div>
                                            {request.userPhone && (
                                              <div className="text-sm text-gray-500">{request.userPhone}</div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{request.unit}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                                          {request.role}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {request.requestedAt?.toDate ? 
                                          new Date(request.requestedAt.toDate()).toLocaleDateString() : 
                                          'N/A'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {request.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                          onClick={async () => {
                                            setSelectedUserForDetails(request);
                                            await fetchUserDetailsForRequest(request);
                                            setShowUserDetailsModal(true);
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View user details"
                                        >
                                          <Eye className="h-4 w-4 inline" />
                                        </button>
                                        {request.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => handleApproveRequest(request)}
                                              disabled={approvalLoading}
                                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                              title="Approve request"
                                            >
                                              <UserCheck className="h-4 w-4 inline" />
                                            </button>
                                            <button
                                              onClick={() => handleRejectRequest(request)}
                                              disabled={approvalLoading}
                                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                              title="Reject request"
                                            >
                                              <UserX className="h-4 w-4 inline" />
                                            </button>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                  <button
                                    onClick={() => setRequestsCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={requestsCurrentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Previous
                                  </button>
                                  <button
                                    onClick={() => setRequestsCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={requestsCurrentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Next
                                  </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm text-gray-700">
                                      Showing <span className="font-medium">{(requestsCurrentPage - 1) * requestsPerPage + 1}</span> to{' '}
                                      <span className="font-medium">
                                        {Math.min(requestsCurrentPage * requestsPerPage, filteredRequests.length)}
                                      </span>{' '}
                                      of <span className="font-medium">{filteredRequests.length}</span> results
                                    </p>
                                  </div>
                                  <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                      <button
                                        onClick={() => setRequestsCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={requestsCurrentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                      >
                                        <ChevronLeft className="h-5 w-5" />
                                      </button>
                                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                                        <button
                                          key={page}
                                          onClick={() => setRequestsCurrentPage(page)}
                                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            requestsCurrentPage === page
                                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                          }`}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                      <button
                                        onClick={() => setRequestsCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={requestsCurrentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                      >
                                        <ChevronRight className="h-5 w-5" />
                                      </button>
                                    </nav>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              </div>
            </div>
          </PermissionGate>
        )}

        {activeTab === 'academies' && (
              <PermissionGate entity="academies" action="read" showMessage={true}>
          <AcademiesManagement projectId={projectId} />
              </PermissionGate>
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
              <PermissionGate entity="courts" action="read" showMessage={true}>
          <CourtsManagement projectId={projectId} />
              </PermissionGate>
        )}

        {activeTab === 'bookings' && (
              <PermissionGate entity="bookings" action="read" showMessage={true}>
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
                <ExportButton dataType="bookings" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg" />
                <button
                  onClick={refreshAllData}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  title="Refresh all bookings data"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>

                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                  title="Create a new booking (coming soon)"
                  disabled
                >
                  <Plus className="h-4 w-4 mr-2" />
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
                                <tr key={booking.id} className={`hover:transition-colors ${booking.type === 'academy'
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
                                      <div className={`w-2 h-2 rounded-full mr-2 ${booking.type === 'academy' ? 'bg-green-500' : 'bg-blue-500'
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
                                      EGP {booking.totalPrice || booking.totalCost || 0}
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
                                    className="group relative text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                    title="View full booking details"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="text-xs font-medium hidden xl:inline">View</span>
                                  </button>

                                  {/* Status Change Dropdown */}
                                  <select
                                    value={booking.status || 'pending'}
                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    title="Update booking status"
                                  >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="confirmed">✅ Confirmed</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                    <option value="completed">✔️ Completed</option>
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
                                <tr key={booking.id} className={`hover:transition-colors ${booking.type === 'academy'
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
                                      <div className={`w-2 h-2 rounded-full mr-2 ${booking.type === 'academy' ? 'bg-green-500' : 'bg-blue-500'
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
                                      EGP {booking.totalPrice || booking.totalCost || 0}
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
                                    className="group relative text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                    title="View full booking details and history"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="text-xs font-medium hidden xl:inline">View</span>
                                  </button>

                                  {/* Status Change Dropdown */}
                                  <select
                                    value={booking.status || 'pending'}
                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    title="Update booking status"
                                  >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="confirmed">✅ Confirmed</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                    <option value="completed">✔️ Completed</option>
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
              </PermissionGate>
        )}

        {activeTab === 'events' && (
              <PermissionGate entity="notifications" action="read" showMessage={true}>
          <NotificationManagement projectId={projectId} />
              </PermissionGate>
        )}

        {activeTab === 'news' && (
              <PermissionGate entity="news" action="read" showMessage={true}>
                <div className="services-management">
                  {/* News Header */}
                  <div className="page-header bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <div className="header-content">
                      <div className="header-left">
                        <div className="header-icon">
                          <Newspaper className="h-6 w-6" />
                        </div>
                        <div className="header-text">
                          <h1>News Management</h1>
                          <p>Manage news categories and posts</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* News Navigation Cards */}
                  <div className="services-nav-grid">
                    <div 
                      className={`nav-card ${newsSubTab === 'news' ? 'active' : ''}`}
                      onClick={() => setNewsSubTab('news')}
                    >
                      <div className="nav-card-icon">
                        <Newspaper className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>News Posts</h3>
                        <p>Create and manage news posts</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`nav-card ${newsSubTab === 'categories' ? 'active' : ''}`}
                      onClick={() => setNewsSubTab('categories')}
                    >
                      <div className="nav-card-icon">
                        <Tag className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>News Categories</h3>
                        <p>Manage news categories and types</p>
                      </div>
                    </div>
                  </div>

                  {/* News Content */}
                  <div className="services-content">
                    {newsSubTab === 'news' && (
                      <NewsManagementSystem projectId={projectId} />
                    )}
                    
                    {newsSubTab === 'categories' && (
                      <NewsCategoriesManagement projectId={projectId} />
                    )}
                  </div>
                </div>
              </PermissionGate>
            )}

            {activeTab === 'services' && (
              <PermissionGate entity="services" action="read" showMessage={true}>
                <div className="services-management">
                  {/* Services Header */}
                  <div className="page-header bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <div className="header-content">
                      <div className="header-left">
                        <div className="header-icon">
                          <Settings className="h-6 w-6" />
                        </div>
                        <div className="header-text">
                          <h1>Services Management</h1>
                          <p>Manage service categories, individual services, and booking requests</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Navigation Cards */}
                  <div className="services-nav-grid">
                    <div 
                      className={`nav-card ${servicesSubTab === 'categories' ? 'active' : ''}`}
                      onClick={() => setServicesSubTab('categories')}
                    >
                      <div className="nav-card-icon">
                        <Building className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>Service Categories</h3>
                        <p>Manage service categories and availability</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`nav-card ${servicesSubTab === 'bookings' ? 'active' : ''}`}
                      onClick={() => setServicesSubTab('bookings')}
                    >
                      <div className="nav-card-icon">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>Service Bookings</h3>
                        <p>View and manage service booking requests</p>
                      </div>
                    </div>
                  </div>

                  {/* Services Content */}
                  <div className="services-content">
                    {servicesSubTab === 'categories' && (
                      <ServicesManagement projectId={projectId} />
                    )}
                    
                    {servicesSubTab === 'bookings' && (
                      <ServiceBookingsManagement projectId={projectId} />
                    )}
                  </div>
                </div>
              </PermissionGate>
            )}

            {activeTab === 'requests' && (
              <PermissionGate entity="requests" action="read" showMessage={true}>
                <div className="services-management">
                  {/* Requests Header */}
                  <div className="page-header bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <div className="header-content">
                      <div className="header-left">
                        <div className="header-icon">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="header-text">
                          <h1>Requests Management</h1>
                          <p>Manage request categories, form fields, and user submissions</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requests Navigation Cards */}
                  <div className="services-nav-grid">
                    <div 
                      className={`nav-card ${requestsSubTab === 'categories' ? 'active' : ''}`}
                      onClick={() => setRequestsSubTab('categories')}
                    >
                      <div className="nav-card-icon">
                        <Building className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>Request Categories</h3>
                        <p>Manage request categories and form fields</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`nav-card ${requestsSubTab === 'submissions' ? 'active' : ''}`}
                      onClick={() => setRequestsSubTab('submissions')}
                    >
                      <div className="nav-card-icon">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>Request Submissions</h3>
                        <p>View and manage user request submissions</p>
                      </div>
                    </div>
                  </div>

                  {/* Requests Content */}
                  <div className="services-content">
                    <RequestsManagement projectId={projectId} activeTab={requestsSubTab} />
                  </div>
                </div>
              </PermissionGate>
            )}

            {activeTab === 'complaints' && (
              <PermissionGate entity="complaints" action="read" showMessage={true}>
                <div className="services-management">
                  {/* Complaints Header */}
                  <div className="page-header bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <div className="header-content">
                      <div className="header-left">
                        <div className="header-icon">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="header-text">
                          <h1>Complaints Management</h1>
                          <p>Manage complaint categories and user complaints</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complaints Navigation Cards */}
                  <div className="services-nav-grid">
                    <div 
                      className={`nav-card ${complaintsSubTab === 'complaints' ? 'active' : ''}`}
                      onClick={() => setComplaintsSubTab('complaints')}
                    >
                      <div className="nav-card-icon">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>User Complaints</h3>
                        <p>View and manage user complaints</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`nav-card ${complaintsSubTab === 'categories' ? 'active' : ''}`}
                      onClick={() => setComplaintsSubTab('categories')}
                    >
                      <div className="nav-card-icon">
                        <Building className="h-6 w-6" />
                      </div>
                      <div className="nav-card-content">
                        <h3>Complaint Categories</h3>
                        <p>Manage complaint categories and types</p>
                      </div>
                    </div>
                  </div>

                  {/* Complaints Content */}
                  <div className="services-content">
                    {complaintsSubTab === 'complaints' && (
                      <ComplaintsManagement projectId={projectId} />
                    )}
                    
                    {complaintsSubTab === 'categories' && (
                      <ComplaintCategoriesManagement projectId={projectId} />
                    )}
                  </div>
                </div>
              </PermissionGate>
            )}

            {activeTab === 'guidelines' && (
              <PermissionGate entity="guidelines" action="read" showMessage={true}>
                <PDFGuidelines projectId={projectId} />
              </PermissionGate>
            )}

            {activeTab === 'ads' && (
              <PermissionGate entity="ads" action="read" showMessage={true}>
                <AdsManagement projectId={projectId} />
              </PermissionGate>
            )}

            {activeTab === 'fines' && (
              <PermissionGate entity="fines" action="read" showMessage={true}>
                <FinesManagement projectId={projectId} />
              </PermissionGate>
            )}

            {activeTab === 'guestpasses' && (
              <PermissionGate entity="guest_passes" action="read" showMessage={true}>
                <GuestPasses />
              </PermissionGate>
            )}

            {activeTab === 'support' && (
              <PermissionGate entity="support" action="read" showMessage={true}>
                <SupportManagement />
              </PermissionGate>
            )}

            {activeTab === 'guards' && (
              <PermissionGate entity="guards" action="read" showMessage={true}>
                <GuardsManagement projectId={projectId} />
              </PermissionGate>
        )}

        {activeTab === 'device_keys' && (
          <PermissionGate entity="device_keys" action="read" showMessage={true}>
            <DeviceKeysManagement projectId={projectId} />
          </PermissionGate>
        )}

        {activeTab === 'admins' && (
          <PermissionGate entity="admin_accounts" action="read" showMessage={true}>
            <div className="space-y-6">
              {/* Admins Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Admin Accounts Management</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage administrator accounts, permissions, and access for this project
                  </p>
                </div>
              </div>

              {/* Admin Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border-2 border-red-200 p-6 relative z-10">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-200 rounded-xl">
                      <UserPlus className="h-6 w-6 text-red-700" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-red-700 uppercase">Total Admins</p>
                      <p className="text-3xl font-bold text-red-900">{projectAdmins?.length || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {projectAdmins?.filter(a => a.isActive).length || 0} active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-10">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Super Admins</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {projectAdmins?.filter(a => a.accountType === 'super_admin').length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-10">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Full Access</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {projectAdmins?.filter(a => a.accountType === 'full_access').length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-10">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Custom Access</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {projectAdmins?.filter(a => a.accountType === 'custom').length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Admin Requests - Super Admin Only */}
              {isSuperAdmin() && pendingAdminsCount > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-amber-200 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-700" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-amber-900">Pending Admin Requests</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          {pendingAdminsCount} admin request{pendingAdminsCount !== 1 ? 's' : ''} waiting for approval
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-amber-600 text-white text-lg font-bold rounded-full animate-pulse shadow-lg">
                      {pendingAdminsCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Admin Management Component */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <AdminManagement />
              </div>
            </div>
              </PermissionGate>
        )}

        {activeTab === 'store' && (
              <PermissionGate entity="store" action="read" showMessage={true}>
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
              </PermissionGate>
        )}

        {activeTab === 'orders' && (
              <PermissionGate entity="orders" action="read" showMessage={true}>
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
                <ExportButton dataType="orders" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg" />
                <button
                  onClick={refreshAllData}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  title="Refresh all orders data"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
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
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center font-medium"
                    title="Reset all filters to show all orders"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
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
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered'
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
                                className="group relative text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                title="View complete order details"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs font-medium hidden xl:inline">View</span>
                              </button>

                              {/* Status Change Dropdown */}
                              <select
                                value={order.status || 'pending'}
                                onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                title="Update order status and notify customer"
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="processing">🔄 Processing</option>
                                <option value="shipped">🚚 Shipped</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
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
              </PermissionGate>
        )}

        {activeTab === 'gatepass' && (
              <PermissionGate entity="gate_pass" action="read" showMessage={true}>
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
              </PermissionGate>
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
        </main>
      </div>

      {/* Booking Details Modal */}
      {isBookingModalOpen && selectedBookingForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-y-auto">
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
                      EGP {selectedBookingForModal.totalPrice || selectedBookingForModal.totalCost || 0}
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
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                          title="Approve this booking and notify the user"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm Booking
                        </button>
                        <button
                          onClick={() => {
                            handleCancelBooking(selectedBookingForModal.id);
                            setIsBookingModalOpen(false);
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                          title="Cancel this booking and notify the user"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Booking
                        </button>
                      </>
                    )}
                    {selectedBookingForModal.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          handleCompleteBooking(selectedBookingForModal.id);
                          setIsBookingModalOpen(false);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                        title="Mark this booking as completed"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark as Complete
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
                      {selectedBookingForModal.createdAt ? 
                        (selectedBookingForModal.createdAt.toDate ? 
                          selectedBookingForModal.createdAt.toDate().toLocaleString() : 
                          new Date(selectedBookingForModal.createdAt).toLocaleString()
                        ) : 'Unknown'
                      }
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
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                title="Close this modal"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrderForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[75vh] overflow-y-auto">
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
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedOrderForModal.status === 'delivered'
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
                        <p className="text-sm font-medium text-gray-900">EGP {(item.price || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total: EGP {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
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
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                title="Close this modal"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Details Modal */}
      {isStoreModalOpen && selectedStoreForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${(selectedStoreForModal.status === 'active' ||
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
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-1 ${(selectedStoreForModal.status === 'active' ||
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
                                  <span className="text-lg font-bold text-green-600">EGP {product.price || 0}</span>
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
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center font-medium"
                          title="Reset all filters to show all store orders"
                        >
                          <X className="h-4 w-4 mr-1" />
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
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered'
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
                                      className="group relative text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                      title="View complete order details and customer info"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="text-xs font-medium hidden xl:inline">View</span>
                                    </button>
                                    <select
                                      value={order.status || 'pending'}
                                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                      className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      title="Update order status - customer will be notified"
                                    >
                                      <option value="pending">⏳ Pending</option>
                                      <option value="processing">🔄 Processing</option>
                                      <option value="shipped">🚚 Shipped</option>
                                      <option value="delivered">✅ Delivered</option>
                                      <option value="cancelled">❌ Cancelled</option>
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
                                        className={`h-4 w-4 ${i < (review.rating || 0)
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
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  title="Close store details modal"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[75vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedUser.migrated === true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Migrated
                      </span>
                    )}
                    {selectedUser.oldId && selectedUser.migrated !== true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Migration
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information Section - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-sm text-gray-900 font-semibold mt-1">
                      {selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.firstName || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.lastName || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900 font-medium mt-1 break-all">{selectedUser.email || 'No email'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.mobile || selectedUser.phone || 'No phone'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">National ID</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.nationalId || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Birth</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                    <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUser.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Verified</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.emailVerified ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-red-600">Not Verified</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Project Information - Only show the project they're viewing */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Current Project Information
                </h3>
                {(() => {
                  // Find the current project from the user's projects array
                  const currentProject = selectedUser.projects?.find(p => p.projectId === projectId);
                  
                  if (currentProject) {
                    return (
                      <div className="bg-white rounded-lg p-5 border-2 border-green-300 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-3">
                            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Project Name</label>
                            <p className="text-base text-green-900 font-bold mt-1">{project?.name || 'Unknown Project'}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Unit Number</label>
                            <p className="text-base text-green-900 font-bold mt-1">{currentProject.unit || 'N/A'}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Role</label>
                            <p className="text-base text-green-900 font-bold mt-1 capitalize">{currentProject.role || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedUser.projects?.length > 1 && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-sm text-green-700 flex items-center">
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              This user has access to {selectedUser.projects.length} project{selectedUser.projects.length > 1 ? 's' : ''} total
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-yellow-700 flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          User is not associated with this project
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Status & Approval Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-600" />
                  Account Status & Approvals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval Status</label>
                    <p className="text-sm text-gray-900 font-medium mt-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : selectedUser.approvalStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : selectedUser.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.approvalStatus || 'pending'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Status</label>
                    <p className="text-sm text-gray-900 font-medium mt-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.registrationStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedUser.registrationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.registrationStatus || 'Unknown'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile Complete</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.isProfileComplete ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Complete
                        </span>
                      ) : (
                        <span className="text-orange-600">Incomplete</span>
                      )}
                    </p>
                  </div>
                  {selectedUser.approvedBy && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved By</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.approvedBy}</p>
                    </div>
                  )}
                  {selectedUser.approvedAt && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.approvedAt.toDate ? 
                          selectedUser.approvedAt.toDate().toLocaleDateString() :
                          new Date(selectedUser.approvedAt).toLocaleDateString()
                        }
                      </p>
                    </div>
                  )}
                  {selectedUser.role && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Role</label>
                      <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUser.role}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents & Profile Pictures Section */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Documents & Profile Pictures
                </h3>
                
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <label className="text-sm font-medium text-purple-700">Profile Picture</label>
                    <div className="mt-2">
                      {selectedUser.documents?.profilePictureUrl ? (
                        <div className="flex items-center space-x-4">
                          <img
                            src={selectedUser.documents.profilePictureUrl}
                            alt="Profile"
                            className="h-20 w-20 rounded-full object-cover border-4 border-purple-200 shadow-md"
                          />
                          <button
                            onClick={() => window.open(selectedUser.documents.profilePictureUrl, '_blank')}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Size
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <span className="text-gray-500 text-sm">No profile picture uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* National ID Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front ID */}
                    <div>
                      <label className="text-sm font-medium text-purple-700">Front National ID</label>
                      <div className="mt-2">
                        {selectedUser.documents?.frontIdUrl ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={selectedUser.documents.frontIdUrl}
                                alt="Front National ID"
                                className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 shadow-sm"
                              />
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Uploaded
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(selectedUser.documents.frontIdUrl, '_blank')}
                              className="w-full px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <span className="text-gray-500 text-sm">Not uploaded</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back ID */}
                    <div>
                      <label className="text-sm font-medium text-purple-700">Back National ID</label>
                      <div className="mt-2">
                        {selectedUser.documents?.backIdUrl ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={selectedUser.documents.backIdUrl}
                                alt="Back National ID"
                                className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 shadow-sm"
                              />
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Uploaded
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(selectedUser.documents.backIdUrl, '_blank')}
                              className="w-full px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <span className="text-gray-500 text-sm">Not uploaded</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Status Summary */}
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3">Document Status</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.profilePictureUrl ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-xs text-gray-600">Profile Picture</span>
                      </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.frontIdUrl ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-600">Front ID</span>
                      </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          selectedUser.documents?.backIdUrl ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-600">Back ID</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status Section */}
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Account Status
                </h3>
                <div className="space-y-4">
                  {selectedUser.isSuspended ? (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                          <UserX className="h-4 w-4 mr-2" />
                          Account Suspended
                        </span>
                        <span className="text-sm text-gray-500">
                          {selectedUser.suspensionType === 'permanent' ? 'Permanent' : 'Temporary'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Reason:</span>
                          <p className="text-gray-600 mt-1">{selectedUser.suspensionReason}</p>
                        </div>
                        {selectedUser.suspensionType === 'temporary' && selectedUser.suspensionEndDate && (
                          <div>
                            <span className="font-medium text-gray-700">Suspension Ends:</span>
                            <p className="text-gray-600 mt-1">
                              {new Date(selectedUser.suspensionEndDate).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Suspended At:</span>
                          <p className="text-gray-600 mt-1">
                            {selectedUser.suspendedAt ? 
                              (selectedUser.suspendedAt.toDate ? 
                                selectedUser.suspendedAt.toDate().toLocaleString() :
                                new Date(selectedUser.suspendedAt).toLocaleString()
                              ) : 'Unknown'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Suspended By:</span>
                          <p className="text-gray-600 mt-1">{selectedUser.suspendedBy || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  ) : selectedUser.createdByAdmin && selectedUser.registrationStatus === 'in_progress' && selectedUser.registrationStep === 'awaiting_password' ? (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Awaiting Password Setup
                        </span>
                        <PermissionGate entity="users" action="write">
                          <button
                            onClick={() => {
                              handleResendPasswordEmail(selectedUser);
                            }}
                            className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resend Email
                          </button>
                        </PermissionGate>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <p className="text-gray-600 mt-1">User was created by admin and needs to set their password</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <p className="text-gray-600 mt-1">{selectedUser.email}</p>
                        </div>
                        {selectedUser.passwordResetSentAt && (
                          <div>
                            <span className="font-medium text-gray-700">Last Email Sent:</span>
                            <p className="text-gray-600 mt-1">
                              {selectedUser.passwordResetSentAt.toDate ? 
                                selectedUser.passwordResetSentAt.toDate().toLocaleString() :
                                new Date(selectedUser.passwordResetSentAt).toLocaleString()
                              }
                            </p>
                          </div>
                        )}
                        {selectedUser.passwordResetCount && (
                          <div>
                            <span className="font-medium text-gray-700">Email Sent Count:</span>
                            <p className="text-gray-600 mt-1">{selectedUser.passwordResetCount} time(s)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Account Active
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Migration Information - Only show if user has migration data */}
              {(selectedUser.migrated || selectedUser.oldId || selectedUser.migratedAt || selectedUser.oldDocumentId) && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                  <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Migration Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migration Status</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.migrated === true ? (
                          <span className="text-teal-600 flex items-center font-semibold">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Migrated
                          </span>
                        ) : selectedUser.oldId ? (
                          <span className="text-orange-600 flex items-center font-semibold">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Needs Migration
                          </span>
                        ) : (
                          <span className="text-blue-600 font-semibold">New User</span>
                        )}
                      </p>
                    </div>
                    {selectedUser.oldId && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Old User ID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.oldId}</p>
                      </div>
                    )}
                    {selectedUser.oldDocumentId && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Old Document ID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.oldDocumentId}</p>
                      </div>
                    )}
                    {selectedUser.migratedAt && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migrated At</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {typeof selectedUser.migratedAt === 'string'
                            ? new Date(selectedUser.migratedAt).toLocaleString()
                            : selectedUser.migratedAt.toDate
                              ? selectedUser.migratedAt.toDate().toLocaleString()
                              : 'Unknown'}
                        </p>
                      </div>
                    )}
                    {selectedUser.migratedTo && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Migrated To UID</label>
                        <p className="text-sm text-gray-900 font-mono mt-1">{selectedUser.migratedTo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Information & Timestamps */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  Account Information & Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                    <p className="text-xs text-gray-900 font-mono mt-1 break-all">{selectedUser.id}</p>
                  </div>
                  {selectedUser.authUid && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auth UID</label>
                      <p className="text-xs text-gray-900 font-mono mt-1 break-all">{selectedUser.authUid}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.createdAt ? 
                        (selectedUser.createdAt.toDate ? 
                          selectedUser.createdAt.toDate().toLocaleString() :
                          new Date(selectedUser.createdAt).toLocaleString()
                        ) : 'Unknown'
                      }
                    </p>
                  </div>
                  {selectedUser.updatedAt && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updated At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {typeof selectedUser.updatedAt === 'string'
                          ? new Date(selectedUser.updatedAt).toLocaleString()
                          : selectedUser.updatedAt.toDate
                            ? selectedUser.updatedAt.toDate().toLocaleString()
                            : 'Unknown'}
                      </p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Login</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUser.lastLoginAt ? 
                        (selectedUser.lastLoginAt.toDate ? 
                          selectedUser.lastLoginAt.toDate().toLocaleString() :
                          new Date(selectedUser.lastLoginAt).toLocaleString()
                        ) : 'Never'
                      }
                    </p>
                  </div>
                  {selectedUser.registrationStep && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Step</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.registrationStep}</p>
                    </div>
                  )}
                  {selectedUser.createdByAdmin !== undefined && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By Admin</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedUser.createdByAdmin ? (
                          <span className="text-blue-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-600">No</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedUser.accountType && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</label>
                      <p className="text-sm text-gray-900 font-medium mt-1 capitalize">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.accountType === 'temporary'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.accountType}
                        </span>
                      </p>
                    </div>
                  )}
                  {selectedUser.validityStartDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validity Start</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.validityStartDate}</p>
                    </div>
                  )}
                  {selectedUser.validityEndDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validity End</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.validityEndDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Members Section - ALWAYS VISIBLE */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-6 border-2 border-pink-300 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-pink-900 flex items-center">
                    <svg className="h-6 w-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Family Account Management
                  </h3>
                  <PermissionGate entity="users" action="write">
                    <button
                      onClick={() => openFamilyMemberModal(selectedUser)}
                      className="px-4 py-2 bg-pink-600 text-white text-sm font-bold rounded-lg hover:bg-pink-700 transition-all hover:scale-105 shadow-md flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Link Family Member
                    </button>
                  </PermissionGate>
                </div>
                
                {/* If this user is a family member of someone */}
                {selectedUser.parentAccountId && (() => {
                  const parentUser = projectUsers.find(u => u.id === selectedUser.parentAccountId);
                  return (
                    <div className="mb-4 bg-white rounded-lg p-5 border-2 border-blue-400 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-blue-900 flex items-center">
                          <Link2 className="h-4 w-4 mr-2" />
                          Linked to Parent Account
                        </h4>
                        <PermissionGate entity="users" action="write">
                          <button
                            onClick={() => handleUnlinkFamilyMember(selectedUser.id)}
                            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                            title="Unlink from parent"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                      </div>
                      {parentUser ? (
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-blue-300 flex items-center justify-center ring-2 ring-blue-400">
                              <span className="text-sm font-bold text-blue-900">
                                {parentUser.firstName?.charAt(0)}{parentUser.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{parentUser.firstName} {parentUser.lastName}</p>
                              <p className="text-xs text-gray-600">{parentUser.email}</p>
                              <p className="text-xs text-blue-700 font-semibold mt-1">
                                Unit: {parentUser.projects?.find(p => p.projectId === projectId)?.unit || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUserAction('view', parentUser)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-lg transition-colors"
                            title="View Parent Account"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">Parent ID: {selectedUser.parentAccountId}</p>
                      )}
                    </div>
                  );
                })()}
                
                {/* Family members linked to this account */}
                {(() => {
                  const linkedFamilyMembers = projectUsers.filter(user => user.parentAccountId === selectedUser.id);
                  if (linkedFamilyMembers.length > 0) {
                    return (
                      <div className="bg-white rounded-lg p-5 border-2 border-pink-400 shadow-md">
                        <h4 className="text-sm font-bold text-pink-900 mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Family Members ({linkedFamilyMembers.length})
                        </h4>
                        <div className="space-y-3">
                          {linkedFamilyMembers.map((familyMember) => {
                            const familyMemberProject = familyMember.projects?.find(p => p.projectId === projectId);
                            return (
                              <div key={familyMember.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 hover:shadow-md transition-all">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="h-12 w-12 rounded-full bg-pink-300 flex items-center justify-center ring-2 ring-pink-400">
                                    <span className="text-sm font-bold text-pink-900">
                                      {familyMember.firstName?.charAt(0)}{familyMember.lastName?.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">{familyMember.firstName} {familyMember.lastName}</p>
                                    <p className="text-xs text-gray-600">{familyMember.email}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-xs font-semibold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                                        Unit: {familyMemberProject?.unit || 'N/A'}
                                      </span>
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                        familyMemberProject?.role === 'family' 
                                          ? 'bg-pink-200 text-pink-800 ring-1 ring-pink-400'
                                          : 'bg-gray-200 text-gray-800'
                                      }`}>
                                        {familyMemberProject?.role || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleUserAction('view', familyMember)}
                                    className="p-2 text-pink-600 hover:text-pink-900 hover:bg-pink-200 rounded-lg transition-colors"
                                    title="View Family Member"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <PermissionGate entity="users" action="write">
                                    <button
                                      onClick={() => handleUnlinkFamilyMember(familyMember.id)}
                                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Unlink Family Member"
                                    >
                                      <Unlink className="h-4 w-4" />
                                    </button>
                                  </PermissionGate>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-white rounded-lg p-6 border-2 border-dashed border-pink-300 text-center">
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                            <Users className="h-8 w-8 text-pink-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">No Family Members Yet</p>
                          <p className="text-xs text-gray-500 mb-4">This account doesn't have any family members linked</p>
                          <PermissionGate entity="users" action="write">
                            <button
                              onClick={() => openFamilyMemberModal(selectedUser)}
                              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all hover:scale-105 shadow-md flex items-center"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Link First Family Member
                            </button>
                          </PermissionGate>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Additional Metadata - Only show if there are additional fields */}
              {(selectedUser.fcmTokens || selectedUser.platform || selectedUser.appVersion || selectedUser.deviceInfo) && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Device & App Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedUser.platform && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform</label>
                        <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUser.platform}</p>
                      </div>
                    )}
                    {selectedUser.appVersion && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">App Version</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.appVersion}</p>
                      </div>
                    )}
                    {selectedUser.deviceInfo && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Device Info</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.deviceInfo}</p>
                      </div>
                    )}
                    {selectedUser.fcmTokens && Array.isArray(selectedUser.fcmTokens) && (
                      <div className="bg-white rounded-lg p-3 shadow-sm col-span-full">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">FCM Tokens</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUser.fcmTokens.length} device(s) registered</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                {/* Approval Actions for Pending Users */}
                {selectedUser.approvalStatus === 'pending' && (
                  <>
                    <PermissionGate entity="users" action="write">
                      <button
                        onClick={() => {
                          handleApproveUser(selectedUser);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                        title="Approve this user's registration and grant access"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Approve User
                      </button>
                    </PermissionGate>
                    <PermissionGate entity="users" action="write">
                      <button
                        onClick={() => {
                          handleRejectUser(selectedUser);
                          setShowUserModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                        title="Reject this user's registration request"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject User
                      </button>
                    </PermissionGate>
                  </>
                )}
                
                {/* Regular Actions for Approved Users */}
                {selectedUser.approvalStatus === 'approved' && (
                  <>
                    <PermissionGate entity="users" action="write">
                      <button
                        onClick={() => {
                          setShowUserModal(false);
                          handleUserAction('edit', selectedUser);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                        title="Edit user information and project details"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </button>
                    </PermissionGate>
                    {selectedUser.isSuspended ? (
                      <PermissionGate entity="users" action="write">
                        <button
                          onClick={() => {
                            handleUnsuspendUser(selectedUser);
                            setShowUserModal(false);
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                          title="Restore user access and remove suspension"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Restore Access
                        </button>
                      </PermissionGate>
                    ) : (
                      <PermissionGate entity="users" action="write">
                        <button
                          onClick={() => {
                            setUserToSuspend(selectedUser);
                            setSuspensionReason('');
                            setSuspensionDuration('7');
                            setSuspensionType('temporary');
                            setShowSuspendModal(true);
                            setShowUserModal(false);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                          title="Suspend user account temporarily or permanently"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend Account
                        </button>
                      </PermissionGate>
                    )}
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                title="Close user details modal"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && userToSuspend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                  <UserX className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Suspend User</h3>
                  <p className="text-sm text-gray-500">
                    {userToSuspend.firstName} {userToSuspend.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Suspension Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="temporary"
                      checked={suspensionType === 'temporary'}
                      onChange={(e) => setSuspensionType(e.target.value)}
                      className="mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Temporary</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="permanent"
                      checked={suspensionType === 'permanent'}
                      onChange={(e) => setSuspensionType(e.target.value)}
                      className="mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Permanent</span>
                  </label>
                </div>
              </div>

              {suspensionType === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={suspensionDuration}
                    onChange={(e) => setSuspensionDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                    <option value="90">3 months</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension *
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                title="Cancel and close without suspending"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                title="Confirm suspension with the specified reason and duration"
              >
                <UserX className="h-4 w-4 mr-2" />
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Edit className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
                    <p className="text-sm text-gray-500 mt-1">Update user information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditUserData(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editUserData.firstName}
                      onChange={(e) => handleEditUserInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editUserData.lastName}
                      onChange={(e) => handleEditUserInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editUserData.email}
                      onChange={(e) => handleEditUserInputChange('email', e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      value={editUserData.mobile}
                      onChange={(e) => handleEditUserInputChange('mobile', e.target.value)}
                      placeholder="01234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      National ID *
                    </label>
                    <input
                      type="text"
                      value={editUserData.nationalId}
                      onChange={(e) => handleEditUserInputChange('nationalId', e.target.value)}
                      placeholder="Enter national ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editUserData.dateOfBirth}
                      onChange={(e) => handleEditUserInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={editUserData.gender}
                      onChange={(e) => handleEditUserInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Project Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Number *
                    </label>
                    <input
                      type="text"
                      value={editUserData.projectUnit}
                      onChange={(e) => handleEditUserInputChange('projectUnit', e.target.value)}
                      placeholder="e.g., A101, B205"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={editUserData.projectRole}
                      onChange={(e) => handleEditUserInputChange('projectRole', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="owner">Owner</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ID Documents Upload/Replace */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  National ID Documents
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {(editUserData.currentFrontIdUrl || editUserData.currentBackIdUrl) 
                    ? 'Current documents shown below. Upload new files to replace them.'
                    : 'No documents uploaded yet. Add them now.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front ID Upload/Replace */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Front National ID
                    </label>
                    {editFrontIdPreview ? (
                      <div className="relative">
                        <img
                          src={editFrontIdPreview}
                          alt="New Front ID Preview"
                          className="w-full h-48 object-cover rounded-lg border-2 border-purple-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditRemoveFile('front')}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          New Upload
                        </div>
                      </div>
                    ) : editUserData.currentFrontIdUrl ? (
                      <div className="relative">
                        <img
                          src={editUserData.currentFrontIdUrl}
                          alt="Current Front ID"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <div className="absolute bottom-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Current Document
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-all cursor-pointer rounded-lg">
                          <div className="opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700">
                              Click to Replace
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleEditFileUpload(e.target.files[0], 'front')}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleEditFileUpload(e.target.files[0], 'front')}
                        />
                      </label>
                    )}
                  </div>

                  {/* Back ID Upload/Replace */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Back National ID
                    </label>
                    {editBackIdPreview ? (
                      <div className="relative">
                        <img
                          src={editBackIdPreview}
                          alt="New Back ID Preview"
                          className="w-full h-48 object-cover rounded-lg border-2 border-purple-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditRemoveFile('back')}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          New Upload
                        </div>
                      </div>
                    ) : editUserData.currentBackIdUrl ? (
                      <div className="relative">
                        <img
                          src={editUserData.currentBackIdUrl}
                          alt="Current Back ID"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <div className="absolute bottom-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Current Document
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-all cursor-pointer rounded-lg">
                          <div className="opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700">
                              Click to Replace
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleEditFileUpload(e.target.files[0], 'back')}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleEditFileUpload(e.target.files[0], 'back')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(editFrontIdFile || editBackIdFile) && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>
                        {editFrontIdFile && editBackIdFile ? 'Both documents will be replaced' : 
                         editFrontIdFile ? 'Front ID will be replaced' : 
                         'Back ID will be replaced'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowEditUserModal(false);
                      setEditUserData(null);
                      setEditFrontIdFile(null);
                      setEditBackIdFile(null);
                      setEditFrontIdPreview(null);
                      setEditBackIdPreview(null);
                    }}
                    disabled={editingUser || editUploadingFiles}
                    className="px-6 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Cancel editing and close without saving"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleEditUser}
                    disabled={editingUser || editUploadingFiles}
                    className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg"
                    title="Save all changes to user information"
                  >
                    {editingUser || editUploadingFiles ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editUploadingFiles ? 'Uploading Documents...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Add New User</h3>
                    <p className="text-sm text-gray-500 mt-1">Create a new user account for this project</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Account Type Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Account Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    newUserData.accountType === 'permanent' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}>
                    <input
                      type="radio"
                      value="permanent"
                      checked={newUserData.accountType === 'permanent'}
                      onChange={(e) => handleNewUserInputChange('accountType', e.target.value)}
                      className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="text-base font-semibold text-gray-900">Permanent User</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Regular user account with full access and no expiration date
                      </p>
                    </div>
                  </label>

                  <label className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    newUserData.accountType === 'temporary' 
                      ? 'border-orange-600 bg-orange-50' 
                      : 'border-gray-300 bg-white hover:border-orange-300'
                  }`}>
                    <input
                      type="radio"
                      value="temporary"
                      checked={newUserData.accountType === 'temporary'}
                      onChange={(e) => handleNewUserInputChange('accountType', e.target.value)}
                      className="mt-1 mr-3 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-orange-600" />
                        <span className="text-base font-semibold text-gray-900">Temporary User</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Time-limited account with specified validity period
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Validity Period - Only for Temporary Users */}
              {newUserData.accountType === 'temporary' && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                    Validity Period
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={newUserData.validityStartDate}
                        onChange={(e) => handleNewUserInputChange('validityStartDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={newUserData.validityEndDate}
                        onChange={(e) => handleNewUserInputChange('validityEndDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 mt-3 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>User account will become inaccessible after the end date. The account will behave as if deleted.</span>
                  </p>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.firstName}
                      onChange={(e) => handleNewUserInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.lastName}
                      onChange={(e) => handleNewUserInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => handleNewUserInputChange('email', e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Password setup link will be sent to this email</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      value={newUserData.mobile}
                      onChange={(e) => handleNewUserInputChange('mobile', e.target.value)}
                      placeholder="01234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      National ID *
                    </label>
                    <input
                      type="text"
                      value={newUserData.nationalId}
                      onChange={(e) => handleNewUserInputChange('nationalId', e.target.value)}
                      placeholder="Enter national ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={newUserData.dateOfBirth}
                      onChange={(e) => handleNewUserInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={newUserData.gender}
                      onChange={(e) => handleNewUserInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Project Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Number *
                    </label>
                    <input
                      type="text"
                      value={newUserData.projectUnit}
                      onChange={(e) => handleNewUserInputChange('projectUnit', e.target.value)}
                      placeholder="e.g., A101, B205"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={newUserData.projectRole}
                      onChange={(e) => handleNewUserInputChange('projectRole', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="owner">Owner</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ID Documents Upload */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  National ID Documents 
                </h4>
                <p className="text-sm text-gray-600 mb-4">Upload ID documents now or let the user upload during signup</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front ID Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Front National ID
                    </label>
                    {frontIdPreview ? (
                      <div className="relative">
                        <img
                          src={frontIdPreview}
                          alt="Front ID Preview"
                          className="w-full h-48 object-cover rounded-lg border-2 border-purple-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('front')}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Uploaded
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'front')}
                        />
                      </label>
                    )}
                  </div>

                  {/* Back ID Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Back National ID
                    </label>
                    {backIdPreview ? (
                      <div className="relative">
                        <img
                          src={backIdPreview}
                          alt="Back ID Preview"
                          className="w-full h-48 object-cover rounded-lg border-2 border-purple-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('back')}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Uploaded
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG or WebP (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'back')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-blue-900 mb-1">Important Information</h5>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>User profile will be created and <strong>pre-approved</strong></li>
                      <li><strong>✅ Password reset email will be sent automatically</strong> to the user</li>
                      <li>User clicks email link, sets password, and can login immediately</li>
                      <li>Required fields: First Name, Last Name, Email, Mobile, National ID, Unit</li>
                      <li>ID documents are optional - user can upload during first login if not provided</li>
                      {newUserData.accountType === 'temporary' && (
                        <li className="font-semibold">⚠️ Temporary accounts will become inaccessible after the end date</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Process Flow */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-green-900 mb-1">📧 Automated Email Process</h5>
                    <p className="text-sm text-green-800 mb-2">
                      When you click "Create User", the following happens automatically:
                    </p>
                    <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                      <li>User account created in Firebase Authentication</li>
                      <li><strong>Password reset email sent to: {newUserData.email || '[email will be shown]'}</strong></li>
                      <li>User profile saved in database with all information</li>
                      <li>ID documents uploaded to secure storage (if provided)</li>
                    </ol>
                    <p className="text-sm text-green-800 mt-3 font-medium">
                      ✨ The user will receive the email within seconds and can set their password immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(frontIdFile || backIdFile) && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>
                        {frontIdFile && backIdFile ? 'Both ID documents ready to upload' : 
                         frontIdFile ? 'Front ID ready to upload' : 
                         'Back ID ready to upload'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowAddUserModal(false);
                      // Reset files on cancel
                      setFrontIdFile(null);
                      setBackIdFile(null);
                      setFrontIdPreview(null);
                      setBackIdPreview(null);
                    }}
                    disabled={addingUser || uploadingFiles}
                    className="px-6 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Cancel and close without creating user"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNewUser}
                    disabled={addingUser || uploadingFiles}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg"
                    title="Create user account and send password setup email"
                  >
                    {addingUser || uploadingFiles ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {uploadingFiles ? 'Uploading Documents...' : 'Creating User...'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User & Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family Member Assignment Modal */}
      {showFamilyMemberModal && selectedParentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <UserPlus className="h-7 w-7 mr-3" />
                    Link Family Member
                  </h2>
                  <p className="text-pink-100 mt-1 text-sm">
                    Assign an existing user as family member to <strong>{selectedParentUser.firstName} {selectedParentUser.lastName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowFamilyMemberModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={familySearchTerm}
                    onChange={(e) => setFamilySearchTerm(e.target.value)}
                    placeholder="Search users by name, email, unit..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Only users from the <strong>same unit (Unit: {selectedParentUser.projects?.find(p => p.projectId === projectId)?.unit || 'N/A'})</strong> who are not already linked will appear
                </p>
              </div>

              {/* Available Users List */}
              <div className="space-y-3">
                {(() => {
                  // Get parent user's unit
                  const parentUserProject = selectedParentUser.projects?.find(p => p.projectId === projectId);
                  const parentUnit = parentUserProject?.unit;

                  // Filter users: exclude selected parent, exclude users who already have a parent, filter by same unit, and apply search
                  const availableUsers = projectUsers.filter(user => {
                    // Exclude the parent user themselves
                    if (user.id === selectedParentUser.id) return false;
                    
                    // Exclude users who already have a parent account
                    if (user.parentAccountId) return false;
                    
                    // MUST be in the same unit as parent
                    const userProject = user.projects?.find(p => p.projectId === projectId);
                    if (!userProject || userProject.unit !== parentUnit) return false;
                    
                    // Apply search filter
                    if (familySearchTerm) {
                      const searchLower = familySearchTerm.toLowerCase();
                      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                      const email = user.email?.toLowerCase() || '';
                      const unit = userProject.unit?.toLowerCase() || '';
                      
                      if (!fullName.includes(searchLower) && !email.includes(searchLower) && !unit.includes(searchLower)) {
                        return false;
                      }
                    }
                    
                    return true;
                  });

                  if (availableUsers.length === 0) {
                    return (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-semibold">No Available Users</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {familySearchTerm ? 'Try a different search term' : 'All users are either already linked or unavailable'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          {availableUsers.length} user{availableUsers.length !== 1 ? 's' : ''} available
                        </p>
                        {familySearchTerm && (
                          <button
                            onClick={() => setFamilySearchTerm('')}
                            className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                      
                      {availableUsers.map((user) => {
                        const userProject = user.projects?.find(p => p.projectId === projectId);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border-2 border-gray-200 hover:border-pink-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center ring-2 ring-pink-200">
                                <span className="text-lg font-bold text-white">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                    Unit: {userProject?.unit || 'N/A'}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Role: {userProject?.role || 'N/A'}
                                  </span>
                                  {user.approvalStatus === 'approved' && (
                                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                      ✓ Approved
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleLinkFamilyMember(user.id)}
                              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all hover:scale-105 shadow-md flex items-center whitespace-nowrap"
                            >
                              <Link2 className="h-4 w-4 mr-2" />
                              Link as Family
                            </button>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowFamilyMemberModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center"
                title="Close family member selection modal"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Building Details Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 text-white rounded-t-2xl border-b-4 border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Building Analytics</h2>
                    <p className="text-red-100 mt-1 text-sm">
                      {[...new Set(enrichedUnits.map(u => u.buildingNum))].length} Buildings • {enrichedUnits.length} Total Units
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBuildingModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(() => {
                  // Group enriched units by building
                  const buildingGroups = enrichedUnits.reduce((acc, unit) => {
                    const buildingNum = unit.buildingNum || 'Unknown';
                    if (!acc[buildingNum]) {
                      acc[buildingNum] = [];
                    }
                    acc[buildingNum].push(unit);
                    return acc;
                  }, {});

                  // Sort building numbers
                  const sortedBuildings = Object.keys(buildingGroups).sort((a, b) => {
                    if (a === 'Unknown') return 1;
                    if (b === 'Unknown') return -1;
                    return Number(a) - Number(b);
                  });

                  return sortedBuildings.map(buildingNum => {
                    const buildingUnits = buildingGroups[buildingNum];
                    const occupiedCount = buildingUnits.filter(unit => unit.isOccupied).length;

                    const occupancyRate = buildingUnits.length > 0 
                      ? Math.round((occupiedCount / buildingUnits.length) * 100) 
                      : 0;

                    return (
                      <div 
                        key={buildingNum}
                        onClick={() => {
                          setUnitBuildingFilter(String(buildingNum));
                          setShowBuildingModal(false);
                        }}
                        className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 hover:border-red-400 hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-3">
                            <div className="p-3 bg-red-200 rounded-full">
                              <Building className="h-6 w-6 text-red-700" />
                            </div>
                          </div>
                          <p className="text-sm font-bold text-red-700 uppercase mb-2">Building {buildingNum}</p>
                          <p className="text-4xl font-bold text-red-900 mb-1">{buildingUnits.length}</p>
                          <p className="text-xs text-gray-600 mb-4">units</p>
                          
                          <div className="flex items-center justify-center space-x-3 text-xs mb-3">
                            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              <span className="font-bold text-green-700">{occupiedCount}</span>
                            </div>
                            <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                              <span className="font-bold text-gray-700">{buildingUnits.length - occupiedCount}</span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all"
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                          <p className="text-xs font-bold text-red-700">{occupancyRate}% occupied</p>
                          
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-xs text-blue-600 font-semibold">Click to filter</p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 flex justify-end border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setShowBuildingModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center font-medium"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit/Building Notification Modal */}
      {showUnitNotificationModal && selectedUnitForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl border-b-4 border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <Bell className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Send Notification</h2>
                    <p className="text-blue-100 mt-1 text-sm">
                      {actionTargetType === 'unit' 
                        ? `Unit ${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`
                        : `All users in Building ${selectedUnitForAction.buildingNum}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUnitNotificationModal(false);
                    setSelectedUnitForAction(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Count Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Recipients</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {(() => {
                        if (actionTargetType === 'unit') {
                          const unitIdentifier = `${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`;
                          return projectUsers.filter(user => 
                            user.projects?.some(p => p.projectId === projectId && p.unit === unitIdentifier)
                          ).length;
                        } else {
                          return projectUsers.filter(user => 
                            user.projects?.some(p => {
                              if (p.projectId === projectId && p.unit) {
                                const [building] = p.unit.split('-');
                                return building === String(selectedUnitForAction.buildingNum);
                              }
                              return false;
                            })
                          ).length;
                        }
                      })()} users
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notification Title (Optional)
                </label>
                <input
                  type="text"
                  value={unitNotificationTitle}
                  onChange={(e) => setUnitNotificationTitle(e.target.value)}
                  placeholder={`${actionTargetType === 'unit' ? 'Unit' : 'Building'} Notification`}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Notification Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={unitNotificationMessage}
                  onChange={(e) => setUnitNotificationMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows="6"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  This message will be sent to all {actionTargetType === 'unit' ? 'users in this unit' : 'users in this building'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowUnitNotificationModal(false);
                  setSelectedUnitForAction(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendUnitNotification}
                disabled={!unitNotificationMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit/Building Suspension Modal */}
      {showUnitSuspensionModal && selectedUnitForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 text-white rounded-t-2xl border-b-4 border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <UserX className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Suspend Users</h2>
                    <p className="text-red-100 mt-1 text-sm">
                      {actionTargetType === 'unit' 
                        ? `Unit ${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`
                        : `All users in Building ${selectedUnitForAction.buildingNum}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUnitSuspensionModal(false);
                    setSelectedUnitForAction(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Count Warning */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Warning: Mass Suspension</p>
                    <p className="text-sm text-gray-700">
                      You are about to suspend <span className="font-bold text-red-700">
                      {(() => {
                        if (actionTargetType === 'unit') {
                          const unitIdentifier = `${selectedUnitForAction.buildingNum}-${selectedUnitForAction.unitNum}`;
                          return projectUsers.filter(user => 
                            user.projects?.some(p => p.projectId === projectId && p.unit === unitIdentifier)
                          ).length;
                        } else {
                          return projectUsers.filter(user => 
                            user.projects?.some(p => {
                              if (p.projectId === projectId && p.unit) {
                                const [building] = p.unit.split('-');
                                return building === String(selectedUnitForAction.buildingNum);
                              }
                              return false;
                            })
                          ).length;
                        }
                      })()} user(s)</span> in this {actionTargetType}. This action will prevent them from accessing the app.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suspension Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Suspension Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUnitSuspensionType('temporary')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      unitSuspensionType === 'temporary'
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                    }`}
                  >
                    <Clock className="h-5 w-5 mx-auto mb-2" />
                    <p className="font-semibold">Temporary</p>
                    <p className="text-xs mt-1 text-gray-600">Set a duration</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSuspensionType('permanent')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      unitSuspensionType === 'permanent'
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                    <p className="font-semibold">Permanent</p>
                    <p className="text-xs mt-1 text-gray-600">Until manually lifted</p>
                  </button>
                </div>
              </div>

              {/* Duration (if temporary) */}
              {unitSuspensionType === 'temporary' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Suspension Duration
                  </label>
                  <select
                    value={unitSuspensionDuration}
                    onChange={(e) => setUnitSuspensionDuration(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              )}

              {/* Suspension Reason */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reason for Suspension *
                </label>
                <textarea
                  value={unitSuspensionReason}
                  onChange={(e) => setUnitSuspensionReason(e.target.value)}
                  placeholder="Enter the reason for suspension..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  This reason will be visible to the suspended users
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowUnitSuspensionModal(false);
                  setSelectedUnitForAction(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUnitUsers}
                disabled={!unitSuspensionReason.trim()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal for Unit Requests */}
      {showUserDetailsModal && selectedUserForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 finesModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[75vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUserFullData ? 
                    `${selectedUserFullData.firstName?.charAt(0) || ''}${selectedUserFullData.lastName?.charAt(0) || ''}` :
                    `${selectedUserForDetails.userName?.split(' ')[0]?.charAt(0) || ''}${selectedUserForDetails.userName?.split(' ')[1]?.charAt(0) || ''}`
                  }
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUserFullData ? 
                      `${selectedUserFullData.firstName} ${selectedUserFullData.lastName}` :
                      selectedUserForDetails.userName
                    }
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUserFullData?.email || selectedUserForDetails.userEmail}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                      selectedUserForDetails.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      selectedUserForDetails.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedUserForDetails.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {selectedUserForDetails.status === 'approved' && <UserCheck className="h-3 w-3 mr-1" />}
                      {selectedUserForDetails.status === 'rejected' && <UserX className="h-3 w-3 mr-1" />}
                      Request: {selectedUserForDetails.status?.toUpperCase()}
                    </span>
                    {selectedUserFullData?.migrated === true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Migrated
                      </span>
                    )}
                    {selectedUserFullData?.oldId && selectedUserFullData?.migrated !== true && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Migration
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {loadingUserDetails ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedUserFullData ? (
                <>
                  {/* Personal Information Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                        <p className="text-sm text-gray-900 font-semibold mt-1">
                          {selectedUserFullData.fullName || `${selectedUserFullData.firstName} ${selectedUserFullData.lastName}`}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.firstName || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.lastName || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                        <p className="text-sm text-gray-900 font-medium mt-1 break-all">{selectedUserFullData.email || 'No email'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.mobile || selectedUserFullData.phone || 'No phone'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">National ID</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.nationalId || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Birth</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                        <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUserFullData.gender || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Verified</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedUserFullData.emailVerified ? (
                            <span className="text-green-600 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="text-red-600">Not Verified</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status & Approvals Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-purple-600" />
                      Account Status & Approvals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval Status</label>
                        <p className="text-sm text-gray-900 font-medium mt-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            selectedUserFullData.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : selectedUserFullData.approvalStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : selectedUserFullData.approvalStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedUserFullData.approvalStatus || 'pending'}
                          </span>
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Status</label>
                        <p className="text-sm text-gray-900 font-medium mt-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            selectedUserFullData.registrationStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : selectedUserFullData.registrationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedUserFullData.registrationStatus || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile Complete</label>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedUserFullData.isProfileComplete ? (
                            <span className="text-green-600 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Complete
                            </span>
                          ) : (
                            <span className="text-orange-600">Incomplete</span>
                          )}
                        </p>
                      </div>
                      {selectedUserFullData.approvedBy && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved By</label>
                          <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserFullData.approvedBy}</p>
                        </div>
                      )}
                      {selectedUserFullData.approvedAt && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved At</label>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {selectedUserFullData.approvedAt.toDate ? 
                              selectedUserFullData.approvedAt.toDate().toLocaleDateString() :
                              new Date(selectedUserFullData.approvedAt).toLocaleDateString()
                            }
                          </p>
                        </div>
                      )}
                      {selectedUserFullData.role && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Role</label>
                          <p className="text-sm text-gray-900 font-medium mt-1 capitalize">{selectedUserFullData.role}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents & Profile Pictures Section */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-purple-600" />
                      Documents & Profile Pictures
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div>
                        <label className="text-sm font-medium text-purple-700">Profile Picture</label>
                        <div className="mt-2">
                          {selectedUserFullData.documents?.profilePictureUrl ? (
                            <div className="flex items-center space-x-4">
                              <img
                                src={selectedUserFullData.documents.profilePictureUrl}
                                alt="Profile"
                                className="h-20 w-20 rounded-full object-cover border-4 border-purple-200 shadow-md"
                              />
                              <button
                                onClick={() => window.open(selectedUserFullData.documents.profilePictureUrl, '_blank')}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Size
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-4">
                              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                                <Users className="h-8 w-8 text-gray-400" />
                              </div>
                              <span className="text-gray-500 text-sm">No profile picture uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* National ID Documents */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Front ID */}
                        <div>
                          <label className="text-sm font-medium text-purple-700">Front National ID</label>
                          <div className="mt-2">
                            {selectedUserFullData.documents?.frontIdUrl ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={selectedUserFullData.documents.frontIdUrl}
                                    alt="Front National ID"
                                    className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 shadow-sm"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ Uploaded
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => window.open(selectedUserFullData.documents.frontIdUrl, '_blank')}
                                  className="w-full px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Document
                                </button>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <span className="text-gray-500 text-sm">Not uploaded</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Back ID */}
                        <div>
                          <label className="text-sm font-medium text-purple-700">Back National ID</label>
                          <div className="mt-2">
                            {selectedUserFullData.documents?.backIdUrl ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={selectedUserFullData.documents.backIdUrl}
                                    alt="Back National ID"
                                    className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 shadow-sm"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ Uploaded
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => window.open(selectedUserFullData.documents.backIdUrl, '_blank')}
                                  className="w-full px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Document
                                </button>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <span className="text-gray-500 text-sm">Not uploaded</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                      <p className="text-sm text-gray-900 font-semibold mt-1">{selectedUserForDetails.userName || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                      <p className="text-sm text-gray-900 font-medium mt-1 break-all">{selectedUserForDetails.userEmail || 'No email'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserForDetails.userPhone || 'No phone'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                      <p className="text-xs text-gray-600 font-mono mt-1 break-all">{selectedUserForDetails.userId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Request Information Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Unit Request Information
                </h3>
                <div className="bg-white rounded-lg p-5 border-2 border-green-300 shadow-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Project Name</label>
                      <p className="text-base text-green-900 font-bold mt-1">{selectedUserForDetails.projectName || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Unit Number</label>
                      <p className="text-base text-green-900 font-bold mt-1">{selectedUserForDetails.unit || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Role</label>
                      <p className="text-base text-green-900 font-bold mt-1 capitalize">{selectedUserForDetails.role || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Request Date</label>
                      <p className="text-base text-green-900 font-bold mt-1">
                        {selectedUserForDetails.requestedAt?.toDate ? 
                          new Date(selectedUserForDetails.requestedAt.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Status & Action Details */}
              <div className={`rounded-xl p-6 border ${
                selectedUserForDetails.status === 'pending' ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200' :
                selectedUserForDetails.status === 'approved' ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' :
                'bg-gradient-to-br from-red-50 to-rose-100 border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                  selectedUserForDetails.status === 'pending' ? 'text-amber-900' :
                  selectedUserForDetails.status === 'approved' ? 'text-green-900' :
                  'text-red-900'
                }`}>
                  <FileText className={`h-5 w-5 mr-2 ${
                    selectedUserForDetails.status === 'pending' ? 'text-amber-600' :
                    selectedUserForDetails.status === 'approved' ? 'text-green-600' :
                    'text-red-600'
                  }`} />
                  Request Status & Action Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Request Status</label>
                    <p className="text-sm text-gray-900 font-semibold mt-1 capitalize">{selectedUserForDetails.status || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Request Date</label>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {selectedUserForDetails.requestedAt?.toDate ? 
                        new Date(selectedUserForDetails.requestedAt.toDate()).toLocaleDateString() : 
                        'N/A'}
                    </p>
                  </div>
                  {selectedUserForDetails.approvedBy && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved By</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserForDetails.approvedBy}</p>
                    </div>
                  )}
                  {selectedUserForDetails.approvedAt?.toDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {new Date(selectedUserForDetails.approvedAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedUserForDetails.rejectedBy && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected By</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedUserForDetails.rejectedBy}</p>
                    </div>
                  )}
                  {selectedUserForDetails.rejectedAt?.toDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected At</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {new Date(selectedUserForDetails.rejectedAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedUserForDetails.rejectionReason && (
                    <div className="bg-white rounded-lg p-3 shadow-sm md:col-span-3">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejection Reason</label>
                      <p className="text-sm text-red-700 font-medium mt-1">{selectedUserForDetails.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-between items-center border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              {selectedUserForDetails.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUserDetailsModal(false);
                      handleRejectRequest(selectedUserForDetails);
                    }}
                    disabled={approvalLoading}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium disabled:opacity-50 flex items-center shadow-md hover:shadow-lg"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDetailsModal(false);
                      handleApproveRequest(selectedUserForDetails);
                    }}
                    disabled={approvalLoading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 flex items-center shadow-md hover:shadow-lg"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDashboard;