import db from "../models/index.js"; // Sequelize models
require("dotenv").config();
const { Op, Model } = require("sequelize");
import { parseStringPromise } from 'xml2js';
import { sendStatusUpdate, sendStudentDashBoardUpdate } from '../websocket/wsStudentStatusServer.js';
import userServices from './userServices.js';
import XLSX from 'xlsx';
import file from "../utils/file.js"
const fs = require('fs');
const path = require('path');
const getCourse = async () => {
    try {
        // Truy vấn thông tin từ bảng thisinh, khoahoc_thisinh, và status
        const courseInfo = await db.khoahoc.findAll({ order: [['NgayThi', 'ASC']] });
        return ({
            EM: 'Lấy thông tin thí sinh thành công',
            EC: 0,
            DT: courseInfo,
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        return ({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: [],
        });
    }
};


const getInfoStudents = async (IDKhoaHoc, SoBaoDanh, IDThiSinh = null) => {
    try {
        const resUserInFor = await userServices.getInfoStudentServices(IDKhoaHoc, SoBaoDanh, IDThiSinh)
        return ({
            EM: resUserInFor.EM,
            EC: resUserInFor.EC,
            DT: resUserInFor.DT,
        });

    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        return ({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: [],
        });
    }
};



const createStatus = async (namestatus) => {
    try {
        if (!namestatus) {
            return ({
                EM: 'Some field null',//error message
                EC: 2,//error code
                DT: []
            });
        }
        const newStatus = await db.status.create({ namestatus });
        return ({
            EM: 'Create success',//error message
            EC: 0,//error code
            DT: newStatus
        });
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const updateStatus = async (id, namestatus) => {
    try {
        if (!id || !namestatus)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });
        const status = await db.status.findByPk(id);
        if (!status) {
            return ({
                EM: 'Can find key',//error message
                EC: 1,//error code
                DT: []
            });
        }
        const updateUser = await status.update({ namestatus });
        sendStatusUpdate(updateUser);
        return ({
            EM: 'Update success',//error message
            EC: 0,//error code
            DT: status
        });
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const deleteStatus = async (id) => {
    try {
        if (!id)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        const status = await db.status.findByPk(id);
        if (!status) {
            return ({
                EM: 'Cane find key',//error message
                EC: 1,//error code
                DT: []
            });
        }
        await status.destroy();
        return ({
            EM: 'Delete Success',//error message
            EC: 0,//error code
            DT: []
        });
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const handleImportXMLStudent = async (file) => {
    if (!file) {
        return ({
            EM: 'No file provided',
            EC: 2,
            DT: []
        });
    }

    try {
        const xmlData = file.buffer.toString();
        const parsedData = await parseStringPromise(xmlData);

        // Lấy thông tin khóa học từ KY_SH
        const kySh = parsedData.SAT_HACH.DATA[0].KY_SH[0];
        const tenKhoaHoc = kySh.$.xmlns;
        const maKySH = kySh.MAKYSH[0];
        const ngaySH = kySh.NGAYSH[0];

        // Tạo hoặc lấy khóa học (IDKhoaHoc sẽ là maKySH)
        const [khoaHoc] = await db.khoahoc.findOrCreate({
            where: { IDKhoaHoc: maKySH },
            defaults: {
                IDKhoaHoc: maKySH,
                TenKhoaHoc: tenKhoaHoc,
                NgayThi: ngaySH,
                TrungTam: kySh.MATTSH[0],
                TrangThai: 1,
            }
        });

        // Lấy danh sách người lái xe từ NGUOI_LXS
        const nguoiLxs = parsedData.SAT_HACH.DATA[0].NGUOI_LXS[0].NGUOI_LX || [];
        const maDangKyList = nguoiLxs.map((nguoi) => nguoi?.MA_DK[0]);

        // Lấy dữ liệu hiện tại từ cơ sở dữ liệu
        const existingThiSinh = await db.thisinh.findAll({
            where: { IDKhoaHoc: maKySH },
            attributes: ['Ma_Dang_Ky', 'IDThiSinh']
        });

        const existingKhoahocThisinh = await db.khoahoc_thisinh.findAll({
            where: { IDKhoaHoc: maKySH },
            attributes: ['IDThiSinh', 'SoBaoDanh']
        });

        // Tạo Map để tra cứu nhanh
        const existingThiSinhMap = new Map(
            existingThiSinh.map((t) => [t.Ma_Dang_Ky, t.IDThiSinh])
        );
        const existingKhoahocThisinhMap = new Map(
            existingKhoahocThisinh.map((entry) => [entry.IDThiSinh, entry.SoBaoDanh])
        );

        // Bộ đếm số lượng
        let successfulImports = 0;
        let failedImports = 0;
        const failedDetails = [];
        const thiSinhData = [];
        const khoahocThisinhData = [];

        // const token = await getTokenNLTB_LOCAL();
        // console.log('check token', token)

        for (const nguoi of nguoiLxs) {
            try {
                const maDangKy = nguoi?.MA_DK[0];
                const hoTen = nguoi?.HO_VA_TEN[0];
                let ngaySinhStr = nguoi?.NGAY_SINH[0];
                const soCMT = nguoi?.SO_CMT[0];
                const hangGPLX = nguoi?.HO_SO[0]?.HANG_GPLX[0];
                const sbd = nguoi?.HO_SO[0]?.SO_BAO_DANH[0] || 999;
                const anh = nguoi?.HO_SO[0].ANH_CHAN_DUNG[0];

                // Kiểm tra và thiết lập giá trị mặc định cho ngaySinh nếu không hợp lệ
                if (isNaN(Date.parse(ngaySinh))) {
                    ngaySinh = new Date(); // Sử dụng ngày hiện tại nếu ngaySinh không hợp lệ
                } else {
                    ngaySinh = new Date(ngaySinh);
                }

                let ngaySinh = new Date();
                if (ngaySinhStr && ngaySinhStr.length === 8 && !isNaN(ngaySinhStr)) {
                    const year = parseInt(ngaySinhStr.substring(0, 4), 10);
                    const month = parseInt(ngaySinhStr.substring(4, 6), 10) - 1; // Tháng trong JS từ 0-11
                    const day = parseInt(ngaySinhStr.substring(6, 8), 10);
                    ngaySinh = new Date(year, month, day);
                }


                // Kiểm tra xem Ma_Dang_Ky đã tồn tại trong database chưa (trong tất cả các kỳ thi)
                const existingThiSinhLast = await db.thisinh.findOne({
                    where: {
                        Ma_Dang_Ky: maDangKy, IDKhoaHoc: {
                            [Op.ne]: maKySH
                        }
                    },
                    include: [
                        {
                            model: db.khoahoc,
                            as: 'khoahoc',
                        }
                    ],
                    order: [['createdAt', 'DESC']], // Lấy bản ghi mới nhất
                    raw: true,
                    nest: true
                });
                // Nếu thí sinh chưa tồn tại, thêm vào bảng `thisinh`
                let thiSinhId = existingThiSinhMap.get(maDangKy);
                // Sao chép bài kiểm tra từ kỳ thi trước (nếu có)

                if (!thiSinhId) {

                    let studentInfo = null;
                    let fileAvatar = path.resolve(__dirname, '../asset/ImageStudent/', `${maDangKy}.jpg`);

                    // if (!!token && !fs.existsSync(fileAvatar)) {
                    //     const getInforAddStudent = await fetchDataStudentWithToken(maDangKy, token);
                    //     studentInfo = getInforAddStudent?.Data[getInforAddStudent.total_count - 1];
                    //     fileAvatar = await file.saveBase64Image(studentInfo?.srcAvatar, maDangKy);
                    // }

                    const newThiSinh = await db.thisinh.create({
                        IDKhoaHoc: maKySH,
                        Ma_Dang_Ky: maDangKy,
                        Ma_Ky_SH: maKySH,
                        HoTen: hoTen,
                        NgaySinh: ngaySinh,
                        SoCMT: soCMT,
                        loaibangthi: hangGPLX,
                        Anh: `/asset/ImageStudent/${maDangKy}.jpg`
                    });
                    thiSinhId = newThiSinh.IDThiSinh;

                    if (!!existingThiSinhLast) {
                        const previousExams = await db.exam.findAll({
                            where: { IDThisinh: existingThiSinhLast?.IDThiSinh },
                            include: [
                                {
                                    model: db.subject
                                }
                            ],
                        });
                        for (const exam of previousExams) {
                            await db.exam.create({
                                IDThisinh: thiSinhId,
                                IDTest: exam.IDTest,
                                answerlist: exam.answerlist,
                                point: exam.point,
                                result: exam.result,
                                IDSubject: exam.IDSubject,
                                note: !!existingThiSinhLast?.khoahoc ? existingThiSinhLast?.khoahoc?.TenKhoaHoc : ""
                            });
                        }
                    }
                }

                // Nếu thí sinh chưa tồn tại trong `khoahoc_thisinh`, thêm vào bảng
                if (!existingKhoahocThisinhMap.has(thiSinhId)) {
                    khoahocThisinhData.push({
                        IDKhoaHoc: maKySH,
                        IDThiSinh: thiSinhId,
                        SoBaoDanh: sbd,
                    });
                }
                successfulImports++;

            } catch (err) {
                // Lưu thông tin học viên bị lỗi
                failedImports++;
                failedDetails.push({
                    hoTen: nguoi?.HO_VA_TEN[0],
                    maDangKy: nguoi?.MA_DK[0],
                    error: err.message
                });
            }
        }

        // Bulk insert `khoahoc_thisinh`
        if (khoahocThisinhData.length > 0) {
            await db.khoahoc_thisinh.bulkCreate(khoahocThisinhData, { ignoreDuplicates: true });
        }

        return ({
            EM: 'File imported and data processed',
            EC: 0,
            DT: {
                total: nguoiLxs.length,
                successful: successfulImports,
                failed: failedImports,
                failedDetails,
            }
        });
    } catch (error) {
        console.error("Error processing XML:", error);
        return ({
            EM: 'Error processing XML file',
            EC: -1,
            DT: []
        });
    }
};



const getAllStatus = async () => {
    try {
        const statusAll = await db.status.findAll();

        return ({
            EM: 'Lấy thông tin thí sinh thành công',
            EC: 0,
            DT: statusAll,
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        return ({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: [],
        });
    }
};

const getInfoStudentsSBD = async (IDKhoaHoc, SoBaoDanh, CCCD) => {
    try {
        if (!IDKhoaHoc && !showsubject && !CCCD)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        // Nếu có IDKhoaHoc, thêm điều kiện vào
        if (IDKhoaHoc) {
            whereCondition.IDKhoaHoc = IDKhoaHoc;
        }

        if (SoBaoDanh) {
            whereCondition['$khoahoc_thisinh.SoBaoDanh$'] = SoBaoDanh;
        }

        if (CCCD) {
            whereCondition['$thisinh.SoCMT$'] = {
                [Op.like]: `%${CCCD}%`
            };
        }

        const thiSinhInfo = await db.thisinh.findAll({
            where: whereCondition,
            include: [
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['IDThiSinh', 'SoBaoDanh', 'IDstatus', 'payment', 'moneypayment', 'stt'],
                    // where: { IDstatus: { [db.Sequelize.Op.ne]: null } }, // Exclude entries where `IDstatus` is null
                    include: [{
                        model: db.status,
                        attributes: ['id', 'namestatus'],
                    }]
                }
            ],
            order: [[db.khoahoc_thisinh, 'updatedAt', 'DESC']],
        });

        return ({
            EM: 'Lấy thông tin thí sinh thành công',
            EC: 0,
            DT: thiSinhInfo,
        });
    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin thí sinh:", error);
        return ({
            EM: 'Lỗi khi lấy thông tin thí sinh',
            EC: -1,
            DT: [],
        });
    }
};


const updateStudentStatus = async (IDKhoaHoc, SoBaoDanh, status) => {
    try {
        if (!IDKhoaHoc || !SoBaoDanh)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        const studentRecord = await db.khoahoc_thisinh.findOne({
            where: { IDKhoaHoc, SoBaoDanh }
        });
        if (!studentRecord) {
            return ({
                EM: 'Student not found',
                EC: 2,
                DT: [],
            });
        }

        studentRecord.IDstatus = status; // Update status field
        await studentRecord.save();
        sendStatusUpdate(studentRecord);
        return ({
            EM: 'Status updated successfully',
            EC: 0,
            DT: studentRecord,
        });
    } catch (error) {
        console.error("Error updating student status:", error);
        return ({
            EM: 'Server error',
            EC: -1,
            DT: [],
        });
    }
};

const getLastInfoStudents = async (IDKhoaHoc, IDstatus, rank = null) => {
    try {


        let whereCondition = { IDKhoaHoc };
        if (!!rank) whereCondition.loaibangthi = rank;

        const thiSinhInfo = await db.thisinh.findOne({
            where: whereCondition, // Lọc theo IDKhoaHoc
            attributes: { exclude: ['Anh'] },
            include: [
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['IDThiSinh', 'SoBaoDanh', 'IDstatus', 'stt'], // Lấy thông tin họ tên, ảnh, và loại bằng thi từ bảng thisinh
                    where: {
                        [Op.and]: [
                            {
                                IDstatus
                            }, {
                                stt: { [Op.ne]: null }
                            }
                        ]
                    },
                    include: [{
                        model: db.status,
                        attributes: ['id', 'namestatus'],
                    }]
                }
            ],

            order: [[db.khoahoc_thisinh, 'stt', 'DESC']],
            limit: 1,
            // raw: true
        });
        console.log('check thiSinhInfo', thiSinhInfo)
        return thiSinhInfo;
    } catch (error) {
        return [];
    }
};

const bulkUpdateStudentStatus = async (IDKhoaHoc, SoBaoDanhList, status) => {
    try {


        if (!IDKhoaHoc || !Array.isArray(SoBaoDanhList) || SoBaoDanhList.length === 0) {
            return ({
                EC: 1,
                EM: "Thiếu dữ liệu cần thiết hoặc danh sách trống",
                DT: []
            });
        }

        // Lấy dữ liệu hiện tại từ cơ sở dữ liệu
        const existingThiSinh = db.thisinh.findAll({
            where: {
                IDKhoaHoc
            },
            raw: true
        });

        // Lấy dữ liệu hiện tại từ cơ sở dữ liệu
        const existingKhoaHoc_ThiSinh = db.khoahoc_thisinh.findAll({
            where: {
                IDKhoaHoc
            },
            raw: true
        });

        const [r1, r2] = await Promise.all([existingThiSinh, existingKhoaHoc_ThiSinh])
        const existingThiSinhMap = new Map(
            r1.map(t => {
                return [t.IDThiSinh, t];
            })
        );

        // console.log('check existingThiSinhMap', existingThiSinhMap)


        const existingKhoaHoc_ThiSinhMap = new Map(
            r2.map((t) => [t.SoBaoDanh, t])
        );



        const courseExists = await db.khoahoc.findOne({ where: { IDKhoaHoc } });
        if (!courseExists) {
            return ({ EC: 1, EM: "Khóa học không tồn tại" });
        }

        const thiSinhLastInfo_B2 = await getLastInfoStudents(IDKhoaHoc, status, 'B2');
        const thiSinhLastInfo_B11 = await getLastInfoStudents(IDKhoaHoc, status, 'B11');
        const thiSinhLastInfo_C = await getLastInfoStudents(IDKhoaHoc, status, 'C');

        let indexContinue_B2 = 0;
        let indexContinue_B11 = 0;
        let indexContinue_C = 0;

        if (!!thiSinhLastInfo_B2?.khoahoc_thisinh?.stt) indexContinue_B2 = thiSinhLastInfo_B2?.khoahoc_thisinh?.stt;
        if (!!thiSinhLastInfo_B11?.khoahoc_thisinh?.stt) indexContinue_B11 = thiSinhLastInfo_B11?.khoahoc_thisinh?.stt;
        if (!!thiSinhLastInfo_C?.khoahoc_thisinh?.stt) indexContinue_C = thiSinhLastInfo_C?.khoahoc_thisinh?.stt;

        await Promise.all(
            SoBaoDanhList.map(async (soBaoDanh, index) => {
                const sbdString = soBaoDanh.toString();
                if (existingKhoaHoc_ThiSinhMap.has(sbdString)) {

                    const IDThiSinh = existingKhoaHoc_ThiSinhMap.get(sbdString).IDThiSinh;

                    if (existingThiSinhMap.has(IDThiSinh)) {
                        const rankUpdate = existingThiSinhMap.get(IDThiSinh).loaibangthi;

                        let sttUpdate = 1;
                        if (rankUpdate == 'B2') sttUpdate = ++indexContinue_B2;
                        else if (rankUpdate == 'B11') sttUpdate = ++indexContinue_B11;
                        else if (rankUpdate == 'C') sttUpdate = ++indexContinue_C;
                        // console.log('check existingKhoaHoc_ThiSinhMap.get(sbdString)', existingKhoaHoc_ThiSinhMap.get(sbdString))
                        const infoSttStudent = existingKhoaHoc_ThiSinhMap.get(sbdString);
                        if (infoSttStudent.stt == null || infoSttStudent.IDstatus != status)
                            await db.khoahoc_thisinh.update(
                                { IDstatus: status, stt: sttUpdate },
                                {
                                    where: {
                                        SoBaoDanh: soBaoDanh,
                                        IDKhoaHoc,
                                    },
                                }
                            );
                    }
                }
            })
        );

        const updatedStudents = await getThiSinhSBDOfCourse(IDKhoaHoc, SoBaoDanhList);
        // console.log('check updatedStudents', JSON.stringify(updatedStudents))

        await sendStatusUpdate(updatedStudents);

        return ({ EC: 0, EM: "Cập nhật trạng thái thành công", DT: [] });
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        return ({ EC: -1, EM: "Có lỗi xảy ra khi cập nhật trạng thái", DT: [] });
    }
}

const getThiSinhSBDOfCourse = async (IDKhoaHoc, SoBaoDanhList) => {
    try {
        const thiSinhInfo = await db.thisinh.findAll({
            where: { IDKhoaHoc },
            attributes: {
                exclude: ['Anh'] // Correctly excluding the `Anh` attribute
            },
            include: [
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['IDThiSinh', 'SoBaoDanh', 'IDstatus', 'stt', 'payment', 'moneypayment'],
                    where: { SoBaoDanh: SoBaoDanhList, IDKhoaHoc },
                    include: [
                        {
                            model: db.status,
                            attributes: ['id', 'namestatus'],
                        }
                    ]
                }
            ],
            order: [[db.khoahoc_thisinh, 'stt', 'ASC']],
        });

        return thiSinhInfo;
    } catch (error) {
        console.error("Error fetching student list:", error);
        return [];
    }
}

const handleImportPaymentFile = async (file, IDKhoaHoc) => {

    if (!file || !IDKhoaHoc) {
        return ({ EC: 2, EM: 'File hoặc ID khóa học không được để trống.', DT: [] });
    }

    try {
        // Kiểm tra khóa học tồn tại
        const courseExists = await db.khoahoc.findOne({ where: { IDKhoaHoc } });
        if (!courseExists) {
            return ({ EC: 1, EM: "Khóa học không tồn tại" });
        }

        // Đọc file Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Xác định vị trí cột
        const headerRow = sheetData[0].map(e => e.trim());
        const maKhachHangIndex = headerRow.indexOf("Mã khách hàng");
        const trangThaiThanhToanIndex = headerRow.indexOf("Trạng thái thanh toán");
        const soTienIndex = headerRow.indexOf("Số tiền");

        if (maKhachHangIndex === -1 || trangThaiThanhToanIndex === -1) {
            return ({ EC: 1, EM: 'Không tìm thấy cột Mã khách hàng hoặc Trạng thái thanh toán.' });
        }

        // Tải dữ liệu khóa học_thí sinh liên quan để kiểm tra nhanh
        const existingEntries = await db.khoahoc_thisinh.findAll({
            where: { IDKhoaHoc },
            attributes: ['IDThiSinh', 'SoBaoDanh', 'payment', 'moneypayment'],
        });
        // Tạo Map để tra cứu nhanh
        // Tạo Map để tra cứu nhanh, đồng nhất kiểu chuỗi
        const entryMap = new Map(existingEntries.map(entry => [
            entry.SoBaoDanh.toString().padStart(3, '0'), // Chuẩn hóa SoBaoDanh trong cơ sở dữ liệu
            entry,
        ]));
        // Lưu các bản ghi cần cập nhật
        const updates = [];
        const notUpdatedRows = [];
        let updatedCount = 0;
        let notUpdatedCount = 0;
        console.log('check sheetData.length', sheetData.length)

        for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (!row) continue;

            const maKhachHang = row[maKhachHangIndex];
            const trangThaiThanhToan = row[trangThaiThanhToanIndex];
            const soTien = row[soTienIndex];

            if (!maKhachHang || !trangThaiThanhToan) {
                notUpdatedRows.push({ row: i, reason: 'Thiếu dữ liệu Mã khách hàng hoặc Trạng thái thanh toán' });
                continue;
            }

            const soBaoDanh = String(maKhachHang).slice(-3);
            if (isNaN(soBaoDanh)) {
                notUpdatedRows.push({ row: i, reason: 'Số báo danh không hợp lệ' });
                continue;
            }

            const isPaid = trangThaiThanhToan.toLowerCase() === 'đã thanh toán';
            const money = parseFloat(soTien) || 0;

            if (entryMap.has(soBaoDanh)) {
                updates.push({
                    SoBaoDanh: soBaoDanh,
                    IDKhoaHoc,
                    payment: isPaid,
                    moneypayment: money,
                });
                updatedCount++;
            } else {
                notUpdatedCount++;
            }
        }

        // Bulk update các bản ghi
        await Promise.all(
            updates.map(async (update) => {
                await db.khoahoc_thisinh.update(
                    { payment: update.payment, moneypayment: update.moneypayment },
                    { where: { SoBaoDanh: update.SoBaoDanh, IDKhoaHoc: update.IDKhoaHoc } }
                );
            })
        );

        return ({
            EC: 0,
            EM: 'Import thành công!',
            DT: {
                updatedCount,
                notUpdatedCount, // Các dòng không được cập nhật
                notUpdatedRows
            },
        });
    } catch (error) {
        console.error('Lỗi xử lý file:', error);
        return ({ EC: -1, EM: 'Some err', ErrorDetail: error.message });
    }
};

const fetchDataStudentWithToken = async (mhv, token) => {
    try {
        // Bước 2: Sử dụng token để gọi API thứ hai
        const apiResponse = await fetch(`http://${process.env.NLTB_API_HOST}:7782/api/HocVienTH?soCmt=${mhv}&page=1&limit=20`, {
            method: "GET",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "vi,en;q=0.9",
                "Authorization": `Bearer ${token}`, // Thêm token vào header Authorization
                "Origin": `http://${process.env.NLTB_API_HOST}:7185`,
                "Referer": `http://${process.env.NLTB_API_HOST}:7185/`
            }
        });

        if (!apiResponse.ok) {
            throw new Error("API request failed");
        }

        const apiData = await apiResponse.json();
        return apiData;

    } catch (error) {
        console.error("Error:", error);
    }
};

const getTokenNLTB_LOCAL = async () => {
    // Bước 1: Gửi yêu cầu đăng nhập để lấy token
    const loginResponse = await fetch(`http://${process.env.NLTB_API_HOST}:7782/api/Login`, {
        method: "POST",
        headers: {
            "accept": "application/json, text/plain, */*",
            "accept-language": "vi,en;q=0.9",
            "content-type": "application/json",
            "no-auth": "True",
            "Referer": `http://${process.env.NLTB_API_HOST}:7185/`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: JSON.stringify({
            Username: "cdxdNLT",
            Password: "@cdxdNLT"
        })
    });

    if (!loginResponse.ok) {
        throw new Error("Login failed");
    }

    const loginData = await loginResponse.json();
    return loginData?.Token; // Giả sử API trả về token ở đây
}

const updateProcesstest = async (IDThiSinh, processtest) => {
    try {
        if (!IDThiSinh || !processtest)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        const thisinh = await db.thisinh.findOne({
            where: {
                IDThiSinh
            }
        });
        if (!thisinh) {
            return ({
                EM: 'Cant find key',//error message
                EC: 1,//error code
                DT: []
            });
        }
        if (processtest != 3) {
            await thisinh.update({ IDprocesstest: processtest, print: 1 });
        } else {
            await thisinh.update({ IDprocesstest: processtest });
        }
        const res = await userServices.getInfoStudentServices(null, null, IDThiSinh)
        const studentInfo = res.DT[0];
        await sendStudentDashBoardUpdate(studentInfo);

        return ({
            EM: 'update success',//error message
            EC: 0,//error code
            DT: updateUser
        });
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const deleteKhoaHoc = async (IDKhoaHoc) => {
    try {
        // Lấy danh sách IDThiSinh thuộc khoá học
        const thiSinhList = await db.thisinh.findAll({
            where: { IDKhoaHoc },
            attributes: ['IDThiSinh'],
        });
        const ids = thiSinhList.map(ts => ts.IDThiSinh);

        if (ids.length > 0) {
            // Xoá bài thi của các thí sinh trong khoá
            await db.exam.destroy({ where: { IDThisinh: ids } });
            // Xoá bản ghi khoahoc_thisinh
            await db.khoahoc_thisinh.destroy({ where: { IDThiSinh: ids } });
            // Xoá thí sinh
            await db.thisinh.destroy({ where: { IDThiSinh: ids } });
        }

        // Xoá khoá học
        await db.khoahoc.destroy({ where: { IDKhoaHoc } });

        return { EM: 'Xoá khoá học thành công', EC: 0, DT: [] };
    } catch (error) {
        console.log('deleteKhoaHoc error', error);
        return { EM: 'Lỗi khi xoá khoá học', EC: -1, DT: [] };
    }
};

const resetall = async () => {
    try {

        await db.exam.destroy({ where: {} });
        await db.thisinh.update({ IDprocesstest: 1 }, { where: {} });
        return ({
            EM: 'Reset dữ liệu thành công',//error message
            EC: 0,//error code
            DT: []
        });
    } catch (error) {
        console.log('check error', error)
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const resetStudentExams = async (IDThiSinh) => {
    try {
        await db.exam.destroy({ where: { IDThisinh: IDThiSinh } });
        await db.thisinh.update({ IDprocesstest: 1 }, { where: { IDThiSinh } });
        return { EM: 'Reset thí sinh thành công', EC: 0, DT: [] };
    } catch (error) {
        return { EM: 'Lỗi server', EC: -1, DT: [] };
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
    getLastInfoStudents,
    // updateList
    bulkUpdateStudentStatus,
    handleImportPaymentFile,
    getThiSinhSBDOfCourse,
    getTokenNLTB_LOCAL,
    updateProcesstest,
    resetall,
    deleteKhoaHoc,
    resetStudentExams
};
