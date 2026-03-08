/**
 * Application routes constants
 * @module core/constants/routes
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  STUDENT_LIST: '/students',
  TEST_STUDENT: '/teststudent',
  QR_SCANNER: '/qr-scanner',
  FINAL_EXAM: '/finalexam',
  DASHBOARD: '/dashboard',
  PAYMENT_UPLOAD: '/upload/payment',
} as const;

export const WS_PATHS = {
  STUDENT_STATUS: '/ws/student-status',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
