import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import GroupDashboardPage from './pages/GroupDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/group/:groupId" element={<GroupDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          {/* Redirect all these routes to dashboard for a single-page app experience */}
          <Route path="/groups" element={<Navigate to="/dashboard" replace />} />
          <Route path="/friends" element={<Navigate to="/dashboard" replace />} />
          <Route path="/activity" element={<Navigate to="/dashboard" replace />} />
          <Route path="/account" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
