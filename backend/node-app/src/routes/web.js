import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import userStatusController from "../controller/userStatusController";
import { checkUserJwt, checkUserPermission } from "../middleware/JWTaction";
import loginRegisterController from "../controller/loginRegisterController";
import fileController from "../controller/fileController";
import testStudentController from "../controller/testStudentController";
import rankController from "../controller/rankController";
import subjectController from "../controller/subjectController";
import examController from "../controller/examController";
import practicetestController from "../controller/practicetestController";
import azureController from "../controller/azureController";
import studentController from "../controller/studentController";
import courseQRController from "../controller/courseQRController";
import QRController from "../controller/QRController";
import trafficCheckController from "../controller/trafficCheckController";
import mezonController from "../controller/mezonController";
import userController from "../controller/userController";
import teacherCourseController from "../controller/teacherCourseController";
import teacherPortalController from "../controller/teacherPortalController";
import studentPortalController from "../controller/studentPortalController";
import teacherProfileController from "../controller/teacherProfileController";
import setupPasswordController from "../controller/setupPasswordController";
import hocvienController from "../controller/hocvienController";
import studentAssignmentController from "../controller/studentAssignmentController";
import gplxController from "../controller/gplxController";
import reviewSetController from "../controller/reviewSetController";
import examSetImportController from "../controller/examSetImportController";
import chatController from "../controller/chatController";
import notificationController from "../controller/notificationController";
import { triggerSync, getMyKQSH, testMssqlConnection, getHocVienKQSH, getTeacherStudentKQSH } from "../controller/kqshController";
import {
  getGroups, createGroup, updateGroup, deleteGroup,
  getRoles, createRole, updateRole, deleteRole,
  getGroupRoles, setGroupRoles,
  getPermissionUsers, setUserGroup,
  syncApiEndpoints, getApiEndpoints, updateApiEndpoint,
  getGroupApiMatrix, setGroupApiPermissions,
} from "../controller/permissionController";
import { getTrainingStudent, getTrainingAvatar, getTrainingSessionDetail } from "../controller/trainingPortalController";
import { getTrainingStudentCached, triggerSyncAll, getTrainingSyncStatus, importByCccdList } from "../controller/trainingSyncController";
import contactLeadController from "../controller/contactLeadController";
import { getAdminConfig, saveAdminConfig, testAdminConnection } from "../controller/adminConfigController";
import {
  listAdmins, getAdmin, createAdminHandler, updateAdminHandler,
  toggleAdminHandler, deleteAdminHandler,
  assignSupperTeacherHandler, detachSupperTeacherHandler,
  toggleFeaturedHandler,
} from "../controller/adminController";
import {
  uploadZip, importSupperTeachers, downloadTemplate, getInstructorProfile,
} from "../controller/supperTeacherImportController";
import {
  listMyTeachers, addTeacher, editTeacher, removeTeacher,
  listMyStudents, assignStudent, dropStudentHandler, updateStudentHandler, importCccd, ratingsOverview,
  listSupperTeachers, addSupperTeacher, editSupperTeacher, removeSupperTeacher,
  previewDeleteSupperTeacher, addTeacherByAdmin, moveTeacherToSupper, listTeachersInTeam, listTeachersWithoutSupper,
  promoteTeacher, demoteSuperTeacher, assignStudentToSTHandler,
} from "../controller/superTeacherController";


const routes = express.Router();

// Common utility for creating storage engines
const createDiskStorage = (destinationPath) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath, { recursive: true });
            }
            cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext = path.extname(file.originalname).toLowerCase(); // Lấy extension hiện tại

            // Nếu không có extension, thêm .png
            const finalExt = ext || '.png';
            cb(null, `${file.fieldname}-${uniqueSuffix}${finalExt}`);
        },
    });
};

// Configure storages
const uploadImageText = multer({ storage: createDiskStorage(path.join(__dirname, '../upload/originTextImg')) });
const uploadStorageQR = multer({ storage: createDiskStorage(path.join(__dirname, '../upload/originQR')) });
const memoryUpload = multer({ storage: multer.memoryStorage() });
const imageFileFilter = (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'));
};
const uploadTeacherAvatar = multer({
    storage: createDiskStorage(path.join(__dirname, '../upload/teacher-avatars')),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});
