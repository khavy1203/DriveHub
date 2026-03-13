import React, { useState, useRef, useEffect, useCallback } from 'react';
import './QrScanner.scss';
import useApiService from 'src/services/useApiService';
import { ApiResponse } from "../../../interfaces";
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Course } from 'src/interfaces';
// =====================
// Types
// =====================
export interface StudentFormData {
  id: number;
  CCCD: string; // CCCD
  CMT: string; // CMT / Mã SV
  name: string;
  dob: string;
  gender: string;
  address: string;
  registrationDate: string; // Ngày cấp
}

interface ApiDataQR {
  success: boolean;
  avatar?: string;
  decodedText?: { data: string; type: string }[];
  DT: any[];
  EC: number;
  EM: string
}

// =====================
// Child 1: QrScannerForm (only scan + parse + hiển thị để thêm)
// =====================
interface QrScannerFormProps {
  onAdd: (data: StudentFormData, avatarBase64: string | null) => void;
}

const QrScannerForm: React.FC<QrScannerFormProps> = ({ onAdd }) => {
  const { post } = useApiService();

  const [formData, setFormData] = useState<StudentFormData>({
    id: 0, CCCD: '', CMT: '', name: '', dob: '', gender: '', address: '', registrationDate: ''
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const parseDecodedText = (decodedText: string): StudentFormData => {
    const [CCCD, CMT, name, dob, gender, address, registrationDate] = decodedText.split('|');
    return { CCCD, CMT, name, dob, gender, address, registrationDate } as StudentFormData;
  };

  const resetForm = () => {
    setFormData({ id: 0, CCCD: '', CMT: '', name: '', dob: '', gender: '', address: '', registrationDate: '' });
    setAvatar(null);
    setError('');
  };

  const decodeFromBlob = async (blob: Blob) => {
    const fd = new window.FormData();
    fd.append('image', blob);
    try {
      const response = await post<ApiDataQR>('/api/file/qr/decode', fd);
      const data: ApiDataQR = response.DT?.[0];
      if (response.EC === 0 && data && data.success) {
        if (data.avatar) setAvatar(`data:image/jpeg;base64,${data.avatar}`);
        if (data.decodedText?.length && data.decodedText[0]?.data) {
          const decodedText = data.decodedText[0].data;
          setFormData(parseDecodedText(decodedText));
        } else setError('No QR data detected or invalid format.');
      } else setError(response?.EM || 'Failed to decode QR code.');
    } catch (e) {
      setError('Failed to send image to backend.');
      console.error(e);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    resetForm();
    await decodeFromBlob(e.target.files[0]);
  };

  const startCamera = async () => {
    resetForm();
    setCameraActive(true);

    if (!window.confirm('Cho phép truy cập camera để tiếp tục?')) {
      setError('Đã hủy truy cập camera.');
      setCameraActive(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt hoặc thiết bị không hỗ trợ camera.');
      setCameraActive(false);
      return;
    }

    try {
      const constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Cannot access the camera. Please allow camera access.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndSendImage = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && decodeFromBlob(blob), 'image/jpeg');
  };

  const handleAddToList = async () => {
    if (!formData.CCCD) {
      toast.info('Chưa có dữ liệu hợp lệ để thêm.');
      return;
    }
    onAdd(formData, avatar);
    resetForm();
  };

  return (
    <div className="qr-form">
      <h2>QR Code Scanner Form</h2>
      <div className="form-group-upload">
        <div className="qr-upload">
          <label htmlFor="qrUpload" className="form-label">Upload QR Code:</label>
          <input type="file" id="qrUpload" accept="image/*" onChange={handleQRUpload} className="form-input" />
        </div>

        <div className="camera-container">
          <div>
            <video ref={videoRef} className="video-feed" autoPlay playsInline muted></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </div>
          <div className="button-group">
            {!cameraActive ? (
              <button type="button" onClick={startCamera} className="form-button">Quét Camera</button>
            ) : (
              <button type="button" onClick={stopCamera} className="form-button">Dừng Quét</button>
            )}
            {cameraActive && (
              <button type="button" onClick={captureAndSendImage} className="form-button">Chụp hình</button>
            )}
          </div>
        </div>
      </div>

      <div className="form-data">
        {avatar && (
          <div className="avatar-container">
            <img src={avatar} alt="Avatar" className="avatar-image" />
          </div>
        )}
        <h3 className="form-data-title">Form Data</h3>
        <div className="form-field-inline"><label className="form-label-inline">CCCD:</label><input type="text" value={formData.CCCD} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">CMT:</label><input type="text" value={formData.CMT} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">Họ Tên:</label><input type="text" value={formData.name} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">Ngày sinh:</label><input type="text" value={formData.dob} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">Giới tính:</label><input type="text" value={formData.gender} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">Địa chỉ:</label><input type="text" value={formData.address} readOnly className="form-input-inline" /></div>
        <div className="form-field-inline"><label className="form-label-inline">Ngày cấp:</label><input type="text" value={formData.registrationDate} readOnly className="form-input-inline" /></div>
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={handleAddToList} className="btn btn-primary mt-2">Thêm vào danh sách</button>
      </div>
    </div>
  );
};

// =====================
// Child 2: QrEntriesTable (hiển thị + sửa/xóa)
// =====================
interface QrEntriesTableProps {
  entries: StudentFormData[];
  avatars: Record<string, string | null>; // key = id (CCCD)
  onUpdate: (data: StudentFormData) => void;
  onDelete: (id: number) => void;
}

const QrEntriesTable: React.FC<QrEntriesTableProps> = ({ entries, avatars, onUpdate, onDelete }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StudentFormData | null>(null);

  const startEdit = (row: StudentFormData) => {
    setEditId(row.CCCD);
    setDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft) return;
    onUpdate(draft);
    toast.success('Đã cập nhật bản ghi.');
    cancelEdit();
  };

  return (
    <div className="table-responsive mt-4">
      <table className="table table-striped table-hover table-bordered caption-top">
        <caption>QR đã thêm</caption>
        <thead>
          <tr className="table-dark">
            <th scope="col">#</th>
            <th scope="col">Avatar</th>
            <th scope="col">CCCD</th>
            <th scope="col">CMT</th>
            <th scope="col">Họ tên</th>
            <th scope="col">Ngày sinh</th>
            <th scope="col">Giới tính</th>
            <th scope="col">Địa chỉ</th>
            <th scope="col">Ngày cấp</th>
            <th scope="col">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center">Chưa có bản ghi</td>
            </tr>
          ) : entries.map((row, idx) => {
            const isEditing = editId === row.CCCD;
            const current = isEditing && draft ? draft : row;
            return (
              <tr key={row.id}>
                <th scope="row">{idx + 1}</th>
                <td>{avatars[row.CCCD] ? <img src={avatars[row.CCCD] as string} alt="avt" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : '-'}</td>
                <td>{isEditing ? <input value={current.CCCD} onChange={(e) => setDraft({ ...(current as StudentFormData), CCCD: e.target.value })} /> : row.CCCD}</td>
                <td>{isEditing ? <input value={current.CMT} onChange={(e) => setDraft({ ...(current as StudentFormData), CMT: e.target.value })} /> : row.CMT}</td>
                <td>{isEditing ? <input value={current.name} onChange={(e) => setDraft({ ...(current as StudentFormData), name: e.target.value })} /> : row.name}</td>
                <td>{isEditing ? <input value={current.dob} onChange={(e) => setDraft({ ...(current as StudentFormData), dob: e.target.value })} /> : row.dob}</td>
                <td>{isEditing ? <input value={current.gender} onChange={(e) => setDraft({ ...(current as StudentFormData), gender: e.target.value })} /> : row.gender}</td>
                <td>{isEditing ? <input value={current.address} onChange={(e) => setDraft({ ...(current as StudentFormData), address: e.target.value })} /> : row.address}</td>
                <td>{isEditing ? <input value={current.registrationDate} onChange={(e) => setDraft({ ...(current as StudentFormData), registrationDate: e.target.value })} /> : row.registrationDate}</td>
                <td className="d-flex gap-2">
                  {isEditing ? (
                    <>
                      <button className="btn btn-sm btn-success" onClick={saveEdit}>Lưu</button>
                      <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(row)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row?.id)}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// =====================
// Parent Page: QrScannerPage (gộp 2 component, cùng 1 trang thêm/xóa/sửa)
// =====================


type CourseQR = { id: number; name: string; description?: string | null; createdAt?: string; updatedAt?: string; type?: string; code?: string | null };
const QrScannerPage: React.FC = () => {
  const { get, post, put, del } = useApiService();

  // Danh sách QR đã thêm tạm thời trên client
  const [entries, setEntries] = useState<StudentFormData[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});

  const [courses, setCourses] = useState<CourseQR[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(''); // giữ string vì value của <select> là string
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  // THÊM STATE MỚI CHO LOẠI KHÓA HỌC
  const [newCourseType, setNewCourseType] = useState('CCCD');

  // Các loại QR đã được định nghĩa
  const qrTypes = [
    'CCCD', 'GPLX', 'BANK_VIETQR', 'BILL_QR', 'E_GOV', 'HEALTH_QR', 'E_TICKET', 'WAYBILL', 'PRODUCT_QR', 'VOUCHER', 'OTHER'
  ];

  // Sửa fetchCourses dùng đúng API:
  const fetchCourses = useCallback(async () => {
    try {
      const response = await get<ApiResponse>('/api/courseqr');
      if (response.EC === 0 && response?.DT) setCourses(response.DT as CourseQR[]);
      else setCourses([]);
    } catch {
      setCourses([]);
    }
  }, [get]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Lấy danh sách đã ghi danh của khóa học từ server (không giữ cache client)
  const fetchEnrolled = useCallback(async () => {
    if (!selectedCourse) {
      setEntries([]);
      return;
    }
    try {
      const resp = await get<ApiResponse<CourseQR[]>>(`/api/qr/list?courseId=${selectedCourse}`);

      if (resp.EC === 0 && resp.DT) {
        
        const parsedData = resp.DT.map(entry => {
          try {
            if (!entry?.code) return null; // ✅ Bỏ qua nếu code là null/undefined
            const parsedCode = JSON.parse(entry.code); // ✅ Lúc này chắc chắn là string
            return {
              ...parsedCode,
              id: entry.id
            };
          } catch (e) {
            console.error("Lỗi khi phân tích JSON:", e);
            return null;
          }
        }).filter((item): item is StudentFormData => item !== null);

        setEntries(parsedData as StudentFormData[]);
      } else {
        setEntries([]);
      }
    } catch (e) {
      console.error("Lỗi khi gọi API:", e);
      setEntries([]);
    }
  }, [selectedCourse]);

  // FIX: Thêm dependency `selectedCourse` vào mảng dependency để gọi lại khi khóa học thay đổi.
  useEffect(() => {
    fetchEnrolled();
  }, [selectedCourse]);


  const handleAdd = async (data: StudentFormData, avatarBase64: string | null) => {
    if (!selectedCourse) {
      toast.warn('Chọn khóa học trước khi thêm.');
      return;
    }
    try {
      const response = await post<ApiResponse>('/api/qr', {
        courseId: selectedCourse,
        code: data,
      });
      if (response.EC === 0) {
        toast.success(`Đã thêm ${data.name} (CCCD ${data.id}) vào khóa học!`);
        fetchEnrolled();
      } else {
        toast.error(response.EM || 'Thêm vào khóa học thất bại');
      }
    } catch (e) {
      toast.error('Lỗi khi gọi API thêm vào khóa học');
      console.error(e);
    }
  };

  const handleUpdate = async (updated: StudentFormData) => {
    if (!selectedCourse) {
      toast.warn('Chọn khóa học trước.');
      return;
    }
    try {
      const response = await put<ApiResponse>('/api/qr/update', {
        studentData: updated
      });
      if (response.EC === 0) {
        toast.success('Đã cập nhật bản ghi.');
        fetchEnrolled();
      } else {
        toast.error(response.EM || 'Cập nhật thất bại');
      }
    } catch (e) {
      toast.error('Lỗi khi gọi API cập nhật');
      console.error(e);
    }
  };


  const handleDelete = async (id: number) => {
    if (!selectedCourse) {
      toast.warn('Chọn khóa học trước.');
      return;
    }
    try {
      const response = await del<ApiResponse>(
        `/api/qr/${encodeURIComponent(id)}`
      );
      if (response.EC === 0) {
        toast.success('Đã xóa bản ghi.');
        fetchEnrolled();
      } else {
        toast.error(response.EM || 'Xóa thất bại');
      }
    } catch (e) {
      toast.error('Lỗi khi gọi API xóa');
      console.error(e);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      toast.warning('Nhập tên khóa học');
      return;
    }
    // TRUYỀN THÊM newCourseType VÀO BODY REQUEST
    try {
      const response = await post<ApiResponse>('/api/courseQR/add', {
        name: newCourseName.trim(),
        description: newCourseDesc || null,
        type: newCourseType, // <--- Đã thêm dòng này
      });
      if (response.EC === 0) {
        toast.success('Tạo khóa học thành công');
        setNewCourseName('');
        setNewCourseDesc('');
        setNewCourseType('CCCD'); // Reset về giá trị mặc định
        setShowCreateCourse(false);
        fetchCourses();
      } else {
        toast.error(response.EM || 'Tạo khóa học thất bại');
      }
    } catch {
      toast.error('Tạo khóa học thất bại');
    }
  };

  const handleExportToExcel = () => {
    if (entries.length === 0) {
      toast.info('Không có dữ liệu để xuất file.');
      return;
    }

    // Chuẩn bị dữ liệu để xuất
    const dataForExport = entries.map((entry, index) => ({
      'STT': index + 1,
      'CCCD': entry.CCCD,
      'CMT': entry.CMT,
      'Họ tên': entry.name,
      'Ngày sinh': entry.dob,
      'Giới tính': entry.gender,
      'Địa chỉ': entry.address,
      'Ngày cấp': entry.registrationDate,
    }));

    // Tạo một worksheet từ dữ liệu JSON
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);

    // Tạo một workbook và thêm worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dữ liệu QR');

    // Ghi file Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // Lưu file với tên tùy chỉnh
    saveAs(data, `Danh_sach_QR_${new Date().toLocaleDateString('vi-VN')}.xlsx`);

    toast.success('Đã xuất dữ liệu ra file Excel!');
  };

  return (
    <div className="qr-scanner container">
      <h1 className="title">QR</h1>

      {/* Khu vực scan & thêm */}
      <QrScannerForm onAdd={handleAdd} />

      {/* (Tuỳ chọn) Chọn khóa học để đẩy từng bản ghi lên server */}
      <div className="mt-4">
        <label className="me-2">Course Detect:</label>
        <div className='list-course'>
          <div className="left">
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Select a course</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="right">
            <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setShowCreateCourse(!showCreateCourse)}>Create Course</button>
            {showCreateCourse && (
              <div className="create-course-form mt-2 d-flex gap-2">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="New course name"
                />
                <input
                  type="text"
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Description (optional)"
                />
                {/* THÊM DROPDOWN CHO LOẠI KHÓA HỌC */}
                <select value={newCourseType} onChange={(e) => setNewCourseType(e.target.value)}>
                  {qrTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleCreateCourse}>Save</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h2 className="mb-0">Danh sách đã thêm</h2>
        <button
          type="button"
          className="btn btn-success"
          onClick={handleExportToExcel}
        >
          <i className="fas fa-file-excel me-2"></i>
          Xuất Excel
        </button>
      </div>
      {/* Bảng entries: sửa/xóa tại chỗ, cùng một trang */}
      <QrEntriesTable entries={entries} avatars={avatars} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
};

export default QrScannerPage;