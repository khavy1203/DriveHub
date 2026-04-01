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
import {
  listMyTeachers, addTeacher, editTeacher, removeTeacher,
  listMyStudents, assignStudent, dropStudentHandler, importCccd, ratingsOverview,
  listSupperTeachers, addSupperTeacher, editSupperTeacher, removeSupperTeacher,
  previewDeleteSupperTeacher, addTeacherByAdmin, moveTeacherToSupper, listTeachersInTeam, listTeachersWithoutSupper,
  promoteTeacher, demoteSuperTeacher,
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
    routes.post('/review/sets/generate/:rankId', reviewSetController.generateReviewSets);
    routes.post('/review/tips/import', reviewSetController.batchImportTips);
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

    routes.post("/import-xml", memoryUpload.single('file'), userStatusController.handleImportXMLStudent); // Đính kèm middleware upload để xử lý file import học sinh
    routes.post("/import-payment", memoryUpload.single('file'), userStatusController.handleImportPaymentFile); // Đính kèm middleware upload để xử lý file

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

    routes.get("/student-portal/ket-qua-sat-hanh", getMyKQSH);
    routes.post("/admin/kqsh/sync", triggerSync);
    routes.get("/admin/kqsh/test-connection", testMssqlConnection);

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
    routes.delete('/super-teacher/students/:hocVienId', dropStudentHandler);
    routes.post('/super-teacher/import-cccd', importCccd);
    routes.get('/super-teacher/ratings-overview', ratingsOverview);

    // ── SupperAdmin: manage SupperTeachers ───────────────────────────────────
    routes.get('/admin/supper-teachers', listSupperTeachers);
    routes.post('/admin/supper-teachers', addSupperTeacher);
    routes.put('/admin/supper-teachers/:id', editSupperTeacher);
    routes.delete('/admin/supper-teachers/:id', removeSupperTeacher);
    routes.get('/admin/supper-teachers/:id/preview-delete', previewDeleteSupperTeacher);
    routes.get('/admin/supper-teachers/:id/teachers', listTeachersInTeam);
    routes.post('/admin/teachers-with-super', addTeacherByAdmin);
    routes.put('/admin/teachers/:teacherId/assign-super', moveTeacherToSupper);
    routes.get('/admin/teachers-without-super', listTeachersWithoutSupper);
    routes.put('/admin/teachers/:teacherId/promote', promoteTeacher);
    routes.put('/admin/supper-teachers/:id/demote', demoteSuperTeacher);

    routes.get("/training/student", getTrainingStudent);
    routes.get("/training/student-cached", getTrainingStudentCached);
    routes.get("/training/avatar", getTrainingAvatar);
    routes.get("/training/session-detail", getTrainingSessionDetail);
    routes.post("/training/sync-all", triggerSyncAll);
    routes.post("/training/import-cccd", importByCccdList);
    routes.get("/training/sync-status", getTrainingSyncStatus);

    //file 
    routes.post("/file/namestandardizationfile", fileController.nameStandardizationFile);
    routes.post("/file/createOrUpdateQuestion", memoryUpload.single('file'), fileController.createOrUpdateQuestion);
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
    routes.post("/file/update-rank-student-with-excel", memoryUpload.single('file'), fileController.updateRankStudentWithExcel);

    //test student - subject
    routes.get("/testStudent/subject", testStudentController.getSubject);
    routes.post("/testStudent/processExcelAndInsert", memoryUpload.single('file'), testStudentController.processExcelAndInsert); //upload 600 question and test
    routes.post("/exam-sets/import", memoryUpload.single('file'), examSetImportController.importReviewSets);

    //rank
    routes.post('/rank/create-rank', rankController.createRank)
    routes.put('/rank/update-rank/:id', rankController.updateRank)
    routes.delete('/rank/:id', rankController.deleteRank)

    //subject
    routes.post('/subject/create-subject', subjectController.createSubject)
    routes.put('/subject/update-subject/:IDsubject', subjectController.updateSubject)
    routes.delete('/subject/:id', subjectController.deleteSubject)

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

    routes.post('/gplx/import', memoryUpload.single('file'), gplxController.importExcel);
    routes.get('/gplx/list', gplxController.getList);

    return app.use("/api", routes);
};

export default initWebRoutes;

