import { isNumber } from "lodash";
import db from "../models/index.js";
const { Op } = require("sequelize");
import { sendStudentDashBoardUpdate } from '../websocket/wsStudentStatusServer.js';
import constants from "../constants/constants.js";

// Lightweight student fetch for dashboard broadcast — NO questions loaded
const getStudentForBroadcast = async (IDThiSinh) => {
    return db.thisinh.findOne({
        where: { IDThiSinh },
        attributes: { exclude: ['Anh'] },
        include: [
            {
                model: db.khoahoc_thisinh,
                include: [
                    { model: db.status, attributes: ['id', 'namestatus'] },
                    { model: db.khoahoc },
                ],
            },
            { model: db.processtest },
            {
                model: db.exam,
                attributes: ['id', 'IDThisinh', 'IDTest', 'point', 'result', 'IDSubject', 'answerlist', 'note', 'createdAt', 'updatedAt'],
                include: [
                    { model: db.test, attributes: ['id', 'IDSubject', 'code'] },
                    { model: db.subject },
                ],
            },
            {
                model: db.rank,
                include: [
                    { model: db.subject, where: { showsubject: true }, required: false },
                ],
            },
            { model: db.khoahoc },
        ],
    });
};

const getSubject = async (rankId, showsubject) => {
    try {
        if (!rankId || !showsubject)
            return { EM: 'Some Field Null', EC: 2, DT: [] };

        let whereClause = { IDrank: rankId };
        if (showsubject !== undefined) {
            whereClause.showsubject = showsubject === 'true';
        }

        const subjects = await db.subject.findAll({ where: whereClause });
        return { EM: 'ok', EC: 0, DT: subjects };
    } catch (e) {
        console.error('[getSubject]', e);
        return { EM: 'error from server', EC: -1, DT: [] };
    }
};

const createExam = async (IDThisinh, IDTest, answerlist, point, result, IDSubject) => {
    const t = await db.sequelize.transaction();
    try {
        if (!IDThisinh || !IDTest || !answerlist || !isNumber(point) || !result || !IDSubject) {
            await t.rollback();
            return { EM: 'Null select', EC: 2, DT: [] };
        }

        const findExistExamSj = await db.exam.findOne({
            where: { IDThisinh, IDSubject },
            transaction: t,
        });

        if (findExistExamSj) {
            await t.rollback();
            return {
                EM: 'Thí sinh đã tồn tại kết quả môn học, không thế làm bài thi',
                EC: 1,
                DT: [findExistExamSj],
            };
        }

        const createEx = await db.exam.create(
            { IDThisinh, IDTest, answerlist, point, result, IDSubject },
            { transaction: t },
        );

        // Lightweight counts instead of loading 600 questions
        const [examCount, student] = await Promise.all([
            db.exam.count({ where: { IDThisinh }, transaction: t }),
            db.thisinh.findByPk(IDThisinh, { attributes: ['loaibangthi'], transaction: t }),
        ]);

        let subjectCount = 0;
        if (student?.loaibangthi) {
            const rank = await db.rank.findOne({
                where: { name: student.loaibangthi },
                attributes: ['id'],
                transaction: t,
            });
            if (rank) {
                subjectCount = await db.subject.count({
                    where: { IDrank: rank.id, showsubject: true },
                    transaction: t,
                });
            }
        }

        const newProcesstest = examCount >= subjectCount ? 3 : 1;
        await db.thisinh.update(
            { IDprocesstest: newProcesstest },
            { where: { IDThiSinh: IDThisinh }, transaction: t },
        );

        await t.commit();

        // Broadcast outside transaction — lightweight query without questions
        const studentInfo = await getStudentForBroadcast(IDThisinh);
        if (studentInfo) {
            sendStudentDashBoardUpdate(studentInfo);
        }

        if (result === "ĐẠT") {
            return { EM: `Chúc mừng bạn đã ${result} với số điểm là: ${point}`, EC: 0, DT: createEx };
        }
        return { EM: `Bạn đã ${result} với số điểm là: ${point}`, EC: 1, DT: createEx };

    } catch (error) {
        await t.rollback();
        console.error('[createExam]', error);
        return { EM: 'error from server', EC: -1, DT: [] };
    }
};

const deleteExam = async (id) => {
    const t = await db.sequelize.transaction();
    try {
        if (!id) {
            await t.rollback();
            return { EM: 'Some Field Null', EC: 2, DT: [] };
        }

        const exam = await db.exam.findByPk(id, { transaction: t });
        if (!exam) {
            await t.rollback();
            return { EM: 'Not found', EC: 1, DT: [] };
        }

        const idThisinh = exam.IDThisinh;
        await db.thisinh.update(
            { IDprocesstest: 1 },
            { where: { IDThiSinh: idThisinh }, transaction: t },
        );
        await exam.destroy({ transaction: t });

        await t.commit();

        // Broadcast outside transaction
        const studentInfo = await getStudentForBroadcast(idThisinh);
        if (studentInfo) {
            sendStudentDashBoardUpdate(studentInfo);
        }

        return { EM: 'Delete success', EC: 0, DT: null };
    } catch (error) {
        await t.rollback();
        console.error('[deleteExam]', error);
        return { EM: 'error from server', EC: -1, DT: [] };
    }
};


async function exportReport(courseId) {
    try {
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
            where: { IDKhoaHoc: courseId },
            raw: true,
        });

        const groupedByStudent = {};

        results.forEach((row) => {
            const key = `${row.HoTen}_${row.SoCMT}_${row.loaibangthi}`;
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

            let finalScore;
            if (point >= threshold) {
                finalScore = point ? parseFloat(5 + remainingPoint) : null;
            } else {
                finalScore = point ? parseFloat((point * 5 / threshold).toFixed(2)) : null;
            }

            if (subjectName === constants.subjectName.PL) {
                groupedByStudent[key]['LUẬT GT'] = finalScore;
            } else if (subjectName === constants.subjectName.KTLX) {
                groupedByStudent[key]['KTLX'] = finalScore;
            } else if (subjectName === constants.subjectName.DD) {
                groupedByStudent[key]['Đạo đức'] = finalScore;
            } else if (subjectName === constants.subjectName.CT) {
                groupedByStudent[key]['Cấu tạo'] = finalScore;
            }
        });

        const sortedResults = Object.values(groupedByStudent).sort((a, b) => {
            const loaiBangCompare = a['Loại bằng thi'].localeCompare(b['Loại bằng thi'], 'vi');
            if (loaiBangCompare !== 0) return loaiBangCompare;
            const sbdA = a['SBD'] ? parseInt(a['SBD']) : 0;
            const sbdB = b['SBD'] ? parseInt(b['SBD']) : 0;
            return sbdA - sbdB;
        });

        return { EM: "Lấy dữ liệu thành công", EC: 0, DT: sortedResults };
    } catch (error) {
        console.error('Lỗi khi truy vấn kết quả:', error);
        return { EM: 'error from server', EC: -1, DT: [] };
    }
}

module.exports = {
    getSubject,
    createExam,
    deleteExam,
    exportReport
}
