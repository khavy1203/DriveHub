import React from 'react';
import { useAuth } from '../../features/auth';

import Mainbanner from './Mainbanner';
import Services from './Services';
import Portfolio from './Portfolio';
import MezonSection from './MezonSection';
import Pricing from './Pricing';
import Contact from './Contact';
import FooterDesc from './FooterDesc';

const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const OAUTH_STATE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const isMobile = (): boolean => MOBILE_USER_AGENT_REGEX.test(navigator.userAgent || '');
const hasAuthToken = (): boolean => Boolean(sessionStorage.getItem('auth_token'));
const DEFAULT_AVATAR = 'https://gravatar.com/avatar/d302cbc4526bf50e64befe198736824c?s=400&d=robohash&r=x';

const buildMezonAuthorizeUrl = (): string | null => {
  const mezonClientId = process.env.REACT_APP_MEZON_CLIENT_ID;
  const redirectUri = process.env.REACT_APP_MEZON_REDIRECT_URI || 'https://localhost:3000/mezon-callback';
  const authorizeUrl = process.env.REACT_APP_MEZON_AUTHORIZE_URL || 'https://oauth2.mezon.ai/oauth2/auth';
  const mezonScope = process.env.REACT_APP_MEZON_SCOPE || 'openid offline';

  if (!mezonClientId) return null;

  const randomStateBytes = new Uint8Array(11);
  window.crypto.getRandomValues(randomStateBytes);
  const state = Array.from(randomStateBytes)
    .map((byte) => OAUTH_STATE_ALPHABET[byte % OAUTH_STATE_ALPHABET.length])
    .join('');

  sessionStorage.setItem('mezon_oauth_state', state);

  const params = new URLSearchParams({
    client_id: mezonClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: mezonScope,
    state,
  });

  return `${authorizeUrl}?${params.toString()}`;
};

const HomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isAuthenticated, isAuthLoading, displayName, avatarUrl, logout } = useAuth();
  const autoLoginTriggeredRef = React.useRef<boolean>(false);

  const displayUserName = displayName || 'Nguoi dung';
  const resolvedAvatar = avatarUrl || DEFAULT_AVATAR;

  // Scroll-reveal observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    const targets = document.querySelectorAll('.hp-reveal');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleLogout = (): void => {
    logout();
    setIsMenuOpen(false);
    window.location.href = '/#/';
  };

  const handleAuthAction = (): void => {
    if (isAuthenticated) {
      handleLogout();
      return;
    }
    setIsMenuOpen(false);
    window.location.href = '/#/login';
  };

  React.useEffect(() => {
    if (autoLoginTriggeredRef.current) return;
    if (isAuthLoading) return;
    autoLoginTriggeredRef.current = true;
    if (!isMobile() || isAuthenticated || hasAuthToken()) return;
    const oauthUrl = buildMezonAuthorizeUrl();
    if (!oauthUrl) return;
    window.location.href = oauthUrl;
  }, [isAuthenticated, isAuthLoading]);

  return (
    <>
      {/* Mobile navbar — only visible on ≤991px */}
      <div className="tc-mobile-navbar">
        <div className="tc-mobile-navbar-content">
          <a href="/" className="tc-mobile-logo">
            <img src="/assets/images/logo.png" alt="Logo" />
          </a>
          <i
            className="material-icons tc-menu-icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? 'close' : 'menu'}
          </i>
        </div>

        {isMenuOpen && (
          <div className="tc-mobile-dropdown">
            {isAuthenticated && (
              <div className="tc-mobile-user-card">
                <div className="tc-mobile-user-avatar">
                  <img
                    src={resolvedAvatar}
                    alt="Avatar"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (t.src !== DEFAULT_AVATAR) t.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <div className="tc-mobile-user-meta">
                  <p className="tc-mobile-user-name">{displayUserName}</p>
                </div>
              </div>
            )}

            <div className="tc-mobile-menu-links">
              <a href="/" onClick={() => setIsMenuOpen(false)}>Trang chủ</a>
              <a href="/#/teststudent" onClick={() => setIsMenuOpen(false)}>Thi-Thử-Thật</a>
              <a href="/#/license-check" onClick={() => setIsMenuOpen(false)}>Tra cứu GPLX</a>
              <a href="/#/traffic-check" onClick={() => setIsMenuOpen(false)}>Tra cứu phạt nguội</a>
              <a href="/#/dashboard" onClick={() => setIsMenuOpen(false)}>DashBoard</a>
              <a href="/#/qr-scanner" onClick={() => setIsMenuOpen(false)}>QR Scanner</a>
            </div>

            <div className="tc-mobile-dropdown-footer">
              <button
                type="button"
                className={`tc-mobile-menu-link-btn ${isAuthenticated ? 'tc-mobile-logout-btn' : 'tc-mobile-login-btn'}`}
                onClick={handleAuthAction}
              >
                <i className="material-icons" aria-hidden="true">
                  {isAuthenticated ? 'logout' : 'login'}
                </i>
                {isAuthenticated ? 'Đăng xuất' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Mainbanner />
      <Services />
      <Portfolio />
      <MezonSection />
      <Pricing />
      <Contact />
      <FooterDesc />
    </>
  );
};

export default HomePage;
