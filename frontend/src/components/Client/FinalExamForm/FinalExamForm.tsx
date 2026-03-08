import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../../../shared/hooks";
import { ApiResponse } from "../../../core/types";
import { Student, Test, Question } from "../../../features/student/types";
import { Subject } from "../../../features/exam/types";

// Type alias for backward compatibility
type ThiSinh = Student;
import ResultModal from '../ResultModal/ResultModal';
import { toast } from 'react-toastify';
import './FinalExamForm.css';

// ─── Hook: detect screen size ──────────────────────────────
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);
  return { isMobile };
};

// ─── Mobile keyboard component ─────────────────────────────
interface MobileKeyboardProps {
  currentQuestion: number;
  totalQuestions: number;
  selectedOptions: number[];
  disabled: boolean;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onSelectOption: (opt: number) => void;
}

const MobileKeyboard: React.FC<MobileKeyboardProps> = ({
  currentQuestion, totalQuestions, selectedOptions,
  disabled, onNavigateUp, onNavigateDown, onSelectOption,
}) => {
  const navKey = (label: React.ReactNode, onClick: () => void, extra?: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mk-key mk-nav ${extra || ''}`}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {label}
    </button>
  );

  const ansKey = (opt: number) => {
    const selected = selectedOptions.includes(opt);
    return (
      <button
        key={opt}
        type="button"
        disabled={disabled}
        onClick={() => onSelectOption(opt)}
        className={`mk-key mk-ans ${selected ? 'mk-ans--on' : ''}`}
        aria-pressed={selected}
      >
        {opt}
      </button>
    );
  };

  return (
    <div className="mobile-keyboard" aria-label="Bàn phím điều khiển">
      {/* Left: navigation */}
      <div className="mk-left">
        <div className="mk-counter">{currentQuestion + 1}/{totalQuestions}</div>
        {navKey(
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M5 15l7-7 7 7"/>
          </svg>,
          onNavigateUp, 'mk-nav--up'
        )}
        {navKey(
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M19 9l-7 7-7-7"/>
          </svg>,
          onNavigateDown, 'mk-nav--dn'
        )}
      </div>

      {/* Divider */}
      <div className="mk-divider" />

      {/* Right: answer options */}
      <div className="mk-right">
        {[1, 2, 3, 4].map(ansKey)}
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────
const FinalExamForm: React.FC = () => {
  const { get, post } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { IDThiSinh, IDSubject } = location.state as { IDThiSinh: number; IDSubject: number };
  const { isMobile } = useScreenSize();

  const [studentNow, setStudentNow]       = useState<ThiSinh | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[][]>([]);
  const [subject, setSubject]             = useState<Partial<Subject> | null>(null);
  const [arrQuestion, setArrQuestion]     = useState<any[]>([]);
  const [showResult, setShowResult]       = useState(false);
  const [score, setScore]                 = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showAnswers, setShowAnswers]     = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeOut, setTimeOut]             = useState(false);
  const [testRandom, setTestRandom]       = useState<number | null>(null);
  const [testCode, setTestCode]           = useState<string | null>(null);
  const [nextSubjectName, setNextSubjectName] = useState<string | null>(null);
  const [untestedSubjects, setUntestedSubjects] = useState<Subject[]>([]);
  const [showSidebar, setShowSidebar]     = useState(false);

  // ── Init exam ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await get<ApiResponse<Student[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
        if (!res.DT?.length) { toast.error("Không tìm thấy thí sinh."); navigate('/testStudent'); return; }

        const student: ThiSinh = res.DT[0];
        setStudentNow(student);

        const doneIds = student?.exams?.map(e => Number(e.IDSubject)) || [];
        const notTested: Subject[] = student?.rank?.subjects?.filter((s: any) => !doneIds.includes(s.id)) || [];

        if (!notTested.length) {
          toast.success("Đã hoàn thành tất cả bài thi!");
          await post(`/api/students/update-processtest`, { IDThiSinh, processtest: 3 });
          navigate('/testStudent'); return;
        }

        const subjectId = notTested.some(e => e.id === IDSubject) ? IDSubject : notTested[0].id;
        setUntestedSubjects(notTested.filter(e => e.id !== subjectId));
        await setupExam(subjectId);
        await post(`/api/students/update-processtest`, { IDThiSinh, processtest: 2 });
      } catch (err) {
        console.error(err);
        toast.error("Không thể khởi tạo bài thi.");
        navigate('/testStudent');
      }
    };
    init();
  }, [IDThiSinh]);

  const setupExam = async (subjectId: number) => {
    try {
      const r1 = await get<ApiResponse<Test[]>>(`/api/subject/get-test/${subjectId}`);
      if (!r1.DT?.length) { toast.error("Chưa có dữ liệu bài kiểm tra."); navigate('/testStudent'); return; }

      const rndId = r1.DT[Math.floor(Math.random() * r1.DT.length)].id;
      const r2 = await get<ApiResponse<Test[]>>(`/api/test/get-test/${rndId}`);
      if (!r2?.DT?.[0]) { toast.error("Không thể tải bài thi."); navigate('/testStudent'); return; }

      const varSubject   = r2.DT[0].subject;
      const varQuestions = r2.DT[0].questions;
      if (!varSubject || !varQuestions?.length) { toast.error("Dữ liệu bài thi không hợp lệ."); navigate('/testStudent'); return; }

      const qs = varQuestions.map((q: Question) => ({ ...q, options: ['', '', '', ''] }));
      setSubject(varSubject);
      setArrQuestion(qs);
      setSelectedOptions(new Array(qs.length).fill([]));
      setTimeRemaining((varSubject as any).timeFinish * 60);
      setTestRandom(rndId);
      setTestCode(r2.DT[0].code);
      setCurrentQuestion(0);
      setIsExamFinished(false);
      setTimeOut(false);
      setShowResult(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể thiết lập bài thi.");
      navigate('/testStudent');
    }
  };

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (isExamFinished) return;
    const id = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { clearInterval(id); setTimeOut(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isExamFinished]);

  useEffect(() => {
    if (timeOut && !isExamFinished) { setIsExamFinished(true); handleEndExam(); }
  }, [timeOut]);

  // ── Helpers ───────────────────────────────────────────────
  const toggleOption = useCallback((qIdx: number, optIdx: number) => {
    setSelectedOptions(prev => {
      const next = [...prev];
      const cur  = next[qIdx] || [];
      next[qIdx] = cur.includes(optIdx) ? cur.filter(o => o !== optIdx) : [...cur, optIdx];
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    setCurrentQuestion(q => (q - 1 + arrQuestion.length) % arrQuestion.length);
  }, [arrQuestion.length]);

  const goNext = useCallback(() => {
    setCurrentQuestion(q => (q + 1) % arrQuestion.length);
  }, [arrQuestion.length]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isExamFinished) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) toggleOption(currentQuestion, n);
      if (e.key === 'ArrowUp')   { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [currentQuestion, isExamFinished, toggleOption, goPrev, goNext]);

  const formatTime = useCallback((s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`, []);

  const arraysEqual = useCallback((a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort((x,y)=>x-y), sb = [...b].sort((x,y)=>x-y);
    return sa.every((v,i) => v === sb[i]);
  }, []);

  const toNums = useCallback((arr: string[]) =>
    arr.map(x => { const n = Number(x); return isNaN(n) ? 0 : n; }), []);

  // ── End / finish exam ─────────────────────────────────────
  const handleEndExam = async () => {
    if (!isExamFinished) {
      setIsExamFinished(true);
      setTimeRemaining(0);
      try { await handleFinishExam(); }
      catch (err) { console.error(err); toast.error("Có lỗi khi kết thúc bài thi."); }
    }
  };

  const handleFinishExam = async () => {
    if (!subject) return;
    let calcScore = 0;
    const answerList: string[] = [];
    arrQuestion.forEach((q, i) => {
      if (arraysEqual(selectedOptions[i] || [], toNums(q?.answer?.toString()?.split(',') || []))) calcScore++;
      answerList.push((selectedOptions[i] || []).join('-'));
    });

    const res = await post<ApiResponse>("/api/exam/create-exam", {
      IDThisinh: IDThiSinh, IDTest: testRandom,
      answerlist: answerList.join(','), point: calcScore,
      result: calcScore < ((subject as any).threshold ?? 0) ? "TRƯỢT" : "ĐẠT",
      IDSubject: subject?.id,
    });
    if (res.EC === 0) toast.success(res.EM);
    else if (res.EC === 1) toast.warn(res.EM);
    else toast.error(res.EM);

    const r2 = await get<ApiResponse<Student[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
    const updated: ThiSinh = r2.DT[0];
    const doneIds = updated?.exams?.map(e => Number(e.IDSubject)) || [];
    const remaining: Subject[] = updated?.rank?.subjects?.filter((s: any) => !doneIds.includes(s.id)) || [];
    await post(`/api/students/update-processtest`, { IDThiSinh, processtest: remaining.length ? 1 : 3 });
    setUntestedSubjects(remaining);
    setNextSubjectName(remaining[0]?.name || null);
    setScore(calcScore);
    setShowResult(true);
  };

  const handleNextExam = async () => {
    try {
      if (!untestedSubjects.length) {
        await post(`/api/students/update-processtest`, { IDThiSinh, processtest: 3 });
        navigate('/testStudent'); return;
      }
      const next = untestedSubjects[0].id;
      setUntestedSubjects(p => p.filter(s => s.id !== next));
      setNextSubjectName(untestedSubjects[1]?.name || null);
      await setupExam(next);
      await post(`/api/students/update-processtest`, { IDThiSinh, processtest: 2 });
    } catch (err) {
      console.error(err); navigate('/testStudent');
    }
  };

  const getQuestionImage = useCallback((number?: number) => {
    if (!number) return null;
    try { return require(`../../../assets/600question_2025/${number}.jpg`); }
    catch { return null; }
  }, []);

  const currentImg = useMemo(() => getQuestionImage(arrQuestion[currentQuestion]?.number),
    [arrQuestion, currentQuestion, getQuestionImage]);

  const answeredCount = useMemo(() =>
    selectedOptions.filter(o => o?.length > 0).length, [selectedOptions]);

  const timeClass = timeRemaining < 60 ? 'time--critical' : timeRemaining < 300 ? 'time--warn' : 'time--ok';

  if (!studentNow || !arrQuestion.length || !subject) {
    return (
      <div className="fe-loading">
        <div className="fe-spinner" />
        <p>Đang tải bài thi...</p>
      </div>
    );
  }

  // ── MOBILE layout ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fe-mobile">
        {/* Header */}
        <header className="fe-mob-header">
          <div className={`fe-mob-timer ${timeClass}`}>{formatTime(timeRemaining)}</div>
          <div className="fe-mob-progress">
            <span>{answeredCount}/{arrQuestion.length}</span>
            <div className="fe-mob-bar">
              <div className="fe-mob-bar-fill" style={{ width: `${(answeredCount/arrQuestion.length)*100}%` }} />
            </div>
          </div>
          <button className="fe-mob-menu" onClick={() => setShowSidebar(true)} aria-label="Xem danh sách câu hỏi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </header>

        {/* Subject info */}
        <div className="fe-mob-subj">
          <span>{subject?.name}</span>
          <span className="fe-mob-subj-sep">|</span>
          <span>Mã đề: {testCode}</span>
          <span className="fe-mob-subj-sep">|</span>
          <span>Câu {currentQuestion + 1}</span>
        </div>

        {/* Question image */}
        <main className="fe-mob-question">
          {currentImg
            ? <img src={currentImg} alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`} />
            : <div className="fe-mob-noimg">Không tìm thấy ảnh câu hỏi {arrQuestion[currentQuestion]?.number}</div>
          }
        </main>

        {/* Mobile keyboard */}
        <MobileKeyboard
          currentQuestion={currentQuestion}
          totalQuestions={arrQuestion.length}
          selectedOptions={selectedOptions[currentQuestion] || []}
          disabled={isExamFinished}
          onNavigateUp={goPrev}
          onNavigateDown={goNext}
          onSelectOption={opt => toggleOption(currentQuestion, opt)}
        />

        {/* End button */}
        <div className="fe-mob-footer">
          <button className="fe-mob-end" onClick={handleEndExam} disabled={isExamFinished}>
            🏁 KẾT THÚC BÀI THI
          </button>
        </div>

        {/* Sidebar overlay */}
        {showSidebar && (
          <div className="fe-mob-overlay" onClick={() => setShowSidebar(false)}>
            <div className="fe-mob-sidebar" onClick={e => e.stopPropagation()}>
              <div className="fe-mob-sidebar-head">
                <span>Danh sách câu hỏi</span>
                <button onClick={() => setShowSidebar(false)}>✕</button>
              </div>
              <div className="fe-mob-sidebar-grid">
                {arrQuestion.map((_, i) => (
                  <button
                    key={i}
                    className={`fe-mob-qbtn ${selectedOptions[i]?.length ? 'fe-mob-qbtn--done' : ''} ${i === currentQuestion ? 'fe-mob-qbtn--cur' : ''}`}
                    onClick={() => { setCurrentQuestion(i); setShowSidebar(false); }}
                  >{i + 1}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result modal */}
        {showResult && (
          <ResultModal
            score={score} totalQuestions={arrQuestion.length}
            correctAnswers={score} incorrectAnswers={arrQuestion.length - score}
            resultStatus={score < ((subject as any)?.threshold ?? 0) ? "TRƯỢT" : "ĐẠT"}
            studentInfo={{
              studentID: studentNow?.khoahoc_thisinh?.SoBaoDanh || 0,
              fullName: studentNow?.HoTen || '', subject: subject?.name || '',
              rank: studentNow?.loaibangthi || '', test: testCode || '',
              CCCD: studentNow?.SoCMT || '', courseID: studentNow?.khoahoc_thisinh?.khoahoc?.IDKhoaHoc || '',
            }}
            onClose={() => setShowResult(false)} onViewAnswers={() => setShowAnswers(true)}
            arrQuestion={arrQuestion} selectedOptions={selectedOptions}
            onNextExam={handleNextExam} nextSubjectName={nextSubjectName}
          />
        )}
      </div>
    );
  }

  // ── DESKTOP layout ────────────────────────────────────────
  return (
    <div className="exam-container">
      {/* Left: question + student info */}
      <div className="left-exam">
        <div className="question-section">
          <div className="qs-badge">Câu {currentQuestion + 1} / {arrQuestion.length}</div>
          {currentImg
            ? <img src={currentImg} alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`} />
            : <div className="qs-noimg">Không tìm thấy ảnh câu hỏi {arrQuestion[currentQuestion]?.number}</div>
          }
        </div>

        <div className="footer">
          <div className="left">
            <img src={'data:image/jpg;base64,' + studentNow?.Anh} className="image-hv" alt="Ảnh thí sinh" />
          </div>
          <div className="middle">
            <h5>Môn thi: {subject?.name} ({testCode})</h5>
            <h5>Số Báo Danh: {studentNow?.khoahoc_thisinh?.SoBaoDanh}</h5>
            <h5>Họ và tên: {studentNow?.HoTen}</h5>
            <h5>Hạng: {studentNow?.loaibangthi}</h5>
            <h5>Số CCCD: {studentNow?.SoCMT}</h5>
          </div>
          <div className="right">
            <img src={require(`../../../assets/logo.jpg`)} className="logo" alt="Logo" />
          </div>
        </div>
      </div>

      {/* Right: sidebar */}
      <div className="right-exam">
        <div className="sidebar-section">
          <div className="top">
            {/* Timer */}
            <div className={`time-remaining ${timeClass}`}>
              <span className="time-label">Thời gian còn lại</span>
              <span className="time-value">
                {timeRemaining === 0 ? 'Hết giờ' : formatTime(timeRemaining)}
              </span>
            </div>

            {/* Progress */}
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${(answeredCount/arrQuestion.length)*100}%` }} />
              <span className="progress-text">{answeredCount}/{arrQuestion.length} câu</span>
            </div>

            {/* Question nav grid */}
            <div className="question-nav-container">
              {Array.from({ length: Math.ceil(arrQuestion.length / 10) }).map((_, colIdx) => (
                <div className="question-nav" key={colIdx}>
                  {arrQuestion.slice(colIdx * 10, colIdx * 10 + 10).map((_, qIdx) => {
                    const gi = colIdx * 10 + qIdx;
                    return (
                      <div
                        key={gi}
                        className={`question-btn ${selectedOptions[gi]?.length ? 'answered' : 'unanswered'} ${currentQuestion === gi ? 'current' : ''}`}
                        onClick={() => setCurrentQuestion(gi)}
                      >
                        <div className="question-number">{gi + 1}</div>
                        <div className="answer-options">
                          {arrQuestion[gi].options.map((_: any, oi: number) => (
                            <div key={oi} className="option-cell">
                              <span>{oi + 1}</span>
                              <input
                                type="checkbox"
                                readOnly
                                checked={selectedOptions[gi]?.includes(oi + 1)}
                                onChange={() => toggleOption(gi, oi + 1)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <button className="end-exam-btn" onClick={handleEndExam} disabled={isExamFinished}>
            🏁 Kết Thúc
          </button>
        </div>
      </div>

      {/* Result modal */}
      {showResult && (
        <ResultModal
          score={score} totalQuestions={arrQuestion.length}
          correctAnswers={score} incorrectAnswers={arrQuestion.length - score}
          resultStatus={score < ((subject as any)?.threshold ?? 0) ? "TRƯỢT" : "ĐẠT"}
          studentInfo={{
            studentID: studentNow?.khoahoc_thisinh?.SoBaoDanh || 0,
            fullName: studentNow?.HoTen || '', subject: subject?.name || '',
            rank: studentNow?.loaibangthi || '', test: testCode || '',
            CCCD: studentNow?.SoCMT || '', courseID: studentNow?.khoahoc_thisinh?.khoahoc?.IDKhoaHoc || '',
          }}
          onClose={() => setShowResult(false)} onViewAnswers={() => setShowAnswers(true)}
          arrQuestion={arrQuestion} selectedOptions={selectedOptions}
          onNextExam={handleNextExam} nextSubjectName={nextSubjectName}
        />
      )}
    </div>
  );
};

export default FinalExamForm;
