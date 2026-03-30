import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../../../shared/hooks";
import { ApiResponse } from "../../../../core/types";
import { Course, Status, Rank, Question, Exam, Student } from "../../../../features/student/types";
import { Subject } from "../../../../features/exam/types";
import './LoginTestStudent.scss';
import { toast } from "react-toastify";
import { ENVIRONMENT_CONFIGS, getCurrentEnvironment } from '../../../../core/config/environment';

// ── sessionStorage cache helpers ────────────────────────────────────────────
function scGet<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) { sessionStorage.removeItem(key); return null; }
        return data as T;
    } catch { return null; }
}
function scSet<T>(key: string, data: T, ttlMs = 5 * 60 * 1000) {
    try { sessionStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttlMs })); } catch { }
}

// Type alias for backward compatibility
type ThiSinh = Student;


const LoginTestStudent: React.FC = () => {
    const { get, del } = useApi();
    const navigate = useNavigate();

    const [donViList] = useState([
        { id: 52001, name: '52001 - TRƯỜNG CAO ĐẲNG CƠ ĐIỆN XÂY DỰNG VÀ NÔNG LÂM TRUNG BỘ' }
    ]);
    const [selectedDonVi, setSelectedDonVi] = useState(52001);

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
    const [examCount, setExamCount] = useState<number | null>(null);

    useEffect(() => {
        const wsUrl = ENVIRONMENT_CONFIGS[getCurrentEnvironment()]?.WS_BASE_URL;
        if (!wsUrl) return;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'VISITOR_STATS') setExamCount(data.payload.exam_count);
            } catch (_) {}
        };
        return () => ws.close();
    }, []);

    // Thêm body class để CSS ẩn header/footer trên mobile landscape
    useEffect(() => {
        document.body.classList.add('test-student-page');
        return () => { document.body.classList.remove('test-student-page'); };
    }, []);

    // Tải danh sách khóa học và xếp hạng — dùng sessionStorage cache 5 phút
    useEffect(() => {
        const fetchList = async () => {
            try {
                let courses = scGet<Course[]>('cache_courses');
                let ranks = scGet<Rank[]>('cache_ranks');

                if (!courses) {
                    const res = await get<ApiResponse<Course[]>>("/api/course");
                    courses = res.DT;
                    scSet('cache_courses', courses);
                }
                if (!ranks) {
                    const res = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
                    ranks = res.DT;
                    scSet('cache_ranks', ranks);
                }

                setRanks(ranks);
                setKhoaHocList(courses);
                if (courses.length > 0) {
                    setSelectedKhoaHoc(courses[courses.length - 1].IDKhoaHoc);
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

    // Auto-load student info on page render (display only, does NOT enable start button)
    useEffect(() => {
        const autoLoadStudentInfo = async () => {
            if (!selectedKhoaHoc || !sbd || sbd <= 0 || sbd !== Number(localStorage?.getItem("sbd"))) return;
            try {
                const response = await get<ApiResponse<Student[]>>(`/api/students?IDKhoaHoc=${selectedKhoaHoc}&SoBaoDanh=${sbd}`);
                if (response.DT.length === 0) return;
                const student = response.DT[0] as ThiSinh;
                setStudentNow(student);
                const rank = ranks.find((r) => r.name === student.loaibangthi);
                if (rank) {
                    const cacheKey = `cache_subjects_${rank.id}`;
                    let subjects = scGet<Subject[]>(cacheKey);
                    if (!subjects) {
                        const res = await get<ApiResponse<Subject[]>>(`/api/subject/${rank.id}/get-subjects`, { params: { showsubject: true } });
                        subjects = res.DT;
                        scSet(cacheKey, subjects);
                    }
                    setSubjectList(subjects);
                    autoSelectSubject(student, subjects);
                }
                // Start button stays disabled — user must click "Kiểm tra thông tin" first
            } catch (error) {
                console.error("Error auto-loading student info:", error);
            }
        };
        autoLoadStudentInfo();
    }, [selectedKhoaHoc]);

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
                    setSelectedSubject(responseGetSubject?.DT[0]?.id);
                }
            }
        } catch (error) {
            console.error("Error fetching subjects for rank:", error);
        }
    };
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

            // --- Temporarily disabled: exam reset on server ---
            // await del(`/api/students/${student.IDThiSinh}/exams`);
            // const refreshed = await get<ApiResponse<Student[]>>(`/api/students?IDKhoaHoc=${selectedKhoaHoc}&SoBaoDanh=${sbd}`);
            // const updatedStudent = refreshed.DT[0] as ThiSinh;

            setStudentNow(student);

            const rank = ranks.find((r) => r.name === student.loaibangthi);
            if (rank) {
                const cacheKey = `cache_subjects_${rank.id}`;
                let subjects = scGet<Subject[]>(cacheKey);
                if (!subjects) {
                    const res = await get<ApiResponse<Subject[]>>(`/api/subject/${rank.id}/get-subjects`, { params: { showsubject: true } });
                    subjects = res.DT;
                    scSet(cacheKey, subjects);
                }
                setSubjectList(subjects);
                autoSelectSubject(student, subjects);
                // Always enable start after check — exams are not saved to server
                setIsStartEnabled(true);
            }
        } catch (error) {
            console.error("Error checking student:", error);
            toast.error("Đã xảy ra lỗi khi kiểm tra thông tin thí sinh.");
        }
    };

    // Tự động chọn môn học mà thí sinh chưa thi
    const autoSelectSubject = (student: ThiSinh, subjects: Subject[]) => {
        const untestedSubject = subjects.find(subject =>
            !student.exams?.some((exam: Exam) => exam.IDSubject === subject.id && exam.result !== null)
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

        // --- Temporarily disabled: processtest check ---
        // Since exam results are not saved to server, processtest can get stuck at 2.
        // Re-enable this check when server-side exam storage is restored.
        // if (studentNow?.processtest?.id === 2) {
        //     toast.error("Thí sinh đã trong trạng thái thi. Không thể vào thi lại.");
        //     return;
        // }

        // --- Temporarily disabled: duplicate exam check ---
        // Since exams are not saved to server, these checks are not needed.
        // Re-enable when server-side exam storage is restored.
        // const existingExam = studentNow.exams?.find((exam: Exam) => exam.IDSubject == selectedSubject);
        // const existingSubjectInRank = studentNow?.rank?.subjects?.some((e: Subject) => e.id == Number(selectedSubject))
        // if (!existingSubjectInRank) {
        //     toast.warning("Môn học của khóa không hợp lệ, vui lòng click vào môn học trong bảng hoặc chọn lại môn học");
        //     return;
        // }
        // if (existingExam) {
        //     toast.warning("Thí sinh đã thi môn này.Kết quả: " + (existingExam.result === "ĐẠT" ? "✅ Đạt" : "❌ Trượt"));
        //     return;
        // }

        // Validate subject belongs to student's rank (local check only)
        const existingSubjectInRank = studentNow?.rank?.subjects?.some((e: Subject) => e.id == Number(selectedSubject));
        if (!existingSubjectInRank) {
            toast.warning("Môn học của khóa không hợp lệ, vui lòng click vào môn học trong bảng hoặc chọn lại môn học");
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
                            const exam = studentNow?.exams?.find((e: Exam) => e.IDSubject === subject.id);
                            // Thêm class cho hàng đang được chọn
                            const isSelected = Number(selectedSubject) === subject.id;
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

    const handleCancel = () => {
        setStudentNow(null);
        setSubjectList([]);
        setSelectedSubject(null);
        setSbd(null);
        setIsStartEnabled(false);
        localStorage.removeItem("sbd");
        const lastCourse = khoaHocList[khoaHocList.length - 1];
        setSelectedKhoaHoc(lastCourse?.IDKhoaHoc ?? null);
    };

    return (
        <div className="app-teststudent">

            {/* Banner */}
            <div className="st-banner-container">
                <div className="st-banner-inner">
                    <img
                        src="https://anh.csgt.vn/logo-csgt.png"
                        alt="Logo CSGT"
                        className="st-banner-logo"
                    />
                    <div className="st-banner-text-block">
                        <div className="st-banner-line1">BỘ CÔNG AN</div>
                        <div className="st-banner-line2">CỤC CẢNH SÁT GIAO THÔNG</div>
                    </div>
                </div>
            </div>

            <div className="st-sub-header">
                SÁT HẠCH CẤP GPLX MÔ TÔ
            </div>

            <div className="st-main-content">
                
                <div className="st-search-form">
                    <div className="st-form-row">
                        <label>Đơn vị:</label>
                        <select
                            value={selectedDonVi}
                            onChange={e => setSelectedDonVi(Number(e.target.value))}
                            className="st-donvi-select"
                        >
                            {donViList.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="st-form-row">
                        <label>Khóa:</label>
                        <select value={selectedKhoaHoc || ""} onChange={handleKhoaHocChange} className="st-khoa-select">
                            <option value="" disabled>-- Chọn khóa học --</option>
                            {khoaHocList.map((khoaHoc) => (
                                <option key={khoaHoc.IDKhoaHoc} value={khoaHoc.IDKhoaHoc}>
                                    {khoaHoc.TenKhoaHoc}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="st-form-row st-sbd-row">
                        <label>Số báo danh:</label>
                        <div className="st-sbd-input-group">
                            <input
                                type="text"
                                value={sbd !== null ? sbd.toString() : ""}
                                onChange={handleSBDChange}
                                className="st-sbd-input"
                            />
                            <button
                                className="st-btn-check-info"
                                onClick={handleCheckStudent}
                            >
                                <div className="st-btn-check-icon"></div>
                                <span className="st-btn-check-text">
                                    Kiểm tra<br/>thông tin
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="st-candidate-panel">
                    <div className="st-avatar-box">
                        {studentNow?.Anh ? (
                            <img src={'data:image/jpeg;base64,' + studentNow?.Anh} className="st-avatar-img" alt="Avatar" />
                        ) : (
                            <div className="st-avatar-placeholder"></div>
                        )}
                    </div>
                    
                    <div className="st-info-details">
                        <div className="st-info-row">
                            <span className="st-info-label">Loại GPLX:</span>
                            <span className="st-info-value">{studentNow?.loaibangthi || "-"}</span>
                        </div>
                        <div className="st-info-row">
                            <span className="st-info-label">Họ tên:</span>
                            <span className="st-info-value">{studentNow?.HoTen || "-"}</span>
                        </div>
                        <div className="st-info-row">
                            <span className="st-info-label">Ngày sinh:</span>
                            <span className="st-info-value">{studentNow?.NgaySinh ? new Date(studentNow.NgaySinh).toLocaleDateString('vi-VN') : "-"}</span>
                        </div>
                        <div className="st-info-row">
                            <span className="st-info-label">Số định danh:</span>
                            <span className="st-info-value">{studentNow?.SoCMT || "-"}</span>
                        </div>
                        <div className="st-info-row">
                            <span className="st-info-label">Địa chỉ:</span>
                            <span className="st-info-value">{(studentNow as any)?.DiaChi || "-"}</span>
                        </div>
                        
                        {studentNow && (
                             <div className="st-info-row" style={{marginTop: 5, fontSize: "0.85rem", fontStyle: "italic", display: "none"}}>
                                <span className="st-info-label">Trạng thái:</span>
                                <span>{studentNow?.processtest?.name}</span>
                             </div>
                        )}
                    </div>
                </div>

                <div className="st-footer-buttons">
                    <button 
                        className="st-btn-login"
                        onClick={handleStartExam}
                        disabled={!isStartEnabled}
                    >
                        <div className="st-btn-login-icon"></div>
                        Vào thi
                    </button>
                    <button 
                        className="st-btn-cancel"
                        onClick={handleCancel}
                    >
                        Hủy bỏ
                    </button>
                </div>
            </div>

            {examCount !== null && (
                <div className="exam-count-badge">
                    <span className="exam-count-dot" />
                    {examCount} người đang thi
                </div>
            )}

        </div>
    );
};

export default LoginTestStudent;
