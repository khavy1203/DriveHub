import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../../shared/hooks";
import { ApiResponse } from "../../../core/types";
import { Course, Status, Rank, Question, Exam, Student } from "../../../features/student/types";
import { Subject } from "../../../features/exam/types";
import './LoginTestStudent.css';
import { toast } from "react-toastify";

// Type alias for backward compatibility
type ThiSinh = Student;


const LoginTestStudent: React.FC = () => {
    const { get, post, put, del } = useApi();
    const navigate = useNavigate();

    const [khoaHocList, setKhoaHocList] = useState<Course[]>([]);
    const [selectedKhoaHoc, setSelectedKhoaHoc] = useState<string | null>(null);

    const [subjectList, setSubjectList] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

    const [studentList, setStudentList] = useState<ThiSinh[]>([]);
    const [studentNow, setStudentNow] = useState<ThiSinh | null>();

    const [subjectDoTest, setSubjectDoTest] = useState<Subject>()

    const [ranks, setRanks] = useState<Rank[]>([]);

    const [sbd, setSbd] = useState<number | null>(Number(localStorage?.getItem("sbd")) || null);

    const [isStartEnabled, setIsStartEnabled] = useState(false);

    // Tải danh sách khóa học và xếp hạng
    useEffect(() => {
        const fetchList = async () => {
            try {
                const responseGetCourse = await get<ApiResponse<Course[]>>("/api/course");
                const responseGetRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");

                setRanks(responseGetRanks.DT);
                setKhoaHocList(responseGetCourse.DT);

                // Log danh sách khóa học để kiểm tra giá trị
                console.log('Courses loaded:', responseGetCourse.DT);

                // Sau khi lấy khóa học, tự động chọn khóa học cuối cùng (hoặc có thể là khóa học khác nếu cần)
                if (responseGetCourse.DT.length > 0) {
                    const lastCourse = responseGetCourse.DT[responseGetCourse.DT.length - 1];
                    setSelectedKhoaHoc(lastCourse.IDKhoaHoc); // Gán giá trị khóa học
                    console.log('Selected KhoaHoc:', lastCourse.IDKhoaHoc);
                }
            } catch (error) {
                console.error("Error fetching course list:", error);
            }
        };
        fetchList();
    }, []);

    useEffect(() => {
        if (sbd !== null && sbd > 0) {
            localStorage.setItem("sbd", sbd.toString());
            setIsStartEnabled(false);
        }
    }, [sbd]);

    // 🛠️ Tự động kiểm tra thí sinh khi trang render và nếu SBD có sẵn
    useEffect(() => {
        const checkStudentInfo = async () => {
            console.log('check sbd', sbd, Number(localStorage?.getItem("sbd")))
            if (selectedKhoaHoc && sbd !== null && sbd > 0 && sbd == Number(localStorage?.getItem("sbd"))) {
                await handleCheckStudent();
            }
        }
        checkStudentInfo();
    }, [selectedKhoaHoc]);

    useEffect(() => {
        const cleanup = checkCompletionAndReset();
        return cleanup;
    }, [studentNow, subjectList]);

    // useEffect(() => {
    //     const fetchList = async () => {
    //         try {

    //             if (selectedKhoaHoc) {
    //                 const responseGetStudents = await get<ApiResponse>(`/api/students?IDKhoaHoc=${selectedKhoaHoc}`);
    //                 setStudentList(responseGetStudents.DT);
    //             }
    //         } catch (error) {
    //             console.error("Error fetching course list:", error);
    //         }

    //     };
    //     fetchList();
    // }, [selectedKhoaHoc]);

    const fetchSubjects = async (idRank: number) => {
        try {
            if (ranks !== null) {
                const responseGetSubject = await get<ApiResponse<Subject[]>>(`/api/subject/${idRank}/get-subjects`, {
                    params: {
                        showsubject: true
                    }
                });
                setSubjectList(responseGetSubject.DT);
                if (responseGetSubject.DT.length > 0) {
                    // console.log('check responseGetSubject.DT', responseGetSubject.DT)
                    setSelectedSubject(responseGetSubject?.DT[0]?.id);
                }

            }
        } catch (error) {
            console.error("Error fetching subjects for rank:", error);
        }
    }

    const checkCompletionAndReset = () => {
        let timeoutId: NodeJS.Timeout;
        if (studentNow && subjectList.length) {
            timeoutId = setTimeout(() => {
                const allSubjectCompleted = subjectList.every(subject =>
                    studentNow.exams?.some((exam: Exam) => exam.IDSubject == subject.id && exam.result !== null)
                );
                if (allSubjectCompleted) {
                    setStudentNow(null);
                    setSubjectList([]);
                    setSelectedSubject(null);
                    setSbd(0);
                    setIsStartEnabled(false);
                    localStorage.removeItem("sbd"); // Xóa SBD khỏi localStorage
                    toast.success("Đã hoàn thành tất cả các bài thi. Giao diện được reset.");
                }
            }, 10000);
            return () => clearTimeout(timeoutId);
        }
    }


    const handleKhoaHocChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedKhoaHoc(event.target.value);
        setSubjectList([]);
        setSelectedSubject(null);
        setStudentNow(undefined);
        setSbd(null);  // Làm sạch giá trị SBD
        localStorage.removeItem("sbd"); // Xóa SBD khỏi localStorage
    };

    const handleSubjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSubject(parseInt(event.target.value));
    };

    const handleSelectSubject = (subjectId: number | null) => {
        setSelectedSubject(subjectId);
    };

    const handleCheckStudent = async () => {
        if (!sbd || !selectedKhoaHoc) {
            toast.error("Vui lòng nhập SBD và chọn khóa học.");
            return;
        }

        try {
            const response = await get<ApiResponse<Student[]>>(`/api/students?IDKhoaHoc=${selectedKhoaHoc}&SoBaoDanh=${sbd}`);
            if (response.DT.length === 0) {
                toast.error("Không tìm thấy thí sinh với SBD này.");
                setStudentNow(null);
                setIsStartEnabled(false);
                return;
            }

            const student = response.DT[0] as ThiSinh;
            setStudentNow(student);

            const rank = ranks.find((r) => r.name === student.loaibangthi);
            if (rank) {
                const responseGetSubjects = await get<ApiResponse<Subject[]>>(`/api/subject/${rank.id}/get-subjects`, {
                    params: { showsubject: true },
                });
                setSubjectList(responseGetSubjects.DT);
                autoSelectSubject(student, responseGetSubjects.DT);

                // Kiểm tra trạng thái hoàn thành ngay sau khi lấy danh sách môn
                const allSubjectCompleted = responseGetSubjects.DT.every((subject: Subject) =>
                    student.exams?.some((exam: Exam) => exam.IDSubject === subject.id && exam.result !== null)
                );
                setIsStartEnabled(!allSubjectCompleted); // Chỉ bật "Vào thi" nếu còn môn chưa thi
            }
        } catch (error) {
            console.error("Error checking student:", error);
            toast.error("Đã xảy ra lỗi khi kiểm tra thông tin thí sinh.");
        }
    };

    // Tự động chọn môn học mà thí sinh chưa thi
    const autoSelectSubject = (student: ThiSinh, subjects: Subject[]) => {
        const untestedSubject = subjects.find(subject =>
            !student.exams?.some(exam => exam.IDSubject === subject.id && exam.result !== null)
        );
        if (untestedSubject) {
            setSelectedSubject(untestedSubject.id);
        } else {
            setSelectedSubject(null); // Nếu đã thi hết, không chọn môn nào
        }
    };

    const handleSBDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();
        const numericValue = Number(value);

        if (!isNaN(numericValue) && numericValue > 0) {
            setSbd(numericValue);
        } else {
            setSbd(null);
        }
    };

    const handleStartExam = async () => {
        if (!studentNow) {
            alert("Vui lòng kiểm tra thông tin thí sinh trước khi vào thi.");
            return;
        }

        // Kiểm tra trạng thái processtest
        if (studentNow?.processtest?.id === 2) {
            toast.info("Bạn đang quay lại bài thi đang dang dở.");
            // Cho phép tiếp tục thay vì block bằng thông báo lỗi
        }

        // Kiểm tra nếu thí sinh đã thi môn này
        const existingExam = studentNow.exams?.find(exam => exam.IDSubject == selectedSubject);
        const existingSubjectInRank = studentNow?.rank?.subjects?.some(e => e.id == Number(selectedSubject))
        if (!existingSubjectInRank) {
            toast.warning("Môn học của khóa không hợp lệ, vui lòng click vào môn học trong bảng hoặc chọn lại môn học");
            return;
        }
        if (existingExam) {
            toast.warning("Thí sinh đã thi môn này.Kết quả: " + (existingExam.result === "ĐẠT" ? "✅ Đạt" : "❌ Trượt"));
            return;
        }
        // Sử dụng navigate để chuyển trang và truyền thông tin thí sinh qua state
        navigate("/finalexam", { state: { IDThiSinh: studentNow.IDThiSinh, IDSubject: selectedSubject } });

    };

    const renderSubjectStatus = () => {
        if (!studentNow || !subjectList.length) return null;

        return (
            <>
                <h3>Trạng thái môn thi</h3>
                <table className="subject-status-table">
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Điểm</th>
                            <th>Kết Quả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectList.map(subject => {
                            const exam = studentNow?.exams?.find(e => e.IDSubject === subject.id);
                            // Thêm class cho hàng đang được chọn
                            const isSelected = Number(selectedSubject) == subject.id;
                            const rowClass = isSelected ? "selected-row" : "";
                            return (
                                <tr key={subject.id}
                                    className={rowClass}
                                    onClick={() => handleSelectSubject(subject.id)}>
                                    <td>{subject.name}</td>
                                    <td>{exam ? exam.point : ""}</td>
                                    <td style={{ color: exam?.result === "ĐẠT" ? "green" : "red" }}>
                                        {exam?.result}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </>
        );
    };

    const handleResetStudentData = async () => {
        try {
            const response = await post<ApiResponse>(`/api/students/resetall`, {});
            if (response.EC == 0) {
                setStudentNow(null);
                setSubjectList([]);
                setSelectedSubject(null);
                setSbd(null);
                setIsStartEnabled(false);
                localStorage.removeItem("sbd");
                toast.success(response.EM);
            } else {
                toast.error("Không thể reset dữ liệu học viên.");
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi reset dữ liệu học viên.");
        }
    };

    return (
        <div className="app-teststudent">
            {/* header */}
            <h2>KIỂM TRA LÝ THUYẾT</h2>
            {/* common */}
            <div className="exam-info">
                <div className="exam-info-row">
                    <label>Khoá:</label>

                    <select value={selectedKhoaHoc || ""} onChange={handleKhoaHocChange}>
                        <option value="" disabled>
                            -- Chọn khóa học --
                        </option>
                        {khoaHocList.map((khoaHoc) => (
                            <option key={khoaHoc.IDKhoaHoc} value={khoaHoc.IDKhoaHoc}>
                                {khoaHoc.TenKhoaHoc}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="exam-info-row">
                    <label>Số báo danh:</label>
                    <input
                        type="text"
                        value={sbd !== null ? sbd.toString() : ""}
                        onChange={handleSBDChange}
                        placeholder="Nhập số báo danh (số > 0)"
                    />
                </div>

                {/* <div className="exam-info-row">
                    <label>Môn học:</label>
                    <select value={selectedSubject || ""} onChange={handleSubjectChange}>
                        <option value="" disabled>
                            -- Chọn Môn học --
                        </option>
                        {subjectList.map((mh) => (
                            <option key={mh?.id} value={mh?.id}>
                                {mh.name}
                            </option>
                        ))}
                    </select>
                </div> */}

            </div>
            {/* infor */}
            <div className="candidate-info">
                <div className="image-hv">
                    <img src={'data:image/jpg;base64,' + studentNow?.Anh} className='logo' alt="" />
                </div>
                <div className="candidate-details">
                    <p><strong>Loại GPLX:</strong> {studentNow?.loaibangthi}</p>
                    <p><strong>Họ tên:</strong> {studentNow?.HoTen}</p>
                    <p><strong>Số CMT:</strong> {studentNow?.SoCMT}</p>
                    <p><strong>Tình trạng:</strong> <span className="process" data-status={studentNow?.processtest?.name || "Chưa thi"}> {studentNow?.processtest?.name} </span></p>
                </div>
                <div className="subject-status">

                    {renderSubjectStatus()}
                </div>
            </div>

            <div className="buttons buttons-login">
                <button
                    className={isStartEnabled ? "enter" : "check-button"}
                    onClick={isStartEnabled ? handleStartExam : handleCheckStudent}
                >
                    {isStartEnabled ? "Vào thi" : "Kiểm tra thông tin thí sinh"}
                </button>
            </div>
            {/* Nút Reset dữ liệu ở góc phải */}
            {process.env.REACT_APP_BUILD != "buildlocal" && (
                <button
                    className="reset-button"
                    onClick={handleResetStudentData}
                    style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        padding: '10px 20px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        zIndex: 1000
                    }}
                >
                    Reset dữ liệu
                </button>
            )}

        </div>

    );
};

export default LoginTestStudent;
