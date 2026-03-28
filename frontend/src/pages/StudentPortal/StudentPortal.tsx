import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../features/auth/hooks/useAuth';
import axios from '../../axios';
import './StudentPortal.scss';

// ── Types ──────────────────────────────────────────────────────────────────────

type TeacherProfile = {
  bio?: string;
  licenseTypes?: string;
  locationName?: string;
  avatarUrl?: string;
  yearsExp?: number;
};

type AssignedTeacher = {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  address?: string;
  profile: TeacherProfile | null;
  avgStars: string;
  totalRatings: number;
};

type MyAssignment = {
  id: number;
  status: 'waiting' | 'learning' | 'completed';
  progressPercent: number;
  datHoursCompleted: number;
  notes?: string;
  canRate: boolean;
  teacher: AssignedTeacher | null;
};

type MyProgress = {
  hocVien: { id: number; HoTen: string; loaibangthi?: string; status: string };
  assignment: MyAssignment | null;
};

type PublicTeacher = {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  profile: TeacherProfile | null;
  avgStars: string;
  totalRatings: number;
  isMyTeacher: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const renderStars = (avgStr: string, size: 'sm' | 'md' = 'sm') => {
  const avg = parseFloat(avgStr);
  const filled = Math.round(avg);
  return (
    <div className={`hvp__stars hvp__stars--${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`material-icons hvp__star ${i <= filled ? 'hvp__star--filled' : ''}`}>
          {i <= filled ? 'star' : 'star_border'}
        </span>
      ))}
    </div>
  );
};

type HocVienProfile = {
  id: number;
  HoTen: string;
  SoCCCD: string | null;
  phone: string | null;
  DiaChi: string | null;
  email: string | null;
  NgaySinh: string | null;
  loaibangthi: string | null;
  avatarUrl: string | null;
};

type NavKey = 'progress' | 'myteacher' | 'teachers' | 'rate' | 'profile';

// ── Component ─────────────────────────────────────────────────────────────────

const StudentPortal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAuthLoading } = useAuth();

  const [myProgress, setMyProgress] = useState<MyProgress | null>(null);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Rating state
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<HocVienProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Section refs for scroll-to
  const progressRef = useRef<HTMLElement>(null);
  const myteacherRef = useRef<HTMLElement>(null);
  const teachersRef = useRef<HTMLElement>(null);
  const rateRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLElement>(null);

  const refMap: Record<NavKey, React.RefObject<HTMLElement | null>> = {
    progress: progressRef,
    myteacher: myteacherRef,
    teachers: teachersRef,
    rate: rateRef,
    profile: profileRef,
  };

  const scrollToSection = (key: NavKey) => {
    refMap[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isAuthLoading, navigate]);

  // Scroll to section when URL ?section= param changes
  useEffect(() => {
    const section = searchParams.get('section') as NavKey | null;
    if (!section || !refMap[section as NavKey]) return;
    const timer = setTimeout(() => scrollToSection(section), 150);
    return () => clearTimeout(timer);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<{ EC: number; DT: HocVienProfile }>('/api/hocvien/portal/me');
      if (res.data.EC === 0 && res.data.DT) {
        setProfile(res.data.DT);
      }
    } catch {
      // silent — supplemental
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const res = await axios.get<{ EC: number; EM: string; DT: MyProgress }>('/api/student-portal/my-progress');
      if (res.data.EC === 0) setMyProgress(res.data.DT);
      else toast.error(res.data.EM);
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const res = await axios.get<{ EC: number; EM: string; DT: PublicTeacher[] }>('/api/student-portal/teachers');
      if (res.data.EC === 0) setTeachers(res.data.DT);
    } catch {
      // silent — teachers list is supplemental
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
      fetchTeachers();
      fetchProfile();
    }
  }, [isAuthenticated, fetchProgress, fetchTeachers, fetchProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    const file = avatarInputRef.current?.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.post<{ EC: number; EM: string; DT: { avatarUrl: string } }>(
        '/api/hocvien/portal/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.EC === 0) {
        toast.success('Đã cập nhật ảnh đại diện');
        setAvatarPreview(null);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        fetchProfile();
      } else {
        toast.error(res.data.EM || 'Upload thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedStar) { toast.error('Vui lòng chọn số sao'); return; }
    setSubmittingRating(true);
    try {
      const res = await axios.post<{ EC: number; EM: string }>('/api/student-portal/rate', {
        stars: selectedStar,
        comment: ratingComment || null,
      });
      if (res.data.EC === 0) {
        setRatingDone(true);
        toast.success('Cảm ơn bạn đã đánh giá!');
        fetchProgress();
      } else {
        toast.error(res.data.EM);
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmittingRating(false);
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    !teacherSearch || t.username.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const pct = myProgress?.assignment?.progressPercent ?? 0;
  const datHours = myProgress?.assignment?.datHoursCompleted ?? 0;
  const teacher = myProgress?.assignment?.teacher ?? null;
  const assignment = myProgress?.assignment ?? null;

  if (isAuthLoading || loadingProgress) {
    return (
      <div className="hvp hvp--loading">
        <span className="material-icons hvp__spin">sync</span>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="hvp">

      {/* Thông tin cá nhân — đặt trên tiến độ */}
      <section ref={profileRef} className="hvp__section">
        <h2 className="hvp__section-title">Thông tin cá nhân</h2>
        <div className="hvp__profile-card">

          {/* Avatar block */}
          <div className="hvp__avatar-block">
            <div className="hvp__avatar-wrap">
              {(avatarPreview || profile?.avatarUrl) ? (
                <img
                  src={avatarPreview ?? profile!.avatarUrl!}
                  alt="Ảnh đại diện"
                  className="hvp__avatar-img"
                />
              ) : (
                <div className="hvp__avatar-placeholder">
                  <span className="material-icons">person</span>
                </div>
              )}
              <button
                type="button"
                className="hvp__avatar-edit-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Đổi ảnh đại diện"
              >
                <span className="material-icons">photo_camera</span>
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            {profile && <p className="hvp__avatar-name">{profile.HoTen}</p>}
            {avatarPreview && (
              <button
                type="button"
                className="hvp__save-btn"
                onClick={handleAvatarUpload}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar
                  ? <><span className="material-icons hvp__spin">sync</span>Đang lưu...</>
                  : <><span className="material-icons">save</span>Lưu ảnh</>
                }
              </button>
            )}
          </div>

          {/* Info read-only */}
          {profile && (
            <div className="hvp__profile-info-grid">
              {[
                { icon: 'badge',          label: 'Số CCCD / CMND',  val: profile.SoCCCD },
                { icon: 'phone',          label: 'Số điện thoại',   val: profile.phone },
                { icon: 'mail_outline',   label: 'Email',           val: profile.email },
                { icon: 'cake',           label: 'Ngày sinh',       val: profile.NgaySinh },
                { icon: 'directions_car', label: 'Loại bằng thi',   val: profile.loaibangthi },
                { icon: 'location_on',    label: 'Địa chỉ',         val: profile.DiaChi },
              ].map(({ icon, label, val }) => val ? (
                <div key={label} className="hvp__info-item">
                  <span className="material-icons hvp__info-icon">{icon}</span>
                  <div>
                    <p className="hvp__info-label">{label}</p>
                    <p className="hvp__info-val">{val}</p>
                  </div>
                </div>
              ) : null)}

              <div className="hvp__info-notice">
                <span className="material-icons">info_outline</span>
                Thông tin trên do trung tâm quản lý. Để thay đổi, vui lòng liên hệ nhân viên.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tiến độ học tập */}
      <section ref={progressRef} className="hvp__section">
        <h2 className="hvp__section-title">Tiến độ học tập</h2>
        <div className="hvp__progress-grid">
          {/* Main progress card */}
          <div className="hvp__card hvp__card--progress">
            <div className="hvp__progress-header">
              <div>
                <p className="hvp__progress-label">Tổng quan khóa học</p>
                <h3 className="hvp__progress-pct">
                  {pct}%{' '}
                  <span className="hvp__progress-pct-sub">Hoàn thành</span>
                </h3>
              </div>
              {assignment && (
                <span className={`hvp__status-badge hvp__status-badge--${assignment.status}`}>
                  {assignment.status === 'completed' ? 'Hoàn thành' :
                   assignment.status === 'learning' ? 'Đang học' : 'Chờ bắt đầu'}
                </span>
              )}
            </div>
            <div className="hvp__progress-bar-track">
              <div className="hvp__progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="hvp__progress-stats">
              <div className="hvp__stat-box">
                <span className="hvp__stat-box-label">Giờ thực hành</span>
                <span className="hvp__stat-box-value">{datHours} / 24 giờ</span>
              </div>
              <div className="hvp__stat-box">
                <span className="hvp__stat-box-label">Trạng thái hồ sơ</span>
                <span className="hvp__stat-box-value">{myProgress?.hocVien?.status ?? '—'}</span>
              </div>
            </div>
            {assignment?.notes && (
              <p className="hvp__progress-notes">
                <span className="material-icons">notes</span>
                {assignment.notes}
              </p>
            )}
          </div>

          {/* Mini teacher card */}
          {teacher && (
            <div className="hvp__card hvp__card--mini-teacher">
              <p className="hvp__mini-label">Giáo viên hiện tại</p>
              <div className="hvp__mini-teacher-info">
                <div className="hvp__mini-avatar">
                  {teacher.profile?.avatarUrl
                    ? <img src={teacher.profile.avatarUrl} alt={teacher.username} />
                    : <span>{getInitials(teacher.username)}</span>
                  }
                </div>
                <div>
                  <p className="hvp__mini-name">Thầy/Cô {teacher.username}</p>
                  {teacher.profile?.licenseTypes && (
                    <p className="hvp__mini-sub">Chuyên gia {teacher.profile.licenseTypes}</p>
                  )}
                  {renderStars(teacher.avgStars, 'sm')}
                </div>
              </div>
              <button
                className="hvp__contact-quick-btn"
                onClick={() => scrollToSection('myteacher')}
              >
                <span className="material-icons">chat_bubble</span>
                Xem thông tin liên hệ
              </button>
            </div>
          )}

          {!teacher && !loadingProgress && (
            <div className="hvp__card hvp__card--mini-teacher hvp__card--no-teacher">
              <p className="hvp__mini-label">Giáo viên hiện tại</p>
              <div className="hvp__no-teacher-placeholder">
                <span className="material-icons">person_search</span>
                <p>Chưa được phân công giáo viên</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Giáo viên đang dạy tôi */}
      <section ref={myteacherRef} className="hvp__section">
        <div className="hvp__section-header">
          <h2 className="hvp__section-title">Giáo viên đang dạy tôi</h2>
          {assignment && (
            <span className={`hvp__status-badge hvp__status-badge--${assignment.status}`}>
              {assignment.status === 'completed' ? 'Hoàn thành' :
               assignment.status === 'learning' ? 'Đang học' : 'Chờ bắt đầu'}
            </span>
          )}
        </div>

        {teacher ? (
          <div className="hvp__teacher-card">
            <div className="hvp__teacher-photo">
              {teacher.profile?.avatarUrl
                ? <img src={teacher.profile.avatarUrl} alt={teacher.username} className="hvp__teacher-photo-img" />
                : <div className="hvp__teacher-photo-initials">{getInitials(teacher.username)}</div>
              }
            </div>
            <div className="hvp__teacher-details">
              <div>
                <h3 className="hvp__teacher-name">{teacher.username}</h3>
                <p className="hvp__teacher-tagline">
                  {teacher.profile?.yearsExp ? `${teacher.profile.yearsExp} năm kinh nghiệm` : ''}
                  {teacher.profile?.licenseTypes ? ` — Hạng ${teacher.profile.licenseTypes}` : ''}
                </p>
                {teacher.profile?.bio && (
                  <p className="hvp__teacher-bio">{teacher.profile.bio}</p>
                )}
              </div>

              <div className="hvp__teacher-contacts">
                {teacher.profile?.locationName && (
                  <div className="hvp__contact-item">
                    <div className="hvp__contact-icon"><span className="material-icons">location_on</span></div>
                    <div>
                      <p className="hvp__contact-label">Vị trí hiện tại</p>
                      <p className="hvp__contact-value">{teacher.profile.locationName}</p>
                    </div>
                  </div>
                )}
                {teacher.phone && (
                  <div className="hvp__contact-item">
                    <div className="hvp__contact-icon"><span className="material-icons">call</span></div>
                    <div>
                      <p className="hvp__contact-label">Số điện thoại</p>
                      <p className="hvp__contact-value">{teacher.phone}</p>
                    </div>
                  </div>
                )}
                {teacher.email && (
                  <div className="hvp__contact-item">
                    <div className="hvp__contact-icon"><span className="material-icons">mail</span></div>
                    <div>
                      <p className="hvp__contact-label">Email</p>
                      <p className="hvp__contact-value">{teacher.email}</p>
                    </div>
                  </div>
                )}
                {teacher.address && (
                  <div className="hvp__contact-item">
                    <div className="hvp__contact-icon"><span className="material-icons">home</span></div>
                    <div>
                      <p className="hvp__contact-label">Địa chỉ</p>
                      <p className="hvp__contact-value">{teacher.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hvp__teacher-rating-row">
                {renderStars(teacher.avgStars, 'md')}
                <span className="hvp__rating-avg">{teacher.avgStars}</span>
                <span className="hvp__rating-count">({teacher.totalRatings} đánh giá)</span>
              </div>

              <div className="hvp__teacher-actions">
                {teacher.phone && (
                  <a href={`tel:${teacher.phone}`} className="hvp__btn hvp__btn--call">
                    <span className="material-icons">phone_in_talk</span>
                    Gọi ngay
                  </a>
                )}
                {teacher.email && (
                  <a href={`mailto:${teacher.email}`} className="hvp__btn hvp__btn--message">
                    <span className="material-icons">send</span>
                    Gửi email
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hvp__card hvp__empty-state">
            <span className="material-icons">person_off</span>
            <p>Bạn chưa được phân công giáo viên. Vui lòng liên hệ trung tâm để được hỗ trợ.</p>
          </div>
        )}
      </section>

      {/* Danh sách giáo viên */}
      <section ref={teachersRef} className="hvp__section">
        <div className="hvp__section-header hvp__section-header--teachers">
          <div>
            <h2 className="hvp__section-title">Danh sách giáo viên</h2>
            <p className="hvp__section-sub">Tìm kiếm và tham khảo đội ngũ giáo viên giàu kinh nghiệm</p>
          </div>
          <div className="hvp__search-wrap">
            <span className="material-icons">search</span>
            <input
              type="text"
              className="hvp__search"
              placeholder="Tìm theo tên..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingTeachers ? (
          <div className="hvp__empty-state">
            <span className="material-icons hvp__spin">sync</span>
          </div>
        ) : (
          <div className="hvp__teachers-grid">
            {filteredTeachers.map((t) => (
              <div
                key={t.id}
                className={`hvp__teacher-list-card ${t.isMyTeacher ? 'hvp__teacher-list-card--mine' : ''}`}
              >
                {t.isMyTeacher && (
                  <span className="hvp__my-badge">ĐANG HỌC</span>
                )}
                <div className="hvp__list-card-top">
                  <div className={`hvp__list-avatar ${t.isMyTeacher ? '' : 'hvp__list-avatar--other'}`}>
                    {t.profile?.avatarUrl
                      ? <img src={t.profile.avatarUrl} alt={t.username} />
                      : <span>{getInitials(t.username)}</span>
                    }
                  </div>
                  <div>
                    <h4 className="hvp__list-name">{t.username}</h4>
                    <p className="hvp__list-sub">
                      {t.profile?.licenseTypes ? `Lái xe hạng ${t.profile.licenseTypes}` : 'Giáo viên lái xe'}
                    </p>
                  </div>
                </div>

                <div className="hvp__list-stats">
                  {t.profile?.yearsExp && (
                    <div className="hvp__list-stat-row">
                      <span>Kinh nghiệm:</span>
                      <span className="hvp__list-stat-val">{t.profile.yearsExp} năm</span>
                    </div>
                  )}
                  <div className="hvp__list-rating">
                    {renderStars(t.avgStars, 'sm')}
                    <span className="hvp__rating-avg">{t.avgStars}</span>
                    <span className="hvp__rating-count">({t.totalRatings})</span>
                  </div>
                </div>

                <div className="hvp__list-card-footer">
                  {t.isMyTeacher ? (
                    <button className="hvp__list-detail-btn" onClick={() => scrollToSection('myteacher')}>
                      Xem thông tin liên hệ
                    </button>
                  ) : (
                    <div className="hvp__hidden-contact">
                      <span className="hvp__hidden-label">Thông tin chỉ dành cho học viên của giáo viên</span>
                      <span className="hvp__hidden-value">Liên hệ bị ẩn</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredTeachers.length === 0 && (
              <div className="hvp__empty-state hvp__empty-state--inline">
                <span className="material-icons">person_search</span>
                <p>Không tìm thấy giáo viên phù hợp.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Đánh giá */}
      <section ref={rateRef} className="hvp__section hvp__section--last">
        <h2 className="hvp__section-title">Đánh giá giáo viên</h2>

        {/* Locked — not completed */}
        {(!assignment || assignment.status !== 'completed') && (
          <div className="hvp__rate-locked">
            <div className="hvp__rate-lock-icon">
              <span className="material-icons">lock</span>
            </div>
            <h3>Chưa thể thực hiện đánh giá</h3>
            <p>
              Bạn chỉ có thể đánh giá sau khi hoàn thành toàn bộ khóa học DAT (đủ giờ thực hành).
            </p>
            <button className="hvp__rate-disabled-btn" disabled>
              Đánh giá ngay (Khóa khi chưa hoàn thành)
            </button>
          </div>
        )}

        {/* Already rated */}
        {assignment?.status === 'completed' && !assignment.canRate && !ratingDone && (
          <div className="hvp__rate-done">
            <span className="material-icons">check_circle</span>
            <h3>Bạn đã đánh giá giáo viên</h3>
            <p>Cảm ơn bạn đã dành thời gian đánh giá. Phản hồi của bạn giúp cải thiện chất lượng đào tạo.</p>
          </div>
        )}

        {/* Rating submitted this session */}
        {ratingDone && (
          <div className="hvp__rate-done">
            <span className="material-icons">check_circle</span>
            <h3>Đánh giá thành công!</h3>
            <p>Cảm ơn bạn đã đánh giá giáo viên {teacher?.username}.</p>
          </div>
        )}

        {/* Active rating form */}
        {assignment?.status === 'completed' && assignment.canRate && !ratingDone && (
          <div className="hvp__rate-form">
            {teacher && (
              <div className="hvp__rate-teacher-info">
                <div className="hvp__rate-avatar">
                  {getInitials(teacher.username)}
                </div>
                <div>
                  <p className="hvp__rate-teacher-name">{teacher.username}</p>
                  <p className="hvp__rate-teacher-sub">
                    {teacher.profile?.licenseTypes ? `Hạng ${teacher.profile.licenseTypes}` : 'Giáo viên lái xe'}
                  </p>
                </div>
              </div>
            )}

            <div className="hvp__rate-stars-row">
              <p className="hvp__rate-ask">Bạn đánh giá giáo viên bao nhiêu sao?</p>
              <div className="hvp__rate-stars-input">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    className={`hvp__rate-star-btn ${i <= (hoverStar || selectedStar) ? 'hvp__rate-star-btn--active' : ''}`}
                    onMouseEnter={() => setHoverStar(i)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setSelectedStar(i)}
                  >
                    <span className="material-icons">
                      {i <= (hoverStar || selectedStar) ? 'star' : 'star_border'}
                    </span>
                  </button>
                ))}
                {selectedStar > 0 && (
                  <span className="hvp__rate-star-label">
                    {['', 'Rất tệ', 'Tệ', 'Trung bình', 'Tốt', 'Xuất sắc'][selectedStar]}
                  </span>
                )}
              </div>
            </div>

            <div className="hvp__rate-comment">
              <label>Nhận xét (không bắt buộc)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm học cùng giáo viên..."
                rows={3}
              />
            </div>

            <button
              className="hvp__rate-submit-btn"
              onClick={handleSubmitRating}
              disabled={submittingRating || !selectedStar}
            >
              {submittingRating
                ? <><span className="material-icons hvp__spin">sync</span>Đang gửi...</>
                : <><span className="material-icons">send</span>Gửi đánh giá</>
              }
            </button>
          </div>
        )}
      </section>

    </div>
  );
};

export default StudentPortal;
