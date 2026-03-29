import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import useApiService from '../../../services/useApiService';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import axios from '../../../axios';
import {
  buildClassGroups,
  extractDistrictLine,
  sortStudentsInGroup,
  type KhoaHocBrief,
} from '../../../shared/studentClassGrouping';
import './HocVienListByClass.scss';

type Assignment = {
  id: number;
  hocVienId: number;
  status: 'waiting' | 'learning' | 'completed';
  progressPercent: number;
  datHoursCompleted?: number;
  hocVien: HocVienRow;
};

type HocVienRow = {
  id: number;
  HoTen: string;
  SoCCCD?: string;
  NgaySinh?: string;
  DiaChi?: string;
  loaibangthi?: string;
  phone?: string;
  email?: string;
  status?: string;
  IDKhoaHoc?: string | null;
  khoahoc?: KhoaHocBrief | null;
  createdAt?: string;
};

type ListRow = HocVienRow & {
  assignment?: {
    id?: number;
    status?: string;
    progressPercent?: number;
    datHoursCompleted?: number;
    teacher?: { id: number; username: string };
  };
};

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Chờ phân công',
  learning: 'Đang học',
  completed: 'Hoàn thành',
  registered: 'Đã đăng ký',
  assigned: 'Đã phân công',
  dat_completed: 'Hoàn thành DAT',
  exam_ready: 'Sẵn sàng thi',
};

const formatDate = (raw?: string) => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('vi-VN');
  } catch {
    return raw;
  }
};

