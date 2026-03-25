import { includes, isNumber, update } from "lodash";
import db from "../models/index.js"; // Sequelize models
const { Op, Model } = require("sequelize");
import { sendStudentDashBoardUpdate } from '../websocket/wsStudentStatusServer.js';
import userService from './userServices.js'
import constants from "../constants/constants.js";

const getSubject = async (rankId, showsubject) => {
    try {

        if (!rankId || !showsubject)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        let whereClause = { IDrank: rankId }
        if (showsubject !== undefined) {
            whereClause.showsubject = showsubject === 'true'; // Chuyển đổi thành kiểu boolean nếu cần
        }

        const subjects = await db.subject.findAll({
            where: whereClause
        });

        return ({
            EM: 'update success',//error message
            EC: 0,//error code
            DT: subjects
        });
    } catch (e) {
        return res({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        })
    }
}

const createExam = async (IDThisinh, IDTest, answerlist, point, result, IDSubject) => {
    try {
        if (!IDThisinh || !IDTest || !answerlist || !isNumber(point) || !result || !IDSubject) {
            return ({
                EM: 'Null select',//error message
                EC: 2,//error code
                DT: []
            });
        }

        const findExistExamSj = await db.exam.findOne({
            where: { IDThisinh, IDSubject },
        })

        console.log('check findExistExamSj', findExistExamSj)
        if (findExistExamSj) {
            return ({
                EM: 'Thí sinh đã tồn tại kết quả môn học, không thế làm bài thi',//error message
                EC: 1,//error code
                DT: [findExistExamSj]
            });
        } else {
            const createEx = await db.exam.create({
                IDThisinh, IDTest, answerlist, point, result, IDSubject
            })

            const res = await userService.getInfoStudentServices(null, null, IDThisinh)
            const studentInfo = res.DT[0];

            console.log('check studentInfo', studentInfo)
            if (createEx) {
                if (studentInfo?.exams?.length == studentInfo?.rank?.subjects?.length) {
                    await db.thisinh.update({ IDprocesstest: 3 }, {
                        where: { IDThiSinh: IDThisinh }
                    })
                    studentInfo.IDprocesstest = 3;
                } else {
                    await db.thisinh.update({ IDprocesstest: 1 }, {
                        where: { IDThiSinh: IDThisinh }
                    })
                    studentInfo.IDprocesstest = 1;
                }
            }


            await sendStudentDashBoardUpdate(studentInfo);

            if (result == "ĐẠT") {
                return ({
                    EM: `Chúc mừng bạn đã ${result} với số điểm là: ${point}`,//error message
                    EC: 0,//error code
                    DT: createEx
                });
            } else {
                return ({
                    EM: `Bạn đã ${result} với số điểm là: ${point}`,//error message
                    EC: 1,//error code
                    DT: createEx
                });
            }

        }

    } catch (error) {
        console.log('check error from sever', error)
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};

const deleteExam = async (id) => {
    try {
        if (!id)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });
        const exam = await db.exam.findByPk(id);
        console.log('check vô đây')
        if (!exam) {
            return ({
                EM: 'error from sever',//error message
                EC: 1,//error code
                DT: []
            });
        } else {
            console.log('check exam', exam)
            const updateTs = await db.thisinh.update({ IDprocesstest: 1 }, {
                where: { IDThiSinh: exam?.IDThisinh }
            });
            console.log('check updateTs', updateTs)
            const idThisinhDestroy = exam?.IDThisinh;
            await exam.destroy();
            console.log('check idThisinhDestroy', idThisinhDestroy)
            if (!!idThisinhDestroy) {
                const res = await userService.getInfoStudentServices(null, null, idThisinhDestroy)
                const studentInfo = res.DT[0];
                await sendStudentDashBoardUpdate(studentInfo);

            }
            return ({
                EM: 'Delete success',//error message
                EC: 1,//error code
                DT: res
            });
        }
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};


