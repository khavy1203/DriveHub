import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useSuperTeacher } from '../hooks/useSuperTeacher';
import { useSuperTeacherStudents } from '../hooks/useSuperTeacherStudents';
import { fetchRatingsOverview } from '../services/superTeacherApi';
import TeacherFormModal from './TeacherFormModal';
import type { TeacherInTeam, TeacherFormData, RatingsTeacherCard, TeacherReview } from '../types';
import './MyTeacherList.scss';

const ITEMS_PER_PAGE = 10;

type StatusFilter = 'all' | 'active' | 'inactive';
type SortKey = 'name' | 'students' | 'rating' | 'status';
type SortDir = 'asc' | 'desc';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const getStudentLoadClass = (count: number): string => {
  if (count > 30) return 'teacher-list__student-pill--overloaded';
  if (count >= 20) return 'teacher-list__student-pill--warning';
  return 'teacher-list__student-pill--normal';
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const StarDisplay: React.FC<{ avg: string; size?: 'sm' | 'md' }> = ({ avg, size = 'sm' }) => {
  const num = parseFloat(avg);
  const cls = size === 'sm' ? 'teacher-list__star--sm' : '';
  return (
    <span className="teacher-list__stars">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(num);
        const half = !filled && i === Math.ceil(num) && num % 1 >= 0.3;
        return (
          <span
            key={i}
            className={`material-symbols-outlined teacher-list__star ${filled || half ? 'teacher-list__star--filled' : ''} ${cls}`}
          >
            {filled ? 'star' : half ? 'star_half' : 'star'}
          </span>
        );
      })}
    </span>
  );
};

type ReviewModalProps = {
  teacher: TeacherInTeam;
  rating: RatingsTeacherCard;
  onClose: () => void;
};

