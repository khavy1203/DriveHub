import React, { useState, useRef } from 'react';
import axios from '../../../axios';
import { importSupperTeachersApi } from '../services/superTeacherApi';
import type { ImportResult } from '../types';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const ImportSupperTeacherModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importSupperTeachersApi(file);
      if (res.EC === 0 && res.DT) {
        setResult(res.DT);
        onSuccess();
      } else {
        setError(res.EM || 'Lỗi import');
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { EM?: string } } };
      if (axErr.response?.data?.EM) {
        setError(axErr.response.data.EM);
      } else {
        setError('Lỗi kết nối máy chủ');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get('/api/admin/supper-teachers/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MauImportGiaoVien.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Không thể tải file mẫu');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box import-st-modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Import danh sách giáo viên</h3>

        {!result ? (
          <>
            <div className="import-st-body">
              <p className="import-st-desc">
                Upload file ZIP/RAR chứa file Excel (.xlsx) và thư mục <code>avatar/</code> (ảnh giáo viên, tùy chọn).
              </p>

              <div
                className="import-st-drop"
                onClick={() => inputRef.current?.click()}
              >
                <span className="material-icons">cloud_upload</span>
                <span>{file ? file.name : 'Chọn file ZIP hoặc RAR...'}</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="import-st-notes">
                <p><strong>Lưu ý:</strong></p>
                <ul>
                  <li>Bắt buộc: <strong>CCCD</strong> và <strong>Họ tên</strong></li>
                  <li>CCCD trùng trong hệ thống → cập nhật, đánh dấu <em>chính thức</em></li>
                  <li>GV không có trong file → chuyển thành <em>phụ</em></li>
                  <li>Mật khẩu mặc định = số CCCD</li>
                </ul>
              </div>

              {error && <p className="modal-error">{error}</p>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={handleDownloadTemplate}>
                <span className="material-icons">download</span> Tải file mẫu
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-secondary" onClick={onClose} disabled={importing}>Hủy</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleImport}
                disabled={!file || importing}
              >
                {importing ? 'Đang import...' : 'Import'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="import-st-body">
              <div className="import-st-result">
                <h4 className="import-st-result-title">
                  <span className="material-icons" style={{ color: '#16a34a' }}>check_circle</span>
                  Import hoàn tất
                </h4>
                <div className="import-st-stats">
                  <div className="import-st-stat">
                    <span className="import-st-stat-num">{result.created}</span>
                    <span className="import-st-stat-label">Tạo mới</span>
                  </div>
                  <div className="import-st-stat">
                    <span className="import-st-stat-num">{result.updated}</span>
                    <span className="import-st-stat-label">Cập nhật</span>
                  </div>
                  <div className="import-st-stat">
                    <span className="import-st-stat-num">{result.demoted}</span>
                    <span className="import-st-stat-label">Chuyển phụ</span>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="import-st-errors">
                    <p><strong>Lỗi ({result.errors.length} dòng):</strong></p>
                    <ul>
                      {result.errors.map((e, i) => (
                        <li key={i}>Dòng {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-primary" onClick={onClose}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportSupperTeacherModal;
