import React, { useState, useEffect, useRef } from "react";
import { useApi } from "../../../../shared/hooks";
import httpClient from "../../../../shared/services/httpClient";
import { ApiResponse } from "../../../../core/types";
import { Rank, Course } from "../../../../features/student/types";
import { ENVIRONMENT_CONFIGS, getCurrentEnvironment } from "../../../../core/config/environment";
import { toast } from "react-toastify";
import "./UploadFiles.scss";

// ─── Toast notification ───────────────────────────────────────────────────────
interface Toast { id: number; type: 'success' | 'error' | 'info'; text: string; }
let toastId = 0;

// ─── Drag-and-drop file zone ──────────────────────────────────────────────────
interface DropZoneProps {
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ accept, file, onChange, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  return (
    <div
      className={`dz-zone ${dragging ? 'dz-over' : ''} ${file ? 'dz-has-file' : ''} ${disabled ? 'dz-disabled' : ''}`}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => onChange(e.target.files?.[0] || null)}
        disabled={disabled}
      />
      {file ? (
        <>
          <i className="material-icons dz-icon dz-icon-file">insert_drive_file</i>
          <span className="dz-filename">{file.name}</span>
          <button className="dz-clear" onClick={e => { e.stopPropagation(); onChange(null); }}>
            <i className="material-icons">close</i>
          </button>
        </>
      ) : (
        <>
          <i className="material-icons dz-icon">cloud_upload</i>
          <span className="dz-hint">Kéo thả file vào đây hoặc <u>nhấn để chọn</u></span>
          <span className="dz-accept">{accept.replace(/\./g,'').replace(/,/g,' / ').toUpperCase()}</span>
        </>
      )}
    </div>
  );
};

// ─── Upload card ──────────────────────────────────────────────────────────────
interface UploadCardProps {
  icon: string;
  iconColor?: string;
  title: string;
  desc: string;
  accept: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onUpload: () => Promise<void>;
  loading: boolean;
  msg: { type: 'success' | 'error'; text: string } | null;
  children?: React.ReactNode; // slot for extra controls (dropdown)
  btnLabel?: string;
}

