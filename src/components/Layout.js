import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  Building2,
  LogOut,
  Settings,
  Bell,
  BarChart3,
  UserCheck
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Overview & Analytics' },
    { name: 'Projects', href: '/projects', icon: Building2, description: 'Manage Projects' },
    { name: 'Users', href: '/users', icon: UserCheck, description: 'Manage User Accounts' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:inset-0`}>
        <div className="flex items-center justify-between h-24 px-8 border-b border-gray-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Home className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PRE Admin</h1>
              <p className="text-sm text-blue-100 font-medium">Sports Platform</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-white hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-10 px-6">
          <div className="space-y-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center px-5 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-lg shadow-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-semibold text-base">{item.name}</div>
                    <div className={`text-sm mt-1 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">
                {currentUser?.displayName || 'Admin User'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {currentUser?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Header */}
        <div className="sticky top-0 z-40 bg-white shadow-lg border-b border-gray-200">
          <div className="flex items-center justify-between h-24 px-8 lg:px-10">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-7 w-7" />
              </button>
              
              <div className="hidden sm:block">
                <h2 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-base text-gray-500 mt-1">
                  {navigation.find(item => item.href === location.pathname)?.description || 'Manage your sports platform'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Project Switcher */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Project:</span>
                {(() => {
                  const selectedProject = localStorage.getItem('adminSelectedProject');
                  if (selectedProject) {
                    try {
                      const project = JSON.parse(selectedProject);
                      return (
                        <button
                          onClick={() => navigate('/project-selection')}
                          className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center space-x-2"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>{project.name}</span>
                        </button>
                      );
                    } catch (e) {
                      // Fallback if JSON parsing fails
                    }
                  }
                  return (
                    <button
                      onClick={() => navigate('/project-selection')}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center space-x-2"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Select Project</span>
                    </button>
                  );
                })()}
              </div>
              
              <button className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <button className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="h-6 w-6" />
              </button>
              <div className="w-px h-10 bg-gray-300"></div>
              <div className="flex items-center space-x-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.displayName || 'Admin'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-12">
          <div className="max-w-7xl mx-auto px-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
