/**
 * Source of truth for HTTP APIs. Paths are full client paths (/api/...).
 * Permission match: longest prefix wins for (method, path) rows.
 */
const P = (
  method,
  path,
  featureGroup,
  description,
  isPublic = false,
  pattern = null,
  sortOrder = 0,
) => ({
  method,
  path,
  pattern: pattern || path,
  featureGroup,
  description,
  isPublic,
  sortOrder,
});

export const API_REGISTRY = [
  P('POST', '/api/user/login', 'Auth', 'Login', true),
  P('POST', '/api/user/logout', 'Auth', 'Logout', true),
  P('GET', '/api/account', 'Auth', 'Account session', true),
  P('GET', '/api/auth/setup', 'Auth', 'Verify setup token', true, '/api/auth/setup/:token'),
  P('POST', '/api/auth/setup-password', 'Auth', 'Set password', true),
  P('POST', '/api/auth/forgot-password', 'Auth', 'Forgot password', true),

  P('GET', '/api/users', 'Người dùng', 'List users'),
  P('POST', '/api/users', 'Người dùng', 'Create user'),
  P('PUT', '/api/users', 'Người dùng', 'Update user'),
  P('DELETE', '/api/users', 'Người dùng', 'Delete user'),

  P('GET', '/api/hocvien/portal/me', 'Học viên', 'Portal profile'),
  P('POST', '/api/hocvien/portal/avatar', 'Học viên', 'Upload avatar HV'),
  P('GET', '/api/hocvien', 'Học viên', 'List / detail / KQSH routes', false, '/api/hocvien…'),
  P('POST', '/api/hocvien/register', 'Học viên', 'Register học viên'),
  P('POST', '/api/hocvien/send-credentials', 'Học viên', 'Send credentials'),
  P('PUT', '/api/hocvien', 'Học viên', 'Update học viên', false, '/api/hocvien/:id'),
  P('DELETE', '/api/hocvien', 'Học viên', 'Delete học viên', false, '/api/hocvien/:id'),

  P('GET', '/api/student-assignment', 'Phân công', 'List assignments'),
  P('POST', '/api/student-assignment', 'Phân công', 'Create assignment'),
  P('PUT', '/api/student-assignment', 'Phân công', 'Update assignment', false, '/api/student-assignment/:id'),
  P('DELETE', '/api/student-assignment', 'Phân công', 'Delete assignment', false, '/api/student-assignment/:id'),

  P('GET', '/api/teacher-profile', 'Giáo viên', 'Get teacher profile', false, '/api/teacher-profile/:userId'),
  P('PUT', '/api/teacher-profile', 'Giáo viên', 'Update teacher profile', false, '/api/teacher-profile/:userId'),
  P('POST', '/api/teacher-avatar', 'Giáo viên', 'Upload teacher avatar', false, '/api/teacher-avatar/:userId'),
  P('GET', '/api/teacher-course', 'Giáo viên', 'Teacher course assignments'),
  P('POST', '/api/teacher-course', 'Giáo viên', 'Set teacher courses'),
  P('GET', '/api/teacher/my-students', 'Giáo viên', 'My students'),
  P('GET', '/api/public/teachers', 'Giáo viên', 'Public teachers', true),
  P('GET', '/api/teacher/students', 'KQSH', 'Teacher student KQSH', false, '/api/teacher/students/:hocVienId/kqsh'),

  P('GET', '/api/student-portal/my-progress', 'Portal HV', 'My progress'),
  P('GET', '/api/student-portal/teachers', 'Portal HV', 'Teachers list'),
  P('POST', '/api/student-portal/rate', 'Portal HV', 'Rate teacher'),
  P('GET', '/api/student-portal/ket-qua-sat-hanh', 'Portal HV', 'My KQSH'),

  P('POST', '/api/admin/kqsh/sync', 'KQSH', 'Sync KQSH'),
  P('GET', '/api/admin/kqsh/test-connection', 'KQSH', 'Test MSSQL'),

  P('GET', '/api/chat', 'Chat', 'Chat history', false, '/api/chat/:assignmentId/messages'),

  P('GET', '/api/students', 'Thí sinh', 'Students info', true),
  P('GET', '/api/students_SBD', 'Thí sinh', 'Students by SBD'),
  P('POST', '/api/students/update-processtest', 'Thí sinh', 'Update process test', true),
  P('POST', '/api/students/status/bulk', 'Thí sinh', 'Bulk status'),
  P('POST', '/api/students/resetall', 'Thí sinh', 'Reset all'),
  P('DELETE', '/api/students', 'Thí sinh', 'Reset exams', false, '/api/students/:id/exams'),
  P('POST', '/api/students/update-print-status', 'Thí sinh', 'Update print status'),

  P('GET', '/api/course', 'Khóa học', 'Courses', true),
  P('DELETE', '/api/course', 'Khóa học', 'Delete course', false, '/api/course/:id'),

  P('GET', '/api/status', 'Trạng thái', 'List status', true),
  P('POST', '/api/status', 'Trạng thái', 'Create status'),
  P('PUT', '/api/status', 'Trạng thái', 'Update status', false, '/api/status/:id'),
  P('DELETE', '/api/status', 'Trạng thái', 'Delete status', false, '/api/status/:id'),

  P('GET', '/api/rank/getRank', 'Hạng thi', 'List ranks', true),
  P('POST', '/api/rank/create-rank', 'Hạng thi', 'Create rank'),
  P('PUT', '/api/rank/update-rank', 'Hạng thi', 'Update rank', false, '/api/rank/update-rank/:id'),
  P('DELETE', '/api/rank', 'Hạng thi', 'Delete rank', false, '/api/rank/:id'),

  P('GET', '/api/subject', 'Môn thi', 'Subject routes', false, '/api/subject/…'),
  P('POST', '/api/subject/create-subject', 'Môn thi', 'Create subject'),
  P('PUT', '/api/subject/update-subject', 'Môn thi', 'Update subject', false, '/api/subject/update-subject/:IDsubject'),
  P('DELETE', '/api/subject', 'Môn thi', 'Delete subject', false, '/api/subject/:id'),

  P('GET', '/api/test/get-test', 'Bộ đề', 'Get test', true, '/api/test/get-test/:IDTest'),
  P('GET', '/api/testStudent/subject', 'Bộ đề', 'TestStudent subject'),
  P('POST', '/api/testStudent/processExcelAndInsert', 'Bộ đề', 'Import questions Excel'),
  P('GET', '/api/review/sets', 'Bộ đề', 'Review sets', true, '/api/review/sets/:rankId'),
  P('GET', '/api/review/set', 'Bộ đề', 'Review set questions', true, '/api/review/set/:setId/questions'),
  P('POST', '/api/review/sets/generate', 'Bộ đề', 'Generate review sets', false, '/api/review/sets/generate/:rankId'),
  P('POST', '/api/review/tips/import', 'Bộ đề', 'Import tips'),
  P('POST', '/api/exam-sets/import', 'Bộ đề', 'Import exam sets'),

  P('POST', '/api/exam/create-exam', 'Kỳ thi', 'Create exam', true),
  P('DELETE', '/api/exam', 'Kỳ thi', 'Delete exam', false, '/api/exam/:id'),
  P('GET', '/api/exam/export-report', 'Kỳ thi', 'Export report'),
  P('POST', '/api/testpractice/receivetestpractice', 'Kỳ thi', 'Receive practice test', true),

  P('POST', '/api/file/namestandardizationfile', 'File & Import', 'Normalize filenames'),
  P('POST', '/api/file/createOrUpdateQuestion', 'File & Import', 'Create/update question file'),
  P('POST', '/api/file/qr/decode', 'File & Import', 'Decode QR'),
  P('POST', '/api/file/vnid/detect-info', 'File & Import', 'Detect VN ID'),
  P('POST', '/api/file/update-rank-student-with-excel', 'File & Import', 'Update rank from Excel'),
  P('POST', '/api/import-xml', 'File & Import', 'Import XML students'),
  P('POST', '/api/import-payment', 'File & Import', 'Import payment'),

  P('POST', '/api/gplx/lookup', 'GPLX', 'Lookup GPLX', true),
  P('GET', '/api/gplx/captcha-session', 'GPLX', 'Captcha session', true),
  P('GET', '/api/gplx/captcha-image', 'GPLX', 'Captcha image', true, '/api/gplx/captcha-image/:sessionId'),
  P('POST', '/api/gplx/import', 'GPLX', 'Import GPLX'),
  P('GET', '/api/gplx/list', 'GPLX', 'List GPLX'),

  P('POST', '/api/traffic-check/lookup', 'Tra cứu', 'Traffic lookup', true),

  P('GET', '/api/qr/list', 'QR Code', 'List QR'),
  P('POST', '/api/qr', 'QR Code', 'Create QR'),
  P('PUT', '/api/qr/update', 'QR Code', 'Update QR'),
  P('DELETE', '/api/qr', 'QR Code', 'Delete QR', false, '/api/qr/:id'),
  P('GET', '/api/courseQR', 'QR Code', 'List course QR'),
  P('POST', '/api/courseQR/add', 'QR Code', 'Add course QR'),
  P('PUT', '/api/courseqr', 'QR Code', 'Update course QR', false, '/api/courseqr/:id'),
  P('DELETE', '/api/courseqr', 'QR Code', 'Delete course QR', false, '/api/courseqr/:id'),

  P('POST', '/api/azure/generatetextfromimage', 'Azure OCR', 'Text from image'),
  P('POST', '/api/azure/generateformfromimage', 'Azure OCR', 'Form from image'),

  P('GET', '/api/admin/permissions/groups', 'Phân quyền', 'Groups & nested group roles'),
  P('POST', '/api/admin/permissions/groups', 'Phân quyền', 'Create group'),
  P('PUT', '/api/admin/permissions/groups', 'Phân quyền', 'Update group / set roles', false, '/api/admin/permissions/groups/:id…'),
  P('DELETE', '/api/admin/permissions/groups', 'Phân quyền', 'Delete group', false, '/api/admin/permissions/groups/:id'),
  P('GET', '/api/admin/permissions/roles', 'Phân quyền', 'List roles'),
  P('POST', '/api/admin/permissions/roles', 'Phân quyền', 'Create role'),
  P('PUT', '/api/admin/permissions/roles', 'Phân quyền', 'Update role', false, '/api/admin/permissions/roles/:id'),
  P('DELETE', '/api/admin/permissions/roles', 'Phân quyền', 'Delete role', false, '/api/admin/permissions/roles/:id'),
  P('GET', '/api/admin/permissions/users', 'Phân quyền', 'Permission users'),
  P('PUT', '/api/admin/permissions/users', 'Phân quyền', 'Set user group', false, '/api/admin/permissions/users/:id/group'),
  P('GET', '/api/admin/permissions/api-endpoints', 'Phân quyền', 'List API endpoints'),
  P('POST', '/api/admin/permissions/api-endpoints/sync', 'Phân quyền', 'Sync API registry'),
  P('PUT', '/api/admin/permissions/api-endpoints', 'Phân quyền', 'Update API endpoint', false, '/api/admin/permissions/api-endpoints/:id'),
  P('GET', '/api/admin/permissions/group-api', 'Phân quyền', 'Group–API matrix'),
  P('PUT', '/api/admin/permissions/group-api', 'Phân quyền', 'Set group API permissions'),

  P('POST', '/api/mezon/exchange', 'OAuth', 'Mezon exchange', true),
  P('GET', '/api/test', 'System', 'Health test', true),
];