const HocVienListByClass: React.FC = () => {
  const { get } = useApiService();
  const { role } = useAuth();
  const isTeacher = role === 'GiaoVien';

  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'table' | 'card'>('table');
  const [sortKey, setSortKey] = useState<'name' | 'district'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: 'name' | 'district') => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await axios.get<{ EC: number; EM: string; DT: Assignment[] }>('/api/teacher/my-students');
        if (res.data.EC !== 0) {
          toast.error(res.data.EM || 'Không tải được danh sách');
          setRows([]);
          return;
        }
        const mapped: ListRow[] = (res.data.DT ?? []).map(a => ({
          ...a.hocVien,
          assignment: {
            id: a.id,
            status: a.status,
            progressPercent: a.progressPercent,
            datHoursCompleted: a.datHoursCompleted,
          },
        }));
        setRows(mapped);
      } else {
        const res = await get<{ EC: number; DT: HocVienRow[] }>('/api/hocvien');
        if (res.EC === 0) {
          setRows(res.DT ?? []);
        } else {
          setRows([]);
        }
      }
    } catch {
      toast.error('Lỗi kết nối server');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [get, isTeacher]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      r =>
        r.HoTen?.toLowerCase().includes(q) ||
        r.SoCCCD?.toLowerCase().includes(q) ||
        extractDistrictLine(r.DiaChi).toLowerCase().includes(q),
    );
  }, [rows, search]);

  const groups = useMemo(() => {
    const raw = buildClassGroups(filtered, r => r.createdAt);
    return raw.map(g => ({
      ...g,
      students: sortStudentsInGroup(g.students, sortKey, sortDir),
    }));
  }, [filtered, sortKey, sortDir]);

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resolveStatus = (r: ListRow): string => {
    if (r.assignment?.status) return r.assignment.status;
    return r.status ?? 'registered';
  };

  return (
    <div className="hv-by-class">
      <p className="hv-by-class__crumb">Hệ thống · Đào tạo · Danh sách học viên</p>
      <h1 className="hv-by-class__title">Danh sách học viên</h1>
      <p className="hv-by-class__lead">
        {isTeacher
          ? 'Học viên được phân công cho bạn, nhóm theo lớp — lớp mới nhất hiển thị trên cùng.'
          : 'Quản lý học viên theo nhóm lớp — lớp mới khai giảng ưu tiên ở trên.'}
      </p>

      <div className="hv-by-class__toolbar">
        <div className="hv-by-class__field hv-by-class__field--search">
          <span className="hv-by-class__label">Tìm kiếm</span>
          <div className="hv-by-class__search">
            <span className="material-icons">search</span>
            <input
              className="hv-by-class__input"
              placeholder="Tên, CCCD, huyện..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="hv-by-class__field">
          <span className="hv-by-class__label">Hiển thị</span>
          <div className="hv-by-class__toggle">
            <button
              type="button"
              className={`hv-by-class__toggle-btn ${view === 'table' ? 'hv-by-class__toggle-btn--on' : ''}`}
              onClick={() => setView('table')}
            >
              Bảng
            </button>
            <button
              type="button"
              className={`hv-by-class__toggle-btn ${view === 'card' ? 'hv-by-class__toggle-btn--on' : ''}`}
              onClick={() => setView('card')}
            >
              Thẻ
            </button>
          </div>
        </div>
        <div className="hv-by-class__field">
          <span className="hv-by-class__label">Sắp xếp trong lớp</span>
          <select
            className="hv-by-class__select"
            value={`${sortKey}_${sortDir}`}
            onChange={e => {
              const [k, d] = e.target.value.split('_');
              setSortKey(k as 'name' | 'district');
              setSortDir(d as 'asc' | 'desc');
            }}
          >
            <option value="name_asc">Tên A → Z</option>
            <option value="name_desc">Tên Z → A</option>
            <option value="district_asc">Huyện A → Z</option>
            <option value="district_desc">Huyện Z → A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="hv-by-class__state">
          <span className="material-icons hv-by-class__spin">sync</span>
          Đang tải...
        </div>
      ) : groups.length === 0 ? (
        <div className="hv-by-class__state">
          <span className="material-icons">school</span>
          {rows.length === 0
            ? isTeacher
              ? 'Bạn chưa có học viên được phân công.'
              : 'Chưa có học viên.'
            : 'Không khớp từ khóa tìm kiếm.'}
        </div>
      ) : (
        groups.map(group => {
          const isCollapsed = collapsed.has(group.key);
          const headerTitle =
            group.key === '__no_class__'
              ? group.title
              : `${group.title}${group.subtitle ? ` · ${group.subtitle}` : ''}`;
          return (
            <section key={group.key} className="hv-by-class__group">
              <button
                type="button"
                className="hv-by-class__group-head"
                onClick={() => toggleCollapse(group.key)}
                aria-expanded={!isCollapsed}
              >
                <span className="material-icons hv-by-class__group-chev">
                  {isCollapsed ? 'expand_more' : 'expand_less'}
                </span>
                <div>
                  <h2 className="hv-by-class__group-title">{headerTitle}</h2>
                  <p className="hv-by-class__group-meta">{group.students.length} học viên trong nhóm</p>
                </div>
                <span className="hv-by-class__badge">{group.students.length} HV</span>
              </button>

              {!isCollapsed && view === 'table' && (
                <div className="hv-by-class__table-wrap">
                  <table className="hv-by-class__table">
                    <thead>
                      <tr>
                        <th>
                          <button type="button" className="hv-by-class__sort-th" onClick={() => toggleSort('name')}>
                            Họ tên {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="hv-by-class__sort-th"
                            onClick={() => toggleSort('district')}
                          >
                            Huyện {sortKey === 'district' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </button>
                        </th>
                        <th>Lớp</th>
                        <th>Ngày đăng ký</th>
                        {!isTeacher && <th>Giáo viên</th>}
                        <th>Trạng thái</th>
                        <th>Tiến độ DAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map(r => {
                        const st = resolveStatus(r);
                        const pct = r.assignment?.progressPercent ?? 0;
                        const classLabel =
                          r.khoahoc?.TenKhoaHoc?.trim() || r.khoahoc?.IDKhoaHoc || r.IDKhoaHoc || '—';
                        return (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.HoTen}</strong>
                              <div className="hv-by-class__sub-id">{r.SoCCCD || '—'}</div>
                            </td>
                            <td>{extractDistrictLine(r.DiaChi)}</td>
                            <td>{classLabel}</td>
                            <td>{formatDate(r.createdAt)}</td>
                            {!isTeacher && (
                          <td>{r.assignment?.teacher?.username ?? 'Chưa phân công'}</td>
                        )}
                            <td>
                              <span className={`hv-by-class__status hv-by-class__status--${st}`}>
                                {STATUS_LABEL[st] ?? st}
                              </span>
                            </td>
                            <td>
                              <div className="hv-by-class__progress-row">
                                <span>{pct}%</span>
                                <div className="hv-by-class__progress">
                                  <div className="hv-by-class__progress-fill" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!isCollapsed && view === 'card' && (
                <div className="hv-by-class__cards">
                  {group.students.map(r => {
                    const st = resolveStatus(r);
                    const pct = r.assignment?.progressPercent ?? 0;
                    const classLabel =
                      r.khoahoc?.TenKhoaHoc?.trim() || r.khoahoc?.IDKhoaHoc || r.IDKhoaHoc || '—';
                    return (
                      <article key={r.id} className="hv-by-class__card">
                        <h3 className="hv-by-class__name">{r.HoTen}</h3>
                        <p className="hv-by-class__line">Huyện: {extractDistrictLine(r.DiaChi)}</p>
                        <p className="hv-by-class__line">Lớp: {classLabel}</p>
                        <p className="hv-by-class__line">Đăng ký: {formatDate(r.createdAt)}</p>
                        <p className="hv-by-class__line">
                          Trạng thái: {STATUS_LABEL[st] ?? st} · DAT {pct}%
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      <p className="hv-by-class__role-note">
        {isTeacher
          ? 'Dữ liệu theo phân công của bạn. Admin xem toàn bộ học viên trên hệ thống.'
          : 'Dữ liệu toàn hệ thống (admin).'}
      </p>
    </div>
  );
};

export default HocVienListByClass;
