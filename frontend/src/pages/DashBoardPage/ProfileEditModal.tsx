import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../axios';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultAvatar } from '../../shared/utils/avatarUtils';
import './ProfileEditModal.scss';

type ProfileData = {
  username: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
};

type Props = {
  onClose: () => void;
};

const ProfileEditModal: React.FC<Props> = ({ onClose }) => {
  const { userId, avatarUrl: ctxAvatar, displayName, role, refreshAuth } = useAuth();
  const DEFAULT_AVATAR = getDefaultAvatar(role);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    username: displayName || '',
    email: '',
    phone: '',
    address: '',
    avatarUrl: ctxAvatar || '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axiosInstance.get('/api/teacher-profile/me/full')
      .then((res) => {
        if (res.data?.EC === 0 && res.data?.DT) {
          const d = res.data.DT;
          setForm({
            username: d.username || '',
            email: d.email || '',
            phone: d.phone || '',
            address: d.address || '',
            avatarUrl: d.teacherProfile?.avatarUrl || ctxAvatar || '',
          });
        }
      })
      .catch(() => {/* silently fall back to ctx values */})
      .finally(() => setLoading(false));
  }, [ctxAvatar]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await axiosInstance.post(`/api/teacher-avatar/${userId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.EC === 0 && res.data?.DT?.url) {
        setForm((f) => ({ ...f, avatarUrl: res.data.DT.url }));
        await refreshAuth();
        toast.success('Cập nhật ảnh đại diện thành công');
      }
    } catch {
      // axios interceptor handles toast
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error('Tên hiển thị không được để trống');
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.put('/api/teacher-profile/me', {
        username: form.username.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
      if (res.data?.EC === 0) {
        await refreshAuth();
        toast.success('Cập nhật thông tin thành công');
        onClose();
      }
    } catch {
      // axios interceptor handles toast
    } finally {
      setSaving(false);
    }
  };

  const resolvedAvatar = form.avatarUrl || DEFAULT_AVATAR;

  return createPortal(
    <div className="pem__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pem__panel" onClick={(e) => e.stopPropagation()}>
        <div className="pem__header">
          <h2 className="pem__title">Chỉnh sửa hồ sơ</h2>
          <button className="pem__close" onClick={onClose} aria-label="Đóng">
            <span className="material-icons">close</span>
          </button>
        </div>

        {loading ? (
          <div className="pem__loading">
            <div className="pem__spinner" />
          </div>
        ) : (
          <div className="pem__body">
            {/* Avatar section */}
            <div className="pem__avatar-section">
              <div className="pem__avatar-wrap">
                <img
                  src={resolvedAvatar}
                  alt="avatar"
                  className="pem__avatar-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
                {uploadingAvatar && (
                  <div className="pem__avatar-overlay">
                    <div className="pem__spinner pem__spinner--sm" />
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <button
                className="pem__avatar-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <span className="material-icons">photo_camera</span>
                {uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
              </button>
              <p className="pem__avatar-hint">JPG, PNG, WebP · Tối đa 5MB</p>
            </div>

            {/* Fields */}
            <div className="pem__fields">
              <label className="pem__label">
                Tên hiển thị <span className="pem__required">*</span>
                <input
                  className="pem__input"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Nhập tên hiển thị"
                />
              </label>
              <label className="pem__label">
                Email
                <input
                  className="pem__input pem__input--readonly"
                  value={form.email}
                  readOnly
                />
              </label>
              <label className="pem__label">
                Số điện thoại
                <input
                  className="pem__input"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                  inputMode="tel"
                />
              </label>
              <label className="pem__label">
                Địa chỉ
                <input
                  className="pem__input"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Nhập địa chỉ"
                />
              </label>
            </div>
          </div>
        )}

        <div className="pem__footer">
          <button className="pem__btn-cancel" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button className="pem__btn-save" onClick={handleSave} disabled={saving || loading}>
            {saving
              ? <><span className="material-icons pem__spin">sync</span>Đang lưu...</>
              : <><span className="material-icons">save</span>Lưu thay đổi</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ProfileEditModal;
