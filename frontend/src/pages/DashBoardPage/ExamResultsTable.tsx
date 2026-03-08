import React, { useEffect, useState, useRef } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import { ThiSinh, ApiResponse, Course, Status, Subject, Rank, Question, Exam, Student } from "../../interfaces";
import useApiService from "../../services/useApiService"; // Sử dụng hook mới
import ExamFormPrint from "../../components/DashBoard/PrintLayout/PrintLayout";
import PrintAllExamLayout from "../../components/DashBoard/PrintLayout/PrintAllExamLayout";
import constants from "../../constant/constant";

import "./DashBoardPage.css";
import { toast } from "react-toastify";
import ReactDOMServer from "react-dom/server";
import * as XLSX from 'xlsx'; // Import thư viện xlsx
import { Test } from "src/interfaces";

interface ExamResult {
    id: number;
    IDThisinh: string;
    IDTest: string;
    IDSubject: string;
    point: number;
    result: string;
}

interface ExamDetails {
    subject: string;
    point: number;
    result: string;
}
const cssA4 = `@media print {
              @page { size: 210mm 297mm; margin: 0; } /* Ép khổ A4 trực tiếp */
              body { 
                margin: 0; 
                padding: 0; 
                width: 210mm; 
                min-height: 297mm; 
                box-sizing: border-box;
                overflow: hidden; /* Ngăn tràn nội dung */
                max-height: 297mm; /* Giới hạn chiều cao */
              }
            }`;

const cssContent = `
body {
    font-family: Arial, sans-serif;
    padding: 10px 30px;
    box-sizing: border-box;
}

.result-checkbox {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    align-items: center;
    margin-left: 10px
}

.signature-teacher {
    display: flex;
    justify-content: space-between;
    align-items: start;
}

.signature-teacher div:nth-child(1) {
    display: flex;
    align-items: center;
    margin-left: 70px;
}

.checkbox {
    display: block;
    border: 1px solid #000;
    width: 20px;
    height: 20px;
    text-align: center;
    line-height: 20px;
    margin-right: 20px;
}

.form-header {
    display: flex;
    justify-content: space-around;
}

.header-left,
.header-right {
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
    text-align: center;
}

h3,
h4 {
    margin: 0;
    padding: 0;
}

.form-body>h2 {
    text-align: center;
}

.student-info {
    display: flex;
    justify-content: space-between;
    align-items: start;
}

.info-right.photo img {
    max-width: 150px;
    max-height: 150px;
    object-fit: cover;
    margin: 0 auto;
    display: block;
    border-radius: 5px;
}

/* Container grid */
.grid-container {
    margin: 5px 0px;
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    /* 24 cột */
    grid-template-rows: repeat(5, auto);
    /* 4 hàng */
    /* Khoảng cách giữa các ô */
    /* Padding xung quanh grid */
    border: 1px solid #000;
}

/* Các ô trong grid */
.grid-item {
    /* Màu nền của ô */
    color: rgb(0, 0, 0);
    /* Màu chữ */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    /* Kích thước chữ */
    font-weight: bold;
    /* Chữ in đậm */
    border: 1px solid #000000;
    /* Đường viền */
    /* Bo tròn góc */
    min-height: 30px;
}

/* Merge 3 ô đầu của hàng 1 */
.merge-3 {
    grid-column: span 3;
    /* Merge 3 cột */
}

.merge-4 {
    grid-column: span 4;
    /* Merge 3 cột */
}

.merge-3 {
    grid-column: span 3;
    /* Merge 3 cột */
}

/* Merge 9 ô đầu của các hàng 2, 3, 4 */
.merge-12 {
    grid-column: span 3;
    /* Merge 3 cột */
    grid-row: span 4;
    border: 2px solid #000;
}

.merge-4x2 {
    grid-row: span 4;
    grid-column: span 2;
    /* Merge 3 cột */
    border: 2px solid #000;
}

.result-section {
    display: flex;
    justify-content: space-between;
    text-align: center;
    margin-bottom: 8px;
}

.result-right {
    margin-right: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.nametest {
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
    /* margin: 30px 0; */
}

.signature {
    margin-top: 90px;
}

.result-left {
    display: flex;
    justify-content: right;
    align-items: center;
    width: 100%;
    height: 20px;
}

.conclude {
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-right p:nth-child(1) {
    margin: 0;
    padding: 0;
    ;
}

.subject {
    display: flex;
    justify-content: left;
}

.exam-table {
    padding-top: 38px;
}`

