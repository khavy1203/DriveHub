import db from "../models/index.js"; // Sequelize models
const { Op } = require("sequelize");
import XLSX from 'xlsx';
import cache from '../cache/memoryCache.js';

const TEST_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getSubject = async () => {
    try {
        const subjectInfo = await db.subject.findAll({ raw: true });
        return ({
            EM: 'Lấy thông tin thí sinh thành công',
            EC: 0,
            DT: subjectInfo,
        });

    } catch (e) {
        console.error("check getSubject: ", e);
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        })
    }
}

// Hàm xử lý đọc file Excel và chèn dữ liệu vào cơ sở dữ liệu
const processExcelAndInsert = async (file, IDrank) => {
    try {
        if (!file || !IDrank) {
            return ({
                EM: 'File hoặc IDrank  không được để trống.',
                EC: 2,
                DT: []
            });
        }

        let currentTestCode = null; // Mã đề hiện tại
        let testId = null; // ID của test đã được tạo

        const workbook = XLSX.read(file.buffer, { type: 'buffer' });

        // Duyệt qua tất cả các sheet trong file Excel

        const idSubjectList = (await db.subject.findAll({ where: { IDrank } })).map(e => e.id);

        if (Array.isArray(idSubjectList) && idSubjectList.length > 0) {

            const idTestList = (await db.test.findAll({ where: { IDSubject: idSubjectList } })).map(e => e.id);

            if (Array.isArray(idTestList) && idTestList.length > 0) {

                await db.test_question.destroy({
                    where: {
                        IDTest: idTestList // Điều kiện để xóa các bản ghi có IDtest trong danh sách
                    }
                });

                await db.exam.destroy({
                    where: {
                        IDTest: idTestList // Điều kiện để xóa các bản ghi có IDtest trong danh sách
                    }
                });

                await db.test.destroy({
                    where: {
                        id: idTestList // Điều kiện để xóa các bản ghi có IDtest trong danh sách
                    }
                });
                console.log('Xóa dữ liệu thành công!');
            }

        }

        // Lấy dữ liệu hiện tại từ cơ sở dữ liệu
        const existing600question = await db.question.findAll({
            raw: true
        });

        const existing600questionMap = new Map(
            existing600question.map((t) => [t.number, t])
        );

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName]; // Lấy dữ liệu của từng sheet
            console.log('check sheetName', sheetName)
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Chuyển sheet thành mảng JSON
            let prevDeSo = null;
            const subjectRecord = await db.subject.findOne({
                where: { nameEx: sheetName, IDrank }, // Tìm môn học theo nameEx
            });


            if (subjectRecord && data.length > 0) {
                const IDSubject = subjectRecord.id;
                // Lấy số lượng câu hỏi thực tế dựa trên hàng đầu tiên của sheet
                const totalQuestions = data[0].filter((value, index) => index > 0 && typeof value === 'string' && value.startsWith('Cau')).length;
                console.log('chekc subjectRecord', subjectRecord.name, ' Số câu ', totalQuestions)


                // Cập nhật numberofquestion của subject
                await db.subject.update(
                    { numberofquestion: totalQuestions },
                    { where: { id: IDSubject } }
                );

                for (const row of data) {

                    const deSo = row[0]; // Cột DeSo
                    if (typeof deSo == 'number' && deSo != prevDeSo) {
                        // Nếu DeSo khác so với đề trước, nghĩa là đây là một mã đề mới
                        currentTestCode = deSo; // Cập nhật mã đề mới
                        const existingTest = await db.test.findOne({
                            where: {
                                IDSubject: IDSubject,
                                code: `DeSo-${currentTestCode}`, // Mã đề là DeSo-{currentTestCode}
                            },
                            // include: [
                            //     {
                            //         model: db.question,
                            //         as: 'questions',
                            //     }
                            // ]
                        });
                        // Nếu test đã tồn tại, sử dụng ID của test để tạo câu hỏi hoặc cập nhật
                        if (existingTest) {
                            // Test đã tồn tại, sử dụng IDSubject và ID test hiện tại để tạo câu hỏi
                            testId = existingTest.id;
                        } else {
                            const test = await db.test.create({
                                IDSubject: IDSubject,
                                code: `DeSo-${currentTestCode}`, // Tạo mã đề cho test
                            });

                            // Sau khi tạo test mới, bạn có thể tạo câu hỏi
                            testId = test.id; // ID của test mới
                        }

                        prevDeSo = deSo; // Cập nhật DeSo hiện tại

                        for (let i = 1; i <= totalQuestions; i++) {
                            const questionNumber = parseInt(row[i]); // Số câu hỏi tại cột Cau 1, Cau 2, ...

                            if (existing600questionMap.has(questionNumber)) {
                                // console.log(`${testId} - ${parseInt(subjectRecord.numberofquestion)} - ${questionNumber}`) 
                                await db.test_question.create({
                                    IDTest: testId, // ID của test đã tạo
                                    numberquestion: i, // Câu số (1, 2, 3, ...)
                                    IDQuestion: existing600questionMap.get(questionNumber).id, // ID câu hỏi tương ứng
                                    IDSubject,
                                    order: i
                                });
                            }
                        }

                    }
                }
            }

        }
        // Invalidate all cached tests after rebuild
        cache.invalidatePrefix('test_');

        return ({
            EC: 0,
            EM: 'Dữ liệu đã được xử lý thành công và chèn vào cơ sở dữ liệu!',
            DT: []
        });
    } catch (error) {
        console.error(error);
        return ({
            EM: 'error from server',
            EC: -1,
            DT: []
        })
    }
};

const getTest = async (IDTest) => {
    try {
        if (!IDTest)
            return ({ EM: 'Some Field Null', EC: 2, DT: [] });

        const cacheKey = `test_${IDTest}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return ({ EM: 'success', EC: 0, DT: [cached] });
        }

        const test = await db.test.findOne({
            where: { id: IDTest },
            include: [
                { model: db.subject },
                { model: db.question, as: 'questions' },
            ],
        });

        if (test) {
            cache.set(cacheKey, test, TEST_CACHE_TTL);
        }

        return ({ EM: 'success', EC: 0, DT: [test] });
    } catch (e) {
        console.error("[getTest]", e);
        return ({ EM: 'error from server', EC: -1, DT: [] });
    }
}

module.exports = {
    getSubject,
    processExcelAndInsert,
    getTest
}