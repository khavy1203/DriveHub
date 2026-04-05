import axios from '../../../axios';
import type { TeacherInTeam, StudentInTeam, SupperTeacher, TeacherFormData, SupperTeacherFormData, RatingsOverviewData, ImportResult, InstructorProfile } from '../types';

type ApiRes<T> = { EC: number; EM: string; DT: T };

// ── SupperTeacher: own team ──────────────────────────────────────────────────

export const fetchMyTeachers = () =>
  axios.get<ApiRes<TeacherInTeam[]>>('/api/super-teacher/teachers').then(r => r.data);

export const createTeacherInTeam = (data: TeacherFormData) =>
  axios.post<ApiRes<TeacherInTeam>>('/api/super-teacher/teachers', data).then(r => r.data);

export const updateTeacherInTeam = (teacherId: number, data: Partial<TeacherFormData>) =>
  axios.put<ApiRes<TeacherInTeam>>(`/api/super-teacher/teachers/${teacherId}`, data).then(r => r.data);

export const deleteTeacherFromTeam = (teacherId: number) =>
  axios.delete<ApiRes<null>>(`/api/super-teacher/teachers/${teacherId}`).then(r => r.data);

export const fetchMyStudents = () =>
  axios.get<ApiRes<StudentInTeam[]>>('/api/super-teacher/students').then(r => r.data);

export const assignStudentApi = (hocVienId: number, teacherId: number) =>
  axios.post<ApiRes<unknown>>('/api/super-teacher/assign-student', { hocVienId, teacherId }).then(r => r.data);

export const dropStudentApi = (hocVienId: number) =>
  axios.delete<ApiRes<null>>(`/api/super-teacher/students/${hocVienId}`).then(r => r.data);

export type StudentEditData = {
  HoTen?: string;
  NgaySinh?: string;
  GioiTinh?: string;
  phone?: string;
  DiaChi?: string;
  GhiChu?: string;
  SoCCCD?: string;
};

export const updateStudentApi = (hocVienId: number, data: StudentEditData) =>
  axios.put<ApiRes<unknown>>(`/api/super-teacher/students/${hocVienId}`, data).then(r => r.data);

type CccdImportResult = {
  cccd: string;
  ok: boolean;
  error?: string;
  hoTen?: string;
  hocVienId?: number;
  created?: boolean;
  pct?: number;
};

export const importCccdApi = (cccdList: string[]) =>
  axios.post<ApiRes<{ background: boolean; total: number }>>('/api/super-teacher/import-cccd', { cccdList }).then(r => r.data);

export const fetchMyProfile = () =>
  axios.get<ApiRes<InstructorProfile | null>>('/api/super-teacher/my-profile').then(r => r.data);

export const fetchRatingsOverview = () =>
  axios.get<ApiRes<RatingsOverviewData>>('/api/super-teacher/ratings-overview').then(r => r.data);

// ── SupperAdmin: manage SupperTeachers ───────────────────────────────────────

export const fetchSupperTeachers = (filterAdminId?: number | null) =>
  axios.get<ApiRes<SupperTeacher[]>>('/api/admin/supper-teachers', {
    params: filterAdminId ? { filterAdminId } : undefined,
  }).then(r => r.data);

export const createSupperTeacherApi = (data: SupperTeacherFormData) =>
  axios.post<ApiRes<SupperTeacher>>('/api/admin/supper-teachers', data).then(r => r.data);

export const updateSupperTeacherApi = (id: number, data: Partial<SupperTeacherFormData>) =>
  axios.put<ApiRes<SupperTeacher>>(`/api/admin/supper-teachers/${id}`, data).then(r => r.data);

export const deleteSupperTeacherApi = (id: number) =>
  axios.delete<ApiRes<null>>(`/api/admin/supper-teachers/${id}`).then(r => r.data);

export const previewDeleteSupperTeacher = (id: number) =>
  axios.get<ApiRes<TeacherInTeam[]>>(`/api/admin/supper-teachers/${id}/preview-delete`).then(r => r.data);

export const createTeacherByAdminApi = (superTeacherId: number, data: TeacherFormData) =>
  axios.post<ApiRes<TeacherInTeam>>('/api/admin/teachers-with-super', { superTeacherId, ...data }).then(r => r.data);

export const reassignTeacherApi = (teacherId: number, superTeacherId: number) =>
  axios.put<ApiRes<TeacherInTeam>>(`/api/admin/teachers/${teacherId}/assign-super`, { superTeacherId }).then(r => r.data);

export const fetchTeachersInTeam = (superTeacherId: number) =>
  axios.get<ApiRes<TeacherInTeam[]>>(`/api/admin/supper-teachers/${superTeacherId}/teachers`).then(r => r.data);

export const fetchTeachersWithoutSupper = () =>
  axios.get<ApiRes<TeacherInTeam[]>>('/api/admin/teachers-without-super').then(r => r.data);

export const promoteTeacherApi = (teacherId: number) =>
  axios.put<ApiRes<unknown>>(`/api/admin/teachers/${teacherId}/promote`).then(r => r.data);

export const demoteSuperTeacherApi = (id: number, newManagerId: number) =>
  axios.put<ApiRes<unknown>>(`/api/admin/supper-teachers/${id}/demote`, { newManagerId }).then(r => r.data);

export const assignStudentToSTApi = (hocVienId: number, stId: number) =>
  axios.post<ApiRes<{ hocVienId: number; stId: number }>>('/api/admin/assign-student-to-st', { hocVienId, stId }).then(r => r.data);

// ── Import SupperTeachers from Excel ────────────────────────────────────────

export const importSupperTeachersApi = (file: File, adminId?: number | null) => {
  const fd = new FormData();
  fd.append('file', file);
  if (adminId) fd.append('adminId', String(adminId));
  return axios.post<ApiRes<ImportResult>>('/api/admin/supper-teachers/import', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }).then(r => r.data);
};

export const downloadTemplateUrl = '/api/admin/supper-teachers/template';

export const fetchInstructorProfile = (userId: number) =>
  axios.get<ApiRes<InstructorProfile | null>>(`/api/admin/supper-teachers/${userId}/profile`).then(r => r.data);
