import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity
} from 'lucide-react';

const PassAnalytics = ({ stats, users, passes, selectedProject }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Mock data for demonstration - replace with real data from API
  const mockDailyData = [
    { date: '2024-01-01', total: 12, sent: 8, pending: 4 },
    { date: '2024-01-02', total: 18, sent: 15, pending: 3 },
    { date: '2024-01-03', total: 25, sent: 20, pending: 5 },
    { date: '2024-01-04', total: 15, sent: 12, pending: 3 },
    { date: '2024-01-05', total: 30, sent: 25, pending: 5 },
    { date: '2024-01-06', total: 22, sent: 18, pending: 4 },
    { date: '2024-01-07', total: 28, sent: 22, pending: 6 }
  ];

  const mockUserData = [
    { name: 'John Doe', total: 45, sent: 38, pending: 7 },
    { name: 'Jane Smith', total: 32, sent: 28, pending: 4 },
    { name: 'Mike Johnson', total: 28, sent: 25, pending: 3 },
    { name: 'Sarah Wilson', total: 35, sent: 30, pending: 5 },
    { name: 'David Brown', total: 22, sent: 18, pending: 4 }
  ];

  const statusData = [
    { name: 'Sent', value: stats?.passesSent || 0, color: '#10B981' },
    { name: 'Pending', value: (stats?.totalPassesThisMonth || 0) - (stats?.passesSent || 0), color: '#F59E0B' }
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

  const timeRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
        <div className="flex items-center space-x-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === option.value
                  ? 'bg-pre-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Passes</p>
              <p className="text-2xl font-bold">{stats?.totalPassesThisMonth || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Sent Passes</p>
              <p className="text-2xl font-bold">{stats?.passesSent || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Passes</p>
              <p className="text-2xl font-bold">
                {(stats?.totalPassesThisMonth || 0) - (stats?.passesSent || 0)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold">
                {stats?.totalPassesThisMonth > 0 
                  ? Math.round((stats?.passesSent / stats?.totalPassesThisMonth) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Pass Generation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Daily Pass Generation</h4>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockDailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Total"
              />
              <Area 
                type="monotone" 
                dataKey="sent" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.8}
                name="Sent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Status Distribution</h4>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Top Users by Pass Generation</h4>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockUserData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#3B82F6" name="Total Passes" />
            <Bar dataKey="sent" fill="#10B981" name="Sent Passes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Usage Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">Weekly Trend</h5>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">+12%</p>
          <p className="text-sm text-gray-500">vs last week</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">Monthly Trend</h5>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">+8%</p>
          <p className="text-sm text-gray-500">vs last month</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900">Average Daily</h5>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round((stats?.totalPassesThisMonth || 0) / 30)}
          </p>
          <p className="text-sm text-gray-500">passes per day</p>
        </div>
      </div>
    </div>
  );
};

export default PassAnalytics;