const uploadStudentAvatar = multer({
    storage: createDiskStorage(path.join(__dirname, '../upload/student-avatars')),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});

const NOTIFICATION_ALLOWED_TYPES = /^(image\/(jpeg|png|webp|gif)|application\/pdf|application\/vnd\.openxmlformats-officedocument\.(spreadsheetml\.sheet|wordprocessingml\.document)|application\/vnd\.ms-excel|application\/msword)$/;
const uploadNotificationFiles = multer({
    storage: createDiskStorage(path.join(__dirname, '../upload/notifications')),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (NOTIFICATION_ALLOWED_TYPES.test(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh, PDF, Excel hoặc Word'));
    },
});

const requireSupperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ EC: -1, DT: null, EM: 'Yêu cầu đăng nhập' });
    }
    if (req.user.groupWithRoles?.name !== 'SupperAdmin') {
        return res.status(403).json({ EC: -1, DT: null, EM: 'Chỉ SupperAdmin mới có quyền này' });
    }
    next();
};

const requireAdminOrAbove = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ EC: -1, DT: null, EM: 'Yêu cầu đăng nhập' });
    }
    const name = req.user.groupWithRoles?.name;
    if (name !== 'Admin' && name !== 'SupperAdmin') {
        return res.status(403).json({ EC: -1, DT: null, EM: 'Chỉ Admin mới có quyền này' });
    }
    next();
};

