import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../axios';
import './SetupPassword.scss';

type UserInfo = { username: string; email: string };

const SetupPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    axios.get(`/api/auth/setup/${token}`)
      .then(res => {
        if (res.data.EC === 0) { setUserInfo(res.data.DT); setTokenValid(true); }
        else setTokenValid(false);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Mật khẩu phải ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/auth/setup-password', { token, newPassword, confirmPassword });
      if (res.data.EC === 0) {
        setDone(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(res.data.EM ?? 'Có lỗi xảy ra');
      }
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 6) s++;
    if (newPassword.length >= 10) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][strength];
  const strengthClass = ['', 'sp__strength--1', 'sp__strength--2', 'sp__strength--3', 'sp__strength--4', 'sp__strength--5'][strength];

  if (tokenValid === null) {
    return (
      <div className="sp sp--center">
        <span className="material-icons sp__spin">sync</span>
        <p>Đang xác thực link...</p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="sp sp--center">
        <span className="material-icons sp__icon-err">link_off</span>
        <h2>Link không hợp lệ</h2>
        <p>Link đã hết hạn hoặc đã được sử dụng. Vui lòng liên hệ quản trị viên.</p>
        <button className="sp__btn-primary" onClick={() => navigate('/login')}>
          Quay về đăng nhập
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="sp sp--center">
        <span className="material-icons sp__icon-ok">check_circle</span>
        <h2>Thiết lập thành công!</h2>
        <p>Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="sp">
      <div className="sp__card">
        <div className="sp__logo">
          <span className="material-icons">lock_reset</span>
        </div>
        <h1 className="sp__title">Thiết lập mật khẩu</h1>
        {userInfo && (
          <p className="sp__subtitle">
            Xin chào <strong>{userInfo.username}</strong>. Vui lòng tạo mật khẩu mới để bắt đầu sử dụng.
          </p>
        )}

        <form className="sp__form" onSubmit={handleSubmit}>
          <div className="sp__field">
            <label className="sp__label">Mật khẩu mới</label>
            <div className="sp__input-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                className="sp__input"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="sp__toggle-eye" onClick={() => setShowNew(v => !v)}>
                <span className="material-icons">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {newPassword && (
              <div className="sp__strength-bar">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`sp__strength-seg ${strength >= i ? strengthClass : ''}`} />
                ))}
                <span className="sp__strength-label">{strengthLabel}</span>
              </div>
            )}
          </div>

          <div className="sp__field">
            <label className="sp__label">Xác nhận mật khẩu</label>
            <div className="sp__input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`sp__input ${confirmPassword && confirmPassword !== newPassword ? 'sp__input--error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="sp__toggle-eye" onClick={() => setShowConfirm(v => !v)}>
                <span className="material-icons">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <span className="sp__error-msg">Mật khẩu không khớp</span>
            )}
          </div>

          {error && (
            <div className="sp__alert">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="sp__btn-primary"
            disabled={submitting || !newPassword || !confirmPassword}
          >
            {submitting
              ? <><span className="material-icons sp__spin">sync</span>Đang lưu...</>
              : <><span className="material-icons">lock</span>Xác nhận mật khẩu</>
            }
          </button>
        </form>

        <p className="sp__hint">
          Sau khi thiết lập, bạn sẽ được chuyển tới trang đăng nhập.
        </p>
      </div>
    </div>
  );
};

export default SetupPassword;
