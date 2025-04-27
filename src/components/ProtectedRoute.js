import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SplashScreen from '../components/SplashScreen'; // Assuming SplashScreen is located in this directory

// Usage: <ProtectedRoute><DashboardPage /></ProtectedRoute>
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
