import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../../axios';
import type { SupperTeacherDetail, AssistantDetail, TeacherReview } from '../../../features/superTeacher/types';
import { defaultTeacherAvatar, defaultStudentAvatar } from '../../../shared/utils/avatarUtils';
import './SupperTeacherProfileModal.scss';

const DEFAULT_AVATAR = defaultTeacherAvatar;
const REVIEWER_AVATAR = defaultStudentAvatar;

type Props = {
  teacherId: number;
  onClose: () => void;
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
  return months < 12 ? `${months} tháng trước` : `${Math.floor(months / 12)} năm trước`;
};

const HalfStarRow: React.FC<{ avg: number; size?: 'sm' | 'md' }> = ({ avg, size = 'md' }) => {
  const cls = size === 'sm' ? 'stpm__star--sm' : '';
  return (
    <span className="stpm__stars">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(avg);
        const half = !filled && i === Math.ceil(avg) && avg % 1 >= 0.3;
        return (
          <span key={i} className={`material-symbols-outlined stpm__star ${cls} ${filled || half ? 'stpm__star--filled' : ''}`}>
            {filled ? 'star' : half ? 'star_half' : 'star'}
          </span>
        );
      })}
    </span>
  );
};

const ReviewItem: React.FC<{ review: TeacherReview }> = ({ review }) => (
  <div className="stpm__review">
    <div className="stpm__review-top">
      <div className="stpm__review-author">
        <div className="stpm__review-avatar">
          <img src={REVIEWER_AVATAR} alt="Học viên" />
        </div>
        <div>
          <p className="stpm__review-name">{review.studentName || 'Học viên ẩn danh'}</p>
        </div>
      </div>
      <div className="stpm__review-meta">
        <HalfStarRow avg={review.stars} size="sm" />
        <span className="stpm__review-time">{timeAgo(review.createdAt)}</span>
      </div>
    </div>
    {review.comment && <p className="stpm__review-text">{review.comment}</p>}
  </div>
);

const AssistantCard: React.FC<{ assistant: AssistantDetail }> = ({ assistant }) => (
  <div className="stpm__assistant">
    <div className="stpm__assistant-header">
      <img
        className="stpm__assistant-avatar"
        src={assistant.avatarUrl || DEFAULT_AVATAR}
        alt={assistant.username}
        onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
      />
      <div className="stpm__assistant-info">
        <p className="stpm__assistant-name">{assistant.username}</p>
        <p className="stpm__assistant-role">
          {assistant.licenseTypes ? `Trợ giảng cao cấp · Hạng ${assistant.licenseTypes}` : 'Trợ giảng'}
        </p>
      </div>
      <div className="stpm__assistant-rating">
        <HalfStarRow avg={parseFloat(assistant.avgStars)} size="sm" />
        <span className="stpm__assistant-rating-text">{assistant.avgStars}</span>
      </div>
    </div>
    {assistant.reviews.length > 0 && (
      <div className="stpm__assistant-reviews">
        {assistant.reviews.map(r => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </div>
    )}
  </div>
);

const SupperTeacherProfileModal: React.FC<Props> = ({ teacherId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SupperTeacherDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/public/teachers/${teacherId}`)
      .then(res => {
        if (res.data?.EC === 0 && res.data.DT) {
          setData(res.data.DT as SupperTeacherDetail);
        }
      })
      .catch(() => {})
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

  return createPortal(
    <div className="stpm__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="stpm__panel" onClick={e => e.stopPropagation()}>
        {loading && (
          <div className="stpm__loading">
            <div className="stpm__spinner" />
            <p>Đang tải thông tin...</p>
          </div>
        )}

        {!loading && !data && (
          <div className="stpm__loading">
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#ba1a1a' }}>error_outline</span>
            <p>Không tìm thấy thông tin.</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div className="stpm__header">
              <div className="stpm__header-left">
                <div className="stpm__avatar-wrap">
                  <img
                    className="stpm__avatar"
                    src={data.profile?.avatarUrl || DEFAULT_AVATAR}
                    alt={data.username}
                    onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <div className="stpm__verified">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                </div>
                <div className="stpm__header-info">
                  <div className="stpm__name-row">
                    <h2 className="stpm__name">{data.username}</h2>
                    {data.profile?.licenseTypes && (
                      <span className="stpm__badge">{data.profile.licenseTypes} UPPER INTERMEDIATE</span>
                    )}
                  </div>
                  <div className="stpm__rating-row">
                    <HalfStarRow avg={avgNum} />
                    <span className="stpm__rating-text">
                      {data.avgStars} ({data.totalRatings} đánh giá)
                    </span>
                    {data.profile?.locationName && (
                      <>
                        <span className="stpm__sep">·</span>
                        <span className="stpm__location">
                          <span className="material-symbols-outlined">location_on</span>
                          {data.profile.locationName}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="stpm__profile-details">
                    {data.profile?.yearsExp && (
                      <span className="stpm__detail-tag">
                        <span className="material-symbols-outlined">history</span>
                        {data.profile.yearsExp} năm kinh nghiệm
                      </span>
                    )}
                    {data.profile?.licenseTypes && (
                      <span className="stpm__detail-tag">
                        <span className="material-symbols-outlined">directions_car</span>
                        Hạng {data.profile.licenseTypes}
                      </span>
                    )}
                    {data.isSupperTeacher && (
                      <span className="stpm__detail-tag">
                        <span className="material-symbols-outlined">school</span>
                        {data.activeStudents} đang học · {data.completedStudents} hoàn thành
                      </span>
                    )}
                  </div>
                  {data.profile?.bio && (
                    <p className="stpm__bio">{data.profile.bio}</p>
                  )}
                </div>
              </div>
              <button className="stpm__close" onClick={onClose} aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="stpm__body">
              {data.isSupperTeacher && data.assistants && data.assistants.length > 0 && (
                <section className="stpm__assistants-section">
                  <div className="stpm__section-header">
                    <h3 className="stpm__section-title">Đội ngũ Giảng viên trợ giảng</h3>
                    <span className="stpm__member-count">{data.assistants.length} thành viên</span>
                  </div>
                  <div className="stpm__assistants-list">
                    {data.assistants.map(a => (
                      <AssistantCard key={a.id} assistant={a} />
                    ))}
                  </div>
                </section>
              )}

              {!data.isSupperTeacher && data.reviews && data.reviews.length > 0 && (
                <section className="stpm__reviews-section">
                  <h3 className="stpm__section-title">Đánh giá từ học viên</h3>
                  <div className="stpm__reviews-list">
                    {data.reviews.map(r => (
                      <ReviewItem key={r.id} review={r} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="stpm__footer">
              <button className="stpm__btn stpm__btn--ghost" onClick={onClose}>Đóng</button>
              <button className="stpm__btn stpm__btn--primary" type="button">
                Chỉnh sửa đội ngũ
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default SupperTeacherProfileModal;
