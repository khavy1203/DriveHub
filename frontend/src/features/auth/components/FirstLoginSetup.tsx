import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import httpClient from '../../../shared/services/httpClient';
import './FirstLoginSetup.scss';

type Props = {
  username: string;
  token: string;
  onComplete: (data: { access_token: string; email: string; username: string; groupWithRoles: { name: string } }) => void;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

const COLORS = ['#00685d', '#e6a100', '#ba1a1a', '#4361ee', '#f72585', '#4cc9f0', '#7209b7', '#f77f00'];

const FirstLoginSetup: React.FC<Props> = ({ username, token, onComplete }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Confetti
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const spawnConfetti = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 300,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    particlesRef.current = particles;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.05;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 20) {
          p.opacity -= 0.02;
        }
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setSaving(true);
    try {
      const { data: res } = await httpClient.post<{
        EC: number;
        EM: string;
        DT: { access_token: string; email: string; username: string; groupWithRoles: { name: string } } | string;
      }>('/api/auth/first-login-setup', { email, newPassword, confirmPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.EC === 0 && typeof res.DT === 'object') {
        setStep('success');
        setTimeout(() => spawnConfetti(), 200);
        setTimeout(() => onComplete(res.DT as { access_token: string; email: string; username: string; groupWithRoles: { name: string } }), 5000);
      } else {
        if (res.DT === 'email') {
          setEmailError(res.EM);
        } else {
          toast.error(res.EM || 'Lỗi thiết lập');
        }
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fls-overlay">
        <canvas ref={canvasRef} className="fls-confetti" />
        <div className="fls-success">
          <div className="fls-success__check">
            <svg viewBox="0 0 52 52" className="fls-success__svg">
              <circle className="fls-success__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="fls-success__tick" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h2 className="fls-success__title">Thiết lập thành công!</h2>
          <p className="fls-success__text">
            Giờ đây bạn có thể đăng nhập bằng <strong>email</strong> và <strong>mật khẩu mới</strong> thay cho CCCD.
          </p>
          <div className="fls-success__email">{email}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fls-overlay">
      <div className="fls-modal">
        <div className="fls-modal__header">
          <div className="fls-modal__icon">
            <span className="material-icons">security_update_good</span>
          </div>
          <h2 className="fls-modal__title">Chào mừng, {username}!</h2>
          <p className="fls-modal__subtitle">
            Đây là lần đăng nhập đầu tiên. Vui lòng thiết lập email và mật khẩu mới để bảo mật tài khoản.
          </p>
        </div>

        <form className="fls-modal__form" onSubmit={handleSubmit}>
          <div className="fls-field">
            <label className="fls-field__label">
              <span className="material-icons">email</span>
              Email
            </label>
            <input
              className={`fls-field__input ${emailError ? 'fls-field__input--error' : ''}`}
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              autoFocus
            />
            {emailError && <span className="fls-field__error">{emailError}</span>}
          </div>

          <div className="fls-field">
            <label className="fls-field__label">
              <span className="material-icons">lock</span>
              Mật khẩu mới
            </label>
            <div className="fls-field__pw-wrap">
              <input
                className="fls-field__input"
                type={showPw ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button type="button" className="fls-field__pw-toggle" onClick={() => setShowPw(!showPw)}>
                <span className="material-icons">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="fls-field">
            <label className="fls-field__label">
              <span className="material-icons">lock_reset</span>
              Xác nhận mật khẩu
            </label>
            <input
              className="fls-field__input"
              type={showPw ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="fls-modal__submit" type="submit" disabled={saving}>
            {saving ? (
              <><span className="material-icons fls-spin">sync</span> Đang xử lý...</>
            ) : (
              <><span className="material-icons">check_circle</span> Xác nhận thiết lập</>
            )}
          </button>
        </form>

        <p className="fls-modal__note">
          <span className="material-icons">info</span>
          Sau khi thiết lập, bạn có thể dùng email và mật khẩu mới để đăng nhập.
        </p>
      </div>
    </div>
  );
};

export default FirstLoginSetup;
