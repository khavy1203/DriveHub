import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import DashboardSection from "./DashboardSection";
import PurchaseHistory from "./PurchaseHistory";
import TaskListAndCustomers from "./TaskListAndCustomers";
import WeatherAndActivity from "./WeatherAndActivity";
import DashboardWidgets from "./DashboardWidgets";
import ProBanner from "./ProBanner";
import ExamResultsTable from "./ExamResultsTable";
import Setting from "../../components/DashBoard/Setting/SettingForm";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashBoardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="container-scroller">
      {/* <ProBanner /> */}
      <Sidebar />
      <div className="container-fluid page-body-wrapper">
        <Header />
        <div className="main-panel">
          <div className="pb-5">
            {/* <div className="page-header flex-wrap">
              <div className="d-flex">
                <button type="button" className="btn btn-sm bg-white btn-icon-text border">
                  <i className="mdi mdi-email btn-icon-prepend"></i> Email </button>
                <button type="button" className="btn btn-sm bg-white btn-icon-text border ms-3">
                  <i className="mdi mdi-printer btn-icon-prepend"></i> Print </button>
                <button type="button" className="btn btn-sm ms-3 btn-success"> Add User</button>
              </div>
            </div> */}
            {children}
            {/* <Routes>
              <Route path="/dashboard" element={<ExamResultsTable />} />
              <Route path="/dashboard-section" element={<DashboardSection />} />
              <Route path="/purchase-history" element={<PurchaseHistory />} />
              <Route path="/task-list" element={<TaskListAndCustomers />} />
              <Route path="/weather-activity" element={<WeatherAndActivity />} />
              <Route path="/dashboard-widgets" element={<DashboardWidgets />} />
              <Route path="/setting" element={<Setting />} />
              <Route
                path="/email"
                element={<div className="content">Email Page Content</div>}
              />
              <Route
                path="/print"
                element={<div className="content">Print Page Content</div>}
              />
              <Route
                path="/add-user"
                element={<div className="content">Add User Page Content</div>}
              />
            </Routes> */}
            {/* <DashboardSection/>
            <PurchaseHistory/>
            <TaskListAndCustomers/>
            <WeatherAndActivity/>
            <DashboardWidgets/> */}
          </div>
          {/* <Footer /> */}
        </div>
      </div>
    </div>
  );
};

export default DashBoardLayout;
