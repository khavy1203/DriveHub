/**
 * Header/Navbar component
 * @module layouts/Header
 */

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getDefaultAvatar } from '../shared/utils/avatarUtils';
import './Header.scss';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, displayName, avatarUrl, logout } = useAuth();
  const defaultAvatar = getDefaultAvatar(role);
  const resolvedAvatar = avatarUrl || defaultAvatar;
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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
                    Thi
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/review" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Ôn tập
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/lookup" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Tra cứu
                  </NavLink>
                </li>
                {/* <li className="has-submenu">
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
                </li> */}
              </ul>

              <div className="header-auth">
                {isAuthenticated ? (
                  <div className="header-profile-menu" ref={profileMenuRef}>
                    <button
                      type="button"
                      className="header-user-chip"
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      aria-expanded={isProfileOpen}
                      aria-haspopup="menu"
                    >
                      <img
                        src={resolvedAvatar}
                        alt="User avatar"
                        className="header-user-avatar"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== defaultAvatar) {
                            target.src = defaultAvatar;
                          }
                        }}
                      />
                      <span className="header-role">{displayName || role || 'User'}</span>
                      <i className={`fa fa-chevron-${isProfileOpen ? 'up' : 'down'} header-user-caret`} aria-hidden="true"></i>
                    </button>

                    {isProfileOpen ? (
                      <div className="header-dropdown" role="menu">
                        <button
                          className="header-dropdown-item header-dropdown-item--dashboard"
                          onClick={() => { setIsProfileOpen(false); navigate('/dashboard'); }}
                          role="menuitem"
                        >
                          <i className="fa fa-tachometer"></i>
                          Dashboard
                        </button>
                        <div className="header-dropdown-divider" />
                        <button
                          className="header-dropdown-item"
                          onClick={handleLogout}
                          role="menuitem"
                        >
                          <i className="fa fa-sign-out"></i>
                          Đăng xuất
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <NavLink to="/login" className="header-login-btn">
                    Đăng nhập
                  </NavLink>
                )}
              </div>

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
