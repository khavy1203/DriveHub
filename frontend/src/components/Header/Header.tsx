import React, { useEffect } from "react";
import { NavLink } from 'react-router-dom';
import "./Header.css"

const Navbar: React.FC = () => {

  useEffect(() => {
    const menuTrigger = document.querySelector('.menu-trigger');
    const navMenu = document.querySelector('.main-nav .nav');
    const navLinks = document.querySelectorAll('.main-nav .nav a'); // Tất cả các link trong menu

    const toggleMenu = () => {
      if (navMenu) {
        navMenu.classList.toggle('show'); // Bật/tắt class 'show'
      }
    };

    const closeMenu = () => {
      if (navMenu) {
        navMenu.classList.remove('show'); // Xóa class 'show' để đóng menu
      }
    };

    if (menuTrigger) {
      menuTrigger.addEventListener('click', toggleMenu); // Sự kiện bật/tắt menu
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu); // Đóng menu khi nhấn vào link
    });

    // Cleanup để tránh rò rỉ sự kiện
    return () => {
      if (menuTrigger) {
        menuTrigger.removeEventListener('click', toggleMenu);
      }

      navLinks.forEach((link) => {
        link.removeEventListener('click', closeMenu);
      });
    };
  }, []);

  const isBuildLocal = process.env.REACT_APP_BUILD == 'buildlocal'; // Kiểm tra biến môi trường
  return (
    <header className="header-area header-sticky">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="main-nav">
              {/* Logo */}
              <NavLink to="/" className="logo">
                <img src="/assets/images/logo.png" alt="Logo" />
              </NavLink>

              {/* Menu */}
              {

                <ul className="nav">
                  <li>
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/students" className={({ isActive }) => (isActive ? 'active' : '')}>
                      Hàng đợi thi
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/teststudent" className={({ isActive }) => (isActive ? 'active' : '')}>
                      Thi Thử 5 Môn
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                      DashBoard
                    </NavLink>
                  </li>
                  <li className="has-submenu">
                    <span className="nav-link-custom">Tools</span>
                    <ul className="submenu">
                       <li>
                        <NavLink to="/qr-scanner" className={({ isActive }) => (isActive ? 'active' : '')}>
                          QR Scanner
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/barcode-scanner" className={({ isActive }) => (isActive ? 'active' : '')}>
                          Barcode Scanner
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/image-analyzer" className={({ isActive }) => (isActive ? 'active' : '')}>
                          Image Analyzer
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </ul>
              }

              {/* Mobile Menu Trigger */}
              <button className="menu-trigger">
                <span>Menu</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