const UploadCard: React.FC<UploadCardProps> = ({
  icon, iconColor = '#1a73e8', title, desc, accept, file, onFileChange,
  onUpload, loading, msg, children, btnLabel = 'Upload',
}) => (
  <div className="uc-card">
    <div className="uc-card-header">
      <div className="uc-icon-wrap" style={{ background: iconColor + '18', color: iconColor }}>
        <i className="material-icons">{icon}</i>
      </div>
      <div>
        <div className="uc-title">{title}</div>
        <div className="uc-desc">{desc}</div>
      </div>
    </div>

    {children && <div className="uc-extra">{children}</div>}

    <DropZone accept={accept} file={file} onChange={onFileChange} disabled={loading} />

    {msg && (
      <div className={`uc-msg uc-msg--${msg.type}`}>
        <i className="material-icons">{msg.type === 'success' ? 'check_circle' : 'error_outline'}</i>
        {msg.text}
      </div>
    )}

    <button className="uc-btn" onClick={onUpload} disabled={loading || !file}>
      {loading
        ? <><span className="uc-spinner" /> Đang xử lý...</>
        : <><i className="material-icons">upload</i> {btnLabel}</>}
    </button>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const UploadFiles: React.FC = () => {
  const { get, post } = useApi();

  // Lắng nghe kết quả import XML qua WebSocket
  useEffect(() => {
    const wsUrl = ENVIRONMENT_CONFIGS[getCurrentEnvironment()]?.WS_BASE_URL;
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'IMPORT_XML_STATUS') {
          const { EC, EM, DT } = data.payload;
          if (EC === 0) {
            toast.success(`✅ Import hoàn tất! ${DT?.successful ?? ''} thí sinh thành công${DT?.failed ? `, ${DT.failed} lỗi` : ''}.`);
          } else {
            toast.error(`❌ Import thất bại: ${EM}`);
          }
        }
      } catch { /* ignore */ }
    };
    return () => { ws.close(); };
  }, []);

  // files
  const [fileStudent,    setFileStudent]    = useState<File | null>(null);
  const [filePayment,    setFilePayment]    = useState<File | null>(null);
  const [fileQuestion,   setFileQuestion]   = useState<File | null>(null);
  const [file600,        setFile600]        = useState<File | null>(null);
  const [fileRankUpdate, setFileRankUpdate] = useState<File | null>(null);
  const [fileGplx,       setFileGplx]       = useState<File | null>(null);

  // loading
  const [ldStudent,    setLdStudent]    = useState(false);
  const [ldPayment,    setLdPayment]    = useState(false);
  const [ldQuestion,   setLdQuestion]   = useState(false);
  const [ld600,        setLd600]        = useState(false);
  const [ldRankUpdate, setLdRankUpdate] = useState(false);
  const [ldGplx,       setLdGplx]       = useState(false);

  // messages
  const [msgStudent,    setMsgStudent]    = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [msgPayment,    setMsgPayment]    = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [msgQuestion,   setMsgQuestion]   = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [msg600,        setMsg600]        = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [msgRankUpdate, setMsgRankUpdate] = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [msgGplx,       setMsgGplx]       = useState<{ type: 'success'|'error'; text: string }|null>(null);

  // data
  const [courses,        setCourses]        = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [ranks,          setRanks]          = useState<Rank[]>([]);
  const [selectedRank,   setSelectedRank]   = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          get<ApiResponse<Course[]>>('/api/course'),
          get<ApiResponse<Rank[]>>('/api/rank/getRank'),
        ]);
        setCourses(cRes.DT || []);
        if (cRes.DT?.length) setSelectedCourse(cRes.DT[0].IDKhoaHoc);
        setRanks(rRes.DT || []);
        if (rRes.DT?.length) setSelectedRank(rRes.DT[0].id);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── upload helpers ──
  const upload = async (
    file: File, endpoint: string, extra: Record<string, any>,
    setMsg: (m: { type: 'success'|'error'; text: string }|null) => void,
    setFile: (f: File|null) => void,
    setLd: (b: boolean) => void,
  ) => {
    setLd(true); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    try {
      // Dùng httpClient trực tiếp để không kích hoạt GlobalSpinner (đã có spinner trong button)
      const response = await httpClient.post(endpoint, fd);
      const res: any = response.data;
      if (res?.EC === 0) {
        setMsg({ type: 'success', text: res.EM || 'Thành công!' });
        setFile(null);
      } else {
        setMsg({ type: 'error', text: res?.EM || 'Có lỗi xảy ra.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối, vui lòng thử lại.' });
    } finally {
      setLd(false);
    }
  };

  return (
    <div className="uf-wrapper">
      <div className="uf-header">
        <div className="uf-header-icon"><i className="material-icons">upload_file</i></div>
        <div>
          <div className="uf-header-title">Quản lý Import dữ liệu</div>
          <div className="uf-header-sub">Tải lên các file dữ liệu thí sinh, bộ đề và GPLX</div>
        </div>
      </div>

      {/* ── Section 1: Thí sinh ── */}
      <div className="uf-section">
        <div className="uf-section-label">
          <i className="material-icons">people</i> Quản lý thí sinh
        </div>
        <div className="uf-grid">

          <UploadCard
            icon="person_add" iconColor="#1a73e8"
            title="Import thí sinh"
            desc="File XML xuất từ hệ thống, bao gồm thông tin khoá học"
            accept=".xml"
            file={fileStudent} onFileChange={setFileStudent}
            loading={ldStudent} msg={msgStudent}
            btnLabel="Import thí sinh"
            onUpload={() => fileStudent
              ? upload(fileStudent, '/api/import-xml', {}, setMsgStudent, setFileStudent, setLdStudent)
              : Promise.resolve()
            }
          />

          <UploadCard
            icon="payment" iconColor="#0d9488"
            title="Import thanh toán"
            desc="File Excel danh sách học viên đã thanh toán theo khoá học"
            accept=".xlsx"
            file={filePayment} onFileChange={setFilePayment}
            loading={ldPayment} msg={msgPayment}
            btnLabel="Import thanh toán"
            onUpload={() => filePayment
              ? upload(filePayment, '/api/import-payment', { IDKhoaHoc: selectedCourse }, setMsgPayment, setFilePayment, setLdPayment)
              : Promise.resolve()
            }
          >
            <div className="uc-select-wrap">
              <label><i className="material-icons">school</i> Khoá học</label>
              <select value={selectedCourse || ''} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="" disabled>-- Chọn khoá học --</option>
                {courses.map(c => <option key={c.IDKhoaHoc} value={c.IDKhoaHoc}>{c.TenKhoaHoc}</option>)}
              </select>
            </div>
          </UploadCard>

        </div>
      </div>

      {/* ── Section 2: Ngân hàng đề thi ── */}
      <div className="uf-section">
        <div className="uf-section-label">
          <i className="material-icons">quiz</i> Ngân hàng đề thi
        </div>
        <div className="uf-grid">

          <UploadCard
            icon="help_outline" iconColor="#7c3aed"
            title="Upload 600 câu hỏi"
            desc="File Excel theo mẫu chuẩn, chứa toàn bộ ngân hàng câu hỏi"
            accept=".xlsx"
            file={file600} onFileChange={setFile600}
            loading={ld600} msg={msg600}
            btnLabel="Upload câu hỏi"
            onUpload={() => file600
              ? upload(file600, '/api/file/createOrUpdateQuestion', {}, setMsg600, setFile600, setLd600)
              : Promise.resolve()
            }
          />

          <UploadCard
            icon="library_books" iconColor="#ea580c"
            title="Upload bộ đề thi"
            desc="File Excel bộ đề theo hạng GPLX, theo file mẫu kèm theo"
            accept=".xlsx"
            file={fileQuestion} onFileChange={setFileQuestion}
            loading={ldQuestion} msg={msgQuestion}
            btnLabel="Upload bộ đề"
            onUpload={() => fileQuestion
              ? upload(fileQuestion, '/api/testStudent/processExcelAndInsert', { IDrank: selectedRank }, setMsgQuestion, setFileQuestion, setLdQuestion)
              : Promise.resolve()
            }
          >
            <div className="uc-select-wrap">
              <label><i className="material-icons">directions_car</i> Hạng GPLX</label>
              <select value={selectedRank || ''} onChange={e => setSelectedRank(Number(e.target.value))}>
                <option value="" disabled>-- Chọn hạng --</option>
                {ranks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </UploadCard>

        </div>
      </div>

      {/* ── Section 3: GPLX ── */}
      <div className="uf-section">
        <div className="uf-section-label">
          <i className="material-icons">badge</i> Dữ liệu GPLX
        </div>
        <div className="uf-grid">

          <UploadCard
            icon="update" iconColor="#0891b2"
            title="Cập nhật hạng GPLX"
            desc="File Excel cập nhật hạng GPLX cho thí sinh đã có trong hệ thống"
            accept=".xlsx"
            file={fileRankUpdate} onFileChange={setFileRankUpdate}
            loading={ldRankUpdate} msg={msgRankUpdate}
            btnLabel="Cập nhật"
            onUpload={() => fileRankUpdate
              ? upload(fileRankUpdate, '/api/file/update-rank-student-with-excel', {}, setMsgRankUpdate, setFileRankUpdate, setLdRankUpdate)
              : Promise.resolve()
            }
          />

          <UploadCard
            icon="manage_search" iconColor="#c8000a"
            title="Import GPLX tra cứu"
            desc="File Excel danh sách GPLX tra cứu theo CCCD từ hệ thống Cục CSGT"
            accept=".xlsx,.xls"
            file={fileGplx} onFileChange={setFileGplx}
            loading={ldGplx} msg={msgGplx}
            btnLabel="Import GPLX"
            onUpload={() => fileGplx
              ? upload(fileGplx, '/api/gplx/import', {}, setMsgGplx, setFileGplx, setLdGplx)
              : Promise.resolve()
            }
          />

        </div>
      </div>
    </div>
  );
};

export default UploadFiles;
