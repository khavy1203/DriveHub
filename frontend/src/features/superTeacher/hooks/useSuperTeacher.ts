import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { TeacherInTeam, TeacherFormData } from '../types';
import {
  fetchMyTeachers,
  createTeacherInTeam,
  updateTeacherInTeam,
  deleteTeacherFromTeam,
} from '../services/superTeacherApi';

export const useSuperTeacher = () => {
  const [teachers, setTeachers] = useState<TeacherInTeam[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyTeachers();
      if (res.EC === 0) setTeachers(res.DT ?? []);
      else toast.error(res.EM);
    } catch {
      toast.error('Không thể tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTeacher = useCallback(async (data: TeacherFormData) => {
    const res = await createTeacherInTeam(data);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Tạo giáo viên thành công');
    await loadTeachers();
    return res.DT;
  }, [loadTeachers]);

  const editTeacher = useCallback(async (teacherId: number, data: Partial<TeacherFormData>) => {
    const res = await updateTeacherInTeam(teacherId, data);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Cập nhật thành công');
    await loadTeachers();
  }, [loadTeachers]);

  const removeTeacher = useCallback(async (teacherId: number) => {
    const res = await deleteTeacherFromTeam(teacherId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Xóa giáo viên thành công');
    await loadTeachers();
  }, [loadTeachers]);

  return { teachers, loading, loadTeachers, addTeacher, editTeacher, removeTeacher };
};
