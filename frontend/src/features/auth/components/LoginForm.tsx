/**
 * Login form component
 * @module features/auth/components/LoginForm
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApi } from '../../../shared/hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { ApiResponseLogin } from '../../../core/types/api.types';
import { AUTH_ENDPOINTS } from '../services/authApi';
import FirstLoginSetup from './FirstLoginSetup';
import '../../../assets/css_login/main.css';

export const LoginForm: React.FC = () => {
  const { post } = useApi();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isMezonLoading, setIsMezonLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [firstLoginData, setFirstLoginData] = useState<{ token: string; username: string } | null>(null);
  const { setAuth, isAuthenticated, isAuthLoading } = useAuth();
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    const onOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== 'mezon-oauth') {
        return;
      }

      if (data.type === 'success' && data.token) {
        setIsMezonLoading(false);
        const role = data.role || 'User';
        const username = data.username || 'User';
        setAuth(data.token, role, username, data.avatarUrl || null);
        toast.success('Đăng nhập Mezon thành công!');
        navigate('/dashboard');
      } else if (data.type === 'error') {
        setIsMezonLoading(false);
        toast.error(data.message || 'Đăng nhập Mezon thất bại.');
      }

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
    };

    window.addEventListener('message', onOAuthMessage);
    return () => {
      window.removeEventListener('message', onOAuthMessage);
    };
  }, [navigate, setAuth]);

  useEffect(() => {
    if (!isMezonLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        setIsMezonLoading(false);
      }
    }, 400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isMezonLoading]);

  const handleMezonLogin = useCallback((): void => {
    const mezonClientId = process.env.REACT_APP_MEZON_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_MEZON_REDIRECT_URI || 'http://localhost:3000/mezon-callback';
    const authorizeUrl = process.env.REACT_APP_MEZON_AUTHORIZE_URL || 'https://oauth2.mezon.ai/oauth2/auth';
    const mezonScope = process.env.REACT_APP_MEZON_SCOPE || 'openid offline';

    if (!mezonClientId) {
      setIsMezonLoading(false);
      toast.error('Thiếu cấu hình REACT_APP_MEZON_CLIENT_ID');
      return;
    }

    const stateChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomStateBytes = new Uint8Array(11);
    window.crypto.getRandomValues(randomStateBytes);
    const state = Array.from(randomStateBytes)
      .map((byte) => stateChars[byte % stateChars.length])
      .join('');

    sessionStorage.setItem('mezon_oauth_state', state);
    setIsMezonLoading(true);

    const params = new URLSearchParams({
      client_id: mezonClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: mezonScope,
      state,
    });

    const oauthUrl = `${authorizeUrl}?${params.toString()}`;

    const isCompactViewport = window.innerWidth < 768;
    if (isCompactViewport) {
      window.location.href = oauthUrl;
      return;
    }

    const width = Math.max(760, Math.min(900, Math.round(window.outerWidth * 0.68)));
    const height = Math.max(620, Math.min(700, Math.round(window.outerHeight * 0.82)));

    const dualScreenLeft = typeof window.screenLeft === 'number' ? window.screenLeft : window.screenX;
    const dualScreenTop = typeof window.screenTop === 'number' ? window.screenTop : window.screenY;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || window.screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || window.screen.height;

    const left = dualScreenLeft + Math.max(0, (viewportWidth - width) / 2);
    const top = dualScreenTop + Math.max(0, (viewportHeight - height) / 2);

    const popupFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      'resizable=yes',
      'scrollbars=yes',
      'toolbar=no',
      'menubar=no',
      'status=no'
    ].join(',');

    const popup = window.open(
      oauthUrl,
      'mezon_oauth_popup',
      popupFeatures
    );

    if (!popup) {
      toast.error('Trình duyệt đã chặn popup. Đang chuyển sang đăng nhập thông thường...');
      window.location.href = oauthUrl;
      return;
    }

    popupRef.current = popup;
    try {
      popup.resizeTo(width, height);
      popup.moveTo(Math.round(left), Math.round(top));
    } catch (e) {
      // Some browsers can block move/resize operations.
    }
    popup.focus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!userEmail || !password) {
      toast.error('Vui lòng nhập CCCD/email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await post<ApiResponseLogin>(AUTH_ENDPOINTS.LOGIN, {
        userEmail,
        password,
      });

      if (response.EC === 0) {
        const dt = response.DT as typeof response.DT & { mustChangePassword?: boolean };
        if (dt.mustChangePassword) {
          setFirstLoginData({ token: dt.access_token, username: dt.username });
          return;
        }
        toast.success('Đăng nhập thành công!');
        const token = dt.access_token;
        const role = dt.groupWithRoles.name || 'User';
        setAuth(token, role, dt.username, dt.avatarUrl || null, dt.userId ?? null);
        navigate('/dashboard');
      } else {
        toast.error(response.EM || 'Đăng nhập thất bại!');
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Đã có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstLoginComplete = (data: { access_token: string; email: string; username: string; groupWithRoles: { name: string } }) => {
    const role = data.groupWithRoles.name || 'User';
    setAuth(data.access_token, role, data.username);
    setFirstLoginData(null);
    navigate('/dashboard');
  };

  if (firstLoginData) {
    return (
      <FirstLoginSetup
        username={firstLoginData.username}
        token={firstLoginData.token}
        onComplete={handleFirstLoginComplete}
      />
    );
  }

  return (
    <div className="lf-page">
      <div className="lf-container">

        <div className="lf-left">
          <div className="lf-deco lf-deco--1"></div>
          <div className="lf-deco lf-deco--2"></div>
          <div className="lf-deco lf-deco--3"></div>

          <div className="lf-brand">
            <div className="lf-brand-logo">
              <i className="fa fa-graduation-cap"></i>
            </div>
            <h1 className="lf-brand-name">DriveHub</h1>
            <p className="lf-brand-tagline">Nền tảng luyện thi bằng lái xe trực tuyến</p>
          </div>

          <ul className="lf-features">
            <li><i className="fa fa-check-circle"></i> 600+ câu hỏi luyện tập</li>
            <li><i className="fa fa-check-circle"></i> Thi thử với đề ngẫu nhiên</li>
            <li><i className="fa fa-check-circle"></i> Theo dõi tiến trình học tập</li>
          </ul>
        </div>

        <div className="lf-right">
          <div className="lf-form-wrapper">
            <h2 className="lf-title">Đăng nhập</h2>
            <p className="lf-subtitle">Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>

            <form className="lf-form" onSubmit={handleSubmit} noValidate>

              <div className="lf-input-group">
                <label className="lf-label" htmlFor="lf-email">CCCD hoặc Email</label>
                <div className="lf-input-wrap">
                  <i className="fa fa-id-card lf-input-icon"></i>
                  <input
                    id="lf-email"
                    className="lf-input"
                    type="text"
                    name="userEmail"
                    placeholder="Nhập số CCCD hoặc email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="lf-input-group">
                <label className="lf-label" htmlFor="lf-password">Mật khẩu</label>
                <div className="lf-input-wrap">
                  <i className="fa fa-lock lf-input-icon"></i>
                  <input
                    id="lf-password"
                    className="lf-input"
                    type={showPassword ? 'text' : 'password'}
                    name="pass"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lf-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="lf-forgot-row">
                <Link to="/forgot-password" className="lf-forgot-link">Quên mật khẩu?</Link>
              </div>

              <button className="lf-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="lf-spinner"></span>
                    Đang đăng nhập...
                  </>
                ) : 'Đăng nhập'}
              </button>

            </form>

            <div className="lf-divider">
              <span>hoặc đăng nhập với</span>
            </div>

            <div className="lf-social">
              <a href="/auth/facebook" className="lf-social-btn lf-social-fb" aria-label="Đăng nhập Facebook">
                <i className="fa fa-facebook"></i>
              </a>
              <a href="/auth/google" className="lf-social-btn lf-social-gg" aria-label="Đăng nhập Google">
                <i className="fa fa-google"></i>
              </a>
            </div>

            <button
              type="button"
              className="lf-submit-btn"
              disabled={isMezonLoading}
              style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onClick={handleMezonLogin}
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3DI4Aqenhf8x4Si2IWRveQ5zYCqIJlCkUg&s"
                alt="Mezon"
                style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
              />
              {isMezonLoading ? 'Đang chờ xác thực Mezon...' : 'Đăng nhập bằng Mezon'}
            </button>

            {isMezonLoading ? (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#0b5ed7',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <span className="lf-spinner"></span>
                Đang đăng nhập Mezon, vui lòng chờ...
              </div>
            ) : null}

            <p className="lf-register-text">
              Chưa có tài khoản?&nbsp;
              <a href="/register" className="lf-register-link">Đăng ký ngay</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
