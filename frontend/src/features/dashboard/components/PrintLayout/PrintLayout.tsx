import React, { forwardRef } from "react";
import moment from "moment";
import "./PrintLayout.scss";
import { Exam, Subject, ThiSinh } from "../../../../interfaces";

// const data = [
//     Array.from({ length: 10 }, (_, index) => index + 1), // Giá trị cho hàng 2
//     Array.from({ length: 10 }, (_, index) => index + 22), // Giá trị cho hàng 3
//     Array.from({ length: 10 }, (_, index) => index + 43), // Giá trị cho hàng 4
//     Array.from({ length: 10 }, (_, index) => index + 64), // Giá trị cho hàng 5
// ];

interface PrintLayoutProps {
    student?: ThiSinh;
    testID?: number | null; // Nhận thêm examId
    resultExamCorrect?: any;
}

const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(({ student, testID, resultExamCorrect }, ref) => {

    const formatDate = (value: any): string => {
        if (moment(value).isValid()) {
            return moment(value).format("DD/MM/YYYY"); // Định dạng DD/MM/YYYY
        }
        return value; // Nếu không phải giá trị hợp lệ, trả về gốc
    };

    console.log('check resultExamCorrect', resultExamCorrect)

    const exam: Exam = student?.exams?.find(e => e.IDTest == testID) as Exam;
    const subject: Subject = student?.rank?.subjects?.find(e => e.id == exam.IDSubject) as Subject;

    const data: string[][] = Array.from({ length: 4 }, () =>
        Array.from({ length: subject?.numberofquestion }, () => '')
    );

    exam.answerlist?.split(",")?.forEach((value1, index) => {
        if (!!value1 && resultExamCorrect && resultExamCorrect[index]) {
            const arrAnswerStudent = value1?.split("-");
            if (arrAnswerStudent.length === 1) {
                const answerIndex = parseInt(arrAnswerStudent[0], 10) - 1;
                const correctIndex = Number(resultExamCorrect[index] - 1);

                if (answerIndex >= 0 && correctIndex >= 0 && correctIndex < subject?.numberofquestion) {
                    if (value1 === resultExamCorrect[index]) {
                        data[answerIndex][index] = "X";
                    } else {
                        data[answerIndex][index] = "S";
                        data[correctIndex][index] = "Đ";
                    }
                }
            } else {
                arrAnswerStudent.forEach((value2) => {
                    const answerIndex = parseInt(value2, 10) - 1;
                    const correctIndex = Number(resultExamCorrect[index] - 1);

                    if (answerIndex >= 0 && correctIndex >= 0 && correctIndex < subject?.numberofquestion) {
                        data[answerIndex][index] = "S";
                        data[correctIndex][index] = "Đ";
                    }
                });
            }
        }
    });


    return (
        <div ref={ref} className="exam-form">
            <header className="form-header">
                <div className="header-left">
                    <h4>TRƯỜNG CAO ĐẲNG CĐ-XD</h4>
                    <h4>NÔNG LÂM TRUNG BỘ</h4>
                </div>
                <div className="header-right">
                    <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <h4>Độc lập - Tự do - Hạnh phúc</h4>
                </div>
            </header>
            <section className="form-body">
                <div className="nametest">
                    <h2>BÀI THI KIỂM TRA LÝ THUYẾT</h2>
                    <h3>Môn: {subject.name} *{exam?.test?.code}</h3>
                </div>
                <div className="student-info">
                    <div className="info-left">
                        <p><strong>Họ và tên: {student?.HoTen || "N/A"}</strong></p>
                        {/* <p><strong>Ngày sinh:  {formatDate(student?.NgaySinh) || "N/A"}</strong></p> */}
                        <p><strong>Số CMT: {student?.SoCMT || "N/A"}</strong></p>
                        <p><strong>Khóa kiểm tra:  {student?.khoahoc_thisinh?.IDKhoaHoc || "N/A"}</strong></p>
                        <p><strong>Ngày Tốt nghiệp: {formatDate(student?.khoahoc_thisinh?.khoahoc?.NgayThi) || "N/A"}</strong></p>
                        <p><strong>Tại: Trung Tâm ĐT&SH Lái Xe</strong></p>
                    </div>
                    <div className="info-right photo">
                        <img src={`data:image/jpg;base64,${student?.Anh}`} alt="Candidate" />
                        <p><strong>Hạng GPLX:</strong> {student?.loaibangthi || "N/A"}</p>
                        <p><strong>Số báo danh:</strong> {student?.khoahoc_thisinh?.SoBaoDanh || "N/A"}</p>
                    </div>
                </div>
                <div className="answers-table">
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
                </div>
            </section>
        </div>
    );
});

export default PrintLayout;
