import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import axios from '../../../axios';
import { createNotification } from '../services/notificationApi';
import type { CreateNotificationPayload } from '../types';

type AdminOption = { id: number; username: string; email: string };
type STOption = { id: number; username: string; email: string };
type HVOption = { id: number; HoTen: string; SoCCCD?: string };

type NotificationType = 'admin_to_st' | 'admin_to_student' | 'admin_to_all' | 'superadmin_to_admin' | 'superadmin_to_student';

type NotificationFormProps = {
  onClose: () => void;
  onCreated: () => void;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf')) return 'picture_as_pdf';
  if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
  if (type.includes('document') || type.includes('word')) return 'description';
  return 'insert_drive_file';
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const NotificationForm: React.FC<NotificationFormProps> = ({ onClose, onCreated }) => {
  const { role } = useAuth();
  const isSupperAdmin = role === 'SupperAdmin';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NotificationType>(isSupperAdmin ? 'superadmin_to_admin' : 'admin_to_all');
  const [targetScope, setTargetScope] = useState<'all' | 'selected'>('all');
  const [priority, setPriority] = useState<'normal' | 'important'>('normal');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Recipients list for "selected" scope
  const [adminList, setAdminList] = useState<AdminOption[]>([]);
  const [stList, setStList] = useState<STOption[]>([]);
  const [hvList, setHvList] = useState<HVOption[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recipients when type or targetScope changes
  useEffect(() => {
    if (targetScope !== 'selected') return;
    setSelectedIds(new Set());
    setLoadingList(true);

    if (type === 'superadmin_to_admin') {
      axios.get<{ EC: number; DT: AdminOption[] }>('/api/admins')
        .then(res => { if (res.data.EC === 0) setAdminList(res.data.DT ?? []); })
        .finally(() => setLoadingList(false));
    } else if (type === 'admin_to_st') {
      axios.get<{ EC: number; DT: STOption[] }>('/api/admin/supper-teachers')
        .then(res => { if (res.data.EC === 0) setStList(res.data.DT ?? []); })
        .finally(() => setLoadingList(false));
    } else {
      // admin_to_student or superadmin_to_student
      axios.get<{ EC: number; DT: HVOption[] }>('/api/hocvien')
        .then(res => { if (res.data.EC === 0) setHvList(res.data.DT ?? []); })
        .finally(() => setLoadingList(false));
    }
  }, [type, targetScope]);

  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    const valid = incoming.filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.warn(`${f.name}: loại file không hỗ trợ`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.warn(`${f.name}: vượt quá 10MB`);
        return false;
      }
      return true;
    });
    setFiles(prev => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        toast.warn(`Tối đa ${MAX_FILES} file`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.warn('Vui lòng nhập tiêu đề'); return; }
    if (!content.trim()) { toast.warn('Vui lòng nhập nội dung'); return; }
    if (targetScope === 'selected' && selectedIds.size === 0) {
      toast.warn('Vui lòng chọn ít nhất 1 người nhận');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateNotificationPayload = {
        title: title.trim(),
        content: content.trim(),
        type,
        targetScope,
        priority,
        recipientIds: targetScope === 'selected' ? [...selectedIds] : undefined,
        files: files.length > 0 ? files : undefined,
      };
      const res = await createNotification(payload);
      if (res.EC === 0) {
        toast.success(res.EM);
        onCreated();
      } else {
        toast.error(res.EM);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nm__modal-overlay" onClick={onClose}>
      <div className="nm__modal" onClick={e => e.stopPropagation()}>
        <div className="nm__modal-header">
          <h3>Tạo thông báo mới</h3>
          <button type="button" className="nm__modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="nm__form">
          <div className="nm__form-row nm__form-row--2col">
            <div className="nm__form-field">
              <label>Gửi đến</label>
              <select value={type} onChange={e => { const v = e.target.value as NotificationType; setType(v); if (v === 'admin_to_all') setTargetScope('all'); }}>
                {isSupperAdmin ? (
                  <>
                    <option value="superadmin_to_admin">Admin</option>
                    <option value="superadmin_to_student">Học viên (toàn hệ thống)</option>
                  </>
                ) : (
                  <>
                    <option value="admin_to_all">Tất cả (ST + Học viên)</option>
                    <option value="admin_to_student">Học viên</option>
                    <option value="admin_to_st">SupperTeacher</option>
                  </>
                )}
              </select>
            </div>
            {type !== 'admin_to_all' && (
              <div className="nm__form-field">
                <label>Phạm vi</label>
                <select value={targetScope} onChange={e => setTargetScope(e.target.value as typeof targetScope)}>
                  <option value="all">Tất cả</option>
                  <option value="selected">Chọn cụ thể</option>
                </select>
              </div>
            )}
          </div>

          {targetScope === 'selected' && (
            <div className="nm__form-field">
              <label>Chọn người nhận ({selectedIds.size} đã chọn)</label>
              <div className="nm__recipient-list">
                {loadingList ? (
                  <p className="nm__recipient-loading">Đang tải...</p>
                ) : (
                  type === 'superadmin_to_admin' ? (
                    adminList.length === 0 ? <p className="nm__recipient-loading">Không có dữ liệu</p> :
                    adminList.map(a => (
                      <label key={a.id} className="nm__recipient-item">
                        <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleId(a.id)} />
                        <span>{a.username} ({a.email})</span>
                      </label>
                    ))
                  ) : type === 'admin_to_st' ? (
                    stList.length === 0 ? <p className="nm__recipient-loading">Không có dữ liệu</p> :
                    stList.map(st => (
                      <label key={st.id} className="nm__recipient-item">
                        <input type="checkbox" checked={selectedIds.has(st.id)} onChange={() => toggleId(st.id)} />
                        <span>{st.username} ({st.email})</span>
                      </label>
                    ))
                  ) : (
                    hvList.length === 0 ? <p className="nm__recipient-loading">Không có dữ liệu</p> :
                    hvList.map(hv => (
                      <label key={hv.id} className="nm__recipient-item">
                        <input type="checkbox" checked={selectedIds.has(hv.id)} onChange={() => toggleId(hv.id)} />
                        <span>{hv.HoTen} {hv.SoCCCD ? `— ${hv.SoCCCD}` : ''}</span>
                      </label>
                    ))
                  )
                )}
              </div>
            </div>
          )}

          <div className="nm__form-field">
            <label>Mức độ</label>
            <div className="nm__priority-btns">
              <button
                type="button"
                className={`nm__priority-btn ${priority === 'normal' ? 'nm__priority-btn--active' : ''}`}
                onClick={() => setPriority('normal')}
              >
                Bình thường
              </button>
              <button
                type="button"
                className={`nm__priority-btn nm__priority-btn--important ${priority === 'important' ? 'nm__priority-btn--active' : ''}`}
                onClick={() => setPriority('important')}
              >
                Quan trọng
              </button>
            </div>
          </div>

          <div className="nm__form-field">
            <label>Tiêu đề *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Lịch thi sát hạch B2" />
          </div>

          <div className="nm__form-field">
            <label>Nội dung *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Nhập nội dung thông báo..." />
          </div>

          {/* File upload */}
          <div className="nm__form-field">
            <label>File đính kèm (tối đa {MAX_FILES} file, 10MB/file)</label>
            <div className="nm__upload-area" onClick={() => fileInputRef.current?.click()}>
              <span className="material-icons">cloud_upload</span>
              <span>Nhấn để chọn hoặc kéo thả file (ảnh, PDF, Excel, Word)</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.xlsx,.xls,.docx,.doc"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {files.length > 0 && (
              <div className="nm__file-list">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="nm__file-item">
                    <span className="material-icons nm__file-icon">{getFileIcon(f.type)}</span>
                    <div className="nm__file-info">
                      <span className="nm__file-name">{f.name}</span>
                      <span className="nm__file-size">{formatSize(f.size)}</span>
                    </div>
                    <button type="button" className="nm__file-remove" onClick={() => removeFile(i)}>
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nm__form-actions">
            <button type="button" className="nm__btn-cancel" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="nm__btn-send" disabled={saving}>
              {saving ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationForm;
