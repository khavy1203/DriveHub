export const defaultStudentAvatar = '/avatars/default-student.png';
export const defaultTeacherAvatar = '/avatars/default-teacher.png';

const TEACHER_ROLES = new Set(['GiaoVien', 'SupperTeacher', 'SupperAdmin']);

export const getDefaultAvatar = (role: string | null | undefined): string => {
  if (role && TEACHER_ROLES.has(role)) return defaultTeacherAvatar;
  return defaultStudentAvatar;
};
