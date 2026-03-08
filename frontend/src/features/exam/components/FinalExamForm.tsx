import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../../../shared/hooks";
import { ApiResponse } from "../../../core/types";
import { Student, Question } from "../../student/types";
import { Subject } from "../types";
import KeyboardSimulation from './KeyboardSimulation';
import ResultModal from '../../../components/Client/ResultModal/ResultModal';
import { toast } from 'react-toastify';
// import './FinalExamForm.css';

// Type alias for backward compatibility
type ThiSinh = Student;

// Hook to detect orientation and screen size
const useResponsive = () => {
  const [screenInfo, setScreenInfo] = useState({
    isPortrait: window.innerHeight > window.innerWidth,
    isDesktop: window.innerWidth >= 1024,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isMobile: window.innerWidth < 768,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenInfo({
        isPortrait: window.innerHeight > window.innerWidth,
        isDesktop: window.innerWidth >= 1024,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isMobile: window.innerWidth < 768,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenInfo;
};

const FinalExamForm: React.FC = () => {
  const { get, post } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPortrait, isDesktop, isMobile, isTablet } = useResponsive();
  
  const { IDThiSinh, IDSubject } = location.state as { IDThiSinh: number, IDSubject: number };

  // State management
  const [studentNow, setStudentNow] = useState<ThiSinh | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[][]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [arrQuestion, setArrQuestion] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeOut, setTimeOut] = useState(false);
  const [testRandom, setTestRandom] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | null>(null);
  const [nextSubjectName, setNextSubjectName] = useState<string | null>(null);
  const [untestedSubjects, setUntestedSubjects] = useState<Subject[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize exam
  useEffect(() => {
    const initializeExam = async () => {
      try {
        const response = await get<ApiResponse<ThiSinh[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
        const studentData = response.DT as ThiSinh[];
        if (!studentData || studentData.length === 0) {
          toast.error("Không tìm thấy thí sinh.");
          navigate('/testStudent');
          return;
        }

        const student: ThiSinh = studentData[0];
        setStudentNow(student);

        const examSubjectIds = student?.exams?.map(exam => Number(exam.IDSubject)) || [];
        const subjectsNotTested: Subject[] = student?.rank?.subjects?.filter(
          (subject: any) => !examSubjectIds.includes(subject.id)
        ) || [];

        if (subjectsNotTested.length === 0) {
          toast.success("Bạn đã hoàn thành tất cả các bài thi!");
          await post(`/api/students/update-processtest`, {
            IDThiSinh,
            processtest: 3,
          });
          navigate('/testStudent');
          return;
        }

        const subjectId = subjectsNotTested.some(e => e.id === IDSubject) ? IDSubject : subjectsNotTested[0].id;
        setUntestedSubjects(subjectsNotTested.filter(e => e.id !== subjectId));
        await setupExam(subjectId);

        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 2,
        });
      } catch (error) {
        console.error("Lỗi khi khởi tạo bài thi:", error);
        toast.error("Không thể khởi tạo bài thi.");
        navigate('/testStudent');
      }
    };

    initializeExam();
  }, [IDThiSinh]);

  const setupExam = async (subjectId: number) => {
    try {
      const getRandomTest = await get<ApiResponse<any[]>>(`/api/subject/get-test/${subjectId}`);
      const testData = getRandomTest.DT as any[];
      if (!testData || testData.length === 0) {
        toast.error("Chưa có dữ liệu bài kiểm tra.");
        navigate('/testStudent');
        return;
      }

      const randomTestId = testData[Math.floor(Math.random() * testData.length)].id;
      const varTest = await get<ApiResponse<any[]>>(`/api/test/get-test/${randomTestId}`);
      const testDetails = varTest.DT as any[];

      if (!testDetails || !testDetails[0]) {
        toast.error("Không thể tải thông tin bài thi.");
        navigate('/testStudent');
        return;
      }

      const varSubject = testDetails[0].subject;
      const varArrQuestion = testDetails[0].questions;

      if (!varSubject || !varArrQuestion?.length) {
        toast.error("Dữ liệu bài thi không hợp lệ.");
        navigate('/testStudent');
        return;
      }

      const questionsTest = varArrQuestion.map((e: Question) => ({
        ...e,
        options: ["", "", "", ""],
      }));

      setSubject(varSubject);
      setArrQuestion(questionsTest);
      setSelectedOptions(new Array(questionsTest.length).fill([]));
      setTimeRemaining(varSubject.timeFinish * 60);
      setTestRandom(randomTestId);
      setTestCode(testDetails[0].code);
      setCurrentQuestion(0);
      setIsExamFinished(false);
      setTimeOut(false);
      setShowResult(false);
    } catch (error) {
      console.error("Lỗi trong setupExam:", error);
      toast.error("Không thể thiết lập bài thi.");
      navigate('/testStudent');
    }
  };

  // Timer
  useEffect(() => {
    if (isExamFinished || timeRemaining <= 0) return;

    const intervalId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          setTimeOut(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isExamFinished, timeRemaining]);

  useEffect(() => {
    if (timeOut && !isExamFinished) {
      setIsExamFinished(true);
      handleFinishExam();
    }
  }, [timeOut, isExamFinished]);

  // Toggle option for current question
  const toggleOption = useCallback((questionIndex: number, optionIndex: number) => {
    setSelectedOptions((prev) => {
      const newSelections = [...prev];
      const optionsForCurrentQuestion = newSelections[questionIndex] || [];
      if (optionsForCurrentQuestion.includes(optionIndex)) {
        newSelections[questionIndex] = optionsForCurrentQuestion.filter((opt) => opt !== optionIndex);
      } else {
        newSelections[questionIndex] = [...optionsForCurrentQuestion, optionIndex];
      }
      return newSelections;
    });
  }, []);

  // Navigate to question with animation
  const handleQuestionChange = useCallback((index: number) => {
    if (index === currentQuestion) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQuestion(index);
      setIsAnimating(false);
    }, 150);
  }, [currentQuestion]);

  // Navigate up/down
  const handleNavigateUp = useCallback(() => {
    const newIndex = (currentQuestion - 1 + arrQuestion.length) % arrQuestion.length;
    handleQuestionChange(newIndex);
  }, [currentQuestion, arrQuestion.length, handleQuestionChange]);

  const handleNavigateDown = useCallback(() => {
    const newIndex = (currentQuestion + 1) % arrQuestion.length;
    handleQuestionChange(newIndex);
  }, [currentQuestion, arrQuestion.length, handleQuestionChange]);

  // Select option via keyboard simulation
  const handleSelectOption = useCallback((option: number) => {
    toggleOption(currentQuestion, option);
  }, [currentQuestion, toggleOption]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isExamFinished) return;

      const optionIndex = parseInt(event.key);
      if (optionIndex >= 1 && optionIndex <= 4) {
        toggleOption(currentQuestion, optionIndex);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handleNavigateUp();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleNavigateDown();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, isExamFinished, toggleOption, handleNavigateUp, handleNavigateDown]);

  // Format time
  const formatTime = useCallback((timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Array comparison helper
  const arraysAreEqual = useCallback((arr1: number[], arr2: number[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);
    return sorted1.every((value, index) => value === sorted2[index]);
  }, []);

  const convertStringsToNumbers = useCallback((arr: string[]): number[] => {
    return arr.map(item => {
      const number = Number(item);
      return isNaN(number) ? 0 : number;
    });
  }, []);

  // End exam
  const handleEndExam = async () => {
    if (!isExamFinished) {
      setIsExamFinished(true);
      setTimeRemaining(0);
      try {
        await handleFinishExam();
      } catch (error) {
        console.error("Lỗi khi kết thúc bài thi:", error);
        toast.error("Có lỗi xảy ra khi kết thúc bài thi.");
      }
    }
  };

  // Finish exam and save results
  const handleFinishExam = async () => {
    try {
      if (!subject) return;
      
      let calculatedScore = 0;
      const stringAnswerlist: string[] = [];

      arrQuestion.forEach((question, index) => {
        if (arraysAreEqual(selectedOptions[index] || [], convertStringsToNumbers(question?.answer?.toString()?.split(',') || []))) {
          calculatedScore++;
        }
        stringAnswerlist.push((selectedOptions[index] || []).join('-'));
      });

      const resCreateExam = await post<ApiResponse>("/api/exam/create-exam", {
        IDThisinh: IDThiSinh,
        IDTest: testRandom,
        answerlist: stringAnswerlist.join(','),
        point: calculatedScore,
        result: calculatedScore < subject.threshold ? "TRƯỢT" : "ĐẠT",
        IDSubject: subject?.id,
      });

      if (resCreateExam.EC === 0) toast.success(resCreateExam.EM);
      else if (resCreateExam.EC === 1) toast.warn(resCreateExam.EM);
      else toast.error(resCreateExam.EM);

      // Update untested subjects
      const response = await get<ApiResponse<ThiSinh[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
      const updatedStudentData = response.DT as ThiSinh[];
      const updatedStudent: ThiSinh = updatedStudentData[0];
      const examSubjectIds = updatedStudent?.exams?.map(exam => Number(exam.IDSubject)) || [];
      const updatedUntestedSubjects: Subject[] = updatedStudent?.rank?.subjects?.filter(
        (subject: any) => !examSubjectIds.includes(subject.id)
      ) || [];
      
      if (updatedUntestedSubjects.length === 0) {
        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 3,
        });
      } else {
        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 1,
        });
      }

      setUntestedSubjects(updatedUntestedSubjects);
      setNextSubjectName(updatedUntestedSubjects.length > 0 ? updatedUntestedSubjects[0].name : null);
      setScore(calculatedScore);
      setShowResult(true);
    } catch (error) {
      console.error("Lỗi khi ghi nhận kết quả:", error);
      toast.error("Không thể ghi nhận kết quả thi.");
    }
  };

  const handleNextExam = async () => {
    try {
      if (untestedSubjects.length === 0) {
        toast.success("Bạn đã hoàn thành tất cả các bài thi!");
        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 3,
        });
        navigate('/testStudent');
        return;
      }

      const nextSubjectId = untestedSubjects[0].id;
      setUntestedSubjects(prev => prev.filter(subject => subject.id !== nextSubjectId));
      setNextSubjectName(untestedSubjects.length > 1 ? untestedSubjects[1].name : null);
      await setupExam(nextSubjectId);
      await post(`/api/students/update-processtest`, {
        IDThiSinh,
        processtest: 2,
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài thi kế tiếp:", error);
      navigate('/testStudent');
    }
  };

  // Get question image
  const getQuestionImage = useCallback((number: number | undefined) => {
    if (!number) return null;
    try {
      return require(`../../../assets/600question_2025/${number}.jpg`);
    } catch (error) {
      return null;
    }
  }, []);

  const currentQuestionImage = useMemo(() => 
    getQuestionImage(arrQuestion[currentQuestion]?.number),
    [arrQuestion, currentQuestion, getQuestionImage]
  );

  // Progress calculation
  const answeredCount = useMemo(() => 
    selectedOptions.filter(opt => opt && opt.length > 0).length,
    [selectedOptions]
  );

  const progressPercentage = useMemo(() => 
    arrQuestion.length > 0 ? (answeredCount / arrQuestion.length) * 100 : 0,
    [answeredCount, arrQuestion.length]
  );

  // Loading state
  if (!studentNow || !arrQuestion.length || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  // Render for Mobile/Tablet Portrait
  const renderPortraitLayout = () => (
    <div className="exam-layout-portrait min-h-screen flex flex-col bg-slate-800">
      {/* Top Bar - Timer & Progress */}
      <header className="exam-header sticky top-0 z-30 bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
        <div className="flex items-center justify-between p-3">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className={`
              px-4 py-2 rounded-lg font-mono text-xl font-bold
              ${timeRemaining < 60 ? 'bg-red-500 text-white animate-pulse' : 
                timeRemaining < 300 ? 'bg-yellow-500 text-black' : 
                'bg-green-500 text-white'}
            `}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">{answeredCount}/{arrQuestion.length}</span>
            <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Menu Toggle */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            aria-label="Mở danh sách câu hỏi"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Subject Info */}
        <div className="px-3 pb-2 text-white text-sm truncate">
          <span className="font-semibold">{subject?.name}</span>
          <span className="mx-2">|</span>
          <span>Mã đề: {testCode}</span>
        </div>
      </header>

      {/* Question Area - Takes most space */}
      <main className="flex-1 relative overflow-hidden p-2">
        <div className={`
          h-full bg-white rounded-xl shadow-2xl overflow-hidden
          transition-all duration-150
          ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        `}>
          {/* Question Number Badge */}
          <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            Câu {currentQuestion + 1}
          </div>

          {/* Question Image */}
          {currentQuestionImage ? (
            <img
              src={currentQuestionImage}
              alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Không tìm thấy hình ảnh câu hỏi
            </div>
          )}
        </div>
      </main>

      {/* Keyboard Simulation - Bottom */}
      <div className="flex-shrink-0 h-44 sm:h-48">
        <KeyboardSimulation
          onNavigateUp={handleNavigateUp}
          onNavigateDown={handleNavigateDown}
          onSelectOption={handleSelectOption}
          selectedOptions={selectedOptions[currentQuestion] || []}
          currentQuestion={currentQuestion}
          totalQuestions={arrQuestion.length}
          disabled={isExamFinished}
          layout="horizontal"
        />
      </div>

      {/* Submit Button - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 bg-slate-900">
        <button
          onClick={handleEndExam}
          disabled={isExamFinished}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl 
                     hover:from-red-600 hover:to-red-700 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-98 shadow-lg"
        >
          🏁 KẾT THÚC BÀI THI
        </button>
      </div>

      {/* Question List Sidebar (Slide-in) */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">Danh sách câu hỏi</h3>
              <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-slate-700 rounded">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-5 gap-2">
              {arrQuestion.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleQuestionChange(index);
                    setShowSidebar(false);
                  }}
                  className={`
                    aspect-square rounded-lg font-bold text-sm
                    flex items-center justify-center
                    transition-all duration-200
                    ${currentQuestion === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${selectedOptions[index]?.length > 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render for Landscape (Mobile/Tablet)
  const renderLandscapeLayout = () => (
    <div className="exam-layout-landscape h-screen flex bg-slate-800 overflow-hidden">
      {/* Left Side - Question */}
      <div className="flex-1 flex flex-col p-2 min-w-0">
        {/* Top Bar */}
        <header className="flex-shrink-0 flex items-center justify-between mb-2 gap-2">
          {/* Timer */}
          <div className={`
            px-3 py-1 rounded-lg font-mono text-lg font-bold flex-shrink-0
            ${timeRemaining < 60 ? 'bg-red-500 text-white animate-pulse' : 
              timeRemaining < 300 ? 'bg-yellow-500 text-black' : 
              'bg-green-500 text-white'}
          `}>
            ⏱️ {formatTime(timeRemaining)}
          </div>

          {/* Subject & Progress */}
          <div className="flex-1 flex items-center justify-center gap-2 text-white text-sm truncate">
            <span className="font-semibold truncate">{subject?.name}</span>
            <span className="text-gray-400">|</span>
            <span className="flex-shrink-0">{answeredCount}/{arrQuestion.length}</span>
          </div>

          {/* Menu */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Question Image */}
        <div className={`
          flex-1 bg-white rounded-xl overflow-hidden relative min-h-0
          transition-all duration-150
          ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        `}>
          <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            Câu {currentQuestion + 1}
          </div>
          {currentQuestionImage ? (
            <img
              src={currentQuestionImage}
              alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Không tìm thấy hình ảnh
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Keyboard */}
      <div className="w-64 sm:w-72 md:w-80 flex flex-col p-2">
        <div className="flex-1 min-h-0">
          <KeyboardSimulation
            onNavigateUp={handleNavigateUp}
            onNavigateDown={handleNavigateDown}
            onSelectOption={handleSelectOption}
            selectedOptions={selectedOptions[currentQuestion] || []}
            currentQuestion={currentQuestion}
            totalQuestions={arrQuestion.length}
            disabled={isExamFinished}
            layout="vertical"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleEndExam}
          disabled={isExamFinished}
          className="flex-shrink-0 mt-2 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg
                     hover:from-red-600 hover:to-red-700 transition-all duration-200
                     disabled:opacity-50 active:scale-98"
        >
          🏁 KẾT THÚC
        </button>
      </div>

      {/* Sidebar - Same as portrait */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="relative ml-auto w-64 h-full bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 text-white p-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Danh sách câu hỏi</h3>
              <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-slate-700 rounded">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-1">
              {arrQuestion.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleQuestionChange(index);
                    setShowSidebar(false);
                  }}
                  className={`
                    aspect-square rounded text-xs font-bold
                    flex items-center justify-center
                    ${currentQuestion === index ? 'ring-2 ring-blue-500' : ''}
                    ${selectedOptions[index]?.length > 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700'}
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render for Desktop
  const renderDesktopLayout = () => (
    <div className="exam-layout-desktop h-screen flex bg-slate-800 overflow-hidden">
      {/* Left - Question & Student Info */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        {/* Question Area */}
        <div className={`
          flex-1 bg-white rounded-xl shadow-2xl overflow-hidden relative min-h-0
          transition-all duration-150
          ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        `}>
          <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            Câu {currentQuestion + 1}/{arrQuestion.length}
          </div>
          {currentQuestionImage ? (
            <img
              src={currentQuestionImage}
              alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
              Không tìm thấy hình ảnh câu hỏi {arrQuestion[currentQuestion]?.number}
            </div>
          )}
        </div>

        {/* Student Info Footer */}
        <div className="flex-shrink-0 mt-4 bg-amber-50 rounded-xl p-4 flex items-center gap-6">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            <img 
              src={'data:image/jpg;base64,' + studentNow?.Anh} 
              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
              alt="Ảnh thí sinh" 
            />
          </div>
          
          {/* Student Details */}
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-1">
            <p className="text-sm"><strong>Môn thi:</strong> {subject?.name} ({testCode})</p>
            <p className="text-sm"><strong>Số Báo Danh:</strong> {studentNow?.khoahoc_thisinh?.SoBaoDanh}</p>
            <p className="text-sm"><strong>Họ và tên:</strong> {studentNow?.HoTen}</p>
            <p className="text-sm"><strong>Hạng:</strong> {studentNow?.loaibangthi}</p>
            <p className="text-sm"><strong>Số CCCD:</strong> {studentNow?.SoCMT}</p>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={require(`../../../assets/logo.jpg`)} 
              className="w-24 h-24 object-contain"
              alt="Logo" 
            />
          </div>
        </div>
      </div>

      {/* Right - Sidebar */}
      <div className="w-96 flex flex-col bg-gray-100 rounded-xl m-4 ml-0 shadow-xl overflow-hidden">
        {/* Timer */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-r from-slate-700 to-slate-800">
          <div className="text-center">
            <span className="text-gray-300 text-sm">Thời gian còn lại</span>
            <div className={`
              text-3xl font-mono font-bold mt-1
              ${timeRemaining < 60 ? 'text-red-400 animate-pulse' : 
                timeRemaining < 300 ? 'text-yellow-400' : 
                'text-green-400'}
            `}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Đã làm: {answeredCount}/{arrQuestion.length}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {arrQuestion.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionChange(index)}
                className={`
                  aspect-square rounded-lg font-bold text-sm
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-200 hover:scale-105
                  ${currentQuestion === index ? 'ring-2 ring-blue-500 ring-offset-2 bg-red-100' : ''}
                  ${selectedOptions[index]?.length > 0 
                    ? 'bg-green-400 text-white shadow-md' 
                    : 'bg-amber-50 text-gray-700 hover:bg-amber-100'}
                `}
              >
                <span>{index + 1}</span>
                {selectedOptions[index]?.length > 0 && (
                  <span className="text-[10px]">{selectedOptions[index].join(',')}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Toggle & Submit */}
        <div className="flex-shrink-0 p-4 bg-gray-200 space-y-2">
          {/* Toggle Keyboard */}
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="w-full py-2 bg-slate-600 text-white font-medium rounded-lg
                       hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {showKeyboard ? 'Ẩn bàn phím ảo' : 'Hiện bàn phím ảo'}
          </button>

          {/* Submit Button */}
          <button
            onClick={handleEndExam}
            disabled={isExamFinished}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg
                       hover:from-red-600 hover:to-red-700 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-98 shadow-lg"
          >
            🏁 KẾT THÚC BÀI THI
          </button>
        </div>
      </div>

      {/* Floating Keyboard for Desktop */}
      {showKeyboard && (
        <div className="fixed bottom-4 left-4 z-40 w-80 h-48 shadow-2xl rounded-xl overflow-hidden">
          <KeyboardSimulation
            onNavigateUp={handleNavigateUp}
            onNavigateDown={handleNavigateDown}
            onSelectOption={handleSelectOption}
            selectedOptions={selectedOptions[currentQuestion] || []}
            currentQuestion={currentQuestion}
            totalQuestions={arrQuestion.length}
            disabled={isExamFinished}
            layout="horizontal"
          />
        </div>
      )}
    </div>
  );

  // Determine which layout to render
  const renderLayout = () => {
    if (isDesktop) {
      return renderDesktopLayout();
    } else if (isPortrait) {
      return renderPortraitLayout();
    } else {
      return renderLandscapeLayout();
    }
  };

  return (
    <>
      {renderLayout()}

      {/* Result Modal */}
      {showResult && (
        <ResultModal
          score={score}
          totalQuestions={arrQuestion.length}
          correctAnswers={score}
          incorrectAnswers={arrQuestion.length - score}
          resultStatus={score < subject!.threshold ? "TRƯỢT" : "ĐẠT"}
          studentInfo={{
            studentID: studentNow?.khoahoc_thisinh?.SoBaoDanh || 0,
            fullName: studentNow?.HoTen || '',
            subject: subject?.name || '',
            rank: studentNow?.loaibangthi || '',
            test: testCode || '',
            CCCD: studentNow?.SoCMT || '',
            courseID: studentNow?.khoahoc_thisinh?.khoahoc?.IDKhoaHoc || '',
          }}
          onClose={() => setShowResult(false)}
          onViewAnswers={() => {}}
          arrQuestion={arrQuestion}
          selectedOptions={selectedOptions}
          onNextExam={handleNextExam}
          nextSubjectName={nextSubjectName}
        />
      )}
    </>
  );
};

export default FinalExamForm;
