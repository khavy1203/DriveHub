import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Headers from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import StudentsList from './components/DashBoard/studentlist/StudentsList';
import Login from './components/Client/Login/Login';
import FinalExamForm from './components/Client/FinalExamForm/FinalExamForm';
import { LoadingProvider } from './context/LoadingContext';
import { ToastContainer } from 'react-toastify';
import LoadingSpinner from './context/GlobalSpinner';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute
import DashBoardRoute from './pages/DashBoardPage/DashBoardRoute';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import LoginTestStudent from './components/Client//LoginTestStudent/LoginTestStudent';
import { Navigate } from "react-router-dom";
import QrScannerPage from './pages/HomePage/QRScanner/QrScanner';

const isBuildLocal = process.env.REACT_APP_BUILD == 'buildlocal'  ;
const App: React.FC = () => {
  console.log("check process.env", process.env.REACT_APP_BUILD)
  return (
    <>
      <ToastContainer />
      <AuthProvider>
        <LoadingProvider>
          <LoadingSpinner />
          <Router>
            <Routes>
              {/* Public Layout */}
              <Route path="finalexam" element={<FinalExamForm />} />
              <Route
                path="/"
                element={<PublicLayout />}
              >
                <Route index element={process.env.REACT_APP_BUILD == 'buildlocal'   ? <LoginTestStudent /> : <HomePage />} />
                <Route path="teststudent" element={<LoginTestStudent />} />
                <Route path="students" element={<StudentsList />} />
                <Route path="login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/qr-scanner" element={<QrScannerPage />} />
              </Route>

              {/* Private Layout */}
              <Route
                path="dashboard/*"
                element={
                  <PrivateRoute requiredRole="SupperAdmin">
                    <DashBoardLayout />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </>
  );
};

const PublicLayout: React.FC = () => {
  return (
    <>
      {!isBuildLocal && <Headers />}
      <div className="main-content">
        <Outlet />
      </div>
      {!isBuildLocal && <Footer />}
    </>
  );
};

const DashBoardLayout: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <DashBoardRoute />
    </div>
  );
};

export default App;