const ExamResultsTable: React.FC = () => {
    const { get, post, put, del } = useApiService();
    const [khoaHocList, setKhoaHocList] = useState<Course[]>([]);
    const [selectedKhoaHoc, setSelectedKhoaHoc] = useState<string | null>(null);

    const [studentList, setStudentList] = useState<ThiSinh[]>([]);
    const [studentNow, setStudentNow] = useState<ThiSinh>();

    const [filteredResults, setFilteredResults] = useState<ThiSinh[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

    const [studentDetail, setStudentDetail] = useState<ThiSinh>();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showPrintModalAllExam, setShowPrintModalAllExam] = useState(false);
    const [selectTestId, setSelectedTestId] = useState<number | null>(null);
    const [resultCorrectExam, setResultCorrectExam] = useState<any | null>(null);
    const printRef_viewOne = useRef<HTMLDivElement>(null);
    const printRef_viewAll = useRef<HTMLDivElement>(null);

    // State cho máy in
    const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [duplexMode, setDuplexMode] = useState<string>("two-sided-long-edge"); // Mặc định in 2 mặt

    // State cho số lượng trạng thái
    const [statusCounts, setStatusCounts] = useState<{
        passed: number;
        failed: number;
        absent: number;
        testing: number;
    }>({ passed: 0, failed: 0, absent: 0, testing: 0 });

    // Hàm tính số lượng trạng thái
    const calculateStatusCounts = (students: ThiSinh[]): {
        passed: number;
        failed: number;
        absent: number;
        testing: number;
    } => {
        let passed = 0;
        let failed = 0;
        let absent = 0;
        let testing = 0;

        students.forEach((student) => {
            const exams = student.exams || [];
            const subjects = student.rank?.subjects || [];

            // Đang thi: IDprocesstest = 1
            if (student.IDprocesstest === 2) {
                testing++;
                return;
            }

            // Vắng: Không có bài thi nào
            if (exams.length === 0) {
                absent++;
                return;
            }

            // Kiểm tra xem thí sinh có thi đủ các môn không
            const allSubjectsTested = subjects.every((subject) =>
                exams.some((exam) => exam.IDSubject === subject.id)
            );

            if (!allSubjectsTested) {
                absent++;
                return;
            }

            // Trượt: Có ít nhất một bài thi trượt
            const hasFailed = exams.some((exam) => exam.result === "TRƯỢT");
            if (hasFailed) {
                failed++;
                return;
            }

            // Đạt: Tất cả bài thi đều đạt
            const allPassed = exams.every((exam) => exam.result === "ĐẠT");
            if (allPassed) {
                passed++;
            } else {
                absent++;
            }
        });

        return { passed, failed, absent, testing };
    };

    useEffect(() => {
        const fetchPrinters = async () => {
            if (window.electronAPI) {
                const printerList = await window.electronAPI.getPrinters();
                setPrinters(printerList);
                const defaultPrinter = printerList.find((p) => p.isDefault);
                if (defaultPrinter) setSelectedPrinter(defaultPrinter.name);
            }
        };
        fetchPrinters();
    }, []);

    // const handlePrint = async (testID: number | undefined) => {
    //     if (printRef_viewOne.current) {
    //         try {
    //             // Fetch the CSS file content dynamically
    //             const response = await fetch('/assets/css/print.css');
    //             if (!response.ok) {
    //                 throw new Error('Failed to load CSS file');
    //             }
    //             const cssContent = await response.text();

    //             // Open the print window
    //             const printWindow = window.open("", "_blank");
    //             if (printWindow) {
    //                 printWindow.document.write(`
    //                     <html>
    //                         <head>
    //                             <title>KTTTM_${studentDetail?.SoCMT}_${testID}</title>
    //                             <style>@media print {@page {margin: 0;} body {margin: 0;}}</style>
    //                             <style>
    //                                 ${cssContent} /* Inject CSS content dynamically */
    //                             </style>

    //                         </head>
    //                         <body>${printRef_viewOne.current.innerHTML}</body>
    //                     </html>
    //                 `);
    //                 printWindow.document.close();

    //                 // Wait for the styles to load before printing
    //                 printWindow.onload = () => {
    //                     printWindow.print();
    //                     // printWindow.close();
    //                 };
    //             }
    //         } catch (error) {
    //             console.error('Error loading or applying CSS:', error);
    //             alert('Failed to load styles for printing.');
    //         }
    //     }
    // };

    const handlePrint = async (testID: number | undefined) => {
        if (!testID || !printRef_viewOne.current) return;

        try {
            // const response = await fetch('/assets/css/print.css');
            // if (!response.ok) throw new Error('Failed to load CSS file');
            // const cssContent = await response.text();

            const htmlContent = `
                <html>
                    <head>
                        <title>KTTTM_${studentDetail?.SoCMT}_${testID}</title>
                        <style>@media print {@page {margin: 0;} body {margin: 0;}}</style>
                        <style>${cssA4}${cssContent}</style>
                    </head>
                    <body>${printRef_viewOne.current.innerHTML}</body>
                </html>
            `;

            await printContent(htmlContent, duplexMode);
        } catch (error) {
            console.error('Error loading or applying CSS:', error);
            alert('Failed to load styles for printing.');
        }
    };

    // const handlePrintAll = async (sbd: number | null) => {
    //     try {
    //         // Gọi API để lấy thông tin chi tiết thí sinh
    //         const response = await get<ApiResponse>(
    //             `/api/students?IDKhoaHoc=${selectedKhoaHoc}&SoBaoDanh=${sbd || studentDetail?.khoahoc_thisinh?.SoBaoDanh}`
    //         );
    //         console.log('check response', response)
    //         if (response.EC === 0 && response.DT.length > 0) {
    //             const updatedStudentDetail = response.DT[0] as ThiSinh;

    //             // Fetch CSS nội dung
    //             const cssResponse = await fetch('/assets/css/print.css');
    //             if (!cssResponse.ok) throw new Error('Không thể tải file CSS in.');
    //             const cssContent = await cssResponse.text();

    //             // Tạo cửa sổ in
    //             const printWindow = window.open('', '_blank');
    //             if (!printWindow) {
    //                 alert('Không thể mở cửa sổ in.');
    //                 return;
    //             }

    //             // Nội dung HTML để in
    //             const printContent = `
    //                 <html>
    //                     <head>
    //                         <title>All Exams - ${updatedStudentDetail.HoTen}</title>
    //                         <style>${cssContent}</style>
    //                     </head>
    //                     <body>
    //                         <div id="print-container">
    //                             ${ReactDOMServer.renderToStaticMarkup(<PrintAllExamLayout student={updatedStudentDetail} />)}
    //                         </div>
    //                     </body>
    //                 </html>
    //             `;

    //             // Viết nội dung và in
    //             printWindow.document.open();
    //             printWindow.document.write(printContent);
    //             printWindow.document.close();
    //             printWindow.onload = () => {
    //                 printWindow.print();
    //                 // printWindow.close();
    //             };
    //         } else {
    //             alert('Không thể lấy thông tin thí sinh. Vui lòng thử lại.');
    //         }
    //     } catch (error) {
    //         console.error('Lỗi khi in toàn bộ:', error);
    //         alert('Không thể in. Vui lòng thử lại sau.');
    //     }
    // };

    const printContent = async (content: string, duplex: string) => {

        if (window.electronAPI && !!selectedPrinter) {
            // Gửi cả duplex mode trong content object
            const printData = JSON.stringify({ content, duplex });
            window.electronAPI.print(printData, selectedPrinter);
        } else {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }

    };

    const handlePrintAll = async (khoahoc: string | null, sbd: number | null) => {
        try {
            const response = await get<ApiResponse<ThiSinh[]>>(
                `/api/students?IDKhoaHoc=${khoahoc}&SoBaoDanh=${sbd || studentDetail?.khoahoc_thisinh?.SoBaoDanh}`
            );
            if (response.EC === 0 && response.DT.length > 0) {
                const updatedStudentDetail = response.DT[0] as ThiSinh;

                // const cssResponse = await fetch('/assets/css/print.css');
                // if (!cssResponse.ok) throw new Error('Không thể tải file CSS in.');
                // const cssContent = await cssResponse.text();

                const htmlContent = `
                    <html>
                        <head>
                            <title>All Exams - ${updatedStudentDetail.HoTen}</title>
                            <style>@media print {@page {margin: 0;} body {margin: 0;}}</style>
                            <style>${cssA4}${cssContent}</style>
                        </head>
                        <body>
                            <div id="print-container">
                                ${ReactDOMServer.renderToStaticMarkup(<PrintAllExamLayout student={updatedStudentDetail} />)}
                            </div>
                        </body>
                    </html>
                `;

                await printContent(htmlContent, duplexMode);
                await updatePrintStatus(updatedStudentDetail.IDThiSinh);
                return true;
            } else {
                alert('Không thể lấy thông tin thí sinh. Vui lòng thử lại.');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi in toàn bộ:', error);
            alert('Không thể in. Vui lòng thử lại sau.');
            return false;
        }
    };

    useEffect(() => {
        const fetchList = async () => {
            try {

                const responseGetCourse = await get<ApiResponse<Course[]>>("/api/course");

                setKhoaHocList(responseGetCourse.DT);
                if (responseGetCourse.DT.length > 0) {
                    setSelectedKhoaHoc(responseGetCourse?.DT[responseGetCourse.DT.length - 1]?.IDKhoaHoc);
                }

            } catch (error) {
                console.error("Error fetching course list:", error);
            }

        };
        fetchList();
    }, []);

    useEffect(() => {
        if (showPrintModalAllExam && printRef_viewAll.current) {
            console.log("Print All modal is ready");
        }
    }, [showPrintModalAllExam]);

    useEffect(() => {
        if (!selectedKhoaHoc) return;

        const ENV = process.env.REACT_APP_BUILD as keyof typeof constants.CONFIGS || 'development';
        const wsBaseUrl = constants.CONFIGS[ENV]?.WS_BASE_URL;

        // Set up WebSocket connection
        const socket = new WebSocket(wsBaseUrl);

        socket.onopen = () => {
            console.log("WebSocket connected");
            socket.send(JSON.stringify({ type: 'INIT_dashboard', payload: { IDKhoaHoc: selectedKhoaHoc } }));
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            // Update student list when a new exam result is received
            if (data.type === 'STUDENT_LIST_DASHBOARD' && Array.isArray(data.payload)) {
                const initialList = sortStudentsBySoBaoDanh(data.payload as ThiSinh[]);
                for (const student of initialList) {
                    if (student.IDprocesstest == 3 && student.print == 1) {
                        await handlePrintAll(selectedKhoaHoc, student.khoahoc_thisinh?.SoBaoDanh);
                        console.log('check đã in', student.IDprocesstest, '-', student.print)
                    }
                }
                setStudentList(initialList);
                setFilteredResults(initialList);
            } else if (data.type === "NEW_EXAM_RESULT") {
                const studentReceived: ThiSinh = data.payload;
                console.log('check exam', studentReceived);

                setStudentList((prevList) => {
                    const updatedList = [...prevList]; // Tạo bản sao để không mutate trực tiếp
                    const studentIndex = updatedList.findIndex(
                        (student) => student.IDThiSinh === studentReceived.IDThiSinh
                    );
                    if (studentIndex !== -1) {
                        // Chỉ cập nhật thí sinh tại vị trí đó
                        updatedList[studentIndex] = studentReceived;
                    }
                    return updatedList;

                });

                // Đồng bộ với filteredResults
                setFilteredResults((prevFiltered) => {
                    const updatedFiltered = [...prevFiltered];
                    const filteredIndex = updatedFiltered.findIndex(
                        (student) => student.IDThiSinh === studentReceived.IDThiSinh
                    );
                    if (filteredIndex !== -1) {
                        updatedFiltered[filteredIndex] = studentReceived;
                    }
                    return updatedFiltered;
                });

                // Cập nhật chi tiết nếu đang xem thí sinh đó
                setStudentDetail((prevDetail) => {
                    if (prevDetail?.IDThiSinh === studentReceived.IDThiSinh) {
                        return studentReceived;
                    }
                    return prevDetail;
                });

                // Kiểm tra nếu người dùng vừa hoàn thành đủ các môn
                if (studentReceived.IDprocesstest == 3 && studentReceived?.print !== 2 && !!selectedPrinter) {
                    // Tự động in bài kiểm tra tất cả các môn
                    await handlePrintAll(selectedKhoaHoc, studentReceived?.khoahoc_thisinh?.SoBaoDanh);
                }
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [selectedKhoaHoc]);

    // Cập nhật số lượng trạng thái khi studentList thay đổi
    useEffect(() => {
        const counts = calculateStatusCounts(studentList);
        setStatusCounts(counts);
    }, [studentList]);



    const sortStudentsBySoBaoDanh = (students: ThiSinh[]): ThiSinh[] => {
        return students.sort((a, b) => {
            const soBaoDanhA = a.khoahoc_thisinh?.SoBaoDanh || 0;
            const soBaoDanhB = b.khoahoc_thisinh?.SoBaoDanh || 0;
            return soBaoDanhA - soBaoDanhB;
        });
    };

    const handleKhoaHocChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedKhoaHoc(event.target.value);
        setStudentNow(undefined);
    };


    const handleSearch = (query: string) => {
        setSearchQuery(query);

        // Nếu không có từ khóa, trả lại toàn bộ danh sách
        if (!query.trim()) {
            setFilteredResults(studentList);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const filtered = studentList.filter((result) => {
            const soBaoDanh = result.khoahoc_thisinh?.SoBaoDanh?.toString().toLowerCase() || "";
            // const hoTen = result.HoTen?.toLowerCase() || "";
            // const soCMT = result.SoCMT?.toLowerCase() || "";
            const loaiBangThi = result.loaibangthi?.toLowerCase() || "";
            const tinhTrang = result.processtest?.name?.toLowerCase() || "";

            return (
                soBaoDanh.includes(lowerQuery) ||
                // hoTen.includes(lowerQuery) ||
                // soCMT.includes(lowerQuery) ||
                loaiBangThi.includes(lowerQuery) ||
                tinhTrang.includes(lowerQuery)
            );
        });

        setFilteredResults(filtered);
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
    };

    const handleRowClick = (studentId: number) => {
        setSelectedStudent(studentId);
        const details = studentList
            .find((result: ThiSinh) => result.IDThiSinh === studentId);

        setStudentDetail(details);
        setShowModal(true);
    };
    const sortByExamStatus = (students: ThiSinh[], direction: "asc" | "desc"): ThiSinh[] => {
        return [...students].sort((a, b) => {
            const getStatusPriority = (student: ThiSinh) => {
                const subjects = student.rank?.subjects || [];
                const exams = student.exams || [];

                let passed = 0;
                let failed = 0;
                let notAttempted = 0;

                subjects.forEach((subject) => {
                    const exam = exams.find((e) => e.IDSubject === subject.id);
                    if (exam?.result === "ĐẠT") {
                        passed++;
                    } else if (exam?.result === "TRƯỢT") {
                        failed++;
                    } else {
                        notAttempted++;
                    }
                });

                // Mức độ ưu tiên: đạt -> không đạt -> chưa làm
                return passed * 1000 - failed * 100 + notAttempted;
            };

            const priorityA = getStatusPriority(a);
            const priorityB = getStatusPriority(b);

            if (priorityA < priorityB) return direction === "asc" ? -1 : 1;
            if (priorityA > priorityB) return direction === "asc" ? 1 : -1;
            return 0;
        });
    };
    const handleSortByStatus = () => {
        const newDirection = sortConfig?.key === "status" && sortConfig.direction === "asc" ? "desc" : "asc";
        setSortConfig({ key: "status", direction: newDirection });

        const sortedStudents = sortByExamStatus(filteredResults, newDirection);
        setFilteredResults(sortedStudents);
    }
    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig?.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedResults = [...filteredResults].sort((a, b) => {
            const aValue = key.includes('.') ? key.split('.').reduce((o, k) => (o as any)?.[k], a) : (a as any)[key];
            const bValue = key.includes('.') ? key.split('.').reduce((o, k) => (o as any)?.[k], b) : (b as any)[key];

            if (aValue < bValue) return direction === "asc" ? -1 : 1;
            if (aValue > bValue) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setFilteredResults(sortedResults);
    };

    const handleResetSubject = async (examId: number, examResult: string) => {
        if (!examId) return;

        // Nếu bài thi đạt, yêu cầu xác nhận trước khi xóa
        if (examResult === "ĐẠT") {
            const confirmReset = window.confirm(
                "Bài kiểm tra này đã ĐẠT. Bạn có chắc chắn muốn reset?"
            );
            if (!confirmReset) return; // Nếu người dùng chọn "Không", dừng hàm
        }

        try {
            // Gọi API để xóa bài kiểm tra
            await del(`/api/exam/${examId}`);
            alert("Xóa bài kiểm tra thành công!");

            // Cập nhật lại danh sách bài thi sau khi xóa
            setStudentDetail((prevDetail) => {
                if (!prevDetail) return undefined;

                const updatedExams = prevDetail.exams?.filter((exam) => exam.id !== examId);

                // Trả về đối tượng phù hợp với kiểu `ThiSinh`
                return {
                    ...prevDetail,
                    exams: updatedExams,
                } as ThiSinh;
            });

            // Cập nhật danh sách sinh viên chính
            setStudentList((prevList) =>
                prevList.map((student) => {
                    if (student.IDThiSinh === studentDetail?.IDThiSinh) {
                        const updatedExams = student.exams?.filter((exam) => exam.id !== examId);
                        return { ...student, exams: updatedExams };
                    }
                    return student as ThiSinh;
                }) as ThiSinh[]
            );
        } catch (error) {
            console.error("Lỗi khi xóa bài kiểm tra:", error);
            alert("Xóa bài kiểm tra thất bại!");
        }
    };


    const handleViewPrint = async (testID: number) => {
        if (!testID) return;
        setShowPrintModal(true); // Hiển thị modal trước
        try {
            const varTest = await get<ApiResponse<Test[]>>(`/api/test/get-test/${testID}`);
            if (varTest.EC === 0) {
                setResultCorrectExam(varTest?.DT[0]?.questions?.map((e: any) => e.answer));
                setSelectedTestId(testID);
            }
        } catch (error) {
            console.error("Error loading test details:", error);
        }

    };

    const handleCloseModal = () => {
        setSelectedTestId(null); // Reset test ID
        setShowPrintModal(false); // Đóng modal
        setShowModal(false); // Đóng modal chính
        setShowPrintModalAllExam(false);
    };

    // Hàm reset trạng thái của thí sinh
    const handleResetStatus = async (studentId: number) => {
        try {
            // Gửi yêu cầu để reset trạng thái
            await post(`/api/students/update-processtest`, {
                IDThiSinh: studentId,
                processtest: 1,
            });
            // Cập nhật danh sách thí sinh
            setStudentList((prevList) =>
                prevList.map((student) =>
                    student.IDThiSinh === studentId
                        ? { ...student, IDprocesstest: 1 }
                        : student
                )
            );

            // Cập nhật chi tiết thí sinh nếu đang xem chi tiết
            setStudentDetail((prevDetail) =>
                prevDetail?.IDThiSinh === studentId
                    ? { ...prevDetail, IDprocesstest: 1 }
                    : prevDetail
            );


            alert("Trạng thái thí sinh đã được reset!");
        } catch (error) {
            console.error("Lỗi khi reset trạng thái thí sinh:", error);
            alert("Không thể reset trạng thái thí sinh.");
        }
    };

    const handleExportReport = async () => {
        try {
            // // Gọi API backend để lấy dữ liệu báo cáo
            // const response = await get<ApiResponse>("/api/exam/export-report", {
            //     params: {
            //         courseId: selectedKhoaHoc
            //     }
            // });

            // if (response.EC !== 0) {
            //     toast.warning(response.EM);
            //     return;
            // } else {
            //     const dataConvert = response?.DT; // Dữ liệu từ API trả về

            //     if (!dataConvert || dataConvert.length === 0) {
            //         toast.warning("Không có dữ liệu để xuất báo cáo!");
            //         return;
            //     }

            //     // Tạo một workbook và sheet từ dữ liệu
            //     const worksheet = XLSX.utils.json_to_sheet(dataConvert);
            //     const workbook = XLSX.utils.book_new();
            //     XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

            //     // Xuất file Excel
            //     const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

            //     // Tạo Blob và link để tải file xuống
            //     const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
            //     const url = window.URL.createObjectURL(blob);

            //     // Tạo một thẻ <a> để tự động tải file
            //     const link = document.createElement("a");
            //     link.href = url;
            //     link.setAttribute("download", "thong_ke_KTMH.xlsx");
            //     document.body.appendChild(link);
            //     link.click();

            //     // Dọn dẹp URL tạm
            //     link.parentNode?.removeChild(link);
            //     window.URL.revokeObjectURL(url);

                toast.success("Xuất file báo cáo thành công!");
            // }
        } catch (error) {
            console.error("Lỗi khi xuất file báo cáo:", error);
            alert("Có lỗi xảy ra khi xuất file báo cáo. Vui lòng thử lại!");
        }
    };

    // Hàm cập nhật trạng thái print = 2
    const updatePrintStatus = async (studentId: number) => {
        try {
            // Gọi API để cập nhật trạng thái print trên server
            const updateprint = await post(`/api/students/update-print-status`, {
                IDThiSinh: studentId,
                print: 2,
            });
            console.log('check updateprint', updateprint)
            // Cập nhật trạng thái trong state
            setStudentList(prevList =>
                prevList.map(student =>
                    student.IDThiSinh === studentId ? { ...student, print: 2 } : student
                )
            );

            setFilteredResults(prevFiltered =>
                prevFiltered.map(student =>
                    student.IDThiSinh === studentId ? { ...student, print: 2 } : student
                )
            );

            setStudentDetail(prevDetail =>
                prevDetail?.IDThiSinh === studentId ? { ...prevDetail, print: 2 } : prevDetail
            );

            toast.success(`Đã in và cập nhật trạng thái in cho thí sinh ${studentId}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái in:', error);
            toast.error('Không thể cập nhật trạng thái in.');
        }
    };



    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredResults.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h2 className="mb-4 title-result-exam">Kết quả kiểm tra học viên</h2>

            {/* Thanh Tìm Kiếm */}
            <div className="d-flex mb-3 top-table">
                <div className="exam-info-row">
                    {/* <Form.Group className="mb-3">
                        <Form.Label>Chọn máy in</Form.Label>
                        <Form.Select
                            value={selectedPrinter}
                            onChange={(e) => setSelectedPrinter(e.target.value)}
                        >
                            <option value="">-- Chọn máy in --</option>
                            {printers.map((printer) => (
                                <option key={printer.name} value={printer.name}>
                                    {printer.name} {printer.isDefault ? "(Mặc định)" : ""}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Chế độ in</Form.Label>
                        <Form.Select
                            value={duplexMode}
                            onChange={(e) => setDuplexMode(e.target.value)}
                        >
                            <option value="one-sided">In 1 mặt</option>
                            <option value="two-sided-long-edge">In 2 mặt (dọc)</option>
                            <option value="two-sided-short-edge">In 2 mặt (ngang)</option>
                        </Form.Select>
                    </Form.Group> */}
                    <div className="d-flex justify-content-between">
                        <div className="d-flex gap-4">
                            <div>
                                <strong>Đạt: </strong>
                                <span style={{ color: "green", fontWeight: "bold" }}>{statusCounts.passed}</span>
                            </div>
                            <div>
                                <strong>Trượt: </strong>
                                <span style={{ color: "red", fontWeight: "bold" }}>{statusCounts.failed}</span>
                            </div>
                            <div>
                                <strong>Vắng: </strong>
                                <span style={{ color: "black", fontWeight: "bold" }}>{statusCounts.absent}</span>
                            </div>
                            <div>
                                <strong>Đang thi: </strong>
                                <span style={{ color: "blue", fontWeight: "bold" }}>{statusCounts.testing}</span>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary export-report-btn"
                            onClick={handleExportReport}
                        >
                            Xuất file báo cáo
                        </button>
                    </div>
                    <div className="group">
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
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo số báo danh"
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>


                </div>


            </div>
            <Table hover striped bordered>
                <thead className="table-dark">
                    <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("khoahoc_thisinh.SoBaoDanh")}>
                            SBD {sortConfig?.key === "khoahoc_thisinh.SoBaoDanh" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("HoTen")}>
                            Họ Tên {sortConfig?.key === "HoTen" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("SoCMT")}>
                            CCCD {sortConfig?.key === "SoCMT" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("loaibangthi")}>
                            Hạng Thi {sortConfig?.key === "loaibangthi" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={handleSortByStatus}>
                            Tình Trạng {sortConfig?.key === "status" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((student: ThiSinh, _) => {
                        const exams = student.exams || [];

                        const subjectNeedHaveExam = student?.rank?.subjects;
                        // Style chung cho ô vuông
                        const commonStyle = {
                            fontWeight: "bold",
                            marginRight: "10px",
                            padding: "5px 10px",
                            border: "1px solid", // Viền chung
                            borderRadius: "4px", // Góc bo tròn, có thể bỏ nếu muốn góc vuông
                            display: "inline-block",
                            textAlign: "center" as const, // Sửa lỗi tại đây
                        };

                        const completionStatus = subjectNeedHaveExam?.map((subject, index) => {
                            const exam = exams?.find((exam) => exam?.IDSubject === subject?.id)
                            if (!!exam) {
                                if (exam.result === "ĐẠT") {
                                    // TRƯỜNG HỢP ĐẠT
                                    return (
                                        <span
                                            key={index}
                                            style={{
                                                ...commonStyle,
                                                color: "green", // Màu chữ xanh
                                                borderColor: "green", // Viền màu xanh
                                            }}
                                        >
                                            {subject.nameEx}
                                        </span>
                                    );
                                } else {
                                    // TRƯỜNG HỢP TRƯỢT
                                    return (
                                        <span
                                            key={index}
                                            style={{
                                                ...commonStyle,
                                                color: "red", // Màu chữ đỏ
                                                borderColor: "red", // Viền màu đỏ
                                            }}
                                        >
                                            {subject.nameEx}
                                        </span>
                                    );
                                }
                            } else {
                                // TRƯỜNG HỢP CHƯA THI
                                return (
                                    <span
                                        key={index}
                                        style={{
                                            ...commonStyle,
                                            color: "black", // Màu chữ đen
                                            borderColor: "black", // Viền màu vàng
                                        }}
                                    >
                                        {subject.nameEx}
                                    </span>
                                );
                            }
                        })


                        return (
                            <tr
                                key={_}
                                onClick={() => handleRowClick(student.IDThiSinh)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{student.khoahoc_thisinh?.SoBaoDanh || "N/A"}</td>
                                <td>{student?.HoTen || "N/A"}</td>
                                <td>{student?.SoCMT || "N/A"}</td>
                                <td>{student?.loaibangthi || "N/A"}</td>
                                <td>{completionStatus}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>




            {/* Pagination */}
            <div className="d-flex justify-content-center mt-3">
                <nav>
                    <ul className="pagination">
                        {Array.from({ length: Math.ceil(filteredResults.length / itemsPerPage) }, (_, index) => (
                            <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                                <button className="page-link" onClick={() => paginate(index + 1)}>
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                size="lg"
                centered
                dialogClassName="custom-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi Tiết Kết Quả Thí Sinh SBD: {studentDetail?.khoahoc_thisinh?.SoBaoDanh} - {studentDetail?.HoTen} - {studentDetail?.processtest?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Môn Học</th>
                                <th>Điểm</th>
                                <th>Kết Quả</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentDetail?.rank?.subjects?.map((subject, index) => {
                                const exam = studentDetail?.exams?.find((e) => e.IDSubject === subject.id);
                                const rowClass =
                                    exam?.result === "ĐẠT"
                                        ? "table-success"
                                        : exam?.result === "TRƯỢT"
                                            ? "table-danger"
                                            : "";

                                return (
                                    <tr key={exam?.id} className={rowClass}>
                                        <td>{subject.name}</td>
                                        <td>{exam?.point || "Chưa có điểm"}</td>
                                        <td>{exam?.result || "Chưa có kết quả"}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    onClick={() => handleResetSubject(exam?.id || 0, exam?.result || "")}
                                                    disabled={!exam} // Vô hiệu hóa nút nếu không có exam
                                                >
                                                    Reset
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={async () => {
                                                        await handleViewPrint(exam?.IDTest || 0);
                                                        setTimeout(() => handlePrint(exam?.IDTest), 500);
                                                    }
                                                    }

                                                >
                                                    View_In
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                    </Table>
                    {studentDetail && showPrintModal && !!selectTestId && (
                        <div style={{ display: "none" }}>
                            <div ref={printRef_viewOne}>
                                <ExamFormPrint
                                    student={studentDetail}
                                    testID={selectTestId}
                                    resultExamCorrect={resultCorrectExam} // Truyền exam.id được chọn
                                />
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div>
                        <Button
                            variant="success"
                            className="me-2"
                            onClick={async () =>
                                await handlePrintAll(selectedKhoaHoc, null)
                            }
                        >
                            IN TOÀN BỘ
                        </Button>
                        <Button
                            variant="warning"
                            className="me-2"
                            onClick={async () => {
                                handleResetStatus(studentDetail?.IDThiSinh as number);
                            }}
                        >
                            Reset tình trạng thi
                        </Button>

                    </div>

                    <Button variant="secondary" onClick={handleCloseModal}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Modal */}

        </div>
    );
};

export default ExamResultsTable;
