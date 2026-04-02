import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../../axios';
import { defaultTeacherAvatar, defaultStudentAvatar } from '../../../shared/utils/avatarUtils';
import './TeacherProfileModal.scss';

const DEFAULT_AVATAR = defaultTeacherAvatar;
const REVIEWER_AVATAR = defaultStudentAvatar;

type TeacherProfile = {
  bio?: string | null;
  licenseTypes?: string | null;
  locationName?: string | null;
  avatarUrl?: string | null;
  yearsExp?: number | null;
};

type Review = {
  id: number;
  stars: number;
  comment: string | null;
  createdAt: string;
};

type TeacherDetail = {
  id: number;
  username: string;
  profile: TeacherProfile | null;
  activeStudents: number;
  completedStudents: number;
  avgStars: string;
  totalRatings: number;
  reviews: Review[];
};

type Props = {
  teacherId: number;
  onClose: () => void;
  actionLabel?: string;
  onAction?: (teacherId: number) => void;
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} tuần trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
};

const StarRow: React.FC<{ count: number; size?: 'sm' | 'md' }> = ({ count, size = 'md' }) => {
  const cls = size === 'sm' ? 'tpm__star--sm' : '';
  return (
    <div className="tpm__stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`material-icons tpm__star ${cls} ${i <= count ? 'tpm__star--filled' : ''}`}>
          {i <= count ? 'star' : 'star_border'}
        </span>
      ))}
    </div>
  );
};

const HalfStarRow: React.FC<{ avg: number }> = ({ avg }) => {
  return (
    <div className="tpm__stars">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(avg);
        const half = !filled && i === Math.ceil(avg) && avg % 1 >= 0.3;
        return (
          <span key={i} className={`material-icons tpm__star ${filled || half ? 'tpm__star--filled' : ''}`}>
            {filled ? 'star' : half ? 'star_half' : 'star_border'}
          </span>
        );
      })}
    </div>
  );
};


const TeacherProfileModal: React.FC<Props> = ({ teacherId, onClose, actionLabel, onAction }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/public/teachers/${teacherId}`)
      .then(res => {
        if (res.data?.EC === 0 && res.data.DT) {
          const dt = res.data.DT as TeacherDetail;
          setData({ ...dt, reviews: dt.reviews ?? [] });
        }
      })
      .catch(() => { /* handled by null data */ })
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const avgNum = data ? parseFloat(data.avgStars) : 0;
  const totalCompleted = data ? data.completedStudents : 0;
  const passRatePct = totalCompleted > 0 ? Math.round((totalCompleted / (totalCompleted + data!.activeStudents)) * 100) : 0;

  return createPortal(
    <div className="tpm__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tpm__panel" onClick={e => e.stopPropagation()}>
        {loading && (
          <div className="tpm__loading">
            <div className="tpm__spinner" />
            <p>Đang tải thông tin giáo viên...</p>
          </div>
        )}

        {!loading && !data && (
          <div className="tpm__loading">
            <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--tpm-error)' }}>error_outline</span>
            <p>Không tìm thấy thông tin giáo viên.</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div className="tpm__header">
              <div className="tpm__avatar-wrap">
                <img
                  className="tpm__avatar"
                  src={data.profile?.avatarUrl || DEFAULT_AVATAR}
                  alt={data.username}
                  onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
                <div className="tpm__verified">
                  <span className="material-icons">verified</span>
                </div>
              </div>
              <div className="tpm__header-info">
                <div className="tpm__name-row">
                  <h2 className="tpm__name">{data.username}</h2>
                  <span className="tpm__badge">DAT Certified</span>
                </div>
                <div className="tpm__rating-row">
                  <HalfStarRow avg={avgNum} />
                  <span className="tpm__rating-text">
                    <strong>{data.avgStars}</strong> ({data.totalRatings} đánh giá)
                  </span>
                </div>
                <div className="tpm__tags">
                  {data.profile?.licenseTypes && (
                    <span className="tpm__tag">
                      <span className="material-icons">directions_car</span>
                      {data.profile.licenseTypes}
                    </span>
                  )}
                  {data.profile?.yearsExp && (
                    <span className="tpm__tag">
                      <span className="material-icons">history</span>
                      {data.profile.yearsExp} năm kinh nghiệm
                    </span>
                  )}
                </div>
              </div>
              <button className="tpm__close" onClick={onClose} aria-label="Đóng">
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="tpm__body">
              {/* Metrics grid */}
              <section className="tpm__metrics">
                <div className="tpm__metric">
                  <p className="tpm__metric-label">Chuyên môn</p>
                  <p className="tpm__metric-value">{data.profile?.bio ? data.profile.bio.substring(0, 40) : 'Sa hình & Đường trường'}</p>
                </div>
                <div className="tpm__metric">
                  <p className="tpm__metric-label">Địa bàn</p>
                  <p className="tpm__metric-value">{data.profile?.locationName || '—'}</p>
                </div>
                <div className="tpm__metric">
                  <p className="tpm__metric-label">Đang dạy</p>
                  <p className="tpm__metric-value">{data.activeStudents} học viên</p>
                </div>
                <div className="tpm__metric tpm__metric--highlight">
                  <p className="tpm__metric-label tpm__metric-label--highlight">Đỗ lần 1</p>
                  <div className="tpm__metric-pass">
                    <span className="tpm__metric-pass-pct">{passRatePct}%</span>
                    <span className="tpm__metric-pass-detail">({totalCompleted}/{totalCompleted + data.activeStudents})</span>
                  </div>
                </div>
              </section>

              {/* Reviews */}
              <section className="tpm__reviews-section">
                <div className="tpm__reviews-header">
                  <h3 className="tpm__reviews-title">Phản hồi từ học viên</h3>
                  {data.reviews.length > 3 && (
                    <span className="tpm__reviews-all">Xem tất cả</span>
                  )}
                </div>
                {data.reviews.length === 0 ? (
                  <p className="tpm__reviews-empty">Chưa có đánh giá nào.</p>
                ) : (
                  <div className="tpm__reviews-list">
                    {data.reviews.map((r, idx) => (
                      <div key={r.id} className="tpm__review">
                        <div className="tpm__review-top">
                          <div className="tpm__review-author">
                            <div className="tpm__review-avatar">
                              <img src={REVIEWER_AVATAR} alt="Học viên" />
                            </div>
                            <div>
                              <p className="tpm__review-name">Học viên ẩn danh</p>
                              <p className="tpm__review-time">{timeAgo(r.createdAt)}</p>
                            </div>
                          </div>
                          <StarRow count={r.stars} size="sm" />
                        </div>
                        {r.comment && (
                          <p className="tpm__review-comment">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="tpm__footer">
              <button className="tpm__btn tpm__btn--ghost" onClick={onClose}>Đóng</button>
              {actionLabel && onAction && (
                <button className="tpm__btn tpm__btn--action" onClick={() => onAction(data.id)}>
                  <span className="material-icons">assignment_ind</span>
                  {actionLabel}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default TeacherProfileModal;
