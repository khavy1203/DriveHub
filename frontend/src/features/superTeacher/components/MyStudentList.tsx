import React, { useEffect, useState, useMemo } from 'react';
import { useSuperTeacherStudents } from '../hooks/useSuperTeacherStudents';
import { useSuperTeacher } from '../hooks/useSuperTeacher';
import TrainingDetailModal from './TrainingDetailModal';
import ImportCccdModal from './ImportCccdModal';
import type { StudentInTeam } from '../types';
import './MyStudentList.scss';

const ITEMS_PER_PAGE = 10;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const MyStudentList: React.FC = () => {
  const { students, loading, loadStudents, assignStudent, removeStudent } = useSuperTeacherStudents();
  const { teachers, loadTeachers } = useSuperTeacher();

  const [search, setSearch] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [detailTarget, setDetailTarget] = useState<StudentInTeam | null>(null);
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { loadStudents(); loadTeachers(); }, [loadStudents, loadTeachers]);

  const filtered = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.hocVien?.HoTen ?? '').toLowerCase().includes(q) ||
        (s.hocVien?.SoCCCD ?? '').includes(q),
      );
    }
    if (filterTeacherId) {
      list = list.filter(s => s.teacherId === filterTeacherId);
    }
    if (filterStatus) {
      list = list.filter(s => {
        const pct = s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0;
        const hasSnapshot = !!s.hocVien?.trainingSnapshot;
        if (filterStatus === 'no-data') return !hasSnapshot;
        if (filterStatus === 'learning') return hasSnapshot && pct < 100;
        if (filterStatus === 'completed') return hasSnapshot && pct >= 100;
        return true;
      });
    }
    return list;
  }, [students, search, filterTeacherId, filterStatus]);

  const teacherMap = useMemo(() => {
    const map = new Map<number, string>();
    teachers.forEach(t => map.set(t.id, t.username));
    return map;
  }, [teachers]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const list = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortKey === 'name') {
        va = a.hocVien?.HoTen ?? '';
        vb = b.hocVien?.HoTen ?? '';
      } else if (sortKey === 'cccd') {
        va = a.hocVien?.SoCCCD ?? '';
        vb = b.hocVien?.SoCCCD ?? '';
      } else if (sortKey === 'teacher') {
        va = a.teacherName ?? teacherMap.get(a.teacherId) ?? '';
        vb = b.teacherName ?? teacherMap.get(b.teacherId) ?? '';
      } else if (sortKey === 'progress') {
        va = a.hocVien?.trainingSnapshot?.courseProgressPct ?? -1;
        vb = b.hocVien?.trainingSnapshot?.courseProgressPct ?? -1;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir, teacherMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, filterTeacherId, filterStatus]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortArrow = (key: string) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const toggleSelect = (hocVienId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(hocVienId)) next.delete(hocVienId);
      else next.add(hocVienId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map(s => s.hocVienId)));
    }
  };

  const [confirmBulk, setConfirmBulk] = useState(false);

  const executeBulkAssign = async () => {
    if (!selectedTeacherId || selectedIds.size === 0) return;
    setAssigning(true);
    setConfirmBulk(false);
    try {
      for (const id of selectedIds) {
        await assignStudent(id, Number(selectedTeacherId));
      }
      setSelectedIds(new Set());
      setSelectedTeacherId('');
    } catch {
      // toast already shown in hook
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkAssign = () => {
    if (!selectedTeacherId || selectedIds.size === 0) return;
    if (selectedIds.size >= 10) {
      setConfirmBulk(true);
    } else {
      executeBulkAssign();
    }
  };

  const handleDetailAssign = async (hocVienId: number, teacherId: number) => {
    await assignStudent(hocVienId, teacherId);
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="student-list">
      {/* Header */}
      <div className="student-list__header">
        <div>
          <div className="student-list__title-row">
            <h1 className="student-list__title">Học viên trong đội</h1>
            <span className="student-list__count-badge">{students.length}</span>
          </div>
          <p className="student-list__subtitle">Quản lý danh sách đào tạo và tiến độ học tập</p>
        </div>
        <div className="student-list__header-actions">
          <button className="student-list__import-btn" onClick={() => setShowImport(true)}>
            <span className="material-symbols-outlined">cloud_upload</span>
            Import CCCD
          </button>
          <button className="student-list__export-btn">
            <span className="material-symbols-outlined">download</span>
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Filters + Insight */}
      <div className="student-list__filter-row">
        <div className="student-list__filter-bar">
          <div className="student-list__filter-field">
            <label>Tìm kiếm</label>
            <div className="student-list__filter-input-wrap">
              <span className="material-symbols-outlined">person_search</span>
              <input
                type="text"
                placeholder="Tên hoặc mã học viên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="student-list__filter-field student-list__filter-field--medium">
            <label>Giảng viên</label>
            <div className="student-list__filter-select-wrap">
              <select
                value={filterTeacherId}
                onChange={e => setFilterTeacherId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả giảng viên</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="student-list__filter-field student-list__filter-field--small">
            <label>Trạng thái</label>
            <div className="student-list__filter-select-wrap">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Mọi trạng thái</option>
                <option value="learning">Đang học</option>
                <option value="completed">Hoàn thành</option>
                <option value="no-data">Chưa có dữ liệu</option>
              </select>
            </div>
          </div>
        </div>

        <div className="student-list__insight">
          <div className="student-list__insight-header">
            <span className="material-symbols-outlined">auto_awesome</span>
            <h4>Teacher Insight</h4>
          </div>
          <p className="student-list__insight-text">
            Đội ngũ hiện quản lý <strong>{students.length} học viên</strong>.
            {' '}Hệ thống sẽ gợi ý phân bổ khi phát hiện tải không đều giữa các giáo viên.
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="student-list__loading">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="student-list__empty">
          {search || filterTeacherId ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên nào trong đội'}
        </p>
      ) : (
        <div className="student-list__table-wrap">
          {/* Bulk assign toolbar */}
          {selectedIds.size > 0 && (
            <div className="student-list__bulk-bar">
              <span className="student-list__bulk-count">
                Đã chọn <strong>{selectedIds.size}</strong> học viên
              </span>
              <div className="student-list__bulk-actions">
                <select
                  className="student-list__bulk-select"
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
                <button
                  className="student-list__bulk-assign-btn"
                  onClick={handleBulkAssign}
                  disabled={!selectedTeacherId || assigning}
                >
                  <span className="material-symbols-outlined">group_add</span>
                  {assigning ? 'Đang gán...' : 'Phân công'}
                </button>
                <button
                  className="student-list__bulk-clear"
                  onClick={() => { setSelectedIds(new Set()); setSelectedTeacherId(''); }}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          <table className="student-list__table">
            <thead>
              <tr>
                <th className="student-list__th--check">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selectedIds.size === paged.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>STT</th>
                <th className="student-list__th--sortable" onClick={() => toggleSort('name')}>
                  Học viên
                  <span className="material-symbols-outlined student-list__sort-icon">{sortArrow('name')}</span>
                </th>
                <th className="student-list__th--sortable" onClick={() => toggleSort('cccd')}>
                  Mã định danh
                  <span className="material-symbols-outlined student-list__sort-icon">{sortArrow('cccd')}</span>
                </th>
                <th className="student-list__th--sortable" onClick={() => toggleSort('teacher')}>
                  Giảng viên phụ trách
                  <span className="material-symbols-outlined student-list__sort-icon">{sortArrow('teacher')}</span>
                </th>
                <th className="student-list__th--sortable" onClick={() => toggleSort('progress')}>
                  Tiến độ đào tạo
                  <span className="material-symbols-outlined student-list__sort-icon">{sortArrow('progress')}</span>
                </th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s, i) => {
                const idx = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                const name = s.hocVien?.HoTen ?? '—';
                const teacherName = s.teacherName || teacherMap.get(s.teacherId) || '—';
                const snapshot = s.hocVien?.trainingSnapshot;
                const pct = snapshot?.courseProgressPct ?? 0;
                const hasData = !!snapshot;
                const progressMod = !hasData ? '--empty' : pct >= 100 ? '--done' : pct >= 50 ? '--mid' : '--low';

                return (
                  <tr
                    key={s.id ?? `u-${s.hocVienId}`}
                    className={`student-list__row--clickable ${selectedIds.has(s.hocVienId) ? 'student-list__row--selected' : ''}`}
                    onClick={() => setDetailTarget(s)}
                  >
                    <td className="student-list__td--check" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.hocVienId)}
                        onChange={() => toggleSelect(s.hocVienId)}
                      />
                    </td>
                    <td className="student-list__row-index">{String(idx).padStart(2, '0')}</td>
                    <td>
                      <div className="student-list__student-info">
                        <div className="student-list__student-avatar">
                          {getInitials(name)}
                        </div>
                        <div>
                          <p className="student-list__student-name">{name}</p>
                          <p className="student-list__student-email">{s.hocVien?.phone ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="student-list__id-code">{s.hocVien?.SoCCCD || '—'}</span>
                    </td>
                    <td>
                      {s.teacherId ? (
                        <div className="student-list__teacher-cell">
                          <div className="student-list__teacher-mini-avatar">
                            {getInitials(teacherName)}
                          </div>
                          <span>{teacherName}</span>
                        </div>
                      ) : (
                        <span className="student-list__unassigned-label">Chưa phân công</span>
                      )}
                    </td>
                    <td>
                      <div className={`student-list__progress ${progressMod}`}>
                        {hasData ? (
                          <>
                            <div className="student-list__progress-track">
                              <div
                                className="student-list__progress-fill"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="student-list__progress-label">{pct}%</span>
                          </>
                        ) : (
                          <span className="student-list__progress-empty">Chưa có dữ liệu</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {!hasData ? (
                        <span className="student-list__status-pill student-list__status-pill--neutral">
                          Chờ đồng bộ
                        </span>
                      ) : pct >= 100 ? (
                        <span className="student-list__status-pill student-list__status-pill--done">
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="student-list__status-pill student-list__status-pill--active">
                          Đang học
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="student-list__pagination">
            <p className="student-list__pagination-info">
              Hiển thị <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)}</strong> trong số <strong>{sorted.length}</strong> học viên
            </p>
            <div className="student-list__pagination-btns">
              <button
                className="student-list__page-btn student-list__page-btn--nav"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {pageNumbers.map(n => (
                <button
                  key={n}
                  className={`student-list__page-btn ${n === currentPage ? 'student-list__page-btn--active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="student-list__page-btn student-list__page-btn--nav"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Detail Modal */}
      {detailTarget && detailTarget.hocVien?.SoCCCD && (
        <TrainingDetailModal
          cccd={detailTarget.hocVien.SoCCCD}
          studentName={detailTarget.hocVien?.HoTen ?? '—'}
          currentTeacherId={detailTarget.teacherId}
          teachers={teachers}
          onAssign={(teacherId) => handleDetailAssign(detailTarget.hocVienId, teacherId)}
          onDrop={() => removeStudent(detailTarget.hocVienId)}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* Bulk assign confirmation modal */}
      {confirmBulk && (
        <div className="student-list__modal-backdrop" onClick={() => setConfirmBulk(false)}>
          <div className="student-list__confirm-box" onClick={e => e.stopPropagation()}>
            <div className="student-list__confirm-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="student-list__confirm-title">Xác nhận phân công</h3>
            <p className="student-list__confirm-text">
              Bạn có chắc muốn phân công <strong>{selectedIds.size} học viên</strong> cho giáo viên{' '}
              <strong>{teachers.find(t => t.id === selectedTeacherId)?.username}</strong>?
            </p>
            <div className="student-list__confirm-actions">
              <button className="student-list__confirm-cancel" onClick={() => setConfirmBulk(false)}>Hủy</button>
              <button className="student-list__confirm-ok" onClick={executeBulkAssign} disabled={assigning}>
                {assigning ? 'Đang gán...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CCCD Modal */}
      {showImport && (
        <ImportCccdModal
          onClose={() => setShowImport(false)}
          onSuccess={() => loadStudents()}
        />
      )}
    </div>
  );
};

export default MyStudentList;
