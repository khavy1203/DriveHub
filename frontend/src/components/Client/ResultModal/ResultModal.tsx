import React, { useRef, useState, useEffect } from 'react';
import TableDisplay from '../TableDisplay/TableDisplay';
import { useNavigate } from 'react-router-dom';
import './ResultModal.css';
import { toast } from "react-toastify";

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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number>(5); // Khởi tạo đếm ngược 3s

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (nextSubjectName) {
            onNextExam(); // Chuyển sang bài thi kế tiếp
          } else {
            handleClose(); // Kết thúc
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup timer khi component unmount
    return () => clearInterval(timer);
  }, [nextSubjectName, onNextExam]);

  const handlePrintAnswers = () => {
    if (modalRef.current) {
      const printWindow = window.open('', '_blank', 'height=800,width=600');
      const content = modalRef.current.innerHTML;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>In đáp án</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .table-result { width: 100%; border-collapse: collapse; text-align: center; }
              .table-result th, .table-result td { border: 1px solid #ddd; padding: 8px; }
              .table-result th { background-color: #f4f4f4; font-weight: bold; }
              .user-answer.correct { color: green; font-weight: bold; }
              .user-answer.incorrect { color: red; font-weight: bold; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `;
      printWindow?.document.open();
      printWindow?.document.write(htmlContent);
      printWindow?.focus();
      printWindow?.document.close();
    }
  };

  const handleClose = () => {
    onClose();
    navigate('/testStudent');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4 className = "next-exam">
        {nextSubjectName ? (
            <div>
              <button onClick={onNextExam}>Bài thi kế tiếp</button>
              <span style={{ marginLeft: '10px', color: 'green' }}>
                (Tiếp tục sau {countdown}s)
              </span>
            </div>
          ) : (
            <div>
              <button onClick={handleClose}>Kết thúc</button>
              <span style={{ marginLeft: '10px', color: 'green' }}>
                (Kết thúc {countdown}s)
              </span>
            </div>
          )}
        </h4>

        <div className="modal-body">
          <div className="student-info">
            {/* <h3>Thông tin học viên:</h3>
            <p>Số Báo Danh: <strong>{studentInfo.studentID}</strong></p>
            <p>Họ và tên: <strong>{studentInfo.fullName}</strong></p>
            <p>Hạng: {studentInfo.rank}</p>
            <p>CCCD: {studentInfo.CCCD}</p> */}
            <div className="modal-footer">
              <p>
                <strong>Bài thi trước: <span style={{ color: resultStatus === "TRƯỢT" ? "red" : "green" }}>{resultStatus} {`(${score}/${totalQuestions})`}</span></strong>
              </p>
              {nextSubjectName && (
                <strong><p>Bài thi kế tiếp: <span style={{ color: "green" }}>{nextSubjectName}</span> </p></strong>
              )}
            </div>

          </div>
        </div>

      </div>
      {
        (process.env.REACT_APP_BUILD != 'buildlocal') && (
          <div className="modal-detail" ref={modalRef}>
            <TableDisplay arrQuestion={arrQuestion} selectedOptions={selectedOptions} />
          </div>
        )
      }
    </div >
  );
};

export default ResultModal;