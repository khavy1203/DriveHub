import defaultStudentAvatar from '../../assets/avatars/default-student.png';
import defaultTeacherAvatar from '../../assets/avatars/default-teacher.png';

export { defaultStudentAvatar, defaultTeacherAvatar };

const TEACHER_ROLES = new Set(['GiaoVien', 'SupperTeacher', 'SupperAdmin']);

/**
 * Returns the correct default avatar based on user role.
 * Teachers / SupperTeachers / SupperAdmins → teacher avatar
 * Everyone else (students, users, admins) → student avatar
 */
export const getDefaultAvatar = (role: string | null | undefined): string => {
  if (role && TEACHER_ROLES.has(role)) return defaultTeacherAvatar;
  return defaultStudentAvatar;
};
