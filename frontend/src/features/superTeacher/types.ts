export type TeacherInTeam = {
  id: number;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  active: number;
  superTeacherId: number | null;
  teacherProfile?: {
    bio: string;
    licenseTypes: string;
    locationName: string;
    yearsExp: string;
    avatarUrl: string;
    isActive: number;
  } | null;
};

export type TrainingSnapshot = {
  courseProgressPct: number;
  syncStatus: 'success' | 'error' | 'pending';
  lastSyncAt: string | null;
};

export type StudentInTeam = {
  id: number;
  hocVienId: number;
  teacherId: number;
  teacherName: string | null;
  hocVien?: {
    id: number;
    HoTen: string;
    SoCCCD: string;
    NgaySinh?: string;
    GioiTinh?: string;
    phone?: string;
    DiaChi?: string;
    GhiChu?: string;
    trainingSnapshot?: TrainingSnapshot | null;
  } | null;
};

export type SupperTeacher = {
  id: number;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  active: number;
  teacherCount: number;
};

export type TeacherFormData = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export type SupperTeacherFormData = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export type TeacherReview = {
  id: number;
  stars: number;
  comment: string | null;
  createdAt: string;
  studentName: string | null;
  courseName: string | null;
};

export type RatingsTeacherCard = {
  id: number;
  username: string;
  avatarUrl: string | null;
  licenseTypes: string | null;
  locationName: string | null;
  avgStars: string;
  totalRatings: number;
  activeStudents: number;
  completedStudents: number;
  recentReviews: TeacherReview[];
};

export type RatingsOverviewData = {
  avgStars: string;
  totalReviews: number;
  completedRatio: string;
  teachers: RatingsTeacherCard[];
};

export type PublicSupperTeacher = {
  id: number;
  username: string;
  profile: {
    bio?: string;
    licenseTypes?: string;
    locationName?: string;
    avatarUrl?: string;
    yearsExp?: number;
  } | null;
  assistantCount: number;
  activeStudents: number;
  completedStudents: number;
  avgStars: string;
  totalRatings: number;
};

export type AssistantDetail = {
  id: number;
  username: string;
  avatarUrl: string | null;
  licenseTypes: string | null;
  avgStars: string;
  totalRatings: number;
  activeStudents: number;
  completedStudents: number;
  reviews: TeacherReview[];
};

export type SupperTeacherDetail = {
  id: number;
  username: string;
  profile: {
    bio?: string;
    licenseTypes?: string;
    locationName?: string;
    avatarUrl?: string;
    yearsExp?: number;
  } | null;
  isSupperTeacher: boolean;
  avgStars: string;
  totalRatings: number;
  activeStudents: number;
  completedStudents: number;
  assistants?: AssistantDetail[];
  reviews?: TeacherReview[];
};
