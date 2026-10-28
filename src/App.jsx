import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FpoDashboard from './pages/fpo/FpoDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import TracePage from './pages/TracePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/trace/:id" element={<TracePage />} />

          {/* Role Protected Dashboards */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRole="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fpo"
            element={
              <ProtectedRoute allowedRole="fpo">
                <FpoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
