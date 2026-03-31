import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSuperTeacher } from '../hooks/useSuperTeacher';
import { useSuperTeacherStudents } from '../hooks/useSuperTeacherStudents';
import TrainingDetailModal from './TrainingDetailModal';
import type { StudentInTeam, TeacherInTeam } from '../types';
import './StudentDispatch.scss';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const StudentDispatch: React.FC = () => {
  const { teachers, loading: loadingT, loadTeachers } = useSuperTeacher();
  const { students, loading: loadingS, loadStudents, assignStudent, removeStudent } = useSuperTeacherStudents();

  const [dragStudentId, setDragStudentId] = useState<number | null>(null);
  const [dropTargetTeacherId, setDropTargetTeacherId] = useState<number | null>(null);
  const [detailTarget, setDetailTarget] = useState<StudentInTeam | null>(null);
  const [sortByProgress, setSortByProgress] = useState<Map<number, 'asc' | 'desc'>>(new Map());

  useEffect(() => { loadTeachers(); loadStudents(); }, [loadTeachers, loadStudents]);

  const loading = loadingT || loadingS;

  const teacherColumns = useMemo(() => {
    return teachers.map(t => {
      const tStudents = students.filter(s => s.teacherId === t.id);
      const dir = sortByProgress.get(t.id);
      if (dir) {
        tStudents.sort((a, b) => {
          const pa = a.hocVien?.trainingSnapshot?.courseProgressPct ?? -1;
          const pb = b.hocVien?.trainingSnapshot?.courseProgressPct ?? -1;
          return dir === 'asc' ? pa - pb : pb - pa;
        });
      }
      return { teacher: t, students: tStudents };
    });
  }, [teachers, students, sortByProgress]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, student: StudentInTeam) => {
    setDragStudentId(student.hocVienId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(student.hocVienId));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, teacherId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetTeacherId(teacherId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetTeacherId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, teacherId: number) => {
    e.preventDefault();
    setDropTargetTeacherId(null);
    setDragStudentId(null);

    const hocVienId = Number(e.dataTransfer.getData('text/plain'));
    if (!hocVienId || isNaN(hocVienId)) return;

    const student = students.find(s => s.hocVienId === hocVienId);
    if (!student) return;

    if (student.teacherId === teacherId) return;

    try {
      await assignStudent(hocVienId, teacherId);
    } catch {
      // toast already shown in hook
    }
  }, [students, assignStudent]);

  const handleDragEnd = useCallback(() => {
    setDragStudentId(null);
    setDropTargetTeacherId(null);
  }, []);

  const toggleTeacherSort = useCallback((teacherId: number) => {
    setSortByProgress(prev => {
      const next = new Map(prev);
      const cur = next.get(teacherId);
      if (!cur) next.set(teacherId, 'desc');
      else if (cur === 'desc') next.set(teacherId, 'asc');
      else next.delete(teacherId);
      return next;
    });
  }, []);

  const handleCardClick = useCallback((s: StudentInTeam) => {
    if (s.hocVien?.SoCCCD) setDetailTarget(s);
  }, []);

  const avatarUrl = (t: TeacherInTeam) => t.teacherProfile?.avatarUrl || null;

  if (loading) {
    return (
      <div className="dispatch">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#6d7a77' }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="dispatch">
      {/* Header */}
      <div className="dispatch__header">
        <div>
          <h1 className="dispatch__title">Điều phối Học viên</h1>
          <p className="dispatch__subtitle">
            Kéo thả học viên vào cột giáo viên để phân công.
          </p>
        </div>
        <div className="dispatch__header-right">
          <div className="dispatch__avatar-stack">
            {teachers.slice(0, 3).map(t => {
              const url = avatarUrl(t);
              return url
                ? <img key={t.id} src={url} alt={t.username} />
                : <span key={t.id} className="avatar-placeholder">{getInitials(t.username)}</span>;
            })}
            {teachers.length > 3 && (
              <span className="avatar-placeholder">+{teachers.length - 3}</span>
            )}
          </div>
          {/* <button className="dispatch__import-btn" onClick={() => setShowImport(true)}>
            <span className="material-symbols-outlined">cloud_upload</span>
            Import CCCD
          </button> */}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="dispatch__board">
        {/* Teacher columns */}
        {teacherColumns.map(({ teacher, students: tStudents }) => {
          const isDropTarget = dropTargetTeacherId === teacher.id;
          const completedCount = tStudents.filter(s => (s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0) >= 100).length;
          const incompleteCount = tStudents.length - completedCount;
          return (
            <div
              key={teacher.id}
              className={`dispatch__column ${isDropTarget ? 'dispatch__column--drop-active' : ''}`}
              onDragOver={e => handleDragOver(e, teacher.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, teacher.id)}
            >
              <div className="dispatch__column-header dispatch__column-header--teacher">
                <div className="dispatch__teacher-info">
                  <div className="dispatch__teacher-avatar">
                    {avatarUrl(teacher)
                      ? <img src={avatarUrl(teacher)!} alt={teacher.username} />
                      : getInitials(teacher.username)
                    }
                  </div>
                  <div className="dispatch__teacher-meta">
                    <div className="name">{teacher.username}</div>
                    <div className="role">Giáo viên · {tStudents.length} học viên</div>
                  </div>
                </div>
                <div className="dispatch__column-actions">
                  <button
                    className={`dispatch__sort-btn ${sortByProgress.has(teacher.id) ? 'dispatch__sort-btn--active' : ''}`}
                    onClick={() => toggleTeacherSort(teacher.id)}
                    title="Sắp xếp theo tiến độ"
                  >
                    <span className="material-symbols-outlined">
                      {!sortByProgress.has(teacher.id) ? 'swap_vert' : sortByProgress.get(teacher.id) === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </button>
                  <div className="dispatch__completion-badge">
                    <span className="dispatch__completion-incomplete">{incompleteCount}</span>
                    <span className="dispatch__completion-sep">/</span>
                    <span className="dispatch__completion-done">{completedCount}</span>
                  </div>
                </div>
              </div>
              <div className="dispatch__card-list">
                {tStudents.length === 0 && !isDropTarget && (
                  <div className="dispatch__drop-zone">
                    <span className="material-symbols-outlined">move_down</span>
                    Kéo học viên vào đây
                  </div>
                )}
                {isDropTarget && (
                  <div className="dispatch__drop-zone dispatch__drop-zone--active">
                    <span className="material-symbols-outlined">add_circle</span>
                    Thả để phân công
                  </div>
                )}
                {tStudents.map(s => (
                  <div
                    key={s.hocVienId}
                    className={`dispatch__card dispatch__card--assigned ${dragStudentId === s.hocVienId ? 'dispatch__card--dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, s)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleCardClick(s)}
                  >
                    <div className="dispatch__card-top">
                      <span className="dispatch__card-name">{s.hocVien?.HoTen ?? '—'}</span>
                      <span className="dispatch__card-drag-hint">
                        <span className="material-symbols-outlined">drag_indicator</span>
                      </span>
                    </div>
                    <div className="dispatch__card-details">
                      <div className="dispatch__card-detail">
                        <span className="material-symbols-outlined">badge</span>
                        <span>{s.hocVien?.SoCCCD || '—'}</span>
                      </div>
                      {s.hocVien?.trainingSnapshot && (
                        <div className="dispatch__card-mini-progress">
                          <div className="dispatch__card-mini-track">
                            <div
                              className="dispatch__card-mini-fill"
                              style={{ width: `${Math.min(s.hocVien.trainingSnapshot.courseProgressPct, 100)}%` }}
                            />
                          </div>
                          <span>{s.hocVien.trainingSnapshot.courseProgressPct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>


      {/* Training Detail Modal */}
      {detailTarget && detailTarget.hocVien?.SoCCCD && (
        <TrainingDetailModal
          cccd={detailTarget.hocVien.SoCCCD}
          studentName={detailTarget.hocVien?.HoTen ?? '—'}
          currentTeacherId={detailTarget.teacherId}
          teachers={teachers}
          onAssign={async (teacherId) => { await assignStudent(detailTarget.hocVienId, teacherId); }}
          onDrop={() => removeStudent(detailTarget.hocVienId)}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};

export default StudentDispatch;
