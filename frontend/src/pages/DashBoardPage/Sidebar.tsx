import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

const Sidebar: React.FC = () => {
  const { role, displayName } = useAuth();

  return (
    <nav className="sidebar sidebar-offcanvas" id="sidebar">
      <ul className="nav">
        <li className="nav-item nav-profile">
          <Link to="/dashboard" className="nav-link">
            <div className="nav-profile-image">
              <i className="mdi mdi-account-circle" style={{ fontSize: 42, color: '#adb5bd' }}></i>
              <span className="login-status online"></span>
            </div>
            <div className="nav-profile-text d-flex flex-column pe-3">
              <span className="font-weight-medium mb-2">{displayName || role || 'Admin'}</span>
              <span className="font-weight-normal text-muted">Quản trị viên</span>
            </div>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/dashboard">
            <i className="mdi mdi-home menu-icon"></i>
            <span className="menu-title">Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <a
            className="nav-link"
            data-bs-toggle="collapse"
            href="#ui-basic"
            aria-expanded="false"
            aria-controls="ui-basic"
          >
            <i className="mdi mdi-crosshairs-gps menu-icon"></i>
            <span className="menu-title">Cài đặt</span>
            <i className="menu-arrow"></i>
          </a>
          <div className="collapse" id="ui-basic">
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/setting">
                  Thiết lập chung
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/upload">
                  Upload File
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/printer">
                  Máy in
                </Link>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;