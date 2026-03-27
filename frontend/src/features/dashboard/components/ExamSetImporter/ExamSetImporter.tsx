import React, { useRef, useState } from 'react';
import httpClient from '../../../../shared/services/httpClient';
import './ExamSetImporter.scss';

type SheetResult = {
  sheet: string;
  status: 'success' | 'skipped';
  rank?: string;
  setsCreated?: number;
  questionsPerSet?: number;
  notFoundCount?: number;
  reason?: string;
};

type ImportResult = {
  EM: string;
  EC: number;
  DT: SheetResult[];
};

const ExamSetImporter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await httpClient.post<ImportResult>('/api/exam-sets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch {
      setResult({ EM: 'Lỗi kết nối server', EC: -1, DT: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="esi">
      <div className="esi__header">
        <h2 className="esi__title">Import bộ đề ôn tập</h2>
        <p className="esi__subtitle">
          Upload file Excel chứa bộ đề ôn tập theo từng hạng. Tên sheet = tên hạng (VD: B, A1, C).
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`esi__dropzone${dragging ? ' esi__dropzone--over' : ''}${file ? ' esi__dropzone--has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="esi__file-input"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="esi__file-info">
            <span className="material-icons esi__file-icon">description</span>
            <div>
              <p className="esi__file-name">{file.name}</p>
              <p className="esi__file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <>
            <span className="material-icons esi__upload-icon">upload_file</span>
            <p className="esi__upload-text">Kéo thả file hoặc nhấn để chọn</p>
            <p className="esi__upload-hint">.xlsx / .xls — tên sheet = hạng (B, A1, C...)</p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="esi__actions">
        <button
          className="esi__btn esi__btn--import"
          onClick={handleSubmit}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <span className="material-icons esi__spin">sync</span>
              Đang import...
            </>
          ) : (
            <>
              <span className="material-icons">publish</span>
              Import bộ ôn tập
            </>
          )}
        </button>

        {file && (
          <button className="esi__btn esi__btn--reset" onClick={handleReset} disabled={loading}>
            <span className="material-icons">close</span>
            Xóa file
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="esi__result">
          <div className={`esi__result-banner esi__result-banner--${result.EC === 0 ? 'ok' : 'err'}`}>
            <span className="material-icons">{result.EC === 0 ? 'check_circle' : 'error'}</span>
            <span>{result.EM}</span>
          </div>

          {result.DT.length > 0 && (
            <div className="esi__result-table-wrap">
              <table className="esi__result-table">
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Hạng</th>
                    <th>Bộ ôn tập tạo</th>
                    <th>Câu/bộ</th>
                    <th>Câu không tìm thấy</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {result.DT.map((row, i) => (
                    <tr key={i} className={`esi__result-row esi__result-row--${row.status}`}>
                      <td className="esi__cell-sheet">{row.sheet}</td>
                      <td>{row.rank ?? '—'}</td>
                      <td className="esi__cell-num">{row.setsCreated ?? '—'}</td>
                      <td className="esi__cell-num">{row.questionsPerSet ?? '—'}</td>
                      <td className={`esi__cell-num${(row.notFoundCount ?? 0) > 0 ? ' esi__cell-warn' : ''}`}>
                        {row.notFoundCount ?? '—'}
                      </td>
                      <td>
                        <span className={`esi__badge esi__badge--${row.status}`}>
                          {row.status === 'success' ? 'Thành công' : `Bỏ qua: ${row.reason}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Format guide */}
      <div className="esi__guide">
        <span className="material-icons">info</span>
        <div>
          <p className="esi__guide-title">Định dạng file Excel</p>
          <ul className="esi__guide-list">
            <li>Mỗi sheet = 1 hạng, tên sheet phải khớp với tên hạng trong DB (VD: <code>B</code>, <code>A1</code>, <code>C</code>)</li>
            <li>Dòng 1: tiêu đề (bỏ qua)</li>
            <li>Dòng 2: header — <code>Đề | C1 | C2 | ... | C30</code></li>
            <li>Dòng 3 trở đi: số thứ tự bộ ôn tập và số câu hỏi tương ứng</li>
            <li>Toàn bộ bộ đề ôn tập cũ của hạng sẽ bị xóa và tạo lại</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExamSetImporter;