async function exportReport(courseId) {
    try {
        // Lấy dữ liệu từ các bảng
        const results = await db.thisinh.findAll({
            attributes: ['HoTen', 'SoCMT', 'loaibangthi'],
            include: [
                {
                    model: db.exam,
                    attributes: ['point'],
                    include: [
                        {
                            model: db.subject,
                            attributes: ['name', 'threshold', 'numberofquestion'],
                        },

                    ],
                },
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['SoBaoDanh']
                }
            ],
            where: {
                IDKhoaHoc: courseId,
            },
            raw: true,
        });

        const groupedByStudent = {};

        results.forEach((row) => {
            const key = `${row.HoTen}_${row.SoCMT}_${row.loaibangthi}`;
            console.log('check row0, ', row)
            if (!groupedByStudent[key]) {
                groupedByStudent[key] = {
                    'SBD': row['khoahoc_thisinh.SoBaoDanh'],
                    'Họ tên': row.HoTen,
                    'Số CMT': row.SoCMT,
                    'Loại bằng thi': row.loaibangthi,
                    'LUẬT GT': null,
                    'KTLX': null,
                    'Đạo đức': null,
                    'Cấu tạo': null,
                };
            }
            const subjectName = row['exams.subject.name'];
            const threshold = row['exams.subject.threshold'];
            const numberOfQuestion = parseInt(row['exams.subject.numberofquestion']);
            const point = row['exams.point'];
            const remainingPoint = parseFloat(((point - threshold) / (numberOfQuestion - threshold)) * 5);

            if (subjectName === constants.subjectName.PL) {
                if (point >= threshold)
                    groupedByStudent[key]['LUẬT GT'] = point ? parseFloat(5 + remainingPoint) : null;
                else {
                    groupedByStudent[key]['LUẬT GT'] = point ? parseFloat((point * 5 / threshold).toFixed(2)) : null;
                }
            } else if (subjectName === constants.subjectName.KTLX) {
                if (point >= threshold)
                    groupedByStudent[key]['KTLX'] = point ? parseFloat(5 + remainingPoint) : null;
                else {
                    groupedByStudent[key]['KTLX'] = point ? parseFloat((point * 5 / threshold).toFixed(2)) : null;
                }
            } else if (subjectName === constants.subjectName.DD) {
                if (point >= threshold)
                    groupedByStudent[key]['Đạo đức'] = point ? parseFloat(5 + remainingPoint) : null;
                else {
                    groupedByStudent[key]['Đạo đức'] = point ? parseFloat((point * 5 / threshold).toFixed(2)) : null;
                }
            } else if (subjectName === constants.subjectName.CT) {
                if (point >= threshold)
                    groupedByStudent[key]['Cấu tạo'] = point ? parseFloat(5 + remainingPoint) : null;
                else {
                    groupedByStudent[key]['Cấu tạo'] = point ? parseFloat((point * 5 / threshold).toFixed(2)) : null;
                }
            }
        });


        // Sắp xếp mảng theo Loại bằng thi, Họ tên, SBD tăng dần
        const sortedResults = Object.values(groupedByStudent).sort((a, b) => {
            // Sắp xếp theo Loại bằng thi
            const loaiBangCompare = a['Loại bằng thi'].localeCompare(b['Loại bằng thi'], 'vi');
            if (loaiBangCompare !== 0) return loaiBangCompare;

            // Nếu Họ tên giống nhau, sắp xếp theo SBD (số)
            const sbdA = a['SBD'] ? parseInt(a['SBD']) : 0;
            const sbdB = b['SBD'] ? parseInt(b['SBD']) : 0;
            return sbdA - sbdB;
        });

        return {
            EM: "Lấy dữ liệu thành công", // Thông báo thành công
            EC: 0, // Mã thành công
            DT: sortedResults, // Dữ liệu đã định dạng
        };

    } catch (error) {
        console.error('Lỗi khi truy vấn kết quả:', error);
        return false; // Trả về false nếu có lỗi
    }
}

module.exports = {
    getSubject,
    createExam,
    deleteExam,
    exportReport
}