import React, { useEffect, useState, useMemo } from "react";
import useApiService from "../../../services/useApiService"; // Sử dụng hook mới
import { ThiSinh, ApiResponse, Course, Status } from "../../../interfaces";
import constants from "../../../constant/constant";
import "./StudentsList.css";

const StudentsList: React.FC = () => {
  const { get } = useApiService();
  const [students, setStudents] = useState<ThiSinh[]>([]);
  const [khoaHocList, setKhoaHocList] = useState<Course[]>([]);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState<string | null>(null);
  const [filterSoBaoDanh, setFilterSoBaoDanh] = useState<string>(""); // Trạng thái cho input số báo danh
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [selectedStatusID, setSelectedStatusID] = useState<number | null>(null);


  // Lấy danh sách khóa học
  useEffect(() => {
    const fetchKhoaHocList = async () => {
      try {

        const responseGetCourse = await get<ApiResponse>("/api/course");

        const responseGetStatus = await get<ApiResponse>("/api/status");


        console.log('chekc response', responseGetCourse)
        setKhoaHocList(responseGetCourse.DT);
        setStatusList(responseGetStatus.DT);


        if (responseGetCourse.DT.length > 0) {
          setSelectedKhoaHoc(responseGetCourse?.DT[responseGetCourse.DT.length - 1]?.IDKhoaHoc);
        }

        if (responseGetStatus.DT.length > 0) {
          // Chọn trạng thái mặc định là "LT" hoặc trạng thái đầu tiên
          if (responseGetStatus.DT.length > 0) {
            const defaultStatus = responseGetStatus.DT.find((status) => status.namestatus === "LT");
            setSelectedStatusID(defaultStatus ? defaultStatus.id : responseGetStatus.DT[0].id);
          }
        }

      } catch (error) {
        console.error("Error fetching course list:", error);
      }
    };
    fetchKhoaHocList();
  }, []);

  useEffect(() => {

    const ENV = process.env.REACT_APP_BUILD as keyof typeof constants.CONFIGS || 'development';
    const wsBaseUrl = constants.CONFIGS[ENV]?.WS_BASE_URL;

    const ws = new WebSocket(wsBaseUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      if (selectedKhoaHoc) {
        // Gửi ID khóa học tới server nếu đã chọn
        ws.send(JSON.stringify({ type: 'INIT', payload: { IDKhoaHoc: selectedKhoaHoc } }));
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'STUDENT_LIST' && Array.isArray(data.payload)) {
          setStudents(data.payload as ThiSinh[]);
        } else if (data.type === 'USER_STATUS_UPDATE' && Array.isArray(data.payload)) {
          const updatedStudents: ThiSinh[] = data.payload;
          setStudents((prevStudents) => {
            const updatedMap = new Map(updatedStudents.map((u) => [u.IDThiSinh, u]));

            // Merge existing students with updates
            const mergedStudents = prevStudents.map((student) => {
              const matchingUpdate = updatedMap.get(student.IDThiSinh);

              if (matchingUpdate) {
                // Merge updates into the existing student
                return {
                  ...student,
                  ...matchingUpdate,
                  khoahoc_thisinh: {
                    ...(student.khoahoc_thisinh || {}),
                    ...(matchingUpdate.khoahoc_thisinh || {}),
                  },
                } as ThiSinh;
              }

              return student; // Return original student if no updates
            });

            // Add new students that do not exist in the previous list
            const newStudents = updatedStudents.filter(
              (updated) => !prevStudents.some((student) => student.IDThiSinh === updated.IDThiSinh)
            );

            // Combine merged and new students, triggering a re-render
            return [...mergedStudents, ...newStudents];
          });


        } else {
          console.warn('Unexpected message type or payload:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };



    ws.onclose = (event) => {
      console.warn('WebSocket connection closed:', event.reason || 'No reason provided');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [selectedKhoaHoc]);

  const filterStudentsBySoBaoDanh = (students: ThiSinh[], soBaoDanhList: string) => {
    // Nếu filterSoBaoDanh trống, trả về toàn bộ danh sách học viên
    if (!soBaoDanhList) {
      return students;
    }

    // Nếu có giá trị lọc, tách danh sách số báo danh và lọc học viên
    const soBaoDanhArray = soBaoDanhList.split(',').map(item => Number(item.trim()));
    return students.filter(student =>
      soBaoDanhArray.some((e: number) => e == student.khoahoc_thisinh?.SoBaoDanh)
    );
  };

  // Bộ lọc danh sách học viên theo loại bằng lái
  const filterStudentsByLicense = (licenseType: string) =>
    students.filter(
      (student) =>
        student.loaibangthi === licenseType &&
        student.khoahoc_thisinh?.IDstatus === selectedStatusID
    );


  const handleKhoaHocChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKhoaHoc(event.target.value);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSoBaoDanh(event.target.value);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatusID(Number(event.target.value));
  };

  return (
    <div className="form-list-student">
      {
        <div className="import-file-child-liststudent">
          <div className="select-course-child-liststudent">
            <label>Chọn Khóa Học: </label>
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

          <div className="select-course-child-liststudent">
            <label>Chọn kiểu hiển thị: </label>
            <select value={selectedStatusID || ""} onChange={handleStatusChange}>
              <option value="" disabled>
                -- Kiểu dữ diệu hiển thị --
              </option>
              {statusList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.namestatus}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-so-bao-danh">
            <label>Hiển thị theo SBD (ngăn cách bởi dấu phẩy): </label>
            <input
              type="text"
              value={filterSoBaoDanh}
              onChange={handleFilterChange}
              placeholder="Ví dụ: 123, 456, 789"
            />
          </div>
        </div>
      }

      <div className="list-InfoStudent">
        <TableSection
          title="HẠNG C"
          students={filterStudentsBySoBaoDanh(filterStudentsByLicense("C"), filterSoBaoDanh)}
        />
        <TableSection
          title="HẠNG B2"
          students={filterStudentsBySoBaoDanh(filterStudentsByLicense("B2"), filterSoBaoDanh)}
        />
        <TableSection
          title="HẠNG B11"
          students={filterStudentsBySoBaoDanh(filterStudentsByLicense("B11"), filterSoBaoDanh)}
        />
      </div>
    </div>
  );
};

// Component hiển thị từng bảng
interface TableSectionProps {
  title: string;
  students: ThiSinh[];
}

const TableSection: React.FC<TableSectionProps> = ({ title, students }) => {
  return (
    <div className="section">
      <h3 className="name-table">
        <i className="fas fa-bell"></i> {title}
        <span className="record-count">({students.length})</span>
      </h3>
      <div className="scroll-container">
        <div className="header-row">
          <div className="cell">STT</div>
          <div className="cell">SBD</div>
          <div className="cell">Họ Tên</div>
          <div className="cell">THANH TOÁN</div>
        </div>
        <div className="scroll-content">
          {students.map((student, index) => (
            <div className="row" key={student.IDThiSinh}>
              <div className="cell">{student.khoahoc_thisinh?.stt}</div>
              <div className="cell">{student.khoahoc_thisinh?.SoBaoDanh}</div>
              <div className="cell">{student.HoTen}</div>
              <div className="cell payment-cell">
                {student.khoahoc_thisinh?.payment ? (
                  <i className="fas fa-check-circle paid-icon" title="Đã thanh toán"></i>
                ) : (
                  <i className="fas fa-exclamation-circle unpaid-icon" title="Chưa thanh toán"></i>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentsList;
