import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axios';
import './ForgotPassword.scss';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post<{ EC: number; EM: string }>('/api/auth/forgot-password', { email: email.trim() });
      if (res.data.EC === 0) {
        setSent(true);
      } else {
        setError(res.data.EM || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="fp fp--center">
        <span className="material-icons fp__icon-ok">mark_email_read</span>
        <h2>Kiểm tra email của bạn</h2>
        <p>Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.</p>
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
          Nhập email tài khoản của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        <form className="fp__form" onSubmit={handleSubmit}>
          <div className="fp__field">
            <label className="fp__label">Email</label>
            <input
              type="email"
              className={`fp__input${error ? ' fp__input--error' : ''}`}
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
            disabled={submitting || !email.trim()}
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
