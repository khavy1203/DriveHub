/**
 * Login form component
 * @module features/auth/components/LoginForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApi } from '../../../shared/hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { ApiResponseLogin } from '../../../core/types/api.types';
import { AUTH_ENDPOINTS } from '../services/authApi';
import '../../../assets/css_login/main.css';

export const LoginForm: React.FC = () => {
  const { post } = useApi();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { setAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!userEmail || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await post<ApiResponseLogin>(AUTH_ENDPOINTS.LOGIN, {
        userEmail,
        password,
      });

      if (response.EC === 0) {
        toast.success('Đăng nhập thành công!');
        const token = response.DT.access_token;
        const role = response.DT.groupWithRoles.name || 'User';
        setAuth(token, role);
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
                <label className="lf-label" htmlFor="lf-email">Email</label>
                <div className="lf-input-wrap">
                  <i className="fa fa-envelope lf-input-icon"></i>
                  <input
                    id="lf-email"
                    className="lf-input"
                    type="email"
                    name="userEmail"
                    placeholder="Nhập email của bạn"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    autoComplete="email"
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
                <a href="/forgot-password" className="lf-forgot-link">Quên mật khẩu?</a>
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
