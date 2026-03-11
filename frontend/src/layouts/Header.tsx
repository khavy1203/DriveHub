/**
 * Header/Navbar component
 * @module layouts/Header
 */

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
  useEffect(() => {
    const menuTrigger = document.querySelector('.menu-trigger');
    const navMenu = document.querySelector('.main-nav .nav');
    const navLinks = document.querySelectorAll('.main-nav .nav a');
    const hasSubmenus = document.querySelectorAll('.has-submenu');

    const toggleMenu = (): void => {
      navMenu?.classList.toggle('show');
    };

    const closeMenu = (): void => {
      navMenu?.classList.remove('show');
    };

    const toggleSubmenu = (e: Event): void => {
      if (window.innerWidth > 768) return;
      const item = (e.currentTarget as HTMLElement);
      const trigger = item.querySelector('.nav-link-custom');
      if (trigger && (e.target as HTMLElement).closest('.nav-link-custom')) {
        e.stopPropagation();
        item.classList.toggle('active');
      }
    };

    menuTrigger?.addEventListener('click', toggleMenu);
    navLinks.forEach((link) => link.addEventListener('click', closeMenu));
    hasSubmenus.forEach((item) => item.addEventListener('click', toggleSubmenu));

    return () => {
      menuTrigger?.removeEventListener('click', toggleMenu);
      navLinks.forEach((link) => link.removeEventListener('click', closeMenu));
      hasSubmenus.forEach((item) => item.removeEventListener('click', toggleSubmenu));
    };
  }, []);

  return (
    <header className="header-area header-sticky">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="main-nav">
              <NavLink to="/" className="logo">
                <img src="/assets/images/logo.png" alt="Logo" />
              </NavLink>

              <ul className="nav">
                <li>
                  <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Home
                  </NavLink>
                </li>
                {/* <li>
                  <NavLink to="/students" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Hàng đợi thi
                  </NavLink>
                </li> */}
                <li>
                  <NavLink to="/teststudent" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Thi Thử 5 Môn
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/traffic-check" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Kiểm Tra Phạt Nguội
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

              <button className="menu-trigger" aria-label="Menu">
                <span className="hb-bar"></span>
                <span className="hb-bar"></span>
                <span className="hb-bar"></span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
