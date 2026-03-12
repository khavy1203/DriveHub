import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { role, displayName, logout } = useAuth();

  const handleToggleSidebar = () => {
    document.body.classList.toggle("sidebar-icon-only");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar col-lg-12 col-12 p-lg-0 fixed-top d-flex flex-row">
      <div className="navbar-menu-wrapper d-flex align-items-stretch justify-content-between">
        <a
          className="navbar-brand brand-logo-mini align-self-center d-lg-none"
          href="../../index.html"
        >
          <img src="../../../assets/images/logo-mini.svg" alt="logo" />
        </a>
        <button
          className="navbar-toggler navbar-toggler align-self-center me-2"
          type="button"
          data-toggle="minimize"
          onClick={handleToggleSidebar}
        >
          <i className="mdi mdi-menu"></i>
        </button>
        <ul className="navbar-nav navbar-nav-right ml-lg-auto">
          <li className="nav-item nav-profile dropdown border-0">
            <a
              className="nav-link dropdown-toggle"
              id="profileDropdown"
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="mdi mdi-account-circle me-2" style={{ fontSize: 22 }}></i>
              <span className="profile-name">{displayName || role || 'Admin'}</span>
            </a>
            <div
              className="dropdown-menu navbar-dropdown w-100"
              aria-labelledby="profileDropdown"
            >
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <i className="mdi mdi-logout me-2 text-danger"></i> Đăng xuất
              </button>
            </div>
          </li>
        </ul>
        <button
          className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button"
          data-toggle="offcanvas"
        >
          <span className="mdi mdi-menu"></span>
        </button>
      </div>
    </nav>
  );
};

export default Header;
