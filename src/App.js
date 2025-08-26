import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Bookings from './pages/Bookings';
import Academies from './pages/Academies';
import Sports from './pages/Sports';
import Courts from './pages/Courts';
import Events from './pages/Events';
import ProjectSelection from './pages/ProjectSelection';
import ProjectDashboard from './pages/ProjectDashboard';
import Layout from './components/Layout';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
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
            </Route>

            {/* Project-based routes */}
            <Route path="/project-selection" element={
              <ProtectedRoute>
                <ProjectSelection />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/*" element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/academies" element={
              <ProtectedRoute>
                <Academies />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/sports" element={
              <ProtectedRoute>
                <Sports />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/courts" element={
              <ProtectedRoute>
                <Courts />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
