import React, { forwardRef, useEffect } from "react";
import moment from "moment";
import { Exam, ThiSinh } from "../../../interfaces";

// const data = [
//     Array.from({ length: 10 }, (_, index) => index + 1), // Giá trị cho hàng 2
//     Array.from({ length: 10 }, (_, index) => index + 22), // Giá trị cho hàng 3
//     Array.from({ length: 10 }, (_, index) => index + 43), // Giá trị cho hàng 4
//     Array.from({ length: 10 }, (_, index) => index + 64), // Giá trị cho hàng 5
// ];

interface PrintAllExamLayoutProps {
    student?: ThiSinh;
}

const PrintAllExamLayout: React.FC<PrintAllExamLayoutProps> = ({ student }) => {
    const formatDate = (value: any): string => {
        if (moment(value).isValid()) {
            return moment(value).format("DD/MM/YYYY"); // Định dạng DD/MM/YYYY
        }
        return value; // Nếu không phải giá trị hợp lệ, trả về gốc
    };

    console.log('check student', student)
    const exams: Exam[] = student?.exams as [];
    let allPassed = true; // Biến kiểm tra nếu tất cả bài đều đạt
    console.log('check exams', exams)

    const fullData = [];
    for (const exam of exams) {
        if (!exam?.test?.questions || !exam?.subject?.showsubject) continue;

        const numberOfQuestions = exam?.subject?.numberofquestion || 0;
        const resultExamCorrect: any = exam?.test?.questions?.map((e) => e?.answer) || [];
        const data: string[][] = Array.from({ length: 4 }, () =>
            Array.from({ length: numberOfQuestions }, () => '')
        );

        if (exam?.answerlist) {
            exam.answerlist.split(',').forEach((value1, index) => {
                if (!value1 || resultExamCorrect[index] === undefined) return;

                const arrAnswerStudent = value1.split('-').map((v) => parseInt(v, 10) - 1);
                const correctAnswerIndex = parseInt(resultExamCorrect[index], 10) - 1;

                // Kiểm tra và đánh dấu câu trả lời
                arrAnswerStudent.forEach((studentIndex) => {
                    if (studentIndex < 0) return;

                    if (arrAnswerStudent.length == 1) {
                        data[studentIndex][index] = studentIndex == correctAnswerIndex ? 'X' : 'S';
                        if (studentIndex !== correctAnswerIndex && correctAnswerIndex >= 0) {
                            data[correctAnswerIndex][index] = 'Đ';
                        }
                    } else {
                        data[studentIndex][index] = 'S';
                        if (correctAnswerIndex >= 0) {
                            data[correctAnswerIndex][index] = 'Đ';
                        }
                    }
                });
            });
        }

        // Thêm dữ liệu vào `fullData`
        fullData.push({
            tablePoint: data,
            subjectName: exam?.subject?.name || "N/A",
            code: exam?.test?.code || "N/A",
            point: exam?.point || 0,
            threshold: exam?.subject?.threshold || 0,
            numberofquestion: numberOfQuestions,
            note: exam?.note
        });

        // Kiểm tra nếu có bài nào không đạt
        if (exam?.point < exam?.subject?.threshold) {
            allPassed = false; // Có bài không đạt
        }
    }

    return (
        <div className="exam-form">
            <header className="form-header">
                <div className="header-left">
                    <h4>TRƯỜNG CAO ĐẲNG CĐ-XD & NLTB</h4>
                    <h4>TTĐT&SHLX</h4>
                </div>
                <div className="header-right">
                    <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <h4>Độc lập - Tự do - Hạnh phúc</h4>
                </div>
            </header>
            <section className="form-body">
                <div className="nametest">
                    <h2>KẾT QUẢ KIỂM TRA CÁC MÔN LÝ THUYẾT</h2>
                </div>
                <div className="student-info">
                    <div className="info-left">
                        <p><strong>Họ và tên: {student?.HoTen || "N/A"}</strong></p>
                        <p><strong>Ngày sinh:  {formatDate(student?.NgaySinh) || "N/A"}</strong></p>
                        <p><strong>Số CCCD: {student?.SoCMT || "N/A"}</strong></p>
                        <p><strong>Khóa kiểm tra:  {student?.khoahoc?.TenKhoaHoc || "N/A"}</strong></p>
                        <p><strong>Ngày kiểm tra: {formatDate(student?.khoahoc_thisinh?.khoahoc?.NgayThi) || "N/A"}</strong></p>
                        <p><strong>Tại: Trung Tâm ĐT&SH Lái Xe</strong></p>
                    </div>
                    <div className="info-right photo">
                        {!!student?.Anh && <img src={`data:image/jpg;base64,${student?.Anh}`} alt="Candidate" />}
                        <p><strong>Hạng GPLX:</strong> {student?.loaibangthi || "N/A"}</p>
                        <p><strong>Số báo danh:</strong> {student?.khoahoc_thisinh?.SoBaoDanh || "N/A"}</p>
                    </div>
                </div>
                {/* sort((a, b) => {
                    const subjectIdA = exams.find(exam => exam?.subject?.name == a.subjectName)?.subject?.id || 0;
                    const subjectIdB = exams.find(exam => exam?.subject?.name == b.subjectName)?.subject?.id || 0;
                    return subjectIdA - subjectIdB;
                }) */}
                {fullData.map((data, index) => (
                    <div key={index} className="exam-table">
                        <div className="subject">
                            <h4>Môn: {data.subjectName}</h4>
                            <h4>*{data.code}{!!data?.note ? `(Bảo lưu ${data.note})` : ""}</h4>
                        </div>
                        {/* <p><strong>Mã đề thi:</strong> {data.code}</p>
                        <p><strong>Số điểm:</strong> {data.point}</p>
                        <p><strong>Ngưỡng đạt:</strong> {data.threshold}</p> */}
                        <div className="answers-table">
                            <div
                                className="grid-container"
                                style={{
                                    gridTemplateColumns: `repeat(${data?.numberofquestion + 3}, 1fr)`,
                                }}
                            >
                                <div className="grid-item merge-3">Câu Hỏi</div>
                                {Array.from({ length: data?.numberofquestion }).map((_, index) => (
                                    <div key={index} className="grid-item">
                                        {index + 1}
                                    </div>
                                ))}

                                <div className="grid-item merge-4x2">Trả Lời</div>
                                {Array.from({ length: 4 }).map((_, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                        <div className="grid-item">{rowIndex + 1}</div>
                                        {data.tablePoint[rowIndex]?.map((value, colIndex) => (
                                            <div key={colIndex} className="grid-item">
                                                {value}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className="result-section">
                            <div className="result-left">
                                {/* <p><strong>Kết luận của giám thị:</strong></p> */}
                                <div className="point"><strong>Số điểm đạt được:</strong> {data?.point}/{data.numberofquestion} điểm</div>
                                <div className="result-checkbox">
                                    Đạt<div className="checkbox">{data?.point >= data?.threshold ? "X" : ""}</div>
                                    Không đạt<div className="checkbox">{data?.point < data?.threshold ? "X" : ""}</div>
                                </div>
                                {/* <p>Giám thị ký tên</p> */}
                            </div>

                        </div>
                    </div>
                ))}
                <div className="conclude">
                    <p><strong>Kết luận: </strong></p>
                    <div className="result-checkbox">
                        Đạt <div className="checkbox">{allPassed ? "X" : ""}</div>
                        Không đạt <div className="checkbox">{!allPassed ? "X" : ""}</div>
                    </div>
                </div>
                <div className="signature-teacher">
                    <div><strong>Giám thị ký tên</strong></div>
                    <div className="result-right">
                        <p><strong>Học viên xác nhận kết quả</strong></p>
                        <p className="signature"><strong>{student?.HoTen || "N/A"}</strong></p>
                    </div>
                </div>
                {/* <div className="answers-table">
                    <div
                        className="grid-container"
                        style={{
                            gridTemplateColumns: `repeat(${subject?.numberofquestion + 3}, 1fr)`,
                        }}
                    >
                        <div className="grid-item merge-3">Câu Hỏi</div>
                        {Array.from({ length: subject?.numberofquestion }).map((_, index) => (
                            <div key={index} className="grid-item">
                                {index + 1}
                            </div>
                        ))}

                        <div className="grid-item merge-4x2">Trả Lời</div>
                        {Array.from({ length: 4 }).map((_, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                <div className="grid-item">{rowIndex + 1}</div>
                                {data[rowIndex]?.map((value, colIndex) => (
                                    <div key={colIndex} className="grid-item">
                                        {value}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="result-section">
                    <div className="result-left">
                        <p><strong>Kết luận của giám thị:</strong></p>
                        <p><strong>Số điểm đạt được:</strong> {exam?.point} điểm</p>
                        <div className="result-checkbox">
                            Đạt<div className="checkbox">{exam?.point >= subject?.threshold ? "X" : ""}</div>
                            Không đạt<div className="checkbox">{exam?.point < subject?.threshold ? "X" : ""}</div>
                        </div>
                        <p>Giám thị ký tên</p>
                    </div>
                    <div className="result-right">
                        <p><strong>Học viên xác nhận kết quả</strong></p>
                        <p className="signature"><strong>{student?.HoTen || "N/A"}</strong></p>
                    </div>
                </div> */}
            </section>
        </div>
    );
};

export default PrintAllExamLayout;
