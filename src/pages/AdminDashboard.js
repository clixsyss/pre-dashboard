import React from 'react';
import ProjectSportsInitializer from '../components/ProjectSportsInitializer';
import { 
  Shield, 
  Database, 
  Settings, 
  Users, 
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Check if user is admin (you can implement your own admin check logic)
  const isAdmin = true; // Simplified for now

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System administration and configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Admin Access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-semibold text-green-600">Healthy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sports Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Available Sports Overview</h3>
              <span className="text-sm text-gray-600">Total: 50+ sports across all categories</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 text-sm mb-2">Team Sports</h4>
                <p className="text-xs text-blue-700">Basketball, Football, Rugby, Volleyball, Baseball, Hockey, Cricket, Lacrosse</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-900 text-sm mb-2">Racket Sports</h4>
                <p className="text-xs text-green-700">Tennis, Squash, Paddle, Badminton, Table Tennis, Pickleball, Racquetball</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-purple-900 text-sm mb-2">Fitness & Wellness</h4>
                <p className="text-xs text-purple-700">Yoga, Pilates, Gym, CrossFit, Spinning, Zumba, Barre, Meditation</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-orange-900 text-sm mb-2">Aquatic Sports</h4>
                <p className="text-xs text-orange-700">Swimming, Water Polo, Diving, Synchronized Swimming</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-900 text-sm mb-2">Combat Sports</h4>
                <p className="text-xs text-red-700">Boxing, Martial Arts, Kickboxing, Wrestling</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h4 className="font-medium text-indigo-900 text-sm mb-2">Specialized Sports</h4>
                <p className="text-xs text-indigo-700">Golf, Bowling, Rock Climbing, Skateboarding, Archery, Dance, Gymnastics</p>
              </div>
            </div>
          </div>

          {/* Sports Initializer */}
          <ProjectSportsInitializer />

          {/* Additional Admin Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Tools</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Additional administrative tools and utilities
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Database Backup</h4>
                    <p className="text-sm text-gray-600">Create system backup</p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">User Management</h4>
                    <p className="text-sm text-gray-600">Manage user accounts</p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">System Settings</h4>
                    <p className="text-sm text-gray-600">Configure system options</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;