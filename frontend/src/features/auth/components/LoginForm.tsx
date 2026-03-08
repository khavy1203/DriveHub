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
import '../../../assets/css_login/util.css';
import '../../../assets/css_login/main.css';

export const LoginForm: React.FC = () => {
  const { post } = useApi();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { setAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!userEmail || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await post<ApiResponseLogin>(AUTH_ENDPOINTS.LOGIN, {
        userEmail,
        password,
      });

      if (response.EC === 0) {
        toast.success('Login successful!');
        const token = response.DT.access_token;
        const role = response.DT.groupWithRoles.name || 'User';
        setAuth(token, role);
        navigate('/dashboard');
      } else {
        toast.error(response.EM || 'Login failed!');
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.error('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="limiter">
      <div className="container-login100 backgr-img">
        <div className="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
          <form className="login100-form validate-form" onSubmit={handleSubmit}>
            <span className="login100-form-title p-b-49">Login</span>

            <div className="wrap-input100 validate-input m-b-23" data-validate="Username is required">
              <span className="label-input100">Username</span>
              <input
                className="input100"
                type="text"
                name="userEmail"
                placeholder="Type your email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <span className="focus-input100" data-symbol="&#xf206;"></span>
            </div>

            <div className="wrap-input100 validate-input" data-validate="Password is required">
              <span className="label-input100">Password</span>
              <input
                className="input100"
                type="password"
                name="pass"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="focus-input100" data-symbol="&#xf190;"></span>
            </div>

            <div className="text-right p-t-8 p-b-31">
              <a href="#">Forgot password?</a>
            </div>

            <div className="container-login100-form-btn">
              <div className="wrap-login100-form-btn">
                <div className="login100-form-bgbtn"></div>
                <button className="login100-form-btn" type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </div>

            <div className="txt1 text-center p-t-54 p-b-20">
              <span>Or Sign Up Using</span>
            </div>

            <div className="flex-c-m">
              <a href="#" className="login100-social-item bg1">
                <i className="fa fa-facebook"></i>
              </a>
              <a href="#" className="login100-social-item bg2">
                <i className="fa fa-twitter"></i>
              </a>
              <a href="#" className="login100-social-item bg3">
                <i className="fa fa-google"></i>
              </a>
            </div>

            <div className="flex-col-c p-t-155">
              <span className="txt1 p-b-17">Or Sign Up Using</span>
              <a href="#" className="txt2">Sign Up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
