import React, { useState } from 'react';
import TrainingProgressBlock from '../../trainingPortal/components/TrainingProgressBlock';
import './TrainingDetailModal.scss';

type Teacher = { id: number; username: string };

type Props = {
  cccd: string;
  studentName: string;
  currentTeacherId?: number;
  teachers?: Teacher[];
  onAssign?: (teacherId: number) => Promise<void>;
  onDrop?: () => Promise<void>;
  onClose: () => void;
};

const TrainingDetailModal: React.FC<Props> = ({
  cccd,
  studentName,
  currentTeacherId,
  teachers,
  onAssign,
  onDrop,
  onClose,
}) => {
  const [assignTeacherId, setAssignTeacherId] = useState<number | ''>(currentTeacherId || '');
  const [assigning, setAssigning] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [dropping, setDropping] = useState(false);

  const handleAssign = async () => {
    if (!assignTeacherId || !onAssign) return;
    setAssigning(true);
    try {
      await onAssign(Number(assignTeacherId));
    } finally {
      setAssigning(false);
    }
  };

  const handleDrop = async () => {
    if (!onDrop) return;
    setDropping(true);
    try {
      await onDrop();
      onClose();
    } finally {
      setDropping(false);
    }
  };

  const currentTeacher = teachers?.find(t => t.id === currentTeacherId);

  return (
    <div className="training-detail__backdrop" onClick={onClose}>
      <div className="training-detail__box" onClick={e => e.stopPropagation()}>
        <div className="training-detail__header">
          <div>
            <h3 className="training-detail__title">Tiến độ đào tạo</h3>
            <p className="training-detail__student-name">
              <span className="material-symbols-outlined">person</span>
              {studentName}
              <span className="training-detail__cccd-tag">{cccd}</span>
            </p>
          </div>
          <button className="training-detail__close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Assign section */}
        {teachers && onAssign && (
          <div className="training-detail__assign-bar">
            <div className="training-detail__assign-current">
              <span className="material-symbols-outlined">school</span>
              <span>
                {currentTeacher
                  ? <>Giảng viên: <strong>{currentTeacher.username}</strong></>
                  : <em>Chưa phân công</em>
                }
              </span>
            </div>
            <div className="training-detail__assign-form">
              <select
                className="training-detail__assign-select"
                value={assignTeacherId}
                onChange={e => setAssignTeacherId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Đổi giảng viên --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </select>
              <button
                className="training-detail__assign-btn"
                onClick={handleAssign}
                disabled={!assignTeacherId || assignTeacherId === currentTeacherId || assigning}
              >
                <span className="material-symbols-outlined">group_add</span>
                {assigning ? 'Đang gán...' : 'Phân công'}
              </button>
            </div>
          </div>
        )}

        <div className="training-detail__body">
          <TrainingProgressBlock mode="staff" cccd={cccd} compact />
        </div>

        {/* Drop student footer */}
        {onDrop && (
          <div className="training-detail__footer">
            {!confirmDrop ? (
              <button
                className="training-detail__drop-btn"
                onClick={() => setConfirmDrop(true)}
              >
                <span className="material-symbols-outlined">person_remove</span>
                Học viên bỏ học
              </button>
            ) : (
              <div className="training-detail__drop-confirm">
                <p className="training-detail__drop-warn">
                  <span className="material-symbols-outlined">warning</span>
                  Xác nhận xóa <strong>{studentName}</strong> khỏi đội? Hành động này không thể hoàn tác.
                </p>
                <div className="training-detail__drop-actions">
                  <button
                    className="training-detail__drop-cancel"
                    onClick={() => setConfirmDrop(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="training-detail__drop-execute"
                    onClick={handleDrop}
                    disabled={dropping}
                  >
                    <span className="material-symbols-outlined">delete_forever</span>
                    {dropping ? 'Đang xóa...' : 'Xác nhận xóa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingDetailModal;
