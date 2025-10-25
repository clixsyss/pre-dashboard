import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Building2,
  LogOut,
  Settings,
  Bell,
  BarChart3,
  UserCheck,
  Shield
} from 'lucide-react';
import logo from '../logo.png';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Overview & Analytics' },
    { name: 'Projects', href: '/projects', icon: Building2, description: 'Manage Projects' },
    { name: 'Users', href: '/users', icon: UserCheck, description: 'Manage User Accounts' },
    { name: 'Admin Management', href: '/admin-management', icon: Shield, description: 'Manage Admin Accounts & Approvals' },
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
    <div className="min-h-screen bg-pre-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:inset-0`}>
        <div className="flex items-center justify-between h-24 px-8 border-b border-gray-100 bg-gradient-to-r from-pre-red via-pre-red to-pre-red">
          <div className="flex items-center space-x-4">
            <div className="w-28 h-14 bg-black bg-opacity-60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <img src={logo} alt="PRE Logo" className="h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PRE Admin</h1>
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
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
                (item.name === 'Projects' && location.pathname === '/project-selection');
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
                      ? 'bg-red-50 text-pre-red border-r-4 border-pre-red shadow-lg shadow-red-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${
                    isActive ? 'text-pre-red' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-semibold text-base">{item.name}</div>
                    <div className={`text-sm mt-1 ${
                      isActive ? 'text-pre-red' : 'text-gray-400'
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
        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-gray-100 bg-gradient-to-r from-pre-white to-pre-white">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-pre-red to-pre-red flex items-center justify-center shadow-lg">
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
                  {navigation.find(item => 
                    item.href === location.pathname || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
                    (item.name === 'Projects' && location.pathname === '/project-selection')
                  )?.name || 'Dashboard'}
                </h2>
                <p className="text-base text-gray-500 mt-1">
                  {navigation.find(item => 
                    item.href === location.pathname || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
                    (item.name === 'Projects' && location.pathname === '/project-selection')
                  )?.description || 'Manage your sports platform'}
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
                          className="px-4 py-2 bg-red-50 text-pre-red rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center space-x-2"
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
                      className="px-4 py-2 bg-red-50 text-pre-red rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center space-x-2"
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
              <div className="flex items-center space-x-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-pre-white to-pre-white border border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pre-red to-pre-red flex items-center justify-center shadow-md">
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
