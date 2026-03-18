import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { ThiSinh, Test, ApiResponse, Subject, Question, Student } from "../../../interfaces";
import useApiService from "../../../services/useApiService";
import ResultModal from './ResultModal/ResultModal';
import { toast } from 'react-toastify';
import './FinalExamForm.scss';
import { VirtualDPad } from './VirtualDPad';
import { VirtualNumpad } from './VirtualNumpad';

const FinalExamForm: React.FC = () => {
  const { get, post, put, del } = useApiService();
  const navigate = useNavigate();
  const location = useLocation();
  let { IDThiSinh, IDSubject } = location.state as { IDThiSinh: number, IDSubject: number };
  
  const [studentNow, setStudentNow] = useState<ThiSinh | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[][]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [arrQuestion, setArrQuestion] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeOut, setTimeOut] = useState(false);
  const [testRandom, setTestRandom] = useState<number | null>(null);
  const [testCode, setTestCode] = useState<string | null>(null);
  const [nextSubjectName, setNextSubjectName] = useState<string | null>(null);
  const [untestedSubjects, setUntestedSubjects] = useState<Subject[]>([]); // Lưu danh sách môn chưa thi
  
  const [isMobileExamLayout, setIsMobileExamLayout] = useState(false);
  const MAX_ITEMS_PER_COLUMN = 15;

  useEffect(() => {
    const handleResize = () => {
      setIsMobileExamLayout(window.innerWidth <= 950);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const apiItemsPerColumn = Number((subject as any)?.itemsPerColumn || (subject as any)?.questionPerColumn || 0);
  const mobileItemsPerColumn = apiItemsPerColumn > 0
    ? Math.min(apiItemsPerColumn, MAX_ITEMS_PER_COLUMN)
    : MAX_ITEMS_PER_COLUMN;
  const itemsPerColumn = isMobileExamLayout ? mobileItemsPerColumn : 10;

  const questionColumns = useMemo(() => {
    const columns: Array<{ start: number; items: any[] }> = [];
    for (let start = 0; start < arrQuestion.length; start += itemsPerColumn) {
      columns.push({
        start,
        items: arrQuestion.slice(start, start + itemsPerColumn),
      });
    }
    return columns;
  }, [arrQuestion, itemsPerColumn]);

  const [showMobileList, setShowMobileList] = useState<boolean>(false);
  // Khởi tạo bài thi ban đầu
  useEffect(() => {
    const initializeExam = async () => {
      try {
        const response = await get<ApiResponse<Student[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
        if (response.DT.length === 0) {
          toast.error("Không tìm thấy thí sinh.");
          navigate('/testStudent');
          return;
        }

        const student: ThiSinh = response.DT[0];
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
        else {
          const subjectId = subjectsNotTested.some(e => e.id === IDSubject) ? IDSubject : subjectsNotTested[0].id;
          setUntestedSubjects(subjectsNotTested.filter(e => e.id !== subjectId));
          await setupExam(subjectId);

          await post(`/api/students/update-processtest`, {
            IDThiSinh,
            processtest: 2,
          });
        }

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
      const getRandomTest = await get<ApiResponse<Subject[]>>(`/api/subject/get-test/${subjectId}`);
      if (!getRandomTest.DT || getRandomTest.DT.length === 0) {
        toast.error("Chưa có dữ liệu bài kiểm tra.");
        navigate('/testStudent');
        return;
      }

      const dataTest = getRandomTest.DT;
      const testRandom = dataTest[Math.floor(Math.random() * dataTest.length)].id;
      const varTest = await get<ApiResponse<Test[]>>(`/api/test/get-test/${testRandom}`);

      // Kiểm tra dữ liệu trả về từ API
      if (!varTest?.DT?.[0]) {
        toast.error("Không thể tải thông tin bài thi.");
        navigate('/testStudent');
        return;
      }

      const varSubject = varTest.DT[0].subject as Subject;
      const varArrQuestion = varTest.DT[0].questions ;

      if (!varSubject || !varArrQuestion?.length) {
        toast.error("Dữ liệu bài thi không hợp lệ.");
        navigate('/testStudent');
        return;
      }

      const questionsTest = varArrQuestion.map((e: Question) => ({
        ...e,
        options: ["", "", "", ""], // Đảm bảo options luôn có giá trị mặc định
      }));

      // Thiết lập tất cả state cùng lúc
      setSubject(varSubject);
      setArrQuestion(questionsTest);
      setSelectedOptions(new Array(questionsTest.length).fill([]));
      setTimeRemaining(varSubject.timeFinish * 60);
      setTestRandom(testRandom);
      setTestCode(varTest.DT[0].code);
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

  // Bộ đếm thời gian
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          if (!isExamFinished) {
            setTimeOut(true);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isExamFinished]);

  useEffect(() => {
    if (timeOut) {
      setIsExamFinished(true);
      handleEndExam();
    }
  }, [timeOut]);


  const handleEndExam = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài và kết thúc thi không?")) {
      return;
    }

    if (!isExamFinished) {
      setIsExamFinished(true); // Đánh dấu bài thi đã kết thúc
      setTimeRemaining(0); // Dừng bộ đếm
      try {
        await handleFinishExam(); // Gọi và đợi hàm ghi nhận kết quả
      } catch (error) {
        console.error("Lỗi khi kết thúc bài thi:", error);
        toast.error("Có lỗi xảy ra khi kết thúc bài thi.");
      }
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const optionIndex = parseInt(event.key);
    // console.log('check optionIndex', optionIndex)
    if (optionIndex >= 0 && optionIndex <= arrQuestion[currentQuestion].options.length) {
      toggleOption(currentQuestion, optionIndex);
    }

    if (event.key === 'ArrowUp') {
      handleQuestionChange((currentQuestion - 1 + arrQuestion.length) % arrQuestion.length);
    } else if (event.key === 'ArrowDown') {
      handleQuestionChange((currentQuestion + 1) % arrQuestion.length);
    }

  };

  const toggleOption = (questionIndex: number, optionIndex: number) => {
    setSelectedOptions((prev) => {
      const newSelections = [...prev];
      const optionsForCurrentQuestion = newSelections[questionIndex];
      if (optionsForCurrentQuestion.includes(optionIndex)) {
        newSelections[questionIndex] = optionsForCurrentQuestion.filter((opt) => opt !== optionIndex);
      } else {
        newSelections[questionIndex] = [...optionsForCurrentQuestion, optionIndex];
      }
      return newSelections;
    });
  };

  const handleQuestionChange = (index: number) => {
    setCurrentQuestion(index);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestion, selectedOptions]);

  // Chuyển đổi giây thành định dạng phút:giây
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  function arraysAreEqual(arr1: any[], arr2: any[]): boolean {
    // Sắp xếp mảng và so sánh
    arr1.sort();
    arr2.sort();

    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  function convertStringsToNumbers(arr: string[]): number[] {
    return arr.map(item => {
      const number = Number(item);
      return isNaN(number) ? 0 : number; // Trả về 0 nếu không phải số hợp lệ
    });
  }

  const handleFinishExam = async () => {
    try {
      if (!subject) {
        return;
      }
      let calculatedScore = 0;
      const stringAnswerlist: string[] = [];

      arrQuestion.forEach((question, index) => {
        if (arraysAreEqual(selectedOptions[index], convertStringsToNumbers(question?.answer?.toString()?.split(',')))) {
          calculatedScore++;
        }
        stringAnswerlist.push(selectedOptions[index].join('-'));
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

      // Cập nhật danh sách môn chưa thi sau khi hoàn thành bài hiện tại
      const response = await get<ApiResponse<Student[]>>(`/api/students?IDThiSinh=${IDThiSinh}`);
      const updatedStudent: ThiSinh = response.DT[0];
      const examSubjectIds = updatedStudent?.exams?.map(exam => Number(exam.IDSubject)) || [];
      const updatedUntestedSubjects: Subject[] = updatedStudent?.rank?.subjects?.filter(
        (subject: any) => !examSubjectIds.includes(subject.id)
      ) || [];
      if(updatedUntestedSubjects.length == 0){
        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 3,
        });
      }else{
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

  const handleViewAnswers = () => {
    setShowAnswers(true);
  };

  const handleCloseResult = async () => {
    try {
      await post(`/api/students/update-processtest`, {
        IDThiSinh,
        processtest: 1,
      });
    } catch (error) {
      console.error("Lỗi khi reset trạng thái:", error);
    }
    setShowResult(false);
  };

  // const handlePrintAnswers = () => {
  //   if (modalRef.current) {
  //     const printWindow = window.open('', '', 'height=800,width=600'); // Mở một cửa sổ mới tạm thời

  //     printWindow?.document.write('<html><head><title>In đáp án</title></head><body>');
  //     printWindow?.document.write(modalRef.current.innerHTML); // Lấy nội dung modal và viết vào cửa sổ mới
  //     printWindow?.document.write('</body></html>');

  //     printWindow?.document.close(); // Đóng tài liệu để bắt đầu in
  //     printWindow?.focus(); // Đảm bảo cửa sổ được focus trước khi in
  //     printWindow?.print(); // Gọi lệnh in trực tiếp
  //     printWindow?.close(); // Đóng cửa sổ sau khi in xong
  //   }
  // };

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
      } else {
        const nextSubjectId = untestedSubjects[0].id;
        setUntestedSubjects(prev => prev.filter(subject => subject.id !== nextSubjectId));
        setNextSubjectName(untestedSubjects.length ? untestedSubjects[0].name : null);
        await setupExam(nextSubjectId);
        await post(`/api/students/update-processtest`, {
          IDThiSinh,
          processtest: 2,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tạo bài thi kế tiếp:", error);
      navigate('/testStudent');
    }
  };

  if (!studentNow || !arrQuestion.length || !subject) {
    return <div>Loading...</div>; // Hiển thị loading khi chưa có dữ liệu
  }

  const getQuestionImage = (number: number | undefined) => {
    if (!number) return null;
    try {
      return require(`../../../assets/600question_2025/${number}.jpg`);
    } catch (error) {
      console.error(`Không tìm thấy ảnh: ${number}.jpg`);
      return null;
    }
  };

  return (
    <>
      <div className="portrait-lock-screen">
        <div className="lock-content">
          <h2>Vui lòng xoay ngang thiết bị</h2>
          <p>Bài thi yêu cầu thiết bị ở chế độ ngang (Landscape) để hiển thị đầy đủ thông tin.</p>
        </div>
      </div>
      
      <div className={`exam-container`}>
        <div className="virtual-controls">
          <div className="virtual-controls__dpad">
            <VirtualDPad
              currentQuestion={currentQuestion}
              itemsPerColumn={itemsPerColumn}
              totalQuestions={arrQuestion.length}
              onQuestionChange={handleQuestionChange}
            />
          </div>
          <div className="virtual-controls__numpad">
            <VirtualNumpad
              currentQuestion={currentQuestion}
              selectedOptions={selectedOptions}
              toggleOption={toggleOption}
            />
          </div>
        </div>

        <div className="left-exam">
        <div className="virtual-note">
          Tay trái: nhấn nút để điều hướng &nbsp;|&nbsp; Tay phải: chọn đáp án
        </div>
        <div className="question-section">
          <div className="mobile-current-question-info">
            Câu {currentQuestion + 1} / {arrQuestion.length}
          </div>
          {(() => {
            const imageSrc = getQuestionImage(arrQuestion[currentQuestion]?.number);
            return imageSrc ? (
              <img
                src={imageSrc}
                alt={`Câu hỏi ${arrQuestion[currentQuestion]?.number}`}
              />
            ) : (
              <div>Không tìm thấy ảnh câu hỏi {arrQuestion[currentQuestion]?.number}</div>
            );
          })()}
        </div>
        <div className="footer">
          <div className="left">
            <img src={'data:image/jpg;base64,' + studentNow?.Anh} className='image-hv' alt="" />
          </div>
          <div className="middle">
            <div className="subject">
              <h5>Môn thi: {subject?.name} ({testCode})</h5>
            </div>
            <div className="rank">
              <h5>Số Báo Danh: {studentNow?.khoahoc_thisinh?.SoBaoDanh}</h5>
            </div>
            <h5>Hạng: {studentNow?.loaibangthi}</h5>
            <h5>Họ và tên: {studentNow?.HoTen}</h5>
            <h5>Số CCCD: {studentNow?.SoCMT}</h5>
          </div>
          <div className="right">
            <img src={require(`../../../assets/logo.jpg`)} className='logo' alt="" />
          </div>
        </div>
      </div>
      <div className="right-exam">
        <div className="sidebar-section">
          <div className="top">
            <div className="time-remaining">
              Thời gian còn lại:<span>  {timeRemaining === 0 ? (
                <span>Hết thời gian</span>
              ) : (
                <span>{formatTime(timeRemaining)}</span>
              )}</span>
            </div>
            <div
              className="question-nav-container"
              style={{ ['--question-column-count' as any]: questionColumns.length || 1 }}
            >
              {questionColumns.map((column, columnIndex) => (
                <div className="question-nav" key={columnIndex}>
                  {column.items.map((_, questionIndex) => {
                    const globalIndex = column.start + questionIndex;
                    return (
                      <div
                        key={globalIndex}
                        className={`question-btn ${selectedOptions[globalIndex]?.length > 0 ? 'answered' : 'unanswered'} ${currentQuestion === globalIndex ? 'current' : ''}`}
                        onClick={() => handleQuestionChange(globalIndex)}
                      >
                        <div className="question-number">{globalIndex + 1}</div>
                        <div className="answer-options">
                          {arrQuestion[globalIndex].options.map((_: any, optIndex: number) => (
                            <div key={optIndex} className="option-cell">
                              <span>{optIndex + 1}</span>
                              <input
                                type="checkbox"
                                checked={selectedOptions[globalIndex]?.includes(optIndex + 1)}
                                onChange={() => toggleOption(globalIndex, optIndex + 1)}
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
          <button className="end-exam-btn" onClick={handleEndExam}>KẾT THÚC</button>
        </div>
      </div>
    </div>

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
          onClose={handleCloseResult}
          onViewAnswers={handleViewAnswers}
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
