import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { StudentInTeam } from '../types';
import type { StudentEditData } from '../services/superTeacherApi';
import './StudentEditModal.scss';

type Teacher = { id: number; username: string };

type Props = {
  student: StudentInTeam;
  teachers: Teacher[];
  onSave: (hocVienId: number, data: StudentEditData) => Promise<void>;
  onAssign: (hocVienId: number, teacherId: number) => Promise<void>;
  onDrop: () => Promise<void>;
  onClose: () => void;
};

const StudentEditModal: React.FC<Props> = ({
  student, teachers, onSave, onAssign, onDrop, onClose,
}) => {
  const hv = student.hocVien;

  const [form, setForm] = useState<StudentEditData>({
    HoTen: hv?.HoTen ?? '',
    SoCCCD: hv?.SoCCCD ?? '',
    NgaySinh: hv?.NgaySinh ?? '',
    GioiTinh: hv?.GioiTinh ?? '',
    phone: hv?.phone ?? '',
    DiaChi: hv?.DiaChi ?? '',
    GhiChu: hv?.GhiChu ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState<number | ''>(student.teacherId || '');
  const [assigning, setAssigning] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [dropping, setDropping] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(student.hocVienId, form);
      onClose();
    } catch {
      // toast shown in hook
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTeacherId) return;
    setAssigning(true);
    try {
      await onAssign(student.hocVienId, Number(assignTeacherId));
    } finally {
      setAssigning(false);
    }
  };

  const handleDrop = async () => {
    setDropping(true);
    try {
      await onDrop();
      onClose();
    } finally {
      setDropping(false);
    }
  };

  const currentTeacher = teachers.find(t => t.id === student.teacherId);

  return createPortal(
    <div className="sem__overlay" onClick={onClose}>
      <div className="sem__panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sem__header">
          <div>
            <div className="sem__status-badge">
              <span className="material-symbols-outlined">sync</span>
              Chờ đồng bộ
            </div>
            <h3 className="sem__title">Thông tin học viên</h3>
          </div>
          <button className="sem__close" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="sem__banner">
          <span className="material-symbols-outlined">info</span>
          <p>Thông tin cá nhân sẽ bị ghi đè khi học viên được đồng bộ từ hệ thống đào tạo.</p>
        </div>

        <div className="sem__body">
          {/* Personal info form */}
          <div className="sem__section-label">Thông tin cá nhân</div>
          <div className="sem__grid">
            <div className="sem__field">
              <label className="sem__label" htmlFor="sem-HoTen">Họ và tên</label>
              <input
                id="sem-HoTen"
                className="sem__input"
                name="HoTen"
                value={form.HoTen}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="sem__field">
              <label className="sem__label" htmlFor="sem-SoCCCD">Số CCCD</label>
              <input
                id="sem-SoCCCD"
                className="sem__input"
                name="SoCCCD"
                value={form.SoCCCD}
                onChange={handleChange}
                placeholder="012345678901"
              />
            </div>
            <div className="sem__field">
              <label className="sem__label" htmlFor="sem-NgaySinh">Ngày sinh</label>
              <input
                id="sem-NgaySinh"
                className="sem__input"
                name="NgaySinh"
                type="date"
                value={form.NgaySinh}
                onChange={handleChange}
              />
            </div>
            <div className="sem__field">
              <label className="sem__label" htmlFor="sem-GioiTinh">Giới tính</label>
              <select
                id="sem-GioiTinh"
                className="sem__input sem__select"
                name="GioiTinh"
                value={form.GioiTinh}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="sem__field">
              <label className="sem__label" htmlFor="sem-phone">Số điện thoại</label>
              <input
                id="sem-phone"
                className="sem__input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901234567"
              />
            </div>
            <div className="sem__field sem__field--full">
              <label className="sem__label" htmlFor="sem-DiaChi">Địa chỉ</label>
              <input
                id="sem-DiaChi"
                className="sem__input"
                name="DiaChi"
                value={form.DiaChi}
                onChange={handleChange}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
              />
            </div>
            <div className="sem__field sem__field--full">
              <label className="sem__label" htmlFor="sem-GhiChu">Ghi chú</label>
              <textarea
                id="sem-GhiChu"
                className="sem__input sem__textarea"
                name="GhiChu"
                value={form.GhiChu}
                onChange={handleChange}
                rows={2}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>

          {/* Assign teacher */}
          <div className="sem__section-label">Phân công giảng viên</div>
          <div className="sem__assign">
            <div className="sem__assign-current">
              <span className="material-symbols-outlined">school</span>
              {currentTeacher
                ? <span>Đang phụ trách: <strong>{currentTeacher.username}</strong></span>
                : <em>Chưa phân công</em>
              }
            </div>
            <div className="sem__assign-form">
              <select
                className="sem__assign-select"
                value={assignTeacherId}
                onChange={e => setAssignTeacherId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn giảng viên --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </select>
              <button
                className="sem__assign-btn"
                onClick={handleAssign}
                disabled={!assignTeacherId || assignTeacherId === student.teacherId || assigning}
                type="button"
              >
                <span className="material-symbols-outlined">group_add</span>
                {assigning ? 'Đang gán...' : 'Phân công'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sem__footer">
          <div className="sem__footer-left">
            {!confirmDrop ? (
              <button className="sem__drop-btn" onClick={() => setConfirmDrop(true)} type="button">
                <span className="material-symbols-outlined">person_remove</span>
                Xóa khỏi đội
              </button>
            ) : (
              <div className="sem__drop-confirm">
                <span>Xác nhận xóa?</span>
                <button className="sem__drop-cancel" onClick={() => setConfirmDrop(false)} type="button">
                  Hủy
                </button>
                <button
                  className="sem__drop-execute"
                  onClick={handleDrop}
                  disabled={dropping}
                  type="button"
                >
                  {dropping ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            )}
          </div>
          <div className="sem__footer-right">
            <button className="sem__cancel-btn" onClick={onClose} type="button">Hủy</button>
            <button
              className="sem__save-btn"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default StudentEditModal;
