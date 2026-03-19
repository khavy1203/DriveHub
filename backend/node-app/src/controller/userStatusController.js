import userStatusService from "../service/userStatusService";
import { sendImportStatus } from '../websocket/wsStudentStatusServer.js';
const getCourse = async (req, res) => {
    try {
        // Truy vấn thông tin từ bảng thisinh, khoahoc_thisinh, và status
        const data = await userStatusService.getCourse();
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        res.status(500).json({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: '',
        });
    }
};


const getInfoStudents = async (req, res) => {
    try {
        // Lấy thông tin từ query string
        const { IDKhoaHoc, SoBaoDanh, IDThiSinh } = req.query;
        const data = await userStatusService.getInfoStudents(IDKhoaHoc, SoBaoDanh, IDThiSinh);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });

    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        res.status(500).json({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: '',
        });
    }
};



const createStatus = async (req, res) => {
    try {
        const { namestatus } = req.body;
        const data = await userStatusService.createStatus(namestatus);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { namestatus } = req.body;
        const data = await userStatusService.updateStatus(id, namestatus);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        });
    }
};

const deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await userStatusService.deleteStatus(id);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        });
    }
};

const handleImportXMLStudent = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ EM: 'No file provided', EC: 2, DT: [] });
        }

        // Trả về ngay, xử lý import ở background
        res.status(200).json({
            EM: 'Đang xử lý import, vui lòng chờ thông báo hoàn thành...',
            EC: 0,
            DT: []
        });

        // Chạy import sau khi đã trả response
        setImmediate(async () => {
            try {
                const data = await userStatusService.handleImportXMLStudent(req.file);
                await sendImportStatus({ EC: data.EC, EM: data.EM, DT: data.DT });
            } catch (err) {
                console.error('Background import error:', err);
                await sendImportStatus({ EC: -1, EM: 'Import thất bại: ' + err.message, DT: [] });
            }
        });
    }
    catch (error) {
        console.error("Error processing XML:", error);
        return res.status(500).json({
            EM: 'Error processing XML file',
            EC: -1,
            DT: ''
        });
    }
}



const getAllStatus = async (req, res) => {
    try {
        const data = await userStatusService.getAllStatus();
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        res.status(500).json({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: '',
        });
    }
};

const getInfoStudentsSBD = async (req, res) => {
    try {
        const { IDKhoaHoc, SoBaoDanh, CCCD } = req.query;
        const data = await userStatusService.getInfoStudentsSBD(IDKhoaHoc, SoBaoDanh, CCCD);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        res.status(500).json({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: '',
        });
    }
};


const updateStudentStatus = async (req, res) => {
    try {
        const { IDKhoaHoc, SoBaoDanh, status } = req.body;
        const data = await userStatusService.updateStudentStatus(IDKhoaHoc, SoBaoDanh, status);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        console.error("Error updating student status:", error);
        return res.status(500).json({
            EM: 'Server error',
            EC: -1,
            DT: '',
        });
    }
};

const bulkUpdateStudentStatus = async (req, res) => {
    try {
        const { IDKhoaHoc, SoBaoDanhList, status } = req.body;
        const data = await userStatusService.bulkUpdateStudentStatus(IDKhoaHoc, SoBaoDanhList, status);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });

    } catch (error) {
        return res.json({ EC: -1, EM: "Có lỗi xảy ra khi cập nhật trạng thái" });
    }
}

const handleImportPaymentFile = async (req, res) => {
    try {
        const file = req.file;
        const IDKhoaHoc = req?.body?.IDKhoaHoc;
        const data = await userStatusService.handleImportPaymentFile(file, IDKhoaHoc);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        console.error('Lỗi xử lý file:', error);
        return res.status(500).json({ EC: 1, EM: 'Lỗi xử lý file', ErrorDetail: error.message });
    }
};

const updateProcesstest = async (req, res) => {
    try {
        const { IDThiSinh, processtest } = req.body;
        const data = await userStatusService.updateProcesstest(IDThiSinh, processtest);
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        });
    }
};

const resetall = async (req, res) => {
    try {
        const { IDThiSinh, processtest } = req.body;
        const data = await userStatusService.resetall();
        return res.status(200).json({
            EM: data.EM,//error message
            EC: data.EC,//error code
            DT: data.DT
        });
    } catch (error) {
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        });
    }
};



const deleteKhoaHoc = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ EM: 'Thiếu IDKhoaHoc', EC: -1, DT: '' });
        const data = await userStatusService.deleteKhoaHoc(id);
        return res.status(200).json({ EM: data.EM, EC: data.EC, DT: data.DT });
    } catch (error) {
        return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: '' });
    }
};

export default {
    getInfoStudents,
    createStatus,
    updateStatus,
    deleteStatus,
    handleImportXMLStudent,
    getCourse,
    getAllStatus,
    updateStudentStatus,
    getInfoStudentsSBD,
    // updateList
    bulkUpdateStudentStatus,
    handleImportPaymentFile,
    updateProcesstest,
    resetall,
    deleteKhoaHoc,
    resetStudentExams: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ EM: 'Thiếu IDThiSinh', EC: -1, DT: '' });
            const data = await userStatusService.resetStudentExams(id);
            return res.status(200).json({ EM: data.EM, EC: data.EC, DT: data.DT });
        } catch (error) {
            return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: '' });
        }
    }
};