const initWebRoutes = (app) => {

    routes.get('/api/test', (req, res) => {
        res.status(200).json({ message: 'API is working!' });
    });

    // Traffic fine lookup
    routes.post('/traffic-check/lookup', trafficCheckController.lookupTrafficViolation);
    routes.get('/gplx/captcha-session', gplxController.getCaptchaSession);
    routes.get('/gplx/captcha-image/:sessionId', gplxController.getCaptchaImage);
    routes.post('/gplx/lookup', gplxController.lookupGPLX);
    routes.post('/mezon/exchange', mezonController.exchangeCode);
    routes.get('/public/teachers', teacherProfileController.getPublicTeachers);
    routes.get('/public/teachers/:id', teacherProfileController.getPublicTeacherDetail);
    routes.post('/public/contact-lead', contactLeadController.submitContactLead);

    // ── Public routes (không cần đăng nhập) — dùng cho thi ──────────────────
    routes.get("/students", userStatusController.getInfoStudents);
    routes.post("/students/update-processtest", userStatusController.updateProcesstest);
    routes.delete("/students/:id/exams", userStatusController.resetStudentExams);
    routes.get("/course", userStatusController.getCourse);
    routes.get('/rank/getRank', rankController.getRank);

    // Review sets (bộ đề ôn tập — separate from exam test sets)
    routes.get('/review/sets/:rankId', reviewSetController.getReviewSetsByRank);
    routes.get('/review/set/:setId/questions', reviewSetController.getReviewSetQuestions);
    routes.post('/review/sets/generate/:rankId', requireSupperAdmin, reviewSetController.generateReviewSets);
    routes.post('/review/tips/import', requireSupperAdmin, reviewSetController.batchImportTips);
    routes.get('/subject/:rankId/get-subjects', subjectController.getSubject);
    routes.get('/subject/get-test/:IDSubject', subjectController.getTestFromSubject);
    routes.get('/test/get-test/:IDTest', testStudentController.getTest);
    routes.post('/exam/create-exam', examController.createExam);

    // ── Account setup (public — no JWT required) ─────────────────────────────
    routes.get('/teacher/my-students', teacherPortalController.getMyStudents);
    routes.get('/teacher/students/:hocVienId/kqsh', getTeacherStudentKQSH);

    routes.get('/student-portal/my-progress', studentPortalController.getMyProgress);
    routes.get('/student-portal/teachers', studentPortalController.getTeachers);
    routes.post('/student-portal/rate', studentPortalController.submitRating);

    routes.get('/auth/setup/:token', setupPasswordController.verifySetupToken);
    routes.post('/auth/setup-password', setupPasswordController.setupPassword);
    routes.post('/auth/forgot-password', setupPasswordController.forgotPassword);
    routes.post('/auth/change-password', checkUserJwt, setupPasswordController.changePassword);

    // GET /account is registered below after JWT layer; checkUserJwt treats GET /account as
    // optional auth (200 + null DT when anonymous) for home / useAuth hydrate.

    routes.all("*", checkUserJwt, checkUserPermission);

    // CRUD API routes for status
    routes.get("/status", userStatusController.getAllStatus);
    routes.post("/status", userStatusController.createStatus);
    routes.put("/status/:id", userStatusController.updateStatus);
    routes.delete("/status/:id", userStatusController.deleteStatus);

    routes.get("/students_SBD", userStatusController.getInfoStudentsSBD);
    routes.post("/students/status/bulk", userStatusController.bulkUpdateStudentStatus);
    routes.post("/students/resetall", userStatusController.resetall);
    routes.post("/students/update-print-status", studentController.updatePrintStatus);

    routes.delete("/course/:id", userStatusController.deleteKhoaHoc);

    routes.post("/import-xml", requireSupperAdmin, memoryUpload.single('file'), userStatusController.handleImportXMLStudent);
    routes.post("/import-payment", requireSupperAdmin, memoryUpload.single('file'), userStatusController.handleImportPaymentFile);

    //login
    routes.post("/user/login", loginRegisterController.handleLogin);
    routes.post("/user/logout", loginRegisterController.handleLogout);
    /** Public session probe — anonymous returns EC:0, DT.access_token null */
    routes.get("/account", userController.getUserAccount);
    routes.get("/users", userController.readFunc);
    routes.post("/users", userController.createFunc);
    routes.put("/users", userController.updateFunc);
    routes.delete("/users", userController.deleteFunc);
    routes.get('/teacher-profile/me/full', teacherProfileController.getMyFullProfile);
    routes.put('/teacher-profile/me', teacherProfileController.updateMyProfile);
    routes.get('/teacher-profile/:userId', teacherProfileController.getProfile);
    routes.put('/teacher-profile/:userId', teacherProfileController.upsertProfile);
    routes.post('/teacher-avatar/:userId', uploadTeacherAvatar.single('avatar'), teacherProfileController.uploadAvatar);
    routes.get("/teacher-course", teacherCourseController.getAssignments);
    routes.post("/teacher-course", teacherCourseController.setAssignments);

    routes.get("/hocvien", hocvienController.listHocVien);
    routes.get("/hocvien/:id/kqsh", getHocVienKQSH);
    routes.post("/hocvien/register", hocvienController.registerStudent);
    routes.post("/hocvien/send-credentials", hocvienController.sendCredentials);
    routes.put("/hocvien/:id", hocvienController.updateHocVienInfo);
    routes.put("/hocvien/:id/reset-password", hocvienController.resetPassword);
    routes.delete("/hocvien/:id", hocvienController.deleteHocVien);
    routes.get("/hocvien/portal/me", hocvienController.getPortalData);
    routes.put("/hocvien/portal/profile", hocvienController.updateOwnProfile);
    routes.post("/hocvien/portal/avatar", uploadStudentAvatar.single('avatar'), hocvienController.uploadAvatar);

    routes.get("/student-assignment", studentAssignmentController.getAssignments);
    routes.post("/student-assignment", studentAssignmentController.createAssignment);
    routes.put("/student-assignment/:id", studentAssignmentController.updateAssignment);
    routes.delete("/student-assignment/:id", studentAssignmentController.deleteAssignment);

    routes.get("/chat/:assignmentId/messages", chatController.getHistory);

    // ── Notifications ────────────────────────────────────────────────────────
    routes.post("/notification", uploadNotificationFiles.array('files', 5), notificationController.create);
    routes.get("/notification/admin-history", notificationController.adminHistory);
    routes.delete("/notification/:id", notificationController.remove);
    routes.get("/notification/my", notificationController.my);
    routes.get("/notification/unread-count", notificationController.unreadCount);
    routes.put("/notification/read/:recipientId", notificationController.markRead);
    routes.put("/notification/read-all", notificationController.markAllRead);

    routes.get("/student-portal/ket-qua-sat-hanh", getMyKQSH);
    routes.post("/admin/kqsh/sync", requireAdminOrAbove, triggerSync);
    routes.get("/admin/kqsh/test-connection", requireAdminOrAbove, testMssqlConnection);

    // ── Permissions management ────────────────────────────────────────────────
    routes.get("/admin/permissions/groups", getGroups);
    routes.post("/admin/permissions/groups", createGroup);
    routes.put("/admin/permissions/groups/:id", updateGroup);
    routes.delete("/admin/permissions/groups/:id", deleteGroup);

    routes.get("/admin/permissions/roles", getRoles);
    routes.post("/admin/permissions/roles", createRole);
    routes.put("/admin/permissions/roles/:id", updateRole);
    routes.delete("/admin/permissions/roles/:id", deleteRole);

    routes.get("/admin/permissions/groups/:id/roles", getGroupRoles);
    routes.put("/admin/permissions/groups/:id/roles", setGroupRoles);

    routes.get("/admin/permissions/users", getPermissionUsers);
    routes.put("/admin/permissions/users/:id/group", setUserGroup);

    routes.get("/admin/permissions/api-endpoints", getApiEndpoints);
    routes.post("/admin/permissions/api-endpoints/sync", syncApiEndpoints);
    routes.put("/admin/permissions/api-endpoints/:id", updateApiEndpoint);
    routes.get("/admin/permissions/group-api", getGroupApiMatrix);
    routes.put("/admin/permissions/group-api", setGroupApiPermissions);

    // ── SupperTeacher: manage own team ───────────────────────────────────────
    routes.get('/super-teacher/teachers', listMyTeachers);
    routes.post('/super-teacher/teachers', addTeacher);
    routes.put('/super-teacher/teachers/:teacherId', editTeacher);
    routes.delete('/super-teacher/teachers/:teacherId', removeTeacher);
    routes.get('/super-teacher/students', listMyStudents);
    routes.post('/super-teacher/assign-student', assignStudent);
    routes.put('/super-teacher/students/:hocVienId', updateStudentHandler);
    routes.delete('/super-teacher/students/:hocVienId', dropStudentHandler);
    routes.post('/super-teacher/import-cccd', importCccd);
    routes.get('/super-teacher/ratings-overview', ratingsOverview);

    // ── SupperAdmin: manage SupperTeachers ───────────────────────────────────
    routes.get('/admin/supper-teachers', listSupperTeachers);
    routes.post('/admin/supper-teachers', addSupperTeacher);
    // Static paths before :id param
    routes.post('/admin/supper-teachers/import', uploadZip, importSupperTeachers);
    routes.get('/admin/supper-teachers/template', downloadTemplate);
    routes.put('/admin/supper-teachers/:id', editSupperTeacher);
    routes.delete('/admin/supper-teachers/:id', removeSupperTeacher);
    routes.get('/admin/supper-teachers/:id/preview-delete', previewDeleteSupperTeacher);
    routes.get('/admin/supper-teachers/:id/teachers', listTeachersInTeam);
    routes.post('/admin/teachers-with-super', addTeacherByAdmin);
    routes.put('/admin/teachers/:teacherId/assign-super', moveTeacherToSupper);
    routes.get('/admin/teachers-without-super', listTeachersWithoutSupper);
    routes.put('/admin/teachers/:teacherId/promote', promoteTeacher);
    routes.put('/admin/supper-teachers/:id/demote', demoteSuperTeacher);
    routes.get('/admin/supper-teachers/:id/profile', getInstructorProfile);
    routes.post('/admin/assign-student-to-st', assignStudentToSTHandler);

    routes.get("/training/student", getTrainingStudent);
    routes.get("/training/student-cached", getTrainingStudentCached);
    routes.get("/training/avatar", getTrainingAvatar);
    routes.get("/training/session-detail", getTrainingSessionDetail);
    routes.post("/training/sync-all", requireAdminOrAbove, triggerSyncAll);
    routes.post("/training/import-cccd", importByCccdList);
    routes.get("/training/sync-status", getTrainingSyncStatus);

    // Admin management (SupperAdmin only)
    routes.get("/admins", listAdmins);
    routes.post("/admins", createAdminHandler);
    // Static sub-paths must come before /:adminId param routes
    routes.delete("/admins/supper-teachers/:supperTeacherId", detachSupperTeacherHandler);
    routes.get("/admins/:adminId", getAdmin);
    routes.put("/admins/:adminId", updateAdminHandler);
    routes.patch("/admins/:adminId/toggle-active", toggleAdminHandler);
    routes.patch("/admins/:adminId/toggle-featured", toggleFeaturedHandler);
    routes.delete("/admins/:adminId", deleteAdminHandler);
    routes.post("/admins/:adminId/supper-teachers", assignSupperTeacherHandler);

    // Admin server config
    routes.get("/admin/api-config", getAdminConfig);
    routes.put("/admin/api-config", saveAdminConfig);
    routes.post("/admin/api-config/test", testAdminConnection);
    // SupperAdmin can query any admin's config
    routes.get("/admin/api-config/:adminId", getAdminConfig);
    routes.post("/admin/api-config/:adminId/test", testAdminConnection);

    //file 
    routes.post("/file/namestandardizationfile", requireSupperAdmin, fileController.nameStandardizationFile);
    routes.post("/file/createOrUpdateQuestion", requireSupperAdmin, memoryUpload.single('file'), fileController.createOrUpdateQuestion);
    routes.post(
        "/file/qr/decode",
        uploadStorageQR.single('image'), // Middleware để xử lý hình ảnh
        fileController.decodeQR
    );
    routes.post(
        "/file/vnid/detect-info",
        uploadStorageQR.single('image'), // Middleware để xử lý hình ảnh
        fileController.decodeVNID
    );
    routes.post("/file/update-rank-student-with-excel", requireSupperAdmin, memoryUpload.single('file'), fileController.updateRankStudentWithExcel);

    //test student - subject
    routes.get("/testStudent/subject", testStudentController.getSubject);
    routes.post("/testStudent/processExcelAndInsert", requireSupperAdmin, memoryUpload.single('file'), testStudentController.processExcelAndInsert);
    routes.post("/exam-sets/import", requireSupperAdmin, memoryUpload.single('file'), examSetImportController.importReviewSets);

    //rank
    routes.post('/rank/create-rank', requireSupperAdmin, rankController.createRank)
    routes.put('/rank/update-rank/:id', requireSupperAdmin, rankController.updateRank)
    routes.delete('/rank/:id', requireSupperAdmin, rankController.deleteRank)

    //subject
    routes.post('/subject/create-subject', requireSupperAdmin, subjectController.createSubject)
    routes.put('/subject/update-subject/:IDsubject', requireSupperAdmin, subjectController.updateSubject)
    routes.delete('/subject/:id', requireSupperAdmin, subjectController.deleteSubject)

    //exam
    routes.delete("/exam/:id", examController.deleteExam)
    routes.get("/exam/export-report", examController.exportReport);

    //receive gift Test
    routes.post('/testpractice/receivetestpractice', practicetestController.receiveTestPractice) //save exam

    //azure API
    routes.post('/azure/generatetextfromimage', uploadImageText.single("image"), azureController.getGenerateImage) //save exam
    routes.post('/azure/generateformfromimage', uploadImageText.single("image"), azureController.getGenerateFormImage) //save exam

    //QR
    routes.get('/courseQR', courseQRController.getCourseQR);
    routes.post('/courseQR/add', courseQRController.createCourseQR);
    routes.put('/courseqr/:id', courseQRController.updateCourseQR);
    routes.delete('/courseqr/:id', courseQRController.deleteCourseQR);
    routes.get("/qr/list", QRController.getListQR);
    routes.put("/qr/update", QRController.updateQR);
    routes.post("/qr", QRController.createQR);
    routes.delete("/qr/:id", QRController.deleteQR);

    routes.post('/gplx/import', requireSupperAdmin, memoryUpload.single('file'), gplxController.importExcel);
    routes.get('/gplx/list', gplxController.getList);

    return app.use("/api", routes);
};

export default initWebRoutes;

