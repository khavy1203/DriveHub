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
import gplxController from "../controller/gplxController";


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
            let finalExt = ext ? ext : '.png';
            cb(null, `${file.fieldname}-${uniqueSuffix}${finalExt}`);
        },
    });
};

// Configure storages
const uploadImageText = multer({ storage: createDiskStorage(path.join(__dirname, '../upload/originTextImg')) });
const uploadStorageQR = multer({ storage: createDiskStorage(path.join(__dirname, '../upload/originQR')) });
const memoryUpload = multer({ storage: multer.memoryStorage() });

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

    routes.all("*", checkUserJwt, checkUserPermission);
    // CRUD API routes for status
    routes.get("/status", userStatusController.getAllStatus);
    routes.post("/status", userStatusController.createStatus); // Tạo mới trạng thái
    routes.put("/status/:id", userStatusController.updateStatus); // Cập nhật trạng thái
    routes.delete("/status/:id", userStatusController.deleteStatus); // Xóa trạng thái
    // routes.get("/status/getLastInfoStudents", userStatusController.getLastInfoStudents);           // Lấy tất cả user statuses

    routes.get("/students", userStatusController.getInfoStudents);           // Lấy tất cả user statuses
    routes.get("/students_SBD", userStatusController.getInfoStudentsSBD);
    routes.post("/students/status/bulk", userStatusController.bulkUpdateStudentStatus);
    routes.post("/students/update-processtest", userStatusController.updateProcesstest);
    routes.post("/students/resetall", userStatusController.resetall);
    routes.post("/students/update-print-status", studentController.updatePrintStatus);


    routes.get("/course", userStatusController.getCourse);
    routes.delete("/course/:id", userStatusController.deleteKhoaHoc);

    routes.post("/import-xml", memoryUpload.single('file'), userStatusController.handleImportXMLStudent); // Đính kèm middleware upload để xử lý file import học sinh
    routes.post("/import-payment", memoryUpload.single('file'), userStatusController.handleImportPaymentFile); // Đính kèm middleware upload để xử lý file

    //login
    routes.post("/user/login", loginRegisterController.handleLogin);
    routes.post("/user/logout", loginRegisterController.handleLogout);
    routes.get("/account", userController.getUserAccount);

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

    //rank
    routes.get('/rank/getRank', rankController.getRank)
    routes.post('/rank/create-rank', rankController.createRank)
    routes.put('/rank/update-rank/:id', rankController.updateRank)

    //subject
    routes.get('/subject/:rankId/get-subjects', subjectController.getSubject)
    routes.get('/subject/get-test/:IDSubject', subjectController.getTestFromSubject)

    routes.post('/subject/create-subject', subjectController.createSubject)
    routes.put('/subject/update-subject/:IDsubject', subjectController.updateSubject)

    //test
    routes.get('/test/get-test/:IDTest', testStudentController.getTest)


    //exam
    routes.post('/exam/create-exam', examController.createExam) //save exam
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

