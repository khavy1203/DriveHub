import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashBoardLayout from './DashBoardLayout'; // Main Dashboard layout
import ExamResultsTable from './ExamResultsTable'; // Example sub-page
import DashboardSection from './DashboardSection';
import PurchaseHistory from './PurchaseHistory';
import TaskListAndCustomers from './TaskListAndCustomers';
import WeatherAndActivity from './WeatherAndActivity';
import DashboardWidgets from './DashboardWidgets';
import Setting from '../../features/dashboard/components/Setting/SettingForm';
import UploadFiles from '../../features/dashboard/components/Upload/UploadFiles';
import Printer from '../../features/dashboard/components/Printer/Printer';
import ReviewSetManager from '../../features/dashboard/components/ReviewSetManager/ReviewSetManager';
import ExamSetImporter from '../../features/dashboard/components/ExamSetImporter/ExamSetImporter';
// import Detect from '../../components/DashBoard/upload/Detect';

const DashBoardRoute: React.FC = () => {
  return (
    <DashBoardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="exam-results" replace />} />
        <Route path="/exam-results" element={<ExamResultsTable />} />
        <Route path="/dashboard-section" element={<DashboardSection />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/task-list" element={<TaskListAndCustomers />} />
        <Route path="/weather-activity" element={<WeatherAndActivity />} />
        <Route path="/dashboard-widgets" element={<DashboardWidgets />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/upload" element={<UploadFiles />} />
        <Route path="/printer" element={<Printer />} />
        <Route path="/review-sets" element={<ReviewSetManager />} />
        <Route path="/exam-sets-import" element={<ExamSetImporter />} /> {/* Thêm route cho Printer */}
        {/* <Route path="/detect" element={<Detect />} /> */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </DashBoardLayout>
  );
};

export default DashBoardRoute;