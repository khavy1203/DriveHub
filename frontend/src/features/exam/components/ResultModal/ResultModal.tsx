import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import TableDisplay from '../TableDisplay/TableDisplay';
import { useNavigate } from 'react-router-dom';
import './ResultModal.scss';

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
  console.log('ANTIGRAVITY_RESULT_MODAL_FIX_V2');
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    onClose();
    navigate('/testStudent');
  };

  return ReactDOM.createPortal(
    <div className="premium-result-overlay" data-antigravity="fix">
      <div className="result-sidebar-container">
        <h4 className="next-exam-title">
          KẾT QUẢ BÀI THI
        </h4>

        <div className="modal-body-content">
          <div className="result-summary-section">
            <div className="modal-footer-box">
              <div className="result-summary-text-box">
                <p>
                  <strong>Bài thi trước: <span className={`result-status-pill ${resultStatus === "TRƯỢT" ? "failed" : "passed"}`}>{resultStatus} {`(${score}/${totalQuestions})`}</span></strong>
                </p>
                {nextSubjectName && (
                  <p>
                    <strong>Bài thi kế tiếp: <span className="next-subject-name-text">{nextSubjectName}</span></strong>
                  </p>
                )}
              </div>

              {nextSubjectName ? (
                <div className="nav-btn-wrapper">
                  <button className="nav-btn next-btn" onClick={onNextExam}>Bài thi kế tiếp</button>
                </div>
              ) : (
                <div className="nav-btn-wrapper">
                  <button className="nav-btn end-btn" onClick={handleClose}>Kết thúc</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="result-detail-table-container" ref={modalRef}>
        <TableDisplay arrQuestion={arrQuestion} selectedOptions={selectedOptions} />
      </div>
    </div>,
    document.body
  );
};

export default ResultModal;