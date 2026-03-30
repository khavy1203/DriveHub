import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../features/auth/hooks/useAuth';
import axios from '../../axios';
import './TeacherProfileEdit.scss';

type ProfileData = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  address: string | null;
  genderId: number | null;
  imageBase64: string | null;
  teacherProfile: {
    bio: string | null;
    licenseTypes: string | null;
    locationName: string | null;
    avatarUrl: string | null;
    yearsExp: number | null;
  } | null;
};

type FormState = {
  username: string;
  email: string;
  phone: string;
  address: string;
  genderId: string;
  bio: string;
  licenseTypes: string;
  locationName: string;
  yearsExp: string;
};

const GENDER_OPTIONS = [
  { value: '', label: '— Chọn —' },
  { value: '1', label: 'Nam' },
  { value: '2', label: 'Nữ' },
  { value: '3', label: 'Khác' },
];

const TeacherProfileEdit: React.FC = () => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    phone: '',
    address: '',
    genderId: '',
    bio: '',
    licenseTypes: '',
    locationName: '',
    yearsExp: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/teacher-profile/me/full');
      if (res.data?.EC === 0 && res.data.DT) {
        const d = res.data.DT as ProfileData;
        setProfile(d);
        setForm({
          username: d.username || '',
          email: d.email || '',
          phone: d.phone || '',
          address: d.address || '',
          genderId: d.genderId != null ? String(d.genderId) : '',
          bio: d.teacherProfile?.bio || '',
          licenseTypes: d.teacherProfile?.licenseTypes || '',
          locationName: d.teacherProfile?.locationName || '',
          yearsExp: d.teacherProfile?.yearsExp != null ? String(d.teacherProfile.yearsExp) : '',
        });
        setAvatarPreview(d.teacherProfile?.avatarUrl || null);
      }
    } catch {
      toast.error('Không thể tải thông tin cá nhân.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn (tối đa 5MB).');
      return;
    }

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await axios.post(`/api/teacher-avatar/${userId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.EC === 0 && res.data.DT?.url) {
        setAvatarPreview(res.data.DT.url);
        toast.success('Upload ảnh thành công!');
      } else {
        toast.error(res.data?.EM || 'Upload thất bại.');
      }
    } catch {
      toast.error('Lỗi upload ảnh.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      toast.error('Tên hiển thị không được để trống.');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email không được để trống.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        genderId: form.genderId ? parseInt(form.genderId) : null,
        bio: form.bio.trim() || null,
        licenseTypes: form.licenseTypes.trim() || null,
        locationName: form.locationName.trim() || null,
        yearsExp: form.yearsExp ? parseInt(form.yearsExp) : null,
        avatarUrl: avatarPreview || null,
      };
      const res = await axios.put('/api/teacher-profile/me', body);
      if (res.data?.EC === 0) {
        toast.success('Cập nhật thành công!');
      } else {
        toast.error(res.data?.EM || 'Cập nhật thất bại.');
      }
    } catch {
      toast.error('Lỗi kết nối server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="tpe">
        <div className="tpe__loading">
          <div className="tpe__spinner" />
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tpe">
        <div className="tpe__error">
          <span className="material-icons">error_outline</span>
          <p>Không tìm thấy thông tin người dùng.</p>
        </div>
      </div>
    );
  }

  const defaultAvatar = 'https://gravatar.com/avatar/d302cbc4526bf50e64befe198736824c?s=400&d=robohash&r=x';
  const displayAvatar = avatarPreview || (profile.imageBase64 ? `data:image/png;base64,${profile.imageBase64}` : defaultAvatar);

  return (
    <div className="tpe">
      <div className="tpe__header">
        <span className="material-icons tpe__header-icon">manage_accounts</span>
        <div>
          <h1 className="tpe__title">Thông tin cá nhân</h1>
          <p className="tpe__subtitle">Chỉnh sửa thông tin giáo viên</p>
        </div>
      </div>

      <form className="tpe__form" onSubmit={handleSubmit}>
        {/* Avatar section */}
        <div className="tpe__section">
          <h2 className="tpe__section-title">Ảnh đại diện</h2>
          <div className="tpe__avatar-row">
            <div className="tpe__avatar-wrap">
              <img src={displayAvatar} alt="Avatar" className="tpe__avatar-img" />
              {avatarUploading && <div className="tpe__avatar-uploading"><div className="tpe__spinner tpe__spinner--sm" /></div>}
            </div>
            <div className="tpe__avatar-actions">
              <label className="tpe__btn tpe__btn--outline">
                <span className="material-icons">upload</span>
                Tải ảnh lên
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={handleAvatarChange} />
              </label>
              <p className="tpe__avatar-hint">JPG, PNG, WebP hoặc GIF. Tối đa 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="tpe__section">
          <h2 className="tpe__section-title">Thông tin cơ bản</h2>
          <div className="tpe__grid">
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-username">Tên hiển thị *</label>
              <input id="tpe-username" name="username" className="tpe__input" value={form.username} onChange={handleChange} />
            </div>
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-email">Email *</label>
              <input id="tpe-email" name="email" type="email" className="tpe__input" value={form.email} onChange={handleChange} />
            </div>
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-phone">Số điện thoại</label>
              <input id="tpe-phone" name="phone" className="tpe__input" value={form.phone} onChange={handleChange} placeholder="0912345678" />
            </div>
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-gender">Giới tính</label>
              <select id="tpe-gender" name="genderId" className="tpe__input tpe__select" value={form.genderId} onChange={handleChange}>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="tpe__field tpe__field--full">
              <label className="tpe__label" htmlFor="tpe-address">Địa chỉ</label>
              <input id="tpe-address" name="address" className="tpe__input" value={form.address} onChange={handleChange} placeholder="Số nhà, đường, phường, quận, thành phố" />
            </div>
          </div>
        </div>

        {/* Professional info */}
        <div className="tpe__section">
          <h2 className="tpe__section-title">Thông tin chuyên môn</h2>
          <div className="tpe__grid">
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-license">Hạng bằng giảng dạy</label>
              <input id="tpe-license" name="licenseTypes" className="tpe__input" value={form.licenseTypes} onChange={handleChange} placeholder="A1, B1, B2, C" />
            </div>
            <div className="tpe__field">
              <label className="tpe__label" htmlFor="tpe-years">Số năm kinh nghiệm</label>
              <input id="tpe-years" name="yearsExp" type="number" min="0" className="tpe__input" value={form.yearsExp} onChange={handleChange} />
            </div>
            <div className="tpe__field tpe__field--full">
              <label className="tpe__label" htmlFor="tpe-location">Khu vực giảng dạy</label>
              <input id="tpe-location" name="locationName" className="tpe__input" value={form.locationName} onChange={handleChange} placeholder="VD: Quận 9, TP.HCM" />
            </div>
            <div className="tpe__field tpe__field--full">
              <label className="tpe__label" htmlFor="tpe-bio">Giới thiệu bản thân</label>
              <textarea id="tpe-bio" name="bio" className="tpe__input tpe__textarea" rows={4} value={form.bio} onChange={handleChange} placeholder="Mô tả ngắn về bản thân và phong cách giảng dạy..." />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="tpe__actions">
          <button type="submit" className="tpe__btn tpe__btn--primary" disabled={saving}>
            {saving ? (
              <>
                <div className="tpe__spinner tpe__spinner--sm tpe__spinner--white" />
                Đang lưu...
              </>
            ) : (
              <>
                <span className="material-icons">save</span>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherProfileEdit;
