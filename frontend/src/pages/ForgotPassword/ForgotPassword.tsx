import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axios';
import './ForgotPassword.scss';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Vui lòng nhập email hoặc số CCCD'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post<{ EC: number; EM: string }>('/api/auth/forgot-password', { email: identifier.trim() });
      if (res.data.EC === 0) {
        setSuccessMsg(res.data.EM);
      } else {
        setError(res.data.EM || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="fp fp--center">
        <span className="material-icons fp__icon-ok">mark_email_read</span>
        <h2>Kiểm tra email của bạn</h2>
        <p>{successMsg}</p>
        <button className="fp__btn-primary" onClick={() => navigate('/login')}>
          Quay về đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="fp">
      <div className="fp__card">
        <div className="fp__logo">
          <span className="material-icons">lock_reset</span>
        </div>
        <h1 className="fp__title">Quên mật khẩu</h1>
        <p className="fp__subtitle">
          Nhập email hoặc số CCCD của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu về email đã đăng ký.
        </p>

        <form className="fp__form" onSubmit={handleSubmit}>
          <div className="fp__field">
            <label className="fp__label">Email hoặc số CCCD</label>
            <input
              type="text"
              className={`fp__input${error ? ' fp__input--error' : ''}`}
              placeholder="example@email.com hoặc 0123456789xx"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div className="fp__alert">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="fp__btn-primary"
            disabled={submitting || !identifier.trim()}
          >
            {submitting
              ? <><span className="material-icons fp__spin">sync</span>Đang gửi...</>
              : <><span className="material-icons">send</span>Gửi link đặt lại mật khẩu</>
            }
          </button>
        </form>

        <p className="fp__hint">
          <button type="button" className="fp__back-link" onClick={() => navigate('/login')}>
            ← Quay về đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
