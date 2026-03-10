import React, { useRef } from 'react';
import TableDisplay from '../TableDisplay/TableDisplay';
import { useNavigate } from 'react-router-dom';
import './ResultModal.css';

interface ResultModalProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  resultStatus: string;
  studentInfo: {
    studentID: number;
    fullName: string;
    subject: string;
    rank: string;
    test: string;
    CCCD: string;
    courseID: string;
  };
  onClose: () => void;
  onViewAnswers: () => void;
  arrQuestion: {
    number: number;
    image: string;
    answer: string;
  }[];
  selectedOptions: number[][];
  onNextExam: () => void; // Callback cho bài thi kế tiếp
  nextSubjectName: string | null; // Thêm prop mới
}

const ResultModal: React.FC<ResultModalProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  resultStatus,
  studentInfo,
  onClose,
  onViewAnswers,
  arrQuestion,
  selectedOptions,
  onNextExam,
  nextSubjectName
}) => {
  
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    onClose();
    navigate('/testStudent');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4 className="next-exam">
          KẾT QUẢ BÀI THI
        </h4>

        <div className="modal-body">
          <div className="student-info">
            {/* <h3>Thông tin học viên:</h3>
            <p>Số Báo Danh: <strong>{studentInfo.studentID}</strong></p>
            <p>Họ và tên: <strong>{studentInfo.fullName}</strong></p>
            <p>Hạng: {studentInfo.rank}</p>
            <p>CCCD: {studentInfo.CCCD}</p> */}
            <div className="modal-footer">
              <div className="result-summary-text">
                <p>
                  <strong>Bài thi trước: <span className={`result-text ${resultStatus === "TRƯỢT" ? "failed" : "passed"}`}>{resultStatus} {`(${score}/${totalQuestions})`}</span></strong>
                </p>
                {nextSubjectName && (
                  <p>
                    <strong>Bài thi kế tiếp: <span className="next-subject-text">{nextSubjectName}</span></strong>
                  </p>
                )}
              </div>

              {nextSubjectName ? (
                <div className="nav-btn-container">
                  <button className="nav-btn next" onClick={onNextExam}>Bài thi kế tiếp</button>
                </div>
              ) : (
                <div className="nav-btn-container">
                  <button className="nav-btn end" onClick={handleClose}>Kết thúc</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {
        (process.env.REACT_APP_BUILD !== 'buildlocal') && (
          <div className="modal-detail" ref={modalRef}>
            <TableDisplay arrQuestion={arrQuestion} selectedOptions={selectedOptions} />
          </div>
        )
      }
    </div>
  );
};

export default ResultModal;