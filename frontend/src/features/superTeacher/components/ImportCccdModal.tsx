import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { importCccdApi } from '../services/superTeacherApi';
import './ImportCccdModal.scss';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const ImportCccdModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parseCccdList = (): string[] => {
    return input
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleImport = async () => {
    const list = parseCccdList();
    if (list.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 số CCCD');
      return;
    }

    setSubmitting(true);
    try {
      const res = await importCccdApi(list);
      if (res.EC === 0) {
        toast.info(res.EM || `Đang xử lý ${list.length} CCCD ở chế độ nền...`);
        onClose();
        // Background job will push WS notification when done — parent refreshes via socket
      } else {
        toast.error(res.EM || 'Import thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const cccdCount = parseCccdList().length;

  return (
    <div className="import-cccd__backdrop" onClick={onClose}>
      <div className="import-cccd__box" onClick={e => e.stopPropagation()}>
        <h3 className="import-cccd__title">Import học viên từ CSĐT</h3>
        <p className="import-cccd__desc">
          Nhập danh sách số CCCD, mỗi số một dòng hoặc ngăn cách bằng dấu phẩy.
          Hệ thống sẽ tra cứu từ CSĐT và tạo hồ sơ học viên.
        </p>

        <textarea
          className="import-cccd__textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={"012345678901\n012345678902\n012345678903"}
          rows={6}
          disabled={submitting}
        />

        {cccdCount > 0 && (
          <p className="import-cccd__count">
            <span className="material-symbols-outlined">badge</span>
            {cccdCount} CCCD sẽ được import
          </p>
        )}

        <div className="import-cccd__actions">
          <button className="import-cccd__cancel" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button
            className="import-cccd__submit"
            onClick={handleImport}
            disabled={cccdCount === 0 || submitting}
          >
            {submitting ? 'Đang gửi...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCccdModal;
