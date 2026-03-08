/**
 * Students list component with WebSocket real-time updates
 * @module features/student/components/StudentsList
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../shared/hooks/useApi';
import { useStudentWebSocket } from '../hooks/useStudentWebSocket';
import { Student, Course, Status } from '../types';
import { ApiResponse } from '../../../core/types/api.types';
import { StudentTable } from './StudentTable';
import './StudentsList.css';

export const StudentsList: React.FC = () => {
  const { get } = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [filterSoBaoDanh, setFilterSoBaoDanh] = useState<string>('');
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [selectedStatusID, setSelectedStatusID] = useState<number | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courseResponse, statusResponse] = await Promise.all([
          get<ApiResponse<Course[]>>('/api/course'),
          get<ApiResponse<Status[]>>('/api/status'),
        ]);

        setCourses(courseResponse.DT);
        setStatusList(statusResponse.DT);

        if (courseResponse.DT.length > 0) {
          setSelectedCourse(courseResponse.DT[courseResponse.DT.length - 1]?.IDKhoaHoc);
        }

        if (statusResponse.DT.length > 0) {
          const defaultStatus = statusResponse.DT.find((s) => s.namestatus === 'LT');
          setSelectedStatusID(defaultStatus?.id || statusResponse.DT[0].id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [get]);

  // WebSocket handlers
  const handleStudentList = useCallback((newStudents: Student[]) => {
    setStudents(newStudents);
  }, []);

  const handleStatusUpdate = useCallback((updatedStudents: Student[]) => {
    setStudents((prev) => {
      const updatedMap = new Map(updatedStudents.map((u) => [u.IDThiSinh, u]));

      const merged = prev.map((student) => {
        const update = updatedMap.get(student.IDThiSinh);
        if (update) {
          return {
            ...student,
            ...update,
            khoahoc_thisinh: {
              ...student.khoahoc_thisinh,
              ...update.khoahoc_thisinh,
            },
          } as Student;
        }
        return student;
      });

      const newStudents = updatedStudents.filter(
        (u) => !prev.some((s) => s.IDThiSinh === u.IDThiSinh)
      );

      return [...merged, ...newStudents];
    });
  }, []);

  // Connect to WebSocket
  useStudentWebSocket({
    courseId: selectedCourse,
    onStudentList: handleStudentList,
    onStatusUpdate: handleStatusUpdate,
  });

  // Filter functions
  const filterBySoBaoDanh = (studentList: Student[], filter: string): Student[] => {
    if (!filter) return studentList;
    const numbers = filter.split(',').map((n) => Number(n.trim()));
    return studentList.filter((s) =>
      numbers.some((num) => num === s.khoahoc_thisinh?.SoBaoDanh)
    );
  };

  const filterByLicense = (licenseType: string): Student[] =>
    students.filter(
      (s) =>
        s.loaibangthi === licenseType &&
        s.khoahoc_thisinh?.IDstatus === selectedStatusID
    );

  return (
    <div className="form-list-student">
      <div className="import-file-child-liststudent">
        <div className="select-course-child-liststudent">
          <label>Chọn Khóa Học: </label>
          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled>
              -- Chọn khóa học --
            </option>
            {courses.map((course) => (
              <option key={course.IDKhoaHoc} value={course.IDKhoaHoc}>
                {course.TenKhoaHoc}
              </option>
            ))}
          </select>
        </div>

        <div className="select-course-child-liststudent">
          <label>Chọn kiểu hiển thị: </label>
          <select
            value={selectedStatusID || ''}
            onChange={(e) => setSelectedStatusID(Number(e.target.value))}
          >
            <option value="" disabled>
              -- Kiểu dữ liệu hiển thị --
            </option>
            {statusList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.namestatus}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-so-bao-danh">
          <label>Hiển thị theo SBD (ngăn cách bởi dấu phẩy): </label>
          <input
            type="text"
            value={filterSoBaoDanh}
            onChange={(e) => setFilterSoBaoDanh(e.target.value)}
            placeholder="Ví dụ: 123, 456, 789"
          />
        </div>
      </div>

      <div className="list-InfoStudent">
        <StudentTable
          title="HẠNG C"
          students={filterBySoBaoDanh(filterByLicense('C'), filterSoBaoDanh)}
        />
        <StudentTable
          title="HẠNG B2"
          students={filterBySoBaoDanh(filterByLicense('B2'), filterSoBaoDanh)}
        />
        <StudentTable
          title="HẠNG B11"
          students={filterBySoBaoDanh(filterByLicense('B11'), filterSoBaoDanh)}
        />
      </div>
    </div>
  );
};

export default StudentsList;
