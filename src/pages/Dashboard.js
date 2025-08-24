import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  School, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Eye,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalAcademies: 0,
    totalCourts: 0,
    totalRevenue: 0,
    recentBookings: [],
    monthlyBookings: [],
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const totalBookings = bookingsSnapshot.size;
      const recentBookings = [];
      
      bookingsSnapshot.forEach(doc => {
        const data = doc.data();
        recentBookings.push({
          id: doc.id,
          ...data,
          date: data.createdAt?.toDate?.() || new Date()
        });
      });

      // Fetch academies
      const academiesSnapshot = await getDocs(collection(db, 'academies'));
      const totalAcademies = academiesSnapshot.size;

      // Fetch sports/courts
      const sportsSnapshot = await getDocs(collection(db, 'sports'));
      let totalCourts = 0;
      sportsSnapshot.forEach(doc => {
        const data = doc.data();
        totalCourts += (data.courts?.length || 0);
      });

      // Calculate revenue (assuming each booking has a price)
      const totalRevenue = recentBookings.reduce((sum, booking) => {
        return sum + (booking.totalPrice || booking.price || 0);
      }, 0);

      // Generate sample monthly data
      const monthlyBookings = generateMonthlyData();
      const userGrowth = generateUserGrowthData();

      setStats({
        totalUsers,
        totalBookings,
        totalAcademies,
        totalCourts,
        totalRevenue,
        recentBookings: recentBookings.slice(0, 5),
        monthlyBookings,
        userGrowth
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      bookings: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 5000) + 1000
    }));
  };

  const generateUserGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let cumulative = 0;
    return months.map(month => {
      const growth = Math.floor(Math.random() * 50) + 10;
      cumulative += growth;
      return {
        month,
        users: cumulative
      };
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the PRE Admin Dashboard. Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalUsers)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
            <span className="text-success-600">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary-100 rounded-md flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalBookings)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
            <span className="text-success-600">+8%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent-100 rounded-md flex items-center justify-center">
                <School className="w-5 h-5 text-accent-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Academies</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalAcademies)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
            <span className="text-success-600">+5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
            <span className="text-success-600">+15%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-soft">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
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
              {stats.recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.userName || 'Unknown User'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.type === 'court' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {booking.type === 'court' ? 'Court' : 'Academy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.date?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
