import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reviewApi, ReviewQuestion, ReviewSetDetail } from '../services/reviewApi';
import './ReviewChillPage.scss';

type AnswerMap = Record<number, number>; // questionIndex → chosen option (1-based)
type OptionState = 'idle' | 'selected-correct' | 'selected-wrong';

const LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

const parseAnswer = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadImage = (number: number | undefined): string | null => {
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

  // ── Load progress from localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (!setId) return;
    const raw = localStorage.getItem(`review_progress_${setId}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const saved: AnswerMap = parsed?.answers && typeof parsed.answers === 'object'
        ? parsed.answers
        : parsed;
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        setAnswers(saved);
      }
    } catch { /* ignore corrupt cache */ }
  }, [setId]);

  // ── Fetch questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!setId) return;
    setLoading(true);
    reviewApi
      .getReviewSetQuestions(Number(setId))
      .then((res) => { if (res.EC === 0 && res.DT) setReviewSet(res.DT as ReviewSetDetail); })
      .finally(() => setLoading(false));
  }, [setId]);

  const questions: ReviewQuestion[] = useMemo(() => reviewSet?.questions ?? [], [reviewSet]);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // ── Derived answer state for current question ────────────────────────────────
  const selected = answers[currentIndex];           // undefined | number
  const isAnswered = selected !== undefined;
  const correctKey = parseAnswer(currentQuestion?.answer);
  const selectedIsCorrect = isAnswered && correctKey !== null && Number(selected) === correctKey;

  // ── Score counter ────────────────────────────────────────────────────────────
  const correctCount = useMemo(() =>
    questions.reduce((acc, q, i) => {
      const ch = answers[i];
      if (ch === undefined) return acc;
      const ca = parseAnswer(q.answer);
      return acc + (ca !== null && Number(ch) === ca ? 1 : 0);
    }, 0),
  [questions, answers]);

  // ── Persist progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!setId || totalQuestions === 0) return;
    const progressPercent = Math.round((correctCount / totalQuestions) * 100);
    localStorage.setItem(
      `review_progress_${setId}`,
      JSON.stringify({ answers, correctCount, totalQuestions, progressPercent }),
    );
  }, [answers, setId, correctCount, totalQuestions]);

  // ── Option state: only the SELECTED option changes color ─────────────────────
  const getOptionState = useCallback((opt: number): OptionState => {
    if (selected === undefined) return 'idle';
    if (Number(opt) !== Number(selected)) return 'idle';
    return selectedIsCorrect ? 'selected-correct' : 'selected-wrong';
  }, [selected, selectedIsCorrect]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const selectOption = useCallback((opt: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: opt }));
  }, [currentIndex]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentIndex(index);
    setImgFailed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalQuestions]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const maxOpt = currentQuestion?.totalOptions ?? 4;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= maxOpt) { selectOption(n); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(currentIndex + 1); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goTo(currentIndex - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectOption, goTo, currentIndex, currentQuestion?.totalOptions]);

  // ── Sidebar button state ─────────────────────────────────────────────────────
  const navBtnState = (index: number): 'active' | 'correct' | 'wrong' | 'idle' => {
    if (index === currentIndex) return 'active';
    const ch = answers[index];
    if (ch === undefined) return 'idle';
    const ca = parseAnswer(questions[index]?.answer);
    return ca !== null && Number(ch) === ca ? 'correct' : 'wrong';
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="rc-state">
      <span className="material-icons rc-state__icon rc-state__icon--spin">sync</span>
      <p className="rc-state__text">Đang tải bộ đề...</p>
    </div>
  );

  if (!reviewSet || !questions.length) return (
    <div className="rc-state">
      <span className="material-icons rc-state__icon">folder_off</span>
      <p className="rc-state__text">Không tìm thấy bộ đề ôn tập.</p>
      <button className="rc-state__back" onClick={() => navigate('/review')}>Quay lại</button>
    </div>
  );

  const imgSrc = loadImage(currentQuestion?.number);
  const totalOpts = currentQuestion?.totalOptions || 4;
  const wrongReason = !selectedIsCorrect && isAnswered ? currentQuestion?.reason : null;
  const wrongTip    = !selectedIsCorrect && isAnswered ? currentQuestion?.tip    : null;
  const correctLabel = correctKey !== null
    ? LABELS[Math.min(correctKey - 1, LABELS.length - 1)]
    : null;

  return (
    <div className="rc-page">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="rc-topbar">
        <div className="rc-topbar__inner">
          <div className="rc-topbar__left">
            <button className="rc-topbar__back" onClick={() => navigate('/review')} aria-label="Quay lại">
              <span className="material-icons">arrow_back</span>
            </button>
            <div className="rc-topbar__meta">
              <span className="rc-topbar__badge">
                Ôn tập · Hạng {reviewSet.rank?.name}
              </span>
              <h1 className="rc-topbar__title">{reviewSet.name}</h1>
            </div>
          </div>
          <div className="rc-topbar__score">
            <span className="material-icons">task_alt</span>
            <span>{correctCount}/{totalQuestions}</span>
          </div>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <main className="rc-layout">

        {/* Question panel */}
        <div className="rc-panel">
          <div className="rc-card">

            {/* Counter */}
            <div className="rc-card__meta">
              <span className="rc-card__counter">Câu {currentIndex + 1} / {totalQuestions}</span>
              <span className="rc-card__num">#{currentQuestion?.number}</span>
            </div>

            {/* Image */}
            <div className="rc-img-wrap">
              <button className="rc-img-arrow rc-img-arrow--prev" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} aria-label="Câu trước">
                <span className="material-icons">chevron_left</span>
              </button>
              <button className="rc-img-arrow rc-img-arrow--next" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === totalQuestions - 1} aria-label="Câu kế">
                <span className="material-icons">chevron_right</span>
              </button>

              {imgSrc && !imgFailed ? (
                <img src={imgSrc} alt={`Câu ${currentQuestion?.number}`} className="rc-img" onError={() => setImgFailed(true)} />
              ) : (
                <div className="rc-img-empty">
                  <span className="material-icons">image_not_supported</span>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="rc-options">
              {Array.from({ length: totalOpts }, (_, i) => {
                const opt = i + 1;
                const state = getOptionState(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`rc-opt rc-opt--${state}`}
                    onClick={() => selectOption(opt)}
                  >
                    <span className="rc-opt__badge">{LABELS[i]}</span>
                    <span className="rc-opt__label">Đáp án {LABELS[i]}</span>
                    {state === 'selected-correct' && (
                      <span className="material-icons rc-opt__icon">check_circle</span>
                    )}
                    {state === 'selected-wrong' && (
                      <span className="material-icons rc-opt__icon">cancel</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback: correct */}
            {isAnswered && selectedIsCorrect && (
              <div className="rc-feedback rc-feedback--correct">
                <span className="material-icons">check_circle</span>
                <span>Chính xác!</span>
              </div>
            )}

            {/* Feedback: wrong */}
            {isAnswered && !selectedIsCorrect && (
              <div className="rc-feedback rc-feedback--wrong">
                <div className="rc-feedback__header">
                  <span className="material-icons">gavel</span>
                  <span>
                    Chưa đúng —{correctLabel ? ` đáp án đúng là ${correctLabel}` : ''}
                  </span>
                </div>
                {wrongReason ? (
                  <p className="rc-feedback__body">{wrongReason}</p>
                ) : (
                  <p className="rc-feedback__body rc-feedback__body--muted">
                    Chưa có giải thích luật cho câu này. Bạn vẫn có thể chọn lại đáp án khác.
                  </p>
                )}
                {wrongTip && (
                  <div className="rc-feedback__tip">
                    <span className="material-icons">lightbulb</span>
                    <span>{wrongTip}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="rc-nav">
            <button className="rc-nav__btn rc-nav__btn--prev" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              <span className="material-icons">arrow_back</span>
              <span className="rc-nav__label">Câu trước</span>
            </button>
            <button className="rc-nav__btn rc-nav__btn--next" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === totalQuestions - 1}>
              <span className="rc-nav__label">Câu kế tiếp</span>
              <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="rc-sidebar">
          <div className="rc-sidebar__card">
            <h3 className="rc-sidebar__title">Danh sách câu</h3>
            <div className="rc-sidebar__legend">
              <span><span className="rc-sidebar__dot rc-sidebar__dot--active" />Đang xem</span>
              <span><span className="rc-sidebar__dot rc-sidebar__dot--correct" />Đúng</span>
              <span><span className="rc-sidebar__dot rc-sidebar__dot--wrong" />Sai</span>
            </div>
            <div className="rc-sidebar__grid">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`rc-sidebar__btn rc-sidebar__btn--${navBtnState(idx)}`}
                  onClick={() => goTo(idx)}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="rc-sidebar__note">
              <span className="material-icons">info</span>
              <p>Có thể đổi đáp án bất kỳ lúc nào. Không giới hạn thời gian.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ReviewChillPage;
