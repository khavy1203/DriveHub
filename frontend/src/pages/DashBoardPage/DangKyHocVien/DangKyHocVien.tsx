import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useApiService from '../../../services/useApiService';
import './DangKyHocVien.scss';

type FormData = {
  HoTen: string;
  NgaySinh: string;
  GioiTinh: 'Nam' | 'Nữ' | '';
  SoCCCD: string;
  phone: string;
  email: string;
  DiaChi: string;
  loaibangthi: string;
  GplxDaCo: string;
  GhiChu: string;
};

type SuccessData = {
  hocVienId: number;
  userId: number;
  username: string;
  password: string;
  HoTen: string;
};

const LICENSE_TYPES = ['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E'];
const EXPERIENCE_LEVELS = [
  'Chưa từng lái xe',
  'Đã biết lái sơ bộ',
  'Cần bổ túc tay lái',
  'Học lại thi lại',
];

const EMPTY_FORM: FormData = {
  HoTen: '', NgaySinh: '', GioiTinh: '', SoCCCD: '',
  phone: '', email: '', DiaChi: '', loaibangthi: '',
  GplxDaCo: '', GhiChu: '',
};

const DangKyHocVien: React.FC = () => {
  const { post } = useApiService();

  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState('');
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCamActive(true);
    } catch {
      setCamError('Không thể truy cập camera. Vui lòng cấp quyền hoặc dùng nhập thủ công.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamActive(false);
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) { setScanning(false); return; }
      try {
        const fd = new FormData();
        fd.append('image', blob, 'cccd.jpg');
        const res = await fetch('/api/file/vnid/detect-info', {
          method: 'POST',
          body: fd,
          headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
        });
        const json = await res.json();
        if (json.EC === 0 && json.DT?.[0]) {
          const d = json.DT[0];
          // Map common field names from Python OCR service
          setForm(f => ({
            ...f,
            HoTen:    d.ho_ten ?? d.name ?? d.HoTen ?? f.HoTen,
            SoCCCD:   d.so_cccd ?? d.id ?? d.SoCCCD ?? f.SoCCCD,
            NgaySinh: d.ngay_sinh ?? d.dob ?? f.NgaySinh,
            GioiTinh: d.gioi_tinh ?? d.gender ?? f.GioiTinh,
            DiaChi:   d.dia_chi ?? d.address ?? f.DiaChi,
          }));
          setMode('manual');
          stopCamera();
        } else {
          setCamError('Không nhận diện được CCCD. Vui lòng thử lại hoặc nhập thủ công.');
        }
      } catch {
        setCamError('Lỗi kết nối khi gửi ảnh. Vui lòng thử lại.');
      } finally {
        setScanning(false);
      }
    }, 'image/jpeg', 0.92);
  }, []);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.HoTen.trim()) e.HoTen = 'Bắt buộc';
    if (!form.loaibangthi) e.loaibangthi = 'Bắt buộc';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await post<{ EC: number; EM: string; DT: SuccessData }>('/api/hocvien/register', form);
      if (res.EC === 0) {
        setSuccess(res.DT);
      } else {
        setErrors({ email: res.EM });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: 'user' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendEmail = async () => {
    if (!success || !form.email) return;
    setSendingEmail(true);
    try {
      await post<{ EC: number; EM: string }>('/api/hocvien/send-credentials', {
        hocVienId: success.hocVienId,
        toEmail: form.email,
        hoTen: success.HoTen,
        username: success.username,
        password: success.password,
      });
      setEmailSent(true);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setEmailSent(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  return (
    <div className="dkhv">
      {/* Header */}
      <div className="dkhv__header">
        <div>
          <nav className="dkhv__breadcrumb">
            <span>Quản lý</span>
            <span className="material-icons">chevron_right</span>
            <span className="dkhv__breadcrumb--active">Ghi danh mới</span>
          </nav>
          <h1 className="dkhv__title">Thêm học viên mới</h1>
          <p className="dkhv__subtitle">Điền thông tin chi tiết hoặc quét thẻ CCCD để tự động nhập liệu.</p>
        </div>
      </div>

      <div className="dkhv__body">
        {/* Left: mode toggle + scanner */}
        <aside className="dkhv__left">
          {/* Toggle */}
          <div className="dkhv__toggle">
            <button
              className={`dkhv__toggle-btn ${mode === 'manual' ? 'dkhv__toggle-btn--active' : ''}`}
              onClick={() => { setMode('manual'); stopCamera(); }}
            >
              <span className="material-icons">edit_note</span>
              Nhập thủ công
            </button>
            <button
              className={`dkhv__toggle-btn ${mode === 'scan' ? 'dkhv__toggle-btn--active' : ''}`}
              onClick={() => { setMode('scan'); startCamera(); }}
            >
              <span className="material-icons">document_scanner</span>
              Quét CCCD
            </button>
          </div>

          {/* Scanner */}
          <div className="dkhv__scanner">
            {mode === 'scan' ? (
              <>
                <div className="dkhv__cam-wrap">
                  <video ref={videoRef} className="dkhv__cam-video" playsInline muted />
                  <canvas ref={canvasRef} className="dkhv__cam-canvas" />
                  <div className="dkhv__cam-frame">
                    <div className="dkhv__cam-label">Vùng nhận diện</div>
                    <span className="material-icons dkhv__cam-icon">qr_code_scanner</span>
                  </div>
                  {!camActive && (
                    <div className="dkhv__cam-placeholder">
                      <span className="material-icons">camera_alt</span>
                      <p>Camera chưa được bật</p>
                    </div>
                  )}
                </div>
                {camError && <p className="dkhv__cam-error">{camError}</p>}
                <div className="dkhv__cam-controls">
                  {!camActive ? (
                    <button className="dkhv__btn-primary" onClick={startCamera}>
                      <span className="material-icons">videocam</span>Bật camera
                    </button>
                  ) : (
                    <button className="dkhv__btn-capture" onClick={captureAndScan} disabled={scanning}>
                      {scanning
                        ? <><span className="material-icons dkhv__spin">sync</span>Đang nhận diện...</>
                        : <><span className="material-icons">photo_camera</span>Chụp &amp; nhận diện</>
                      }
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="dkhv__scan-hint">
                <span className="material-icons">tips_and_updates</span>
                <div>
                  <p className="dkhv__scan-hint-title">Tự động hóa nhập liệu</p>
                  <p className="dkhv__scan-hint-body">
                    Chuyển sang tab <strong>Quét CCCD</strong> để nhận diện thông tin từ thẻ CCCD/CMND với độ chính xác cao.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right: Form */}
        <section className="dkhv__form-wrap">
          {/* Section 01 — Personal info */}
          <div className="dkhv__section">
            <div className="dkhv__section-header">
              <span className="dkhv__section-num">01</span>
              <h3 className="dkhv__section-title">Thông tin cá nhân</h3>
            </div>
            <div className="dkhv__grid">
              <div className="dkhv__field">
                <label className="dkhv__label">Họ và tên <span className="dkhv__required">*</span></label>
                <input className={`dkhv__input ${errors.HoTen ? 'dkhv__input--error' : ''}`}
                  placeholder="VD: Nguyễn Văn A" value={form.HoTen} onChange={set('HoTen')} />
                {errors.HoTen && <span className="dkhv__error-msg">{errors.HoTen}</span>}
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Ngày sinh</label>
                <input type="date" className="dkhv__input" value={form.NgaySinh} onChange={set('NgaySinh')} />
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Giới tính</label>
                <div className="dkhv__radio-group">
                  {(['Nam', 'Nữ'] as const).map(g => (
                    <label key={g} className={`dkhv__radio-btn ${form.GioiTinh === g ? 'dkhv__radio-btn--active' : ''}`}>
                      <input type="radio" name="gender" value={g}
                        checked={form.GioiTinh === g}
                        onChange={() => setForm(f => ({ ...f, GioiTinh: g }))}
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Số CCCD / CMND</label>
                <input className="dkhv__input" placeholder="012345678912" value={form.SoCCCD} onChange={set('SoCCCD')} />
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Số điện thoại</label>
                <input type="tel" className="dkhv__input" placeholder="090 123 4567" value={form.phone} onChange={set('phone')} />
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Email liên hệ</label>
                <input type="email" className={`dkhv__input ${errors.email ? 'dkhv__input--error' : ''}`}
                  placeholder="example@gmail.com" value={form.email} onChange={set('email')} />
                {errors.email && <span className="dkhv__error-msg">{errors.email}</span>}
              </div>

              <div className="dkhv__field dkhv__field--full">
                <label className="dkhv__label">Địa chỉ thường trú / Quận huyện</label>
                <input className="dkhv__input" placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  value={form.DiaChi} onChange={set('DiaChi')} />
              </div>
            </div>
          </div>

          {/* Section 02 — Course info */}
          <div className="dkhv__section">
            <div className="dkhv__section-header">
              <span className="dkhv__section-num">02</span>
              <h3 className="dkhv__section-title">Thông tin khóa học</h3>
            </div>
            <div className="dkhv__grid">
              <div className="dkhv__field">
                <label className="dkhv__label">
                  Hạng bằng đăng ký <span className="dkhv__required">*</span>
                  {errors.loaibangthi && <span className="dkhv__error-msg"> — {errors.loaibangthi}</span>}
                </label>
                <div className="dkhv__license-chips">
                  {LICENSE_TYPES.map(l => (
                    <button
                      key={l}
                      type="button"
                      className={`dkhv__chip ${form.loaibangthi === l ? 'dkhv__chip--active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, loaibangthi: l }))}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dkhv__field">
                <label className="dkhv__label">Trình độ hiện tại</label>
                <select className="dkhv__input dkhv__select" value={form.GplxDaCo} onChange={set('GplxDaCo')}>
                  <option value="">-- Chọn trình độ --</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="dkhv__field dkhv__field--full">
                <label className="dkhv__label">Ghi chú tuyển sinh</label>
                <textarea className="dkhv__input dkhv__textarea" rows={4}
                  placeholder="Nhập các yêu cầu đặc biệt của học viên hoặc lịch trình mong muốn..."
                  value={form.GhiChu} onChange={set('GhiChu')} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="dkhv__actions">
            <button className="dkhv__btn-ghost" type="button" onClick={handleReset}>Huỷ bỏ thao tác</button>
            <button className="dkhv__btn-submit" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? <><span className="material-icons dkhv__spin">sync</span>Đang xử lý...</>
                : <><span className="material-icons">how_to_reg</span>Ghi danh ngay</>
              }
            </button>
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {success && createPortal(
        <div className="dkhv__overlay">
          <div className="dkhv__modal" onClick={e => e.stopPropagation()}>
            <div className="dkhv__modal-hero">
              <div className="dkhv__modal-check">
                <span className="material-icons">check</span>
              </div>
              <h4 className="dkhv__modal-title">Đăng ký thành công!</h4>
              <p className="dkhv__modal-sub">Hồ sơ học viên đã được lưu vào hệ thống</p>
            </div>

            <div className="dkhv__modal-body">
              <p className="dkhv__modal-section-label">Tài khoản truy cập học viên</p>
              <div className="dkhv__credential-card">
                <div className="dkhv__credential-row">
                  <div>
                    <p className="dkhv__cred-label">Username (Email / SĐT)</p>
                    <p className="dkhv__cred-value">{success.username}</p>
                  </div>
                  <button className="dkhv__copy-btn" onClick={() => copyToClipboard(success.username, 'user')}>
                    <span className="material-icons">{copied === 'user' ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
                <div className="dkhv__cred-divider" />
                <div className="dkhv__credential-row">
                  <div>
                    <p className="dkhv__cred-label">Mật khẩu tạm thời</p>
                    <p className="dkhv__cred-value">{success.password}</p>
                  </div>
                  <button className="dkhv__copy-btn" onClick={() => copyToClipboard(success.password, 'pass')}>
                    <span className="material-icons">{copied === 'pass' ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
              </div>

              <div className="dkhv__modal-actions">
                <button className="dkhv__btn-primary" onClick={handleReset}>
                  <span className="material-icons">person_add</span>Thêm học viên khác
                </button>
                {form.email && (
                  <button
                    className="dkhv__btn-outline"
                    onClick={handleSendEmail}
                    disabled={sendingEmail || emailSent}
                  >
                    {sendingEmail
                      ? <><span className="material-icons dkhv__spin">sync</span>Đang gửi...</>
                      : emailSent
                        ? <><span className="material-icons">check_circle</span>Đã gửi email</>
                        : <><span className="material-icons">mail</span>Gửi thông tin qua email</>
                    }
                  </button>
                )}
              </div>
              <button className="dkhv__btn-text" onClick={handleReset}>Đóng thông báo</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DangKyHocVien;
