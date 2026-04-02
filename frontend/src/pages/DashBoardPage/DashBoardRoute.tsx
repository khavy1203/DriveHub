import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import DashBoardLayout from './DashBoardLayout';
import ExamResultsTable from './ExamResultsTable';
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
import DashboardHome from './DashboardHome/DashboardHome';
import TeacherPortal from '../TeacherPortal/TeacherPortal';
import TeacherProfileEdit from '../TeacherPortal/TeacherProfileEdit';
import StudentPortal from '../StudentPortal/StudentPortal';
import TeacherManagement from './TeacherManagement/TeacherManagement';
import HocVienManagement from './HocVienManagement/HocVienManagement';
import SupperTeacherManagement from './SupperTeacherManagement/SupperTeacherManagement';
import { MyTeacherList, MyStudentList, SupperTeacherDashboard, StudentDispatch } from '../../features/superTeacher';
import ManualAssign from './ManualAssign/ManualAssign';

import DangKyHocVien from './DangKyHocVien/DangKyHocVien';
import ChatPage from './ChatPage/ChatPage';
import KQSHPage from './KQSHPage/KQSHPage';
import PermissionPage from './PermissionPage/PermissionPage';
import AdminApiConfigPage from './AdminApiConfigPage/AdminApiConfigPage';
import AdminManagement from './AdminManagement/AdminManagement';
import { StudentsList } from '../../features/student';
import { AdminFilterProvider } from '../../features/auth/context/AdminFilterContext';

const DashBoardRoute: React.FC = () => {
  const { role } = useAuth();
  const isTeacher = role === 'GiaoVien';
  const isSupperTeacher = role === 'SupperTeacher';
  const isStudent = role === 'HocVien';
  const isSupperAdmin = role === 'SupperAdmin';
  const isAdmin = role === 'Admin';

  return (
    <AdminFilterProvider>
    <DashBoardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="home" replace />} />

        {/* Tổng quan */}
        <Route
          path="/home"
          element={
            isSupperTeacher
              ? <SupperTeacherDashboard />
              : isTeacher
                ? <TeacherPortal embedded />
                : isStudent
                  ? <StudentPortal />
                  : <DashboardHome />
          }
        />

        {/* Quản lý thi — SupperAdmin only */}
        {isSupperAdmin && <Route path="/exam-results" element={<ExamResultsTable />} />}
        {isSupperAdmin && <Route path="/students" element={<StudentsList />} />}
        <Route path="/hoc-vien" element={<HocVienManagement />} />
        <Route path="/dang-ky-hoc-vien" element={<DangKyHocVien />} />

        <Route path="/teachers" element={<TeacherManagement />} />
        <Route path="/supper-teachers" element={<SupperTeacherManagement />} />
        <Route path="/my-teachers" element={<MyTeacherList />} />
        <Route path="/my-students" element={<MyStudentList />} />
        <Route path="/assign-students" element={<StudentDispatch />} />
        <Route path="/manual-assign" element={<ManualAssign />} />
        {(isTeacher || isSupperTeacher) && <Route path="/my-profile" element={<TeacherProfileEdit />} />}

        {/* Cài đặt — SupperAdmin only */}
        {isSupperAdmin && <Route path="/setting" element={<Setting />} />}
        {isSupperAdmin && <Route path="/upload" element={<UploadFiles />} />}
        {isSupperAdmin && <Route path="/printer" element={<Printer />} />}
        {isSupperAdmin && <Route path="/review-sets" element={<ReviewSetManager />} />}
        {isSupperAdmin && <Route path="/exam-sets-import" element={<ExamSetImporter />} />}

        {/* Kết quả sát hạch */}
        <Route path="/ket-qua-sat-hanh" element={<KQSHPage />} />

        {/* Phân quyền — SupperAdmin only */}
        {isSupperAdmin && <Route path="/phan-quyen" element={<PermissionPage />} />}

        {/* Admin management — SupperAdmin only */}
        {isSupperAdmin && <Route path="/admin-management" element={<AdminManagement />} />}

        {/* API config — Admin only */}
        {isAdmin && <Route path="/api-config" element={<AdminApiConfigPage />} />}

        {/* Chat */}
        <Route path="/chat" element={<ChatPage />} />

        {/* Legacy */}
        <Route path="/dashboard-section" element={<DashboardSection />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/task-list" element={<TaskListAndCustomers />} />
        <Route path="/weather-activity" element={<WeatherAndActivity />} />
        <Route path="/dashboard-widgets" element={<DashboardWidgets />} />

        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </DashBoardLayout>
    </AdminFilterProvider>
  );
};

export default DashBoardRoute;
