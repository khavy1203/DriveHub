/**
 * Main Application Component
 * @module App
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Core imports
import { isBuildLocal } from './core/config/environment';

// Feature imports
import { AuthProvider, PrivateRoute, LoginForm, MezonCallback } from './features/auth';
import { StudentsList } from './features/student';

// Shared imports
import { LoadingProvider, GlobalSpinner } from './shared';

// Layout imports
import { Header, Footer } from './layouts';

// Legacy imports (to be migrated)
import HomePage from './pages/HomePage/HomePage';
import DashBoardRoute from './pages/DashBoardPage/DashBoardRoute';
import LoginTestStudent from './features/exam/components/LoginTestStudent/LoginTestStudent';
import { FinalExamForm } from './features/exam';
import QrScannerPage from './pages/HomePage/QRScanner/QrScanner';
import TrafficCheck from './features/traffic-check/components/TrafficCheck';

import './App.css';

/**
 * Public Layout Component
 */
const PublicLayout: React.FC = () => {
  const isLocal = isBuildLocal();

  return (
    <>
      {!isLocal && <Header />}
      <div className="main-content">
        <Outlet />
      </div>
      {!isLocal && <Footer />}
    </>
  );
};

/**
 * Dashboard Layout Wrapper
 */
const DashBoardLayoutWrapper: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <DashBoardRoute />
    </div>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  const isLocal = isBuildLocal();
  const isMezonCallbackPath = window.location.pathname === '/mezon-callback';

  if (isMezonCallbackPath) {
    return (
      <>
        <ToastContainer />
        <AuthProvider>
          <LoadingProvider>
            <GlobalSpinner />
            <MezonCallback />
          </LoadingProvider>
        </AuthProvider>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <AuthProvider>
        <LoadingProvider>
          <GlobalSpinner />
          <Router>
            <Routes>
              {/* Standalone route for exam */}
              <Route path="finalexam" element={<FinalExamForm />} />

              {/* Public Layout Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route 
                  index 
                  element={isLocal ? <LoginTestStudent /> : <HomePage />} 
                />
                <Route path="teststudent" element={<LoginTestStudent />} />
                <Route path="traffic-check" element={<TrafficCheck />} />
                <Route path="students" element={<StudentsList />} />
                <Route path="login" element={<LoginForm />} />
                <Route path="mezon-callback" element={<MezonCallback />} />
                <Route path="qr-scanner" element={<QrScannerPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* Private Dashboard Routes */}
              <Route
                path="dashboard/*"
                element={
                  <PrivateRoute requiredRole="SupperAdmin">
                    <DashBoardLayoutWrapper />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </>
  );
};

export default App;
