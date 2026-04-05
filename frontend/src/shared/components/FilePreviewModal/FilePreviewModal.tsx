import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import './FilePreviewModal.scss';

type FilePreviewModalProps = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
};

const isImage = (mime: string) => mime.startsWith('image/');
const isPdf = (mime: string) => mime === 'application/pdf';
const isExcel = (mime: string) =>
  mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
  mime === 'application/vnd.ms-excel' ||
  /\.xlsx?$/i.test(mime);
const isWord = (mime: string) =>
  mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
  mime === 'application/msword' ||
  /\.docx?$/i.test(mime);

const getFileIcon = (mime: string) => {
  if (isImage(mime)) return 'image';
  if (isPdf(mime)) return 'picture_as_pdf';
  if (isExcel(mime)) return 'table_chart';
  if (isWord(mime)) return 'description';
  return 'insert_drive_file';
};

// ── Image viewer with zoom ──────────────────────────────────────────────────

const ImageViewer: React.FC<{ url: string }> = ({ url }) => {
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 5));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const resetZoom = () => setZoom(1);

  return (
    <div className="fpm__image-viewer">
      <div className="fpm__image-scroll">
        <img
          src={url}
          alt="Preview"
          className="fpm__image"
          style={{ transform: `scale(${zoom})` }}
          onDoubleClick={resetZoom}
        />
      </div>
      <div className="fpm__zoom-controls">
        <button type="button" onClick={zoomOut} title="Thu nhỏ">
          <span className="material-icons">remove</span>
        </button>
        <span className="fpm__zoom-label">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={zoomIn} title="Phóng to">
          <span className="material-icons">add</span>
        </button>
        <button type="button" onClick={resetZoom} title="Kích thước gốc">
          <span className="material-icons">fit_screen</span>
        </button>
      </div>
    </div>
  );
};

// ── PDF viewer ──────────────────────────────────────────────────────────────

const PdfViewer: React.FC<{ url: string }> = ({ url }) => (
  <iframe src={url} className="fpm__pdf-frame" title="PDF Viewer" />
);

// ── Excel viewer ────────────────────────────────────────────────────────────

const ExcelViewer: React.FC<{ url: string }> = ({ url }) => {
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        if (cancelled) return;
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const result = wb.SheetNames.map(name => ({
          name,
          html: XLSX.utils.sheet_to_html(wb.Sheets[name], { editable: false }),
        }));
        setSheets(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể đọc file Excel');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <div className="fpm__loading"><span className="material-icons fpm__spin">sync</span> Đang đọc file...</div>;
  if (error) return <div className="fpm__error">{error}</div>;

  return (
    <div className="fpm__excel-viewer">
      {sheets.length > 1 && (
        <div className="fpm__sheet-tabs">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              className={`fpm__sheet-tab ${i === activeSheet ? 'fpm__sheet-tab--active' : ''}`}
              onClick={() => setActiveSheet(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div
        className="fpm__excel-content"
        dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html || '' }}
      />
    </div>
  );
};

// ── Word viewer ─────────────────────────────────────────────────────────────

const WordViewer: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only .docx is supported by mammoth, .doc fallback to download
    if (fileName.toLowerCase().endsWith('.doc') && !fileName.toLowerCase().endsWith('.docx')) {
      setError('File .doc không hỗ trợ xem trực tiếp. Vui lòng tải về.');
      setLoading(false);
      return;
    }

    import('mammoth')
      .then(mammoth =>
        fetch(url)
          .then(res => res.arrayBuffer())
          .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
      )
      .then(result => {
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể đọc file Word');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url, fileName]);

  if (loading) return <div className="fpm__loading"><span className="material-icons fpm__spin">sync</span> Đang đọc file...</div>;
  if (error) return (
    <div className="fpm__error">
      <p>{error}</p>
      <a href={url} download={fileName} className="fpm__download-link">
        <span className="material-icons">download</span> Tải về
      </a>
    </div>
  );

  return (
    <div className="fpm__word-content" dangerouslySetInnerHTML={{ __html: html || '' }} />
  );
};

// ── Fallback ────────────────────────────────────────────────────────────────

const FallbackViewer: React.FC<{ url: string; fileName: string; fileType: string }> = ({ url, fileName, fileType }) => (
  <div className="fpm__fallback">
    <span className="material-icons fpm__fallback-icon">{getFileIcon(fileType)}</span>
    <p className="fpm__fallback-name">{fileName}</p>
    <a href={url} download={fileName} className="fpm__download-link">
      <span className="material-icons">download</span> Tải về
    </a>
  </div>
);

// ── Main modal ──────────────────────────────────────────────────────────────

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ fileUrl, fileName, fileType, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const renderContent = () => {
    if (isImage(fileType)) return <ImageViewer url={fileUrl} />;
    if (isPdf(fileType)) return <PdfViewer url={fileUrl} />;
    if (isExcel(fileType)) return <ExcelViewer url={fileUrl} />;
    if (isWord(fileType)) return <WordViewer url={fileUrl} fileName={fileName} />;
    return <FallbackViewer url={fileUrl} fileName={fileName} fileType={fileType} />;
  };

  return createPortal(
    <div className="fpm__overlay" ref={overlayRef}>
      <div className="fpm__container">
        <header className="fpm__header">
          <button type="button" className="fpm__close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
          <div className="fpm__header-info">
            <span className="material-icons fpm__header-icon">{getFileIcon(fileType)}</span>
            <span className="fpm__header-name">{fileName}</span>
          </div>
          <a href={fileUrl} download={fileName} className="fpm__header-download" title="Tải về">
            <span className="material-icons">download</span>
          </a>
        </header>
        <div className="fpm__body">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FilePreviewModal;
