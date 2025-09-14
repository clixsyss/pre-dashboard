import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  School, 
  TrendingUp, 
  DollarSign,
  UserPlus,
  AlertCircle,
  Store,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import AdminSetup from '../components/AdminSetup';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Check if a project is selected, if not redirect to project selection
  useEffect(() => {
    const selectedProject = localStorage.getItem('adminSelectedProject');
    if (!selectedProject) {
      console.log('No project selected, redirecting to project selection');
      navigate('/project-selection');
    } else {
      console.log('Project selected:', JSON.parse(selectedProject));
    }
  }, [navigate]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalAcademies: 0,
    totalCourts: 0,
    totalRevenue: 0,
    pendingUsers: 0,
    pendingBookings: 0,
    activeBookings: 0,
    newUsersToday: 0,
    totalProjects: 0,
    totalEvents: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize with default values
      let totalUsers = 0;
      let totalBookings = 0;
      let totalAcademies = 0;
      let totalCourts = 0;
      let totalRevenue = 0;
      let pendingUsers = 0;
      let pendingBookings = 0;
      let activeBookings = 0;
      let newUsersToday = 0;
      let totalProjects = 0;
      let totalEvents = 0;
      let recentBookingsData = [];
      let recentUsersData = [];
      
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        totalUsers = usersSnapshot.size;
        
        // Get recent users for display
        usersSnapshot.forEach(doc => {
          if (recentUsersData.length < 5) {
            const userData = doc.data();
            recentUsersData.push({
              id: doc.id,
              ...userData,
              createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
              name: userData.firstName && userData.lastName ? 
                `${userData.firstName} ${userData.lastName}` : 
                userData.email || 'Unknown User',
              email: userData.email || 'No email',
              status: userData.registrationStatus || 'pending'
            });
          }
        });
        
        // Check for pending users
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.registrationStatus === 'pending') {
            pendingUsers++;
          }
          
          // Check for new users today
          if (userData.createdAt) {
            const userDate = new Date(userData.createdAt.seconds * 1000);
            const today = new Date();
            if (userDate.toDateString() === today.toDateString()) {
              newUsersToday++;
            }
          }
        });
        
        console.log('Users fetched:', totalUsers);
      } catch (err) {
        console.warn('Could not fetch users:', err.message);
      }

      try {
        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        totalBookings = bookingsSnapshot.size;
        
        // Calculate revenue and get recent bookings
        bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          if (booking.price) {
            totalRevenue += parseFloat(booking.price) || 0;
          }
          
          // Check booking status
          if (booking.status === 'pending') {
            pendingBookings++;
          } else if (booking.status === 'active' || booking.status === 'confirmed') {
            activeBookings++;
          }
          
          // Get recent bookings for display
          if (recentBookingsData.length < 5) {
            recentBookingsData.push({
              id: doc.id,
              ...booking,
              date: booking.date ? new Date(booking.date.seconds * 1000) : new Date(),
              userName: booking.userName || 'Unknown User',
              userEmail: booking.userEmail || 'No email',
              serviceType: booking.serviceType || 'unknown',
              serviceName: booking.serviceName || 'Unknown Service',
              status: booking.status || 'pending',
              price: booking.price || 0
            });
          }
        });
        console.log('Bookings fetched:', totalBookings);
      } catch (err) {
        console.warn('Could not fetch bookings:', err.message);
      }

      try {
        // Fetch academies
        const academiesSnapshot = await getDocs(collection(db, 'academies'));
        totalAcademies = academiesSnapshot.size;
        console.log('Academies fetched:', totalAcademies);
      } catch (err) {
        console.warn('Could not fetch academies:', err.message);
      }

      try {
        // Fetch projects
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        totalProjects = projectsSnapshot.size;
        console.log('Projects fetched:', totalProjects);
      } catch (err) {
        console.warn('Could not fetch projects:', err.message);
      }

      try {
        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        totalEvents = eventsSnapshot.size;
        console.log('Events fetched:', totalEvents);
      } catch (err) {
        console.warn('Could not fetch events:', err.message);
      }

      try {
        // Fetch courts
        const courtsSnapshot = await getDocs(collection(db, 'courts'));
        totalCourts = courtsSnapshot.size;
        console.log('Courts fetched:', totalCourts);
      } catch (err) {
        console.warn('Could not fetch courts:', err.message);
      }

      // Update state
      setStats({
        totalUsers,
        totalBookings,
        totalAcademies,
        totalCourts,
        totalRevenue,
        pendingUsers,
        pendingBookings,
        activeBookings,
        newUsersToday,
        totalProjects,
        totalEvents
      });
      
      setRecentBookings(recentBookingsData);
      setRecentUsers(recentUsersData);
      setMonthlyData(generateMonthlyData(totalBookings));
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserStatus();
    fetchDashboardData();
  }, [fetchDashboardData]);

  const checkUserStatus = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        console.log('Current user:', user.email, user.uid);
        
        // Check if user is in admins collection
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            setUserInfo({ ...user, isAdmin: true, adminSource: 'admins collection' });
            console.log('User is admin (from admins collection)');
            return;
          }
        } catch (err) {
          console.log('Could not check admins collection:', err.message);
        }
        
        // Check if user has admin role in users collection
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdmin = userData.role === 'admin';
            setUserInfo({ ...user, isAdmin, adminSource: 'users collection', role: userData.role });
            console.log('User role from users collection:', userData.role, 'Is admin:', isAdmin);
            return;
          }
        } catch (err) {
          console.log('Could not check users collection:', err.message);
        }
        
        setUserInfo({ ...user, isAdmin: false, adminSource: 'not found' });
        console.log('User is not admin');
      } else {
        console.log('No user logged in');
        setUserInfo(null);
      }
    } catch (err) {
      console.error('Error checking user status:', err);
    }
  };



  const generateMonthlyData = (totalBookings) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate sample data for now
    return months.map((month, index) => {
      // Simulate some data for demonstration
      const monthBookings = Math.floor(Math.random() * Math.max(1, totalBookings / 12)) + 1;
      const monthRevenue = monthBookings * (Math.random() * 100 + 50);
      
      return {
        month,
        bookings: monthBookings,
        revenue: Math.round(monthRevenue)
      };
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'up', color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-red-50 text-pre-red',
      green: 'bg-red-50 text-pre-red',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600'
    };

    const changeColorClasses = {
      up: 'text-pre-red',
      down: 'text-red-600'
    };

    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-base font-medium text-gray-600 mb-3">{title}</p>
            <p className="text-4xl font-bold text-gray-900 mb-3">{value}</p>
            {change && (
              <div className="flex items-center">
                <TrendingUp className={`h-5 w-5 ${changeColorClasses[changeType]} ${changeType === 'down' ? 'rotate-180' : ''}`} />
                <span className={`ml-2 text-sm font-semibold ${changeColorClasses[changeType]}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${colorClasses[color]} shadow-md`}>
            <Icon className="h-10 w-10" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{error}</h3>
          
          {/* User Status Information */}
          {userInfo && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-gray-600" />
                Current User Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>Email:</strong> {userInfo.email}</div>
                <div><strong>UID:</strong> {userInfo.uid}</div>
                <div><strong>Is Admin:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    userInfo.isAdmin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userInfo.isAdmin ? 'Yes' : 'No'}
                  </span>
                </div>
                <div><strong>Admin Source:</strong> {userInfo.adminSource}</div>
                {userInfo.role && <div><strong>Role:</strong> {userInfo.role}</div>}
              </div>
            </div>
          )}
          
          <div className="text-gray-600 mb-8 leading-relaxed">
            {userInfo?.isAdmin 
              ? "You appear to be an admin, but there might be a permission issue. Check the browser console for details."
              : "You need admin privileges to access this dashboard. Use the admin setup tool below to add yourself as an admin."
            }
          </div>
          
          {/* Admin Setup Component */}
          <div className="mb-8">
            <AdminSetup />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-pre-red text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Retry
            </button>
            <button 
              onClick={() => window.open('https://console.firebase.google.com/project/_/firestore/rules', '_blank')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Open Firestore Rules
            </button>
            <button 
              onClick={() => window.open('https://console.firebase.google.com/project/_/firestore/data', '_blank')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Open Firestore Data
            </button>
                  </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-8 py-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Recent Users</h3>
              <p className="text-gray-500 mt-1">Latest platform registrations</p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200">
              {recentUsers.length} recent users
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-pre-red">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button className="text-pre-red hover:text-red-800 transition-colors duration-150">
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-gray-500">
                    No recent users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-8">

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Primary Stats */}
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          change={`+${stats.newUsersToday} today`}
          changeType="up"
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          change={`${stats.activeBookings} active`}
          changeType="up"
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          change="+15%"
          changeType="up"
          color="orange"
        />
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={Store}
          change="+2"
          changeType="up"
          color="purple"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Users</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendingUsers}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Pending Bookings</p>
              <p className="text-2xl font-bold text-red-900">{stats.pendingBookings}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-50 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Active Bookings</p>
              <p className="text-2xl font-bold text-red-900">{stats.activeBookings}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-pre-red" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-50 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Events</p>
              <p className="text-2xl font-bold text-red-900">{stats.totalEvents}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <Calendar className="h-6 w-6 text-pre-red" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Bookings Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Monthly Bookings</h3>
              <p className="text-gray-500 mt-1">Track booking trends over time</p>
            </div>
            <div className="w-4 h-4 bg-pre-red rounded-full"></div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#3b82f6" 
                strokeWidth={4}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 8, stroke: 'white' }}
                activeDot={{ r: 10, stroke: '#3b82f6', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Monthly Revenue</h3>
              <p className="text-gray-500 mt-1">Monitor financial performance</p>
            </div>
            <div className="w-4 h-4 bg-pre-red rounded-full"></div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
            <p className="text-gray-500 mt-1">Common administrative tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8" />
              <span className="text-sm font-medium">View All</span>
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">Manage Users</div>
              <div className="text-pre-red text-sm">Review and manage user accounts</div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-pre-red to-red-600 text-white p-6 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8" />
              <span className="text-sm font-medium">View All</span>
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">Bookings</div>
              <div className="text-red-100 text-sm">Monitor and manage reservations</div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Store className="h-8 w-8" />
              <span className="text-sm font-medium">View All</span>
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">Projects</div>
              <div className="text-purple-100 text-sm">Manage property projects</div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <School className="h-8 w-8" />
              <span className="text-sm font-medium">View All</span>
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">Academies</div>
              <div className="text-orange-100 text-sm">Manage academy programs</div>
            </div>
          </button>

        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-8 py-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Recent Bookings</h3>
              <p className="text-gray-500 mt-1">Latest court and academy reservations</p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200">
              {recentBookings.length} recent bookings
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-pre-red">
                            {booking.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {booking.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.serviceType === 'court' ? 'Court Booking' : 'Academy Program'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.serviceName}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(booking.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center">
                    <div className="text-gray-500">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-semibold text-gray-900 mb-2">No recent bookings</p>
                      <p className="text-gray-500">Bookings will appear here once they're created</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
