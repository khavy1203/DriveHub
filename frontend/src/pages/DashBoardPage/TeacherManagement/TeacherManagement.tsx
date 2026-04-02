import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import useApiService from '../../../services/useApiService';
import axios from '../../../axios';
import { TeacherProfileModal } from '../../../shared/components/TeacherProfileModal';
import { fetchSupperTeachers, reassignTeacherApi } from '../../../features/superTeacher/services/superTeacherApi';
import type { SupperTeacher } from '../../../features/superTeacher/types';
import './TeacherManagement.scss';

type Rank = { id: number; name: string };

type Teacher = {
  id: number;
  username: string;
  email: string;
  address?: string;
  phone?: string;
  superTeacherId?: number | null;
  superTeacher?: { id: number; username: string; email: string } | null;
};

type TeacherProfile = {
  userId: number;
  bio: string;
  licenseTypes: string;
  locationName: string;
  yearsExp: string;
  avatarUrl: string;
  isActive: number;
};

type FormState = {
  id?: number;
  username: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  superTeacherId: number | '';
};

const EMPTY_FORM: FormState = { username: '', email: '', password: '', address: '', phone: '', superTeacherId: '' };
const EMPTY_PROFILE: Omit<TeacherProfile, 'userId'> = {
  bio: '', licenseTypes: '', locationName: '', yearsExp: '', avatarUrl: '', isActive: 1,
};

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const TeacherManagement: React.FC = () => {
  const { get, post, put, del } = useApiService();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [viewTeacherId, setViewTeacherId] = useState<number | null>(null);

  // Ranks
  const [ranks, setRanks] = useState<Rank[]>([]);
  // SupperTeachers for assignment dropdown
  const [supperTeachers, setSupperTeachers] = useState<SupperTeacher[]>([]);

  useEffect(() => {
    axios.get<{ EC: number; DT: Rank[] }>('/api/rank/getRank')
      .then(res => { if (res.data.EC === 0) setRanks(res.data.DT ?? []); })
      .catch(() => {});
    fetchSupperTeachers()
      .then(res => { if (res.EC === 0) setSupperTeachers(res.DT ?? []); })
      .catch(() => {});
  }, []);

  // Profile modal
  const [showProfile, setShowProfile] = useState(false);
  const [profileTeacher, setProfileTeacher] = useState<Teacher | null>(null);
  const [profile, setProfile] = useState<Omit<TeacherProfile, 'userId'>>(EMPTY_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ EC: number; DT: Teacher[] }>('/api/users');
      if (res.EC === 0) setTeachers(res.DT ?? []);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const filtered = teachers.filter(t =>
    !search.trim() ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.phone ?? '').includes(search) ||
    (t.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setMessage(null);
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setForm({ id: t.id, username: t.username, email: t.email, password: '', address: t.address ?? '', phone: t.phone ?? '', superTeacherId: t.superTeacherId ?? '' });
    setMessage(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email) {
      setMessage({ text: 'Vui lòng điền đầy đủ tên đăng nhập và email', ok: false });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, superTeacherId: form.superTeacherId || null };
      const res = form.id
        ? await put<{ EC: number; EM: string }>('/api/users', payload as Record<string, unknown>)
        : await post<{ EC: number; EM: string }>('/api/users', payload as Record<string, unknown>);
      if (res.EC === 0) {
        // If editing and superTeacherId changed, also call reassign API
        if (form.id && form.superTeacherId) {
          try {
            await reassignTeacherApi(form.id, Number(form.superTeacherId));
          } catch {
            // non-critical, teacher was still saved
          }
        }
        setMessage({ text: form.id ? 'Cập nhật thành công' : 'Tạo tài khoản thành công', ok: true });
        await fetchTeachers();
        setTimeout(() => setShowModal(false), 800);
      } else {
        setMessage({ text: res.EM ?? 'Có lỗi xảy ra', ok: false });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!window.confirm(`Xóa tài khoản "${username}"?`)) return;
    const res = await del<{ EC: number; EM: string }>(`/api/users?id=${id}`);
    if (res.EC === 0) setTeachers(prev => prev.filter(t => t.id !== id));
  };

  // ── Profile management ──────────────────────────────────────────────────────

  const openProfile = async (t: Teacher) => {
    setProfileTeacher(t);
    setProfileMsg(null);
    setProfile(EMPTY_PROFILE);
    setShowProfile(true);
    try {
      const res = await axios.get<{ EC: number; DT: TeacherProfile | null }>(`/api/teacher-profile/${t.id}`);
      if (res.data.EC === 0 && res.data.DT) {
        const p = res.data.DT;
        setProfile({
          bio: p.bio ?? '',
          licenseTypes: p.licenseTypes ?? '',
          locationName: p.locationName ?? '',
          yearsExp: p.yearsExp ? String(p.yearsExp) : '',
          avatarUrl: p.avatarUrl ?? '',
          isActive: p.isActive ?? 1,
        });
      }
    } catch { /* leave blank */ }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileTeacher) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await axios.post<{ EC: number; EM: string; DT: { url: string } }>(
        `/api/teacher-avatar/${profileTeacher.id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (res.data.EC === 0) {
        setProfile(p => ({ ...p, avatarUrl: res.data.DT.url }));
        setProfileMsg({ text: 'Upload ảnh thành công', ok: true });
      } else {
        setProfileMsg({ text: res.data.EM || 'Upload thất bại', ok: false });
      }
    } catch {
      setProfileMsg({ text: 'Lỗi kết nối server', ok: false });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!profileTeacher) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await axios.put<{ EC: number; EM: string }>(
        `/api/teacher-profile/${profileTeacher.id}`,
        {
          bio: profile.bio || null,
          licenseTypes: profile.licenseTypes || null,
          locationName: profile.locationName || null,
          yearsExp: profile.yearsExp ? parseInt(profile.yearsExp) : null,
          isActive: profile.isActive,
          avatarUrl: profile.avatarUrl || null,
        },
      );
      if (res.data.EC === 0) {
        setProfileMsg({ text: 'Lưu hồ sơ thành công', ok: true });
      } else {
        setProfileMsg({ text: res.data.EM || 'Có lỗi xảy ra', ok: false });
      }
    } catch {
      setProfileMsg({ text: 'Lỗi kết nối server', ok: false });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="tm">
      <div className="tm__header">
        <div>
          <h1 className="tm__title">Quản lý Giáo viên</h1>
          <p className="tm__subtitle">
            <span className="tm__subtitle-dot" />
            Hiện có <strong>{teachers.length}</strong> tài khoản trong hệ thống
          </p>
        </div>
        <button className="tm__btn-primary" onClick={openCreate}>
          <span className="material-icons">person_add</span>
          Thêm giáo viên
        </button>
      </div>

      <div className="tm__filter-bar">
        <div className="tm__search-wrap">
          <span className="material-icons tm__search-icon">person_search</span>
          <input
            className="tm__search"
            placeholder="Tên, email, số điện thoại hoặc địa chỉ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="tm__search-clear" onClick={() => setSearch('')}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="tm__state">
          <span className="material-icons tm__spin">sync</span>
          Đang tải...
        </div>
      ) : filtered.length === 0 ? (
        <div className="tm__state">
          <span className="material-icons">manage_accounts</span>
          {teachers.length === 0 ? 'Chưa có tài khoản nào' : 'Không tìm thấy kết quả'}
        </div>
      ) : (
        <div className="tm__table-wrap">
          <table className="tm__table">
            <thead>
              <tr>
                <th>Giáo viên</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>SupperTeacher</th>
                <th className="tm__th-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="tm__teacher-cell">
                      <div className="tm__avatar">{getInitials(t.username)}</div>
                      <div>
                        <div className="tm__teacher-name" onClick={() => setViewTeacherId(t.id)} style={{ cursor: 'pointer', color: '#00685d' }}>{t.username}</div>
                        <div className="tm__teacher-id">
                          <span className="material-icons">verified</span>
                          GV-{String(t.id).padStart(3, '0')} · {t.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="tm__td-muted">{t.phone || '—'}</td>
                  <td className="tm__td-muted">{t.address || '—'}</td>
                  <td className="tm__td-muted">{t.superTeacher?.username || <span style={{ color: '#94a3b8' }}>Chưa gán</span>}</td>
                  <td>
                    <div className="tm__actions">
                      <button className="tm__action-icon" onClick={() => openProfile(t)} title="Hồ sơ giảng viên">
                        <span className="material-icons">badge</span>
                      </button>
                      <button className="tm__action-icon" onClick={() => openEdit(t)} title="Chỉnh sửa tài khoản">
                        <span className="material-icons">edit</span>
                      </button>
                      <button className="tm__action-icon tm__action-icon--del" onClick={() => handleDelete(t.id, t.username)} title="Xóa">
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tm__table-footer">
            <span>Hiển thị <strong>{filtered.length}</strong> của <strong>{teachers.length}</strong> giáo viên</span>
          </div>
        </div>
      )}

      {/* ── Account modal ────────────────────────────────────────────────────── */}
      {showModal && createPortal(
        <div className="tm__overlay" onClick={() => setShowModal(false)}>
          <div className="tm__modal" onClick={e => e.stopPropagation()}>
            <div className="tm__modal-header">
              <h3>{form.id ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <button className="tm__modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="tm__modal-body">
              <label className="tm__label">
                Tên đăng nhập <span className="tm__required">*</span>
                <input className="tm__input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Nhập tên đăng nhập" />
              </label>
              <label className="tm__label">
                Email <span className="tm__required">*</span>
                <input className="tm__input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Nhập email" />
              </label>
              <label className="tm__label">
                Mật khẩu {!form.id && <span className="tm__required">*</span>}
                {form.id && <span className="tm__hint"> (để trống nếu không đổi)</span>}
                <input className="tm__input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={form.id ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'} />
              </label>
              <label className="tm__label">
                Địa chỉ
                <input className="tm__input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Nhập địa chỉ" />
              </label>
              <label className="tm__label">
                Số điện thoại
                <input className="tm__input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Nhập số điện thoại" />
              </label>
              <label className="tm__label">
                Thuộc SupperTeacher
                <select
                  className="tm__input"
                  value={form.superTeacherId}
                  onChange={e => setForm(f => ({ ...f, superTeacherId: e.target.value ? Number(e.target.value) : '' }))}
                >
                  <option value="">— Chưa gán —</option>
                  {supperTeachers.map(st => (
                    <option key={st.id} value={st.id}>{st.username} ({st.email})</option>
                  ))}
                </select>
              </label>
              {message && (
                <div className={`tm__msg ${message.ok ? 'tm__msg--ok' : 'tm__msg--err'}`}>
                  <span className="material-icons">{message.ok ? 'check_circle' : 'error'}</span>
                  {message.text}
                </div>
              )}
            </div>
            <div className="tm__modal-footer">
              <button className="tm__btn-ghost" onClick={() => setShowModal(false)}>Huỷ</button>
              <button className="tm__btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="material-icons tm__spin">sync</span>Đang lưu...</>
                  : <><span className="material-icons">save</span>{form.id ? 'Cập nhật' : 'Tạo tài khoản'}</>
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Profile modal ────────────────────────────────────────────────────── */}
      {showProfile && profileTeacher && createPortal(
        <div className="tm__overlay" onClick={() => setShowProfile(false)}>
          <div className="tm__modal tm__modal--profile" onClick={e => e.stopPropagation()}>
            <div className="tm__modal-header">
              <h3>Hồ sơ giảng viên — {profileTeacher.username}</h3>
              <button className="tm__modal-close" onClick={() => setShowProfile(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="tm__modal-body">

              {/* Avatar upload */}
              <div className="tm__avatar-section">
                <div className="tm__avatar-preview">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt="avatar" className="tm__avatar-img" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="tm__avatar tm__avatar--lg">{getInitials(profileTeacher.username)}</div>
                  }
                </div>
                <div className="tm__avatar-actions">
                  <p className="tm__avatar-label">Ảnh đại diện</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleUploadAvatar}
                  />
                  <button
                    className="tm__btn-upload"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <span className="material-icons">{uploadingAvatar ? 'sync' : 'upload'}</span>
                    {uploadingAvatar ? 'Đang tải...' : 'Tải ảnh lên'}
                  </button>
                  <p className="tm__hint">hoặc nhập URL ảnh trực tiếp</p>
                  <input
                    className="tm__input tm__input--sm"
                    placeholder="https://..."
                    value={profile.avatarUrl}
                    onChange={e => setProfile(p => ({ ...p, avatarUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="tm__label">
                Hạng bằng lái giảng dạy
                <div className="tm__rank-list">
                  {ranks.map(r => {
                    const selected = profile.licenseTypes.split(',').map(s => s.trim()).filter(Boolean).includes(r.name);
                    return (
                      <label key={r.id} className={`tm__rank-item ${selected ? 'tm__rank-item--selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={e => {
                            const current = profile.licenseTypes.split(',').map(s => s.trim()).filter(Boolean);
                            const next = e.target.checked
                              ? [...current, r.name]
                              : current.filter(n => n !== r.name);
                            setProfile(p => ({ ...p, licenseTypes: next.join(', ') }));
                          }}
                        />
                        {r.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="tm__label">
                Số năm kinh nghiệm
                <input
                  className="tm__input"
                  type="number"
                  min="0"
                  placeholder="VD: 10"
                  value={profile.yearsExp}
                  onChange={e => setProfile(p => ({ ...p, yearsExp: e.target.value }))}
                />
              </label>
              <label className="tm__label">
                Khu vực giảng dạy
                <input
                  className="tm__input"
                  placeholder="VD: Quận Bình Thạnh, TP.HCM"
                  value={profile.locationName}
                  onChange={e => setProfile(p => ({ ...p, locationName: e.target.value }))}
                />
              </label>
              <label className="tm__label">
                Giới thiệu bản thân
                <textarea
                  className="tm__input tm__input--textarea"
                  rows={3}
                  placeholder="Mô tả ngắn về giảng viên..."
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                />
              </label>
              <label className="tm__label tm__label--inline">
                <input
                  type="checkbox"
                  checked={profile.isActive === 1}
                  onChange={e => setProfile(p => ({ ...p, isActive: e.target.checked ? 1 : 0 }))}
                />
                Hiển thị trên trang chủ
              </label>

              {profileMsg && (
                <div className={`tm__msg ${profileMsg.ok ? 'tm__msg--ok' : 'tm__msg--err'}`}>
                  <span className="material-icons">{profileMsg.ok ? 'check_circle' : 'error'}</span>
                  {profileMsg.text}
                </div>
              )}
            </div>
            <div className="tm__modal-footer">
              <button className="tm__btn-ghost" onClick={() => setShowProfile(false)}>Đóng</button>
              <button className="tm__btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile
                  ? <><span className="material-icons tm__spin">sync</span>Đang lưu...</>
                  : <><span className="material-icons">save</span>Lưu hồ sơ</>
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {viewTeacherId != null && (
        <TeacherProfileModal teacherId={viewTeacherId} onClose={() => setViewTeacherId(null)} />
      )}
    </div>
  );
};

export default TeacherManagement;
