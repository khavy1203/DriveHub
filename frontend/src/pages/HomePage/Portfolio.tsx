import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../axios';
import { TeacherProfileModal } from '../../shared/components/TeacherProfileModal';
import './mainpages.scss';

type TeacherPublic = {
  id: number;
  username: string;
  profile: {
    bio?: string;
    licenseTypes?: string;
    locationName?: string;
    avatarUrl?: string;
    yearsExp?: number;
  } | null;
  activeStudents: number;
  completedStudents: number;
  avgStars: string;
  totalRatings: number;
};

const DEFAULT_AVATAR = '/assets/images/teacher/tho/1.jpg';

const renderStars = (avgStr: string) => {
  const avg = parseFloat(avgStr);
  const filled = Math.round(avg);
  return (
    <div className="hp-instructor-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <i key={i} className="material-icons" style={{ fontSize: '1rem', color: i <= filled ? '#f59e0b' : '#d1d5db' }}>
          {i <= filled ? 'star' : 'star_border'}
        </i>
      ))}
      <span className="hp-instructor-stars-val">{avgStr}</span>
      <span className="hp-instructor-stars-count">({avg > 0 ? `${avg} sao` : '—'})</span>
    </div>
  );
};

const Portfolio: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const closeModal = useCallback(() => setSelectedTeacherId(null), []);

  useEffect(() => {
    axios.get<{ EC: number; DT: TeacherPublic[] }>('/api/public/teachers')
      .then(res => { if (res.data.EC === 0) setTeachers(res.data.DT); })
      .catch(() => { /* silent — home page still renders without data */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (teachers.length === 0) return null;

  return (
    <section id="portfolio" className="hp-instructors hp-section">
      <div className="hp-container">
        <div className="hp-instructors-header hp-reveal">
          <div className="hp-section-label">
            <i className="material-icons">people</i>
            Đội ngũ giảng viên
          </div>
          <h2 className="hp-section-title">
            Giảng viên <em>tận tâm</em> & thành tích nổi bật
          </h2>
          <p className="hp-section-sub">
            Những giảng viên kinh nghiệm, luôn đồng hành cùng bạn trên con đường chinh phục bằng lái xe.
          </p>
        </div>

        <div className="hp-instructors-scroll">
          {teachers.map(t => (
            <div className="hp-instructor-card" key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{ cursor: 'pointer' }}>
              <div className="hp-instructor-img">
                <img
                  src={t.profile?.avatarUrl || DEFAULT_AVATAR}
                  alt={t.username}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== DEFAULT_AVATAR) img.src = DEFAULT_AVATAR;
                  }}
                />
                {t.profile?.licenseTypes && (
                  <div className="hp-instructor-badge">Hạng {t.profile.licenseTypes}</div>
                )}
              </div>
              <div className="hp-instructor-body">
                <div className="hp-instructor-name">{t.username}</div>
                {t.profile?.licenseTypes && (
                  <div className="hp-instructor-role">Hạng {t.profile.licenseTypes}</div>
                )}
                {t.profile?.bio && (
                  <p className="hp-instructor-desc">{t.profile.bio}</p>
                )}
                {t.profile?.yearsExp && (
                  <p className="hp-instructor-exp">
                    <i className="material-icons" style={{ fontSize: '0.875rem', verticalAlign: 'middle' }}>work</i>
                    {' '}{t.profile.yearsExp} năm kinh nghiệm
                  </p>
                )}
                {renderStars(t.avgStars)}
                <div className="hp-instructor-stats">
                  <div>
                    <strong>{t.activeStudents}</strong>
                    <span>Đang học</span>
                  </div>
                  <div>
                    <strong>{t.completedStudents}</strong>
                    <span>Hoàn thành</span>
                  </div>
                  {t.totalRatings > 0 && (
                    <div>
                      <strong>{t.totalRatings}</strong>
                      <span>Đánh giá</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTeacherId != null && (
        <TeacherProfileModal teacherId={selectedTeacherId} onClose={closeModal} />
      )}
    </section>
  );
};

export default Portfolio;