const ReviewModal: React.FC<ReviewModalProps> = ({ teacher, rating, onClose }) => {
  const avatarUrl = teacher.teacherProfile?.avatarUrl || null;
  return (
    <div className="teacher-list__rv-overlay" onClick={onClose}>
      <div className="teacher-list__rv-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="teacher-list__rv-header">
          <div className="teacher-list__rv-teacher">
            <div className="teacher-list__rv-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt={teacher.username} />
                : <span>{getInitials(teacher.username)}</span>
              }
            </div>
            <div>
              <h3 className="teacher-list__rv-name">{teacher.username}</h3>
              <div className="teacher-list__rv-stats">
                <StarDisplay avg={rating.avgStars} size="md" />
                <span className="teacher-list__rv-avg">{rating.avgStars}</span>
                <span className="teacher-list__rv-sep">&middot;</span>
                <span className="teacher-list__rv-total">{rating.totalRatings} đánh giá</span>
              </div>
            </div>
          </div>
          <button className="teacher-list__rv-close" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Review list */}
        <div className="teacher-list__rv-body">
          {rating.recentReviews.length > 0 ? (
            <div className="teacher-list__rv-list">
              {rating.recentReviews.map(r => (
                <div key={r.id} className="teacher-list__rv-card">
                  <div className="teacher-list__rv-card-top">
                    <div className="teacher-list__rv-card-author">
                      <div className="teacher-list__rv-card-icon">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p className="teacher-list__rv-card-student">{r.studentName ?? 'Học viên'}</p>
                        {r.courseName && (
                          <p className="teacher-list__rv-card-course">{r.courseName}</p>
                        )}
                      </div>
                    </div>
                    <div className="teacher-list__rv-card-meta">
                      <StarDisplay avg={String(r.stars)} size="sm" />
                      <span className="teacher-list__rv-card-date">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.comment && <p className="teacher-list__rv-card-text">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="teacher-list__rv-empty">Chưa có đánh giá nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MyTeacherList: React.FC = () => {
  const { userId: currentUserId } = useAuth();
  const { teachers, loading, loadTeachers, addTeacher, editTeacher, removeTeacher } = useSuperTeacher();
  const { students, loadStudents } = useSuperTeacherStudents();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeacherInTeam | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TeacherInTeam | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [ratingsMap, setRatingsMap] = useState<Map<number, RatingsTeacherCard>>(new Map());
  const [reviewTeacher, setReviewTeacher] = useState<TeacherInTeam | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadRatings = useCallback(async () => {
    try {
      const res = await fetchRatingsOverview();
      if (res.EC === 0 && res.DT?.teachers) {
        const map = new Map<number, RatingsTeacherCard>();
        res.DT.teachers.forEach(t => map.set(t.id, t));
        setRatingsMap(map);
      }
    } catch { /* ratings are supplementary */ }
  }, []);

  useEffect(() => { loadTeachers(); loadStudents(); loadRatings(); }, [loadTeachers, loadStudents, loadRatings]);

  const studentCountMap = useMemo(() => {
    const map = new Map<number, number>();
    students.forEach(s => {
      if (s.teacherId) {
        map.set(s.teacherId, (map.get(s.teacherId) ?? 0) + 1);
      }
    });
    return map;
  }, [students]);

  const studentCount = (t: TeacherInTeam) => studentCountMap.get(t.id) ?? 0;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = teachers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.username.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.phone ?? '').includes(q),
      );
    }
    if (statusFilter === 'active') list = list.filter(t => t.active);
    if (statusFilter === 'inactive') list = list.filter(t => !t.active);

    return [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return dir * a.username.localeCompare(b.username, 'vi');
        case 'students':
          return dir * (studentCount(a) - studentCount(b));
        case 'rating': {
          const ra = parseFloat(ratingsMap.get(a.id)?.avgStars ?? '0');
          const rb = parseFloat(ratingsMap.get(b.id)?.avgStars ?? '0');
          return dir * (ra - rb);
        }
        case 'status':
          return dir * (Number(a.active) - Number(b.active));
        default:
          return 0;
      }
    });
  }, [teachers, search, statusFilter, sortKey, sortDir, ratingsMap, studentCountMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortDir]);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t: TeacherInTeam) => { setEditing(t); setShowModal(true); };

  const handleSave = async (data: TeacherFormData) => {
    if (editing) {
      const { email: _e, ...rest } = data;
      await editTeacher(editing.id, rest);
    } else {
      await addTeacher(data);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await removeTeacher(confirmDelete.id);
    setConfirmDelete(null);
  };

  const avatarUrl = (t: TeacherInTeam) => t.teacherProfile?.avatarUrl || null;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const openReview = (t: TeacherInTeam) => {
    if (ratingsMap.has(t.id)) setReviewTeacher(t);
  };

  return (
    <div className="teacher-list">
      {/* Header */}
      <div className="teacher-list__header">
        <div>
          <nav className="teacher-list__breadcrumb">
            <span>Workspace</span>
            <span className="separator">/</span>
            <span className="current">Đội ngũ giáo viên</span>
          </nav>
          <h1 className="teacher-list__title">Giáo viên trong đội</h1>
        </div>
        <button className="teacher-list__add-btn" onClick={openAdd}>
          <span className="material-symbols-outlined">person_add</span>
          + Thêm giáo viên
        </button>
      </div>

      {/* Filters */}
      <div className="teacher-list__filters">
        <div className="teacher-list__search-bar">
          <div className="teacher-list__search-field">
            <span className="material-symbols-outlined">filter_list</span>
            <input
              type="text"
              placeholder="Lọc theo tên hoặc mã giáo viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="teacher-list__filter-divider" />
          <div className="teacher-list__status-filter">
            <label>Trạng thái:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className="teacher-list__summary">
          <div className="teacher-list__summary-info">
            <div className="teacher-list__summary-icon">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <div>
              <p className="teacher-list__summary-label">Tổng quy mô</p>
              <p className="teacher-list__summary-count">{teachers.length} Giáo viên</p>
            </div>
          </div>
          <div className="teacher-list__avatar-stack">
            {teachers.slice(0, 3).map(t => {
              const url = avatarUrl(t);
              return url
                ? <img key={t.id} src={url} alt={t.username} />
                : (
                  <span key={t.id} className="avatar-placeholder">
                    {getInitials(t.username)}
                  </span>
                );
            })}
            {teachers.length > 3 && (
              <span className="avatar-placeholder">+{teachers.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="teacher-list__loading">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="teacher-list__empty">
          {search || statusFilter !== 'all' ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên nào trong đội'}
        </p>
      ) : (
        <div className="teacher-list__table-wrap">
          <table className="teacher-list__table">
            <thead>
              <tr>
                <th>STT</th>
                <th>
                  <button className="teacher-list__sort-btn" onClick={() => handleSort('name')} type="button">
                    Thông tin giáo viên
                    <span className={`material-symbols-outlined teacher-list__sort-icon ${sortKey === 'name' ? 'teacher-list__sort-icon--active' : ''}`}>
                      {sortIcon('name')}
                    </span>
                  </button>
                </th>
                <th>Liên hệ</th>
                <th>
                  <button className="teacher-list__sort-btn" onClick={() => handleSort('students')} type="button">
                    Học viên
                    <span className={`material-symbols-outlined teacher-list__sort-icon ${sortKey === 'students' ? 'teacher-list__sort-icon--active' : ''}`}>
                      {sortIcon('students')}
                    </span>
                  </button>
                </th>
                <th>
                  <button className="teacher-list__sort-btn" onClick={() => handleSort('rating')} type="button">
                    Đánh giá
                    <span className={`material-symbols-outlined teacher-list__sort-icon ${sortKey === 'rating' ? 'teacher-list__sort-icon--active' : ''}`}>
                      {sortIcon('rating')}
                    </span>
                  </button>
                </th>
                <th>
                  <button className="teacher-list__sort-btn" onClick={() => handleSort('status')} type="button">
                    Trạng thái
                    <span className={`material-symbols-outlined teacher-list__sort-icon ${sortKey === 'status' ? 'teacher-list__sort-icon--active' : ''}`}>
                      {sortIcon('status')}
                    </span>
                  </button>
                </th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t, i) => {
                const idx = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                const url = avatarUrl(t);
                const count = studentCount(t);
                const rating = ratingsMap.get(t.id);
                return (
                  <tr key={t.id}>
                    <td className="teacher-list__row-index">
                      {String(idx).padStart(2, '0')}
                    </td>
                    <td>
                      <div className="teacher-list__teacher-info">
                        <div className="teacher-list__teacher-avatar">
                          {url
                            ? <img src={url} alt={t.username} />
                            : getInitials(t.username)
                          }
                          {t.id === currentUserId && (
                            <span className="teacher-list__verified" title="Tài khoản của bạn">
                              <span className="material-symbols-outlined">verified</span>
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="teacher-list__teacher-name">
                            {t.username}
                            {t.id === currentUserId && (
                              <span className="teacher-list__you-tag">Bạn</span>
                            )}
                          </p>
                          <p className="teacher-list__teacher-code">ID: {t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="teacher-list__contact">
                        <span className="teacher-list__contact-row teacher-list__contact-row--email">
                          <span className="material-symbols-outlined">mail</span>
                          {t.email}
                        </span>
                        {t.phone && (
                          <span className="teacher-list__contact-row teacher-list__contact-row--phone">
                            <span className="material-symbols-outlined">call</span>
                            {t.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`teacher-list__student-pill ${getStudentLoadClass(count)}`}>
                        {count} Học viên
                      </span>
                    </td>
                    <td>
                      {rating ? (
                        <button
                          className="teacher-list__rating-cell"
                          onClick={() => openReview(t)}
                          type="button"
                        >
                          <StarDisplay avg={rating.avgStars} />
                          <span className="teacher-list__rating-val">{rating.avgStars}</span>
                          <span className="teacher-list__rating-count">({rating.totalRatings})</span>
                        </button>
                      ) : (
                        <span className="teacher-list__rating-empty">Chưa có</span>
                      )}
                    </td>
                    <td>
                      <div className="teacher-list__status">
                        <span className={`teacher-list__status-dot ${t.active ? 'teacher-list__status-dot--active' : 'teacher-list__status-dot--inactive'}`} />
                        <span className="teacher-list__status-text">
                          {t.active ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="teacher-list__actions">
                        <button
                          className="teacher-list__action-btn"
                          onClick={() => openEdit(t)}
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="teacher-list__action-btn teacher-list__action-btn--danger"
                          onClick={() => setConfirmDelete(t)}
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="teacher-list__pagination">
            <p className="teacher-list__pagination-info">
              Đang hiển thị <strong>{paged.length}</strong> trên <strong>{filtered.length}</strong> giáo viên
            </p>
            <div className="teacher-list__pagination-btns">
              <button
                className="teacher-list__page-btn teacher-list__page-btn--nav"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {pageNumbers.map(n => (
                <button
                  key={n}
                  className={`teacher-list__page-btn ${n === currentPage ? 'teacher-list__page-btn--active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="teacher-list__page-btn teacher-list__page-btn--nav"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insight card */}
      {!loading && teachers.length > 0 && (
        <div className="teacher-list__insight">
          <div className="teacher-list__insight-icon">
            <span className="material-symbols-outlined">insights</span>
          </div>
          <div className="teacher-list__insight-body">
            <h3 className="teacher-list__insight-title">Gợi ý phân bổ đội ngũ</h3>
            <p className="teacher-list__insight-text">
              Đội ngũ hiện có <strong>{teachers.length}</strong> giáo viên.
              {' '}Hệ thống sẽ phân tích dữ liệu và đề xuất phân bổ tối ưu khi có đủ dữ liệu học viên.
            </p>
          </div>
          <button className="teacher-list__insight-action">Xem chi tiết</button>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <TeacherFormModal
          teacher={editing}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="teacher-list__modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="teacher-list__modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="teacher-list__modal-title">Xác nhận xóa</h3>
            <p className="teacher-list__modal-text">
              Bạn có chắc muốn xóa giáo viên <strong>{confirmDelete.username}</strong>?
            </p>
            <div className="teacher-list__modal-actions">
              <button className="teacher-list__modal-cancel" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="teacher-list__modal-danger" onClick={handleDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Popup Modal */}
      {reviewTeacher && ratingsMap.has(reviewTeacher.id) && (
        <ReviewModal
          teacher={reviewTeacher}
          rating={ratingsMap.get(reviewTeacher.id)!}
          onClose={() => setReviewTeacher(null)}
        />
      )}
    </div>
  );
};

export default MyTeacherList;
