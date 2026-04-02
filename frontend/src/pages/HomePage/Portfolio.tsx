import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../axios';
import { SupperTeacherProfileModal } from '../../shared/components/SupperTeacherProfileModal';
import { defaultTeacherAvatar } from '../../shared/utils/avatarUtils';
import './mainpages.scss';
import './Portfolio.scss';

const DEFAULT_AVATAR = defaultTeacherAvatar;

type PublicSupperTeacher = {
  id: number;
  username: string;
  profile: {
    bio?: string;
    licenseTypes?: string;
    locationName?: string;
    avatarUrl?: string;
    yearsExp?: number;
  } | null;
  assistantCount: number;
  activeStudents: number;
  completedStudents: number;
  avgStars: string;
  totalRatings: number;
};

const HalfStars: React.FC<{ avg: string }> = ({ avg }) => {
  const num = parseFloat(avg);
  return (
    <span className="pf__stars">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(num);
        const half = !filled && i === Math.ceil(num) && num % 1 >= 0.3;
        return (
          <span key={i} className={`material-symbols-outlined pf__star ${filled || half ? 'pf__star--filled' : ''}`}>
            {filled ? 'star' : half ? 'star_half' : 'star'}
          </span>
        );
      })}
    </span>
  );
};

const Portfolio: React.FC = () => {
  const [teachers, setTeachers] = useState<PublicSupperTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const closeModal = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    axios.get<{ EC: number; DT: PublicSupperTeacher[] }>('/api/public/teachers')
      .then(res => { if (res.data.EC === 0) setTeachers(res.data.DT); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter(t => {
    if (search) {
      return t.username.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  if (loading) return null;
  if (teachers.length === 0) return null;

  return (
    <>
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section id="portfolio" className="pf hp-section">
        <div className="hp-container">
          {/* Search */}
          <div className="pf__filters">
            <div className="pf__search-wrap">
              <span className="material-symbols-outlined pf__search-icon">search</span>
              <input
                className="pf__search"
                type="text"
                placeholder="Tìm kiếm theo tên giáo viên ở đây..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Teacher cards */}
          <div className="pf__grid">
            {filtered.map(t => (
              <div className="pf__card" key={t.id} onClick={() => setSelectedId(t.id)}>
                <div className="pf__card-top">
                  <img
                    className="pf__card-avatar"
                    src={t.profile?.avatarUrl || DEFAULT_AVATAR}
                    alt={t.username}
                    onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <div className="pf__card-info">
                    <h3 className="pf__card-name">{t.username}</h3>
                    {t.profile?.licenseTypes && (
                      <span className="pf__card-badge">Hạng {t.profile.licenseTypes}</span>
                    )}
                  </div>
                </div>

                <div className="pf__card-rating">
                  <HalfStars avg={t.avgStars} />
                  <span className="pf__card-rating-val">{t.avgStars}</span>
                  <span className="pf__card-rating-count">({t.totalRatings} đánh giá)</span>
                </div>

                {t.profile?.bio && (
                  <p className="pf__card-bio">{t.profile.bio}</p>
                )}

                {t.profile?.yearsExp && (
                  <p className="pf__card-exp">
                    <span className="material-symbols-outlined">history</span>
                    {t.profile.yearsExp} năm kinh nghiệm giáo dục
                  </p>
                )}

                <div className="pf__card-stats">
                  <div className="pf__card-stat">
                    <strong>{t.activeStudents}</strong>
                    <span>Đang dạy</span>
                  </div>
                  <div className="pf__card-stat">
                    <strong>{t.completedStudents}</strong>
                    <span>Đã hoàn thành</span>
                  </div>
                  <div className="pf__card-stat">
                    <strong>{t.totalRatings}</strong>
                    <span>Đánh giá</span>
                  </div>
                </div>

                <button className="pf__card-cta" type="button">
                  Xem hồ sơ chi tiết
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="pf__empty">Không tìm thấy giáo viên phù hợp.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust Section ─────────────────────────────────────────────── */}
      <section className="pf-trust hp-section">
        <div className="hp-container">
          <div className="pf-trust__inner">
            <div className="pf-trust__content">
              <span className="pf__label">
                <span className="material-symbols-outlined">verified</span>
                Phẩm tính chuyên môn
              </span>
              <h2 className="pf-trust__title">Tại sao chọn SuperTeacher?</h2>
              <p className="pf-trust__text">
                Mỗi SuperTeacher tại DriveHub đều trải qua quy trình kiểm tra 5 bước khắt khe về cả kỹ năng
                lái xe và kỹ năng sư phạm. Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho từng học viên.
              </p>
              <div className="pf-trust__metrics">
                <div className="pf-trust__metric">
                  <span className="pf-trust__metric-val">98%</span>
                  <span className="pf-trust__metric-label">Học viên hài lòng</span>
                </div>
                <div className="pf-trust__metric">
                  <span className="pf-trust__metric-val">150+</span>
                  <span className="pf-trust__metric-label">Khóa đào tạo/năm</span>
                </div>
              </div>
            </div>
            <div className="pf-trust__visual">
              <img
                src="/assets/images/trust-driving.jpg"
                alt="Driving"
                className="pf-trust__img"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {selectedId != null && (
        <SupperTeacherProfileModal teacherId={selectedId} onClose={closeModal} />
      )}
    </>
  );
};

export default Portfolio;
