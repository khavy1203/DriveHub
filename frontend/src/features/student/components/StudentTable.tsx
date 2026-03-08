/**
 * Student table section component
 * @module features/student/components/StudentTable
 */

import React from 'react';
import { Student } from '../types/student.types';

interface StudentTableProps {
  title: string;
  students: Student[];
}

export const StudentTable: React.FC<StudentTableProps> = ({ title, students }) => {
  return (
    <div className="section">
      <h3 className="name-table">
        <i className="fas fa-bell"></i> {title}
        <span className="record-count">({students.length})</span>
      </h3>
      <div className="scroll-container">
        <div className="header-row">
          <div className="cell">STT</div>
          <div className="cell">SBD</div>
          <div className="cell">Họ Tên</div>
          <div className="cell">THANH TOÁN</div>
        </div>
        <div className="scroll-content">
          {students.map((student) => (
            <div className="row" key={student.IDThiSinh}>
              <div className="cell">{student.khoahoc_thisinh?.stt}</div>
              <div className="cell">{student.khoahoc_thisinh?.SoBaoDanh}</div>
              <div className="cell">{student.HoTen}</div>
              <div className="cell payment-cell">
                {student.khoahoc_thisinh?.payment ? (
                  <i className="fas fa-check-circle paid-icon" title="Đã thanh toán"></i>
                ) : (
                  <i className="fas fa-exclamation-circle unpaid-icon" title="Chưa thanh toán"></i>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentTable;
