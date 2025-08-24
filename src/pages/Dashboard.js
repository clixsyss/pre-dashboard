import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Calendar, 
  School, 
  TrendingUp, 
  DollarSign,
  UserPlus,
  AlertCircle
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

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalAcademies: 0,
    totalCourts: 0,
    totalRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
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
      let recentBookingsData = [];
      
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        totalUsers = usersSnapshot.size;
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
        totalRevenue
      });
      
      setRecentBookings(recentBookingsData);
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

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'up', color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600'
    };

    const changeColorClasses = {
      up: 'text-green-600',
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                    userInfo.isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
              : "You need admin privileges to access this dashboard. Either add yourself to the admins collection or set your role to 'admin' in the users collection."
            }
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your sports platform today.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
              <div className="text-xs text-blue-100 mb-1">Current Status</div>
              <div className="text-sm font-semibold">Active Platform</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          change="+12%"
          changeType="up"
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          change="+8%"
          changeType="up"
          color="green"
        />
        <StatCard
          title="Total Academies"
          value={stats.totalAcademies}
          icon={School}
          change="+5%"
          changeType="up"
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue}`}
          icon={DollarSign}
          change="+15%"
          changeType="up"
          color="orange"
        />
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
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
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
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
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
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-blue-600">
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
                      {booking.date?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${booking.price}
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
