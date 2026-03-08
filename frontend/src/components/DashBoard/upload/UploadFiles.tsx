import React, { useState, useEffect, useCallback } from "react";
import { useApi } from "../../../shared/hooks";
import { ApiResponse } from "../../../core/types";
import { Rank, Course } from "../../../features/student/types";
import "./UploadFiles.css";

const UploadFiles: React.FC = () => {
  const { get, post } = useApi();
  const [selectedFileStudent, setSelectedFileStudent] = useState<File | null>(null);
  const [selectedFilePayment, setSelectedFilePayment] = useState<File | null>(null);
  const [selectedFileTestQuestion, setSelectedFileTestQuestion] = useState<File | null>(null);
  const [selectedFile600Question, setSelectedFile600Question] = useState<File | null>(null);
  const [selectedFileExcelForUpdate, setSelectedFileExcelForUpdate] = useState<File | null>(null);


  const [khoaHocList, setKhoaHocList] = useState<any[]>([]); // Chuyển sang any[]
  const [subjectList, setSubjectList] = useState<any[]>([]); // Chuyển sang any[]

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState<any>(null); // Sử dụng kiểu any

  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRank, setSelectedRank] = useState<any>(null);

  // Fetch danh sách khóa học
  useEffect(() => {
    const fetchKhoaHocList = async () => {
      try {
        const resGetCourse = await get<ApiResponse<Course[]>>("/api/course");
        // const resGetSubject = await get<ApiResponse>("/api/testStudent/subject");

        setKhoaHocList(resGetCourse.DT || []); // Đảm bảo fallback nếu DT không tồn tại
        if (resGetCourse.DT?.length > 0) {
          setSelectedKhoaHoc(resGetCourse.DT[0].IDKhoaHoc);
        }
        // console.log('check resGetSubject', resGetSubject)
        // setSubjectList(resGetSubject.DT || []); // Đảm bảo fallback nếu DT không tồn tại
        // if (resGetSubject.DT?.length > 0) {
        //   setSelectedSubject(resGetSubject.DT[0].id);
        // }

        const responseGetRanks = await get<ApiResponse<Rank[]>>("/api/rank/getRank");
        setRanks(responseGetRanks.DT);
        if (responseGetRanks.DT.length) {
          setSelectedRank(responseGetRanks.DT[0].id)
        }

      } catch (error) {
        console.error("Error fetching course list:", error);
        alert("Không thể tải danh sách khóa học. Vui lòng thử lại.");
      }
    };
    fetchKhoaHocList();
  }, []);

  // Xử lý khi chọn khóa học
  const handleKhoaHocChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKhoaHoc(event.target.value);
  };

  // Xử lý khi chọn khóa học
  const handleSubjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(event.target.value);
  };

  // Xử lý khi chọn khóa học
  const handleRankChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRank(Number(event.target.value));
  };



  // Xử lý khi chọn file thí sinh
  const handleFileChangeUploadStudent = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFileStudent(event.target.files[0]);
    }
  };

  // Xử lý khi chọn file thanh toán
  const handleFileChangeUploadPayment = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFilePayment(event.target.files[0]);
    }
  };

  const handleFileChangeTestQuestion = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFileTestQuestion(event.target.files[0]);
    }
  };

  const handleFileChange600Question = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile600Question(event.target.files[0]);
    }
  };

  const handleFileChangeExcelForUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFileExcelForUpdate(event.target.files[0]);
    }
  };

  // Xử lý upload file thí sinh
  const handleFileUploadStudent = async () => {
    if (!selectedFileStudent) {
      alert("Vui lòng chọn file XML thí sinh.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFileStudent);

    try {
      const response = await post<ApiResponse>("/api/import-xml", formData);
      if (response.EC === 0) {
        alert(`File thí sinh đã được tải lên thành công. ${JSON.stringify(response)}`);
        setSelectedFileStudent(null);
      } else {
        alert(`Error: ${response.EM}`);
      }
    } catch (error) {
      console.error("Error uploading student file:", error);
      alert("Không thể tải file thí sinh. Vui lòng thử lại.");
    }
  };

  // Xử lý upload file thanh toán
  const handleFileUploadPayment = async () => {
    if (!selectedFilePayment) {
      alert("Vui lòng chọn file Excel.");
      return;
    }
    if (!selectedKhoaHoc) {
      alert("Vui lòng chọn một khóa học.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFilePayment);
    formData.append("IDKhoaHoc", selectedKhoaHoc);

    try {
      const response: any = await post("/api/import-payment", formData);
      if (response.EC === 0) {
        alert(`File thí sinh đã được tải lên thành công. ${JSON.stringify(response)}`);
        setSelectedFilePayment(null);
      } else {
        alert(`Error: ${response.EM}`);
      }
    } catch (error) {
      console.error("Error uploading payment file:", error);
      alert("Không thể tải file thanh toán. Vui lòng thử lại.");
    }
  };

  // Xử lý upload file thanh toán
  const handleFileUploadTestQuestion = async () => {

    if (!selectedFileTestQuestion) {
      alert("Vui lòng chọn file Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFileTestQuestion);
    formData.append("IDrank", selectedRank); // Thêm tham số IDrank vào formData
    try {
      const response: any = await post("/api/testStudent/processExcelAndInsert", formData);
      if (response.EC === 0) {
        alert(`File thí sinh đã được tải lên thành công. ${JSON.stringify(response.EM)}`);
        setSelectedFileTestQuestion(null);
      } else {
        alert(`Error: ${response.EM}`);
      }
    } catch (error) {
      console.error("Error uploading Subject file:", error);
    }
  };

  // Xử lý upload file thanh toán
  const handleFileUpload600Question = async () => {

    if (!selectedFile600Question) {
      alert("Vui lòng chọn file Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile600Question);

    try {
      const response: any = await post("/api/file/createOrUpdateQuestion", formData);
      if (response.EC === 0) {
        alert(`File câu hỏi đã được tải lên thành công. ${JSON.stringify(response.EM)}`);
        setSelectedFile600Question(null);
      } else {
        alert(`Error: ${response.EM}`);
      }
    } catch (error) {
      console.error("Error uploading Question file:", error);
    }
  };


  const handleUpdateXmlWithExcel = async () => {
    if (!selectedFileExcelForUpdate) {
      alert("Vui lòng chọn file Excel để cập nhật hạng GPLX.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFileExcelForUpdate);

    try {
      const response: any = await post("/api/file/update-rank-student-with-excel", formData);
      if (response.EC === 0) {
        alert(`${response?.EM}`);
        setSelectedFileExcelForUpdate(null);
      } else {
        alert(`Lỗi: ${response?.EM}- DT: ${JSON.stringify(response?.DT)}`);
      }
    } catch (error) {
      console.error("Lỗi khi gửi file Excel:", error);
      alert("Có lỗi xảy ra khi gửi file Excel. Vui lòng thử lại.");
    }
  };


  return (
    <div className="import-file">

      <div className="import-file-child">

        <div className="upload-section">
          <label>Upload file thí sinh (XML) *Bao gồm cả khoá học:</label>
          <input type="file" accept=".xml" onChange={handleFileChangeUploadStudent} />
          <button onClick={handleFileUploadStudent}>Upload Thí Sinh</button>
        </div>

        <div className="select-course-child">
          <label>Chọn Khóa Học:</label>
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

        <div className="upload-section">
          <label>Upload file thanh toán (Excel):</label>
          <input type="file" accept=".xlsx" onChange={handleFileChangeUploadPayment} />
          <button onClick={handleFileUploadPayment}>Upload Thanh Toán</button>
        </div>

      </div>

      <div className="import-file-child">

        <div className="upload-section">
          <label>Upload 600 Câu hỏi *(Có file mẫu kèm theo):</label>
          <input type="file" accept=".xlsx" onChange={handleFileChange600Question} />
          <button onClick={handleFileUpload600Question}>Upload 600 câu hỏi</button>
        </div>

        <div className="select-course-child">
          <label>Chọn Hạng Upload bộ đề:</label>
          <select value={selectedRank || ""} onChange={handleRankChange}>
            <option value="" disabled>
              -- Chọn Hạng Upload bộ đề --
            </option>
            {ranks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.name}
              </option>
            ))}
          </select>
        </div>

        <div className="upload-section">
          <label>Upload File dữ liệu bộ đề *(Có file mẫu kèm theo):</label>
          <input type="file" accept=".xlsx" onChange={handleFileChangeTestQuestion} />
          <button onClick={handleFileUploadTestQuestion}>Upload Bộ đề</button>
        </div>

      </div>

      <div className="import-file-child">
        <div className="upload-section">
          <label>Upload Excel để cập nhật hạng GPLX cho thí sinh:</label>
          <input type="file" accept=".xlsx" onChange={handleFileChangeExcelForUpdate} />
          <button onClick={handleUpdateXmlWithExcel}>Cập nhật</button>
        </div>
      </div>

    </div>

  );
};

export default UploadFiles;
