import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reviewApi, ReviewQuestion, ReviewSetDetail } from '../services/reviewApi';
import './ReviewChillPage.scss';

type AnswerMap = Record<number, number>; // questionIndex → chosen option (1-based)
type OptionVariant = 'idle' | 'correct' | 'wrong';

const OPTION_LABELS = ['1', '2', '3', '4', '5'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadQuestionImage = (number: number | undefined): string | null => {
  if (!number) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`../../../assets/600question_2025/${number}.jpg`) as string;
  } catch {
    return null;
  }
};

const ReviewChillPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  const [reviewSet, setReviewSet] = useState<ReviewSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!setId) return;
    const saved = localStorage.getItem(`review_progress_${setId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers ?? parsed);
      } catch { /* ignore */ }
    }
  }, [setId]);

  useEffect(() => {
    if (!setId) return;
    setLoading(true);
    reviewApi
      .getReviewSetQuestions(Number(setId))
      .then((res) => {
        if (res.EC === 0 && res.DT) {
          setReviewSet(res.DT as ReviewSetDetail);
        }
      })
      .finally(() => setLoading(false));
  }, [setId]);

  const questions: ReviewQuestion[] = useMemo(() => reviewSet?.questions ?? [], [reviewSet]);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isAnswered = answers[currentIndex] !== undefined;

  const correctCount = useMemo(
    () => questions.filter((q, i) => answers[i] === q.answer).length,
    [questions, answers],
  );
  useEffect(() => {
    if (!setId || totalQuestions === 0) return;
    const progressPercent = Math.round((correctCount / totalQuestions) * 100);
    localStorage.setItem(
      `review_progress_${setId}`,
      JSON.stringify({ answers, correctCount, totalQuestions, progressPercent }),
    );
  }, [answers, setId, correctCount, totalQuestions]);

  const getOptionVariant = useCallback(
    (opt: number): OptionVariant => {
      const selected = answers[currentIndex];
      if (selected === undefined) return 'idle';
      if (opt === currentQuestion?.answer) return 'correct';
      if (opt === selected) return 'wrong';
      return 'idle';
    },
    [answers, currentIndex, currentQuestion],
  );

  const handleSelectOption = useCallback(
    (opt: number) => {
      if (answers[currentIndex] !== undefined) return;
      setAnswers((prev) => ({ ...prev, [currentIndex]: opt }));
    },
    [answers, currentIndex],
  );

  const handleNavigate = useCallback((index: number) => {
    setCurrentIndex(index);
    setImgFailed(false);
  }, []);

  // Keyboard: 1-5 select option, ArrowUp/ArrowLeft prev question, ArrowDown/ArrowRight next question
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const optNum = parseInt(e.key);
      if (!isNaN(optNum) && optNum >= 1 && optNum <= 5) {
        handleSelectOption(optNum);
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next < totalQuestions) { setImgFailed(false); return next; }
          return prev;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => {
          const next = prev - 1;
          if (next >= 0) { setImgFailed(false); return next; }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectOption, totalQuestions]);

  const getNavBtnState = (index: number): 'active' | 'correct' | 'wrong' | 'idle' => {
    if (index === currentIndex) return 'active';
    const chosen = answers[index];
    if (chosen === undefined) return 'idle';
    return chosen === questions[index]?.answer ? 'correct' : 'wrong';
  };

  if (loading) {
    return (
      <div className="chill-state">
        <span className="material-icons chill-state__icon chill-state__icon--spin">sync</span>
        <p className="chill-state__text">Đang tải bộ đề...</p>
      </div>
    );
  }

  if (!reviewSet || !questions.length) {
    return (
      <div className="chill-state">
        <span className="material-icons chill-state__icon">folder_off</span>
        <p className="chill-state__text">Không tìm thấy bộ đề ôn tập.</p>
        <button className="chill-state__back" onClick={() => navigate('/review')}>
          Quay lại trang ôn tập
        </button>
      </div>
    );
  }

  const imageSrc = loadQuestionImage(currentQuestion?.number);
  const isCorrect = isAnswered && answers[currentIndex] === currentQuestion?.answer;
  const showHints = isAnswered && !isCorrect;
  const tip    = showHints ? currentQuestion?.tip    : null;
  const reason = showHints ? currentQuestion?.reason : null;

  return (
    <div className="chill-page">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="chill-topbar">
        <div className="chill-topbar__inner">
          <div className="chill-topbar__left">
            <button
              className="chill-topbar__back"
              onClick={() => navigate('/review')}
              aria-label="Quay lại"
            >
              <span className="material-icons">arrow_back</span>
            </button>
            <div className="chill-topbar__title-group">
              <span className="chill-topbar__brand">
                Ôn tập — Hạng {reviewSet.rank?.name}
              </span>
              <h1 className="chill-topbar__title">{reviewSet.name}</h1>
            </div>
          </div>
          <div className="chill-topbar__right">
            <div className="chill-topbar__chip">
              <span className="material-icons">task_alt</span>
              <span>{correctCount}/{totalQuestions} đúng</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      <main className="chill-layout">
        {/* Question panel */}
        <div className="chill-main">
          <div className="chill-question-card">
            <div className="chill-question-card__meta">
              <span className="chill-question-card__counter">
                Câu {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="chill-question-card__num">#{currentQuestion?.number}</span>
            </div>

            <div className="chill-question-card__image-wrap">
              {/* Mobile nav arrows — overlaid on image sides */}
              <button
                className="chill-img-nav chill-img-nav--prev"
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                aria-label="Câu trước"
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <button
                className="chill-img-nav chill-img-nav--next"
                onClick={() => handleNavigate(currentIndex + 1)}
                disabled={currentIndex === totalQuestions - 1}
                aria-label="Câu kế tiếp"
              >
                <span className="material-icons">chevron_right</span>
              </button>

              {imageSrc && !imgFailed ? (
                <img
                  src={imageSrc}
                  alt={`Câu hỏi ${currentQuestion?.number}`}
                  className="chill-question-card__image"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="chill-question-card__no-image">
                  <span className="material-icons">image_not_supported</span>
                  <p>Câu {currentQuestion?.number}</p>
                </div>
              )}
            </div>

            <div className="chill-options">
              {Array.from({ length: currentQuestion?.totalOptions || 4 }, (_, i) => {
                const opt = i + 1;
                const variant = getOptionVariant(opt);
                return (
                  <button
                    key={opt}
                    className={`chill-option chill-option--${variant}`}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAnswered}
                  >
                    <span className="chill-option__badge">{OPTION_LABELS[i]}</span>
                    <span className="chill-option__label">Đáp án {OPTION_LABELS[i]}</span>
                    {variant === 'correct' && (
                      <span className="material-icons chill-option__result-icon">check_circle</span>
                    )}
                    {variant === 'wrong' && (
                      <span className="material-icons chill-option__result-icon">cancel</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {isAnswered && (
              <div className={`chill-feedback chill-feedback--${isCorrect ? 'correct' : 'wrong'}`}>
                <span className="material-icons">
                  {isCorrect ? 'check_circle' : 'highlight_off'}
                </span>
                <span>
                  {isCorrect
                    ? 'Chính xác!'
                    : `Sai — Đáp án đúng là ${OPTION_LABELS[(currentQuestion?.answer ?? 1) - 1]}`}
                </span>
              </div>
            )}

            {/* Tip + Reason — shown only when wrong */}
            {(tip || reason) && (
              <div className="chill-hints">
                {tip && (
                  <div className="chill-tip">
                    <div className="chill-tip__header">
                      <span className="material-icons">lightbulb</span>
                      <span>Mẹo nhớ nhanh</span>
                    </div>
                    <p className="chill-tip__body">{tip}</p>
                  </div>
                )}
                {reason && (
                  <div className="chill-reason">
                    <div className="chill-reason__header">
                      <span className="material-icons">gavel</span>
                      <span>Lý do / Luật</span>
                    </div>
                    <p className="chill-reason__body">{reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="chill-nav">
            <button
              className="chill-nav__btn chill-nav__btn--prev"
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <span className="material-icons">arrow_back</span>
              <span className="chill-nav__label">Câu trước</span>
            </button>
            <button
              className="chill-nav__btn chill-nav__btn--next"
              onClick={() => handleNavigate(currentIndex + 1)}
              disabled={currentIndex === totalQuestions - 1}
            >
              <span className="chill-nav__label">Câu kế tiếp</span>
              <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="chill-sidebar">
          <div className="chill-sidebar__card">
            <div className="chill-sidebar__header">
              <h3 className="chill-sidebar__title">Danh sách câu hỏi</h3>
              <div className="chill-sidebar__legend">
                <div className="chill-sidebar__legend-item">
                  <span className="chill-sidebar__legend-dot chill-sidebar__legend-dot--active" />
                  Đang xem
                </div>
                <div className="chill-sidebar__legend-item">
                  <span className="chill-sidebar__legend-dot chill-sidebar__legend-dot--correct" />
                  Đúng
                </div>
                <div className="chill-sidebar__legend-item">
                  <span className="chill-sidebar__legend-dot chill-sidebar__legend-dot--wrong" />
                  Sai
                </div>
              </div>
            </div>

            <div className="chill-sidebar__grid">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`chill-sidebar__btn chill-sidebar__btn--${getNavBtnState(index)}`}
                  onClick={() => handleNavigate(index)}
                >
                  {String(index + 1).padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="chill-sidebar__note">
              <span className="material-icons">info</span>
              <p>Chọn sai sẽ hiện mẹo ghi nhớ — không giới hạn thời gian.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ReviewChillPage;
