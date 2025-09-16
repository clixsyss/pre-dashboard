import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import PermissionGate from './PermissionGate';

/**
 * Permission-based Navigation Component
 * Shows/hides navigation items based on admin permissions
 */
const PermissionBasedNav = () => {
  const { currentAdmin, isSuperAdmin } = useAdminAuth();

  if (!currentAdmin) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      // Dashboard is accessible to all active admins
      entity: null,
      action: null
    },
    {
      id: 'users',
      label: 'Users',
      path: '/users',
      icon: '👥',
      entity: 'users',
      action: 'read'
    },
    {
      id: 'units',
      label: 'Units',
      path: '/units',
      icon: '🏠',
      entity: 'units',
      action: 'read'
    },
    {
      id: 'services',
      label: 'Services',
      path: '/services',
      icon: '🔧',
      entity: 'services',
      action: 'read'
    },
    {
      id: 'complaints',
      label: 'Complaints',
      path: '/complaints',
      icon: '📝',
      entity: 'complaints',
      action: 'read'
    },
    {
      id: 'news',
      label: 'News',
      path: '/news',
      icon: '📰',
      entity: 'news',
      action: 'read'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      icon: '🔔',
      entity: 'notifications',
      action: 'read'
    },
    {
      id: 'logs',
      label: 'Logs',
      path: '/logs',
      icon: '📋',
      entity: 'logs',
      action: 'read'
    },
    {
      id: 'admin-management',
      label: 'Admin Management',
      path: '/admin-management',
      icon: '👤',
      entity: 'admin_accounts',
      action: 'read',
      // Only super admins can see this
      superAdminOnly: true
    }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">PREgroup Dashboard</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                // Check if item is super admin only
                if (item.superAdminOnly && !isSuperAdmin()) {
                  return null;
                }

                return (
                  <PermissionGate
                    key={item.id}
                    entity={item.entity}
                    action={item.action}
                    admin={currentAdmin}
                  >
                    <a
                      href={item.path}
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </a>
                  </PermissionGate>
                );
              })}
            </div>
          </div>
          
          {/* Admin Info */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600">
                      {currentAdmin.firstName?.[0]}{currentAdmin.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {currentAdmin.firstName} {currentAdmin.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentAdmin.accountType === 'super_admin' ? 'Super Admin' : 
                     currentAdmin.accountType === 'full_access' ? 'Full Access' : 'Custom'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * Mobile Navigation Component
 */
export const MobileNav = () => {
  const { currentAdmin, isSuperAdmin } = useAdminAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!currentAdmin) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      entity: null,
      action: null
    },
    {
      id: 'users',
      label: 'Users',
      path: '/users',
      icon: '👥',
      entity: 'users',
      action: 'read'
    },
    {
      id: 'units',
      label: 'Units',
      path: '/units',
      icon: '🏠',
      entity: 'units',
      action: 'read'
    },
    {
      id: 'services',
      label: 'Services',
      path: '/services',
      icon: '🔧',
      entity: 'services',
      action: 'read'
    },
    {
      id: 'complaints',
      label: 'Complaints',
      path: '/complaints',
      icon: '📝',
      entity: 'complaints',
      action: 'read'
    },
    {
      id: 'news',
      label: 'News',
      path: '/news',
      icon: '📰',
      entity: 'news',
      action: 'read'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      icon: '🔔',
      entity: 'notifications',
      action: 'read'
    },
    {
      id: 'logs',
      label: 'Logs',
      path: '/logs',
      icon: '📋',
      entity: 'logs',
      action: 'read'
    },
    {
      id: 'admin-management',
      label: 'Admin Management',
      path: '/admin-management',
      icon: '👤',
      entity: 'admin_accounts',
      action: 'read',
      superAdminOnly: true
    }
  ];

  return (
    <div className="sm:hidden">
      <div className="pt-2 pb-3 space-y-1">
        {navItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin()) {
            return null;
          }

          return (
            <PermissionGate
              key={item.id}
              entity={item.entity}
              action={item.action}
              admin={currentAdmin}
            >
              <a
                href={item.path}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </a>
            </PermissionGate>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionBasedNav;
