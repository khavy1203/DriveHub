// Student default: casual guy with sunglasses
export const defaultStudentAvatar =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234f46e5'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23c7d2fe'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='20' fill='%23c7d2fe'/%3E%3Crect x='29' y='42' width='12' height='6' rx='3' fill='%231e1b4b'/%3E%3Crect x='59' y='42' width='12' height='6' rx='3' fill='%231e1b4b'/%3E%3Crect x='41' y='43' width='18' height='3' rx='1.5' fill='%231e1b4b'/%3E%3Crect x='22' y='30' width='56' height='8' rx='4' fill='%231e1b4b'/%3E%3C/svg%3E`;

// Teacher default: professional figure
export const defaultTeacherAvatar =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230369a1'/%3E%3Ccircle cx='50' cy='36' r='18' fill='%23bae6fd'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='20' fill='%23bae6fd'/%3E%3Crect x='42' y='54' width='16' height='20' rx='2' fill='%230c4a6e'/%3E%3Cpolygon points='42,54 50,48 58,54' fill='%23fbbf24'/%3E%3C/svg%3E`;

const TEACHER_ROLES = new Set(['GiaoVien', 'SupperTeacher', 'SupperAdmin']);

export const getDefaultAvatar = (role: string | null | undefined): string => {
  if (role && TEACHER_ROLES.has(role)) return defaultTeacherAvatar;
  return defaultStudentAvatar;
};
