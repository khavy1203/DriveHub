import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { StudentInTeam } from '../types';
import { fetchMyStudents, assignStudentApi, dropStudentApi, updateStudentApi, type StudentEditData } from '../services/superTeacherApi';

export const useSuperTeacherStudents = () => {
  const [students, setStudents] = useState<StudentInTeam[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyStudents();
      if (res.EC === 0) setStudents(res.DT ?? []);
      else toast.error(res.EM);
    } catch {
      toast.error('Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  }, []);

  const assignStudent = useCallback(async (hocVienId: number, teacherId: number) => {
    const res = await assignStudentApi(hocVienId, teacherId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Phân công thành công');
    await loadStudents();
  }, [loadStudents]);

  const removeStudent = useCallback(async (hocVienId: number) => {
    const res = await dropStudentApi(hocVienId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã xóa học viên khỏi đội');
    await loadStudents();
  }, [loadStudents]);

  const updateStudent = useCallback(async (hocVienId: number, data: StudentEditData) => {
    const res = await updateStudentApi(hocVienId, data);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Cập nhật thành công');
    await loadStudents();
  }, [loadStudents]);

  return { students, loading, loadStudents, assignStudent, removeStudent, updateStudent };
};
