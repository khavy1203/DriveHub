import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewApi, RankItem, ReviewSetItem } from '../services/reviewApi';
import './ReviewPage.scss';

const RANK_ICON_MAP: Record<string, string> = {
  A1: 'moped',
  A2: 'two_wheeler',
  B1: 'drive_eta',
  B2: 'directions_car',
  C:  'local_shipping',
  D:  'airport_shuttle',
  E:  'directions_bus',
  F:  'rv_hookup',
};

const GUIDE_STEPS = [
  { icon: 'menu_book',    title: 'Học lý thuyết', description: 'Nắm vững kiến thức cơ bản về luật giao thông.' },
  { icon: 'traffic',      title: 'Biển báo',      description: 'Ghi nhớ ý nghĩa các loại biển báo đường bộ.' },
  { icon: 'quiz',         title: 'Luyện đề',      description: 'Thực hành với bộ đề thi sát hạch chuẩn.' },
  { icon: 'emoji_events', title: 'Thi thử',       description: 'Thử sức với bài thi như thực tế để tự tin.' },
];

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB1wdIIlRCvW9tYEhBaF7CveL228znsJYaHhVwFue2iehwYNTa9Vw6z1A1E5UADz0W53TGk6J59ACkFVSILvAoWF3AiAIwlCf8puFp_2Z75R0rv8CItl87QMlFXR0e7SDqmkLa3X0sJfh79geVSsZxP04xiKeRqC8foXUt0Aw3qygYFShj37iEqr083haJ-Tap_FfdUZBNiDq7cDS-Tdpz-RHrEYalEmNZHuvAY8cUIuXE9DkhGoeYd0spx5U5tvAo0XeUNBKuzvg';

const INITIAL_VISIBLE_COUNT = 10;

const getSetProgress = (setId: number): { pct: number; correct: number; total: number } => {
  try {
    const saved = localStorage.getItem(`review_progress_${setId}`);
    if (!saved) return { pct: 0, correct: 0, total: 0 };
    const { correctCount = 0, totalQuestions = 0, progressPercent = 0 } = JSON.parse(saved);
    return { pct: progressPercent, correct: correctCount, total: totalQuestions };
  } catch {
    return { pct: 0, correct: 0, total: 0 };
  }
};

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [selectedRank, setSelectedRank] = useState<RankItem | null>(null);
  const [reviewSets, setReviewSets] = useState<ReviewSetItem[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Load ranks on mount
  useEffect(() => {
    reviewApi.getRanks().then((res) => {
      if (res.EC === 0 && res.DT?.length) {
        setRanks(res.DT);
        setSelectedRank(res.DT[0]);
      }
    });
  }, []);

  // Load review sets when rank changes
  useEffect(() => {
    if (!selectedRank) return;
    setSetsLoading(true);
    setReviewSets([]);
    setShowAll(false);

    reviewApi.getReviewSetsByRank(selectedRank.id).then((res) => {
      if (res.EC === 0 && res.DT) {
        setReviewSets(res.DT);
      }
    }).finally(() => setSetsLoading(false));
  }, [selectedRank]);

  const visibleSets = useMemo(
    () => (showAll ? reviewSets : reviewSets.slice(0, INITIAL_VISIBLE_COUNT)),
    [showAll, reviewSets],
  );

  const handleRankSelect = (rank: RankItem) => setSelectedRank(rank);

  return (
    <div className="review-page">
      {/* Hero */}
      <section className="review-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="review-hero__overlay" />
        <div className="review-hero__content">
          <h1 className="review-hero__title">Luyện thi bằng lái xe</h1>
          <p className="review-hero__description">
            Hệ thống ôn luyện toàn diện theo bộ câu hỏi mới nhất từ Cục Đường Bộ Việt Nam.
          </p>
          <button className="review-hero__cta" onClick={() => navigate('/teststudent')}>
            Bắt đầu thi thử
          </button>
        </div>
      </section>

      {/* License Categories */}
      <section className="review-section">
        <div className="review-section__header">
          <h2 className="review-section__title">Loại giấy phép lái xe</h2>
          <p className="review-section__subtitle">
            Chọn hạng giấy phép bạn đang theo học để xem bộ đề phù hợp
          </p>
        </div>
        <div className="review-category-grid">
          {ranks.map((rank) => (
            <button
              key={rank.id}
              className={`review-category-btn${selectedRank?.id === rank.id ? ' active' : ''}`}
              onClick={() => handleRankSelect(rank)}
            >
              <i className="material-icons">{RANK_ICON_MAP[rank.name] ?? 'badge'}</i>
              <span className="review-category-btn__label">{rank.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Review Sets */}
      <section className="review-sets-section">
        <div className="review-section">
          <div className="review-sets-header">
            <span className="review-sets-header__accent" />
            <h2 className="review-sets-header__title">
              Bộ đề ôn tập{selectedRank ? ` — Hạng ${selectedRank.name}` : ''}
            </h2>
          </div>

          {setsLoading ? (
            <div className="review-sets-loading">
              <span className="material-icons review-sets-loading__icon">sync</span>
              <span>Đang tải bộ đề...</span>
            </div>
          ) : reviewSets.length === 0 ? (
            <div className="review-sets-empty">
              <span className="material-icons">folder_off</span>
              <p>Chưa có bộ đề ôn tập cho hạng này.</p>
              <p className="review-sets-empty__hint">
                Vào Dashboard → Quản lý ôn tập để tạo bộ đề.
              </p>
            </div>
          ) : (
            <>
              <div className="review-sets-grid">
                {visibleSets.map((set) => {
                  const progress = getSetProgress(set.id);
                  return (
                    <div
                      key={set.id}
                      className="review-set-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/review/chill/${set.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/review/chill/${set.id}`)}
                    >
                      <div className="review-set-card__top">
                        <span className="review-set-card__label">
                          Bộ ôn tập {String(set.setIndex).padStart(2, '0')}
                        </span>
                        <i className="material-icons review-set-card__arrow">arrow_forward</i>
                      </div>
                      <div className="review-set-card__info">
                        <span className="review-set-card__attempts">
                          {set.totalQuestions} câu hỏi
                        </span>
                        <span className={`review-set-card__score${progress.pct === 0 ? ' empty' : progress.pct === 100 ? ' done' : ''}`}>
                          {progress.pct === 0 ? 'Chưa làm' : `${progress.correct}/${progress.total} đúng`}
                        </span>
                      </div>
                      <div className="review-set-card__progress-track">
                        <div
                          className={`review-set-card__progress-fill${progress.pct === 100 ? ' done' : ''}`}
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {!showAll && reviewSets.length > INITIAL_VISIBLE_COUNT && (
                <div className="review-sets-show-more">
                  <button
                    className="review-sets-show-more__btn"
                    onClick={() => setShowAll(true)}
                  >
                    Xem thêm tất cả {reviewSets.length} bộ đề
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Guide */}
      <section className="review-section review-guide">
        <h2 className="review-guide__title">Hướng dẫn ôn tập</h2>
        <div className="review-guide-grid">
          <div className="review-guide-connector" />
          {GUIDE_STEPS.map((step, index) => (
            <div key={index} className="review-guide-step">
              <div className="review-guide-step__icon-wrap">
                <i className="material-icons">{step.icon}</i>
              </div>
              <h3 className="review-guide-step__title">{step.title}</h3>
              <p className="review-guide-step__description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReviewPage;
