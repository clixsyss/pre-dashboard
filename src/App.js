import React, { useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Login from './pages/Login';
// REMOVED IMPORTS: Dashboard, Users, Projects, AdminDashboard, NotificationManager, DataExportPage
// Cost optimization: Removed data-heavy pages for super admins
import ProjectSelection from './pages/ProjectSelection';
import ProjectDashboard from './pages/ProjectDashboard';
import AdminManagement from './components/AdminManagement';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';




// Main App Router Component - handles routing based on admin type
const AppRouter = () => {
  const { currentAdmin, loading, isSuperAdmin } = useAdminAuth();

  console.log('AppRouter: Rendering with admin data:', {
    loading,
    hasCurrentAdmin: !!currentAdmin,
    adminType: currentAdmin?.accountType,
    adminEmail: currentAdmin?.email
  });

  // Memoize the admin type check to prevent unnecessary re-renders
  const isSuperAdminMemo = useMemo(() => {
    const result = isSuperAdmin();
    console.log('AppRouter: isSuperAdmin check result:', result);
    return result;
  }, [isSuperAdmin]);

  if (loading) {
    console.log('AppRouter: Still loading admin data...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-pre-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-pre-black text-lg">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your admin access</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    console.log('AppRouter: No admin found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Super admins get simplified routes - only project selection and admin management
  // COST OPTIMIZATION: Removed all data-heavy pages to reduce database reads
  if (isSuperAdminMemo) {
    console.log('AppRouter: Rendering super admin routes (simplified)');
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/project-selection" replace />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="project-selection" element={<ProjectSelection />} />
          {/* Redirect all removed pages to project selection */}
          <Route path="dashboard" element={<Navigate to="/project-selection" replace />} />
          <Route path="users" element={<Navigate to="/project-selection" replace />} />
          <Route path="projects" element={<Navigate to="/project-selection" replace />} />
          <Route path="admin" element={<Navigate to="/project-selection" replace />} />
          <Route path="notifications" element={<Navigate to="/project-selection" replace />} />
          <Route path="data-export" element={<Navigate to="/project-selection" replace />} />
        </Route>
        <Route path="/project/:projectId/*" element={<ProjectDashboard />} />
      </Routes>
    );
  }

  // Regular admins only get project selection and project dashboards
  console.log('AppRouter: Rendering regular admin routes (should see TestComponent)');
  console.log('AppRouter: Current URL:', window.location.pathname);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/project-selection" replace />} />
      <Route path="/dashboard" element={<Navigate to="/project-selection" replace />} />
      <Route path="/users" element={<Navigate to="/project-selection" replace />} />
      <Route path="/projects" element={<Navigate to="/project-selection" replace />} />
      <Route path="/admin" element={<Navigate to="/project-selection" replace />} />
      <Route path="/admin-management" element={<Navigate to="/project-selection" replace />} />
      <Route path="/project-selection" element={<ProjectSelection />} />
      <Route path="/project/:projectId/*" element={<ProjectDashboard />} />
      <Route path="*" element={<Navigate to="/project-selection" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ErrorBoundary><AppRouter /></ErrorBoundary>} />
            </Routes>
            <NotificationContainer />
          </div>
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
