import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import ProjectSelection from './pages/ProjectSelection';
import ProjectDashboard from './pages/ProjectDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminManagement from './components/AdminManagement';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pre-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pre-red mx-auto mb-4"></div>
          <p className="text-pre-black text-lg">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your authentication</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
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
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="projects" element={<Projects />} />
              <Route path="/project-selection" element={
                <ProtectedRoute>
                  <ProjectSelection />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin-management" element={
                <ProtectedRoute>
                  <AdminManagement />
                </ProtectedRoute>
              } />
            </Route>

            {/* Project-based routes */}
            <Route path="/project/:projectId/*" element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <NotificationContainer />
        </div>
      </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
