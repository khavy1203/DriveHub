/** Pure helpers for grouping học viên by khóa học / lớp (newest-first). */

export type KhoaHocBrief = {
  IDKhoaHoc: string;
  TenKhoaHoc?: string | null;
  NgayThi?: string | Date | null;
};

export type WithClassFields = {
  khoahoc?: KhoaHocBrief | null;
  IDKhoaHoc?: string | null;
  createdAt?: string;
};

export type ClassGroupRow<T> = {
  key: string;
  title: string;
  subtitle: string;
  sortKey: number;
  students: T[];
};

export const extractDistrictLine = (diaChi?: string | null): string => {
  if (!diaChi?.trim()) return '—';
  const parts = diaChi.split(',').map(p => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : diaChi.trim();
};

export const classGroupSortKey = (
  khoahoc?: KhoaHocBrief | null,
  fallbackCreatedAt?: string | null,
): number => {
  const ngay = khoahoc?.NgayThi;
  if (ngay) {
    const t = new Date(ngay).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (fallbackCreatedAt) {
    const t = new Date(fallbackCreatedAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
};

export const buildClassGroups = <T extends WithClassFields>(
  students: T[],
  getCreatedAt: (s: T) => string | undefined,
): ClassGroupRow<T>[] => {
  const map = new Map<string, T[]>();
  for (const s of students) {
    const id = s.khoahoc?.IDKhoaHoc ?? s.IDKhoaHoc ?? '';
    const key = id || '__no_class__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  const groups: ClassGroupRow<T>[] = [];
  for (const [key, list] of map) {
    const sample = list[0];
    const kh = sample?.khoahoc;
    const title =
      key === '__no_class__'
        ? 'Chưa xếp lớp'
        : (kh?.TenKhoaHoc?.trim() || kh?.IDKhoaHoc || sample?.IDKhoaHoc || 'Lớp');

    let subtitle = '';
    if (key !== '__no_class__' && kh?.NgayThi) {
      try {
        subtitle = `Khai giảng ${new Date(kh.NgayThi).toLocaleDateString('vi-VN')}`;
      } catch {
        subtitle = '';
      }
    } else if (key !== '__no_class__') {
      subtitle = 'Chưa có ngày khai giảng';
    }

    const maxCourseDate = Math.max(
      ...list.map(st => classGroupSortKey(st.khoahoc ?? null, getCreatedAt(st) ?? null)),
    );
    const maxCreated = Math.max(
      ...list.map(st => {
        const c = getCreatedAt(st);
        return c ? new Date(c).getTime() : 0;
      }),
    );
    const sortKey = Math.max(maxCourseDate, maxCreated);
    groups.push({ key, title, subtitle, sortKey, students: list });
  }

  groups.sort((a, b) => b.sortKey - a.sortKey);
  return groups;
};

export const sortStudentsInGroup = <T extends { HoTen?: string; DiaChi?: string | null }>(
  list: T[],
  sortKey: 'name' | 'district',
  dir: 'asc' | 'desc',
): T[] => {
  const m = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (sortKey === 'name') return m * (a.HoTen ?? '').localeCompare(b.HoTen ?? '', 'vi');
    return m * extractDistrictLine(a.DiaChi).localeCompare(extractDistrictLine(b.DiaChi), 'vi');
  });
};
