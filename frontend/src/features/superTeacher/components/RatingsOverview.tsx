import React, { useEffect, useState } from 'react';
import { fetchRatingsOverview } from '../services/superTeacherApi';
import type { RatingsOverviewData, RatingsTeacherCard } from '../types';
import './RatingsOverview.scss';

import { defaultTeacherAvatar } from '../../../shared/utils/avatarUtils';
const DEFAULT_AVATAR = defaultTeacherAvatar;

const TeacherCard: React.FC<{ teacher: RatingsTeacherCard }> = ({ teacher }) => {
  const latestReview = teacher.recentReviews[0] ?? null;
  const totalStudents = teacher.activeStudents + teacher.completedStudents;

  return (
    <div className="ro__card">
      <div className="ro__card-top">
        <div className="ro__card-left">
          <img
            className="ro__card-avatar"
            src={teacher.avatarUrl || DEFAULT_AVATAR}
            alt={teacher.username}
            onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
          <div>
            <h4 className="ro__card-name">{teacher.username}</h4>
            <p className="ro__card-role">{teacher.licenseTypes ? `Hạng ${teacher.licenseTypes}` : 'Trợ giảng'}</p>
          </div>
        </div>
        <div className="ro__card-pill">
          <span className="ro__card-pill-val">{teacher.avgStars}</span>
          <span className="material-symbols-outlined ro__card-pill-star">star</span>
        </div>
      </div>

      <div className="ro__card-meta">
        <span className="ro__card-meta-label">Tổng số học sinh</span>
        <span className="ro__card-meta-val">{totalStudents}</span>
      </div>

      {latestReview?.comment && (
        <div className="ro__card-quote">
          <p className="ro__card-quote-text">"{latestReview.comment}"</p>
          <span className="ro__card-quote-tag">— Đánh giá mới nhất</span>
        </div>
      )}
    </div>
  );
};

const RatingsOverview: React.FC = () => {
  const [data, setData] = useState<RatingsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingsOverview()
      .then(res => { if (res.EC === 0) setData(res.DT); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const teachers = data?.teachers ?? [];

  // Compute completion percentage
  const completionParts = data?.completedRatio.split('/') ?? ['0', '0'];
  const completed = parseInt(completionParts[0]);
  const total = parseInt(completionParts[1]);
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Find best teacher for AI insight
  const bestTeacher = teachers.length > 0
    ? [...teachers].sort((a, b) => parseFloat(b.avgStars) - parseFloat(a.avgStars))[0]
    : null;

  // Find teacher needing improvement
  const weakTeacher = teachers.length > 1
    ? [...teachers].sort((a, b) => parseFloat(a.avgStars) - parseFloat(b.avgStars))[0]
    : null;

  return (
    <div className="ro">
      {/* Header */}
      <div className="ro__header">
        <h1 className="ro__title">Tổng quan Đánh giá</h1>
        <p className="ro__subtitle">Theo dõi hiệu suất giảng dạy và phản hồi từ học sinh trên toàn hệ thống.</p>
      </div>

      {loading && <p className="ro__loading">Đang tải dữ liệu...</p>}

      {!loading && data && (
        <>
          {/* ── Stat cards (bento) ─────────────────────────────────────── */}
          <div className="ro__stats">
            <div className="ro__stat">
              <div className="ro__stat-head">
                <div className="ro__stat-icon ro__stat-icon--star">
                  <span className="material-symbols-outlined">star</span>
                </div>
                <span className="ro__stat-tag">Trung bình Sao</span>
              </div>
              <div className="ro__stat-body">
                <span className="ro__stat-big">{data.avgStars}</span>
                <span className="ro__stat-sub">/ 5.0</span>
              </div>
              <div className="ro__stat-trend ro__stat-trend--up">
                <span className="material-symbols-outlined">trending_up</span>
                <span>+0.2 tháng này</span>
              </div>
            </div>

            <div className="ro__stat">
              <div className="ro__stat-head">
                <div className="ro__stat-icon ro__stat-icon--review">
                  <span className="material-symbols-outlined">forum</span>
                </div>
                <span className="ro__stat-tag">Tổng Đánh giá</span>
              </div>
              <div className="ro__stat-body">
                <span className="ro__stat-big">{data.totalReviews.toLocaleString()}</span>
              </div>
              <p className="ro__stat-note">Tăng 12% so với kỳ trước</p>
            </div>

            <div className="ro__stat">
              <div className="ro__stat-head">
                <div className="ro__stat-icon ro__stat-icon--done">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <span className="ro__stat-tag">Hoàn thành</span>
              </div>
              <div className="ro__stat-body">
                <span className="ro__stat-big">{completionPct}%</span>
              </div>
              <div className="ro__stat-bar">
                <div className="ro__stat-bar-fill" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>

          {/* ── Teacher performance grid ───────────────────────────────── */}
          <div className="ro__section-head">
            <h3 className="ro__section-title">Hiệu suất Trợ giảng</h3>
            <button className="ro__section-link" type="button">Xem tất cả</button>
          </div>

          <div className="ro__grid">
            {teachers.map(t => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
            {teachers.length === 0 && (
              <p className="ro__empty">Chưa có dữ liệu trợ giảng.</p>
            )}
          </div>

          {/* ── AI Insights glass card ─────────────────────────────────── */}
          <section className="ro__ai">
            <div className="ro__ai-label">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h3>AI Insights – Phân tích Thông minh</h3>
            </div>
            <div className="ro__ai-glass">
              <div className="ro__ai-left">
                <span className="ro__ai-date">
                  {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
                <h4 className="ro__ai-heading">
                  Điểm sáng hiệu suất:<br />Kỹ năng tương tác cá nhân
                </h4>
                <p className="ro__ai-desc">
                  Dựa trên {data.totalReviews}+ phản hồi gần nhất, AI nhận thấy xu hướng tăng 15% trong mức độ hài lòng
                  về "Khả năng giải đáp thắc mắc riêng". Đây là thế mạnh cạnh tranh chính của đội ngũ hiện tại.
                </p>
                <div className="ro__ai-chips">
                  <div className="ro__ai-chip">
                    <span className="material-symbols-outlined ro__ai-chip-icon--up">trending_up</span>
                    <span>Tăng trưởng top-performer</span>
                  </div>
                  <div className="ro__ai-chip">
                    <span className="material-symbols-outlined ro__ai-chip-icon--warn">priority_high</span>
                    <span>Cần cải thiện tốc độ hồi âm</span>
                  </div>
                </div>
              </div>
              <div className="ro__ai-right">
                <h5 className="ro__ai-right-tag">Khuyến nghị từ AI</h5>
                <ul className="ro__ai-tips">
                  {bestTeacher && (
                    <li className="ro__ai-tip">
                      <span className="material-symbols-outlined">lightbulb</span>
                      <p>
                        Khen thưởng <strong>{bestTeacher.username}</strong> vì duy trì tỷ lệ {bestTeacher.avgStars} sao
                        tuyệt đối. Đề xuất nâng hạng mentor.
                      </p>
                    </li>
                  )}
                  {weakTeacher && weakTeacher.id !== bestTeacher?.id && (
                    <li className="ro__ai-tip">
                      <span className="material-symbols-outlined">lightbulb</span>
                      <p>
                        Triển khai buổi Workshop chia sẻ kỹ năng cho <strong>{weakTeacher.username}</strong> để cải
                        thiện chất lượng phản hồi.
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RatingsOverview;
