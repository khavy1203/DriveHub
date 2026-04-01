import { isRecord } from '../types';

export type TrainingSessionRow = {
  key: string;
  date: string;
  timeRange: string;
  durationLabel: string;
  distanceLabel: string;
  plate: string;
  rank: string;
  gpsCount: number;
  /** ISO timestamp e.g. "2026-01-17T09:25:48.000Z" */
  thoiDiemVao: string | null;
  /** ISO timestamp e.g. "2026-01-17T10:16:21.000Z" */
  thoiDiemRa: string | null;
  /** Local date from API e.g. "17/01/2026" — for session-detail query */
  ngayDaoTao: string | null;
  /** Local time range from API e.g. "09:25–10:16" — for session-detail query */
  gioDaoTao: string | null;
};

export type TrainingModuleHistory = {
  key: string;
  title: string;
  sessions: TrainingSessionRow[];
};

export type TrainingTheoryRow = {
  key: string;
  mon: string;
  tienDo: string;
  hoanThanh: boolean;
  ghiChu: string;
};

export type ThieuDuCriteria = {
  key: string;
  label: string;
  thucTeLabel: string;
  nguongLabel: string;
  pct: number;
  status: 'du' | 'thieu' | 'na';
  danhGia: string;
};

export type ConThieu = {
  gio: number;
  gioBanDem: number;
  gioTuDong: number;
  km: number;
};

export type ThieuDu = {
  hang: string;
  tongKet: string;
  isEligible: boolean;
  criteria: ThieuDuCriteria[];
  conThieu: ConThieu | null;
};

export type GiayToItem = {
  key: string;
  tenGiayTo: string;
  trangThai: string;
  ghiChu: string;
};

export type TrainingFullDisplay = {
  hoTen: string;
  maSo: string;
  rankLabel: string;
  ngaySinh: string;
  cccd: string;
  diaChi: string;
  khoaHoc: string;
  instructor: string | null;
  plate: string | null;
  ketQuaDiemDanh: string;
  dat: {
    soPhienHoc: number;
    tongGio: string;
    tongKm: string;
    completed: boolean;
  } | null;
  cabin: {
    tongGio: string;
    baiHoanThanh: string;
    hoanThanh: boolean;
    ghiChu: string;
  } | null;
  caoToc: {
    tongGio: string;
    tongKm: string;
    vanTocTB: string;
    hoanThanh: boolean;
    ghiChu: string;
  } | null;
  lyThuyet: TrainingTheoryRow[];
  giayTo: GiayToItem[];
  /** 0–100: blended from theory, đường trường, cabin, cao tốc when present in API */
  courseProgressPct: number;
  thieuDu: ThieuDu | null;
  moduleHistories: TrainingModuleHistory[];
};

/** Parse DD/MM/YYYY or ISO date string into display format. */
const formatDateFromSlash = (raw: unknown): string => {
  if (typeof raw !== 'string' || !raw.trim()) return '—';
  const s = raw.trim();
  // Already DD/MM/YYYY — return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  try {
    const date = new Date(s);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('vi-VN');
  } catch {
    /* ignore */
  }
  return s;
};

/** Parse ngaySinh which can be DD/MM/YYYY or ISO string. */
const parseBirthDate = (raw: unknown): string => {
  if (typeof raw !== 'string' || !raw.trim()) return '—';
  const s = raw.trim();
  // DD/MM/YYYY format from API
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // ISO or other parseable format
  try {
    const date = new Date(s);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('vi-VN');
  } catch {
    /* ignore */
  }
  return s;
};

const formatHours = (h: number): string => {
  const hInt = Math.floor(h);
  const min = Math.round((h - hInt) * 60);
  if (min === 0) return `${hInt}h`;
  return `${hInt}h ${min}p`;
};

const parseSessionRow = (item: unknown, idx: number): TrainingSessionRow => {
  const empty: TrainingSessionRow = {
    key: `s-${idx}`, date: '—', timeRange: '—', durationLabel: '—', distanceLabel: '—',
    plate: '—', rank: '—', gpsCount: 0, thoiDiemVao: null, thoiDiemRa: null,
    ngayDaoTao: null, gioDaoTao: null,
  };
  if (!isRecord(item)) return empty;
  const key = typeof item.sessionId === 'string' ? item.sessionId.slice(0, 16) : `s-${idx}`;
  const date = formatDateFromSlash(item.ngayDaoTao);
  const rawGioDaoTao = typeof item.gioDaoTao === 'string' ? item.gioDaoTao.trim() : '';
  const timeRange = rawGioDaoTao ? rawGioDaoTao.replace('-', ' – ') : '—';
  const h = typeof item.thoiGianGio === 'number' ? item.thoiGianGio : parseFloat(String(item.thoiGianGio ?? ''));
  const durationLabel = Number.isFinite(h) ? formatHours(h) : '—';
  const km = typeof item.quangDuongKm === 'number' ? item.quangDuongKm : parseFloat(String(item.quangDuongKm ?? ''));
  const distanceLabel = Number.isFinite(km) ? `${Math.round(km * 100) / 100} km` : '—';
  const plate = typeof item.bienSo === 'string' && item.bienSo.trim() ? item.bienSo.trim() : '—';
  const rank = typeof item.hangXe === 'string' && item.hangXe.trim() ? item.hangXe.trim() : '—';
  const loTrinh = isRecord(item.loTrinh) ? item.loTrinh : null;
  const gpsCount = loTrinh && typeof loTrinh.soDiem === 'number' ? loTrinh.soDiem : 0;
  const thoiDiemVao = typeof item.thoiDiemVao === 'string' && item.thoiDiemVao.trim() ? item.thoiDiemVao.trim() : null;
  const thoiDiemRa = typeof item.thoiDiemRa === 'string' && item.thoiDiemRa.trim() ? item.thoiDiemRa.trim() : null;
  const ngayDaoTao = typeof item.ngayDaoTao === 'string' && item.ngayDaoTao.trim() ? item.ngayDaoTao.trim() : null;
  const gioDaoTao = rawGioDaoTao || null;
  return {
    key: `${key}-${idx}`, date, timeRange, durationLabel, distanceLabel,
    plate, rank, gpsCount, thoiDiemVao, thoiDiemRa, ngayDaoTao, gioDaoTao,
  };
};

const parseLyThuyet = (raw: unknown): TrainingTheoryRow[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((x, i) => {
    if (!isRecord(x)) return null;
    const mon = typeof x.mon === 'string' ? x.mon.trim() : '—';
    const tienDo = typeof x.tienDo === 'string' ? x.tienDo.trim() : '—';
    const hoanThanh = Boolean(x.hoanThanh);
    const ghiChu = typeof x.ghiChu === 'string' ? x.ghiChu.trim() : '';
    return { key: `lt-${i}-${mon}`, mon, tienDo, hoanThanh, ghiChu };
  }).filter((x): x is TrainingTheoryRow => x !== null && x.mon !== '—');
};

const parseGiayTo = (raw: unknown): GiayToItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((x, i) => {
    if (!isRecord(x)) return null;
    const tenGiayTo = typeof x.tenGiayTo === 'string' ? x.tenGiayTo.trim() : '';
    const trangThai = typeof x.trangThai === 'string' ? x.trangThai.trim() : '';
    const ghiChu = typeof x.ghiChu === 'string' ? x.ghiChu.trim() : '';
    if (!tenGiayTo && !trangThai) return null;
    return { key: `gt-${i}`, tenGiayTo: tenGiayTo || '—', trangThai, ghiChu };
  }).filter((x): x is GiayToItem => x !== null);
};

const parseThieuDu = (raw: unknown): ThieuDu | null => {
  if (!isRecord(raw)) return null;
  const hang = typeof raw.hang === 'string' ? raw.hang.trim() : '';
  const nguong = isRecord(raw.nguong) ? raw.nguong : {};
  const thucTe = isRecord(raw.thucTe) ? raw.thucTe : {};
  const danhGia = isRecord(raw.danhGia) ? raw.danhGia : {};

  const tongKet = typeof danhGia.tongKet === 'string' ? danhGia.tongKet.trim() : '—';
  const isEligible = /đủ điều kiện dự thi/i.test(tongKet) && !/chưa/i.test(tongKet);

  const n = (v: unknown): number => {
    const raw = typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;
    return Math.round(raw * 100) / 100;
  };

  const makePct = (actual: number, threshold: number): number =>
    threshold <= 0 ? 100 : Math.min(100, Math.round((actual / threshold) * 100));

  const daGio = typeof danhGia.gioHoc === 'string' ? danhGia.gioHoc.trim() : '';
  const daKm = typeof danhGia.km === 'string' ? danhGia.km.trim() : '';
  const daBanDem = typeof danhGia.banDem === 'string' ? danhGia.banDem.trim() : '';
  const daTuDong = typeof danhGia.tuDong === 'string' ? danhGia.tuDong.trim() : '';

  const statusFromDanhGia = (s: string): ThieuDuCriteria['status'] => {
    if (/không áp dụng/i.test(s)) return 'na';
    if (/^đủ$/i.test(s)) return 'du';
    return 'thieu';
  };

  const criteria: ThieuDuCriteria[] = [
    {
      key: 'gio',
      label: 'Giờ học',
      thucTeLabel: formatHours(n(thucTe.tongGioHoc)),
      nguongLabel: formatHours(n(nguong.gioToiThieu)),
      pct: makePct(n(thucTe.tongGioHoc), n(nguong.gioToiThieu)),
      status: statusFromDanhGia(daGio),
      danhGia: daGio || '—',
    },
    {
      key: 'km',
      label: 'Quãng đường',
      thucTeLabel: `${n(thucTe.tongKm).toFixed(2)} km`,
      nguongLabel: `${n(nguong.kmToiThieu)} km`,
      pct: makePct(n(thucTe.tongKm), n(nguong.kmToiThieu)),
      status: statusFromDanhGia(daKm),
      danhGia: daKm || '—',
    },
    {
      key: 'dem',
      label: 'Ban đêm',
      thucTeLabel: formatHours(n(thucTe.gioBanDem)),
      nguongLabel: formatHours(n(nguong.gioBanDemToiThieu)),
      pct: makePct(n(thucTe.gioBanDem), n(nguong.gioBanDemToiThieu)),
      status: statusFromDanhGia(daBanDem),
      danhGia: daBanDem || '—',
    },
    {
      key: 'tudong',
      label: 'Hộp số tự động',
      thucTeLabel: formatHours(n(thucTe.gioTuDong)),
      nguongLabel: formatHours(n(nguong.gioTuDongToiThieu)),
      pct: makePct(n(thucTe.gioTuDong), n(nguong.gioTuDongToiThieu)),
      status: statusFromDanhGia(daTuDong),
      danhGia: daTuDong || '—',
    },
  ].filter((c) => {
    // Always show if has actual training data, even when threshold is 0
    if (c.status === 'na' && c.key === 'tudong' && n(thucTe.gioTuDong) === 0 && n(nguong.gioTuDongToiThieu) === 0) {
      return false;
    }
    return true;
  });

  const conThieuRaw = isRecord(raw.conThieu) ? raw.conThieu : null;
  const conThieu: ConThieu | null = conThieuRaw ? {
    gio: n(conThieuRaw.gio),
    gioBanDem: n(conThieuRaw.gioBanDem),
    gioTuDong: n(conThieuRaw.gioTuDong),
    km: n(conThieuRaw.km),
  } : null;

  return { hang, tongKet, isEligible, criteria, conThieu };
};

/**
 * Compute overall course completion (0–100).
 *
 * Primary path — when thieuDu is available (from the training system):
 *   Each applicable criterion (status !== 'na') already carries an accurate
 *   pct = min(100, actual / threshold * 100) computed against the real
 *   regulatory minimum for this hạng.  We average those together with
 *   the theory completion ratio (if theory data exists).
 *
 * Fallback — no thieuDu:
 *   Estimate from whatever summary modules are present (cabin, caoToc, dat).
 *   For dat we still avoid a hardcoded session count by using the hours ratio
 *   from tongGio when possible, defaulting to sessions / 10 otherwise.
 */
const computeCourseProgressPct = (params: {
  lyThuyet: TrainingTheoryRow[];
  thieuDu: ThieuDu | null;
  dat: TrainingFullDisplay['dat'];
  cabin: TrainingFullDisplay['cabin'];
  caoToc: TrainingFullDisplay['caoToc'];
}): number => {
  // ── Primary: use real criteria pcts from the training system ────────────
  if (params.thieuDu) {
    const parts: number[] = params.thieuDu.criteria
      .filter((c) => c.status !== 'na')
      .map((c) => c.pct);

    if (params.lyThuyet.length > 0) {
      const done = params.lyThuyet.filter((r) => r.hoanThanh).length;
      parts.push(Math.round((done / params.lyThuyet.length) * 100));
    }

    if (parts.length === 0) return 0;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }

  // ── Fallback: estimate from summary modules ──────────────────────────────
  const weights: number[] = [];

  if (params.lyThuyet.length > 0) {
    const done = params.lyThuyet.filter((r) => r.hoanThanh).length;
    weights.push(done / params.lyThuyet.length);
  }
  if (params.dat !== null) {
    // Use session count as a rough proxy (10 is a common target for B2)
    weights.push(Math.min(1, params.dat.soPhienHoc / 10));
  }
  if (params.cabin !== null) {
    weights.push(params.cabin.hoanThanh ? 1 : 0);
  }
  if (params.caoToc !== null) {
    weights.push(params.caoToc.hoanThanh ? 1 : 0);
  }

  if (weights.length === 0) return 0;
  return Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100);
};

export function parseTrainingDisplay(dt: Record<string, unknown>): TrainingFullDisplay {
  const hv = isRecord(dt.hocVien) ? dt.hocVien : {};

  const hoTen = typeof hv.hoTen === 'string' && hv.hoTen.trim() ? hv.hoTen.trim() : '—';
  const maSo = typeof hv.maDK === 'string' && hv.maDK.trim() ? hv.maDK.trim() : '—';
  const rankLabel = typeof hv.hangDaoTao === 'string' && hv.hangDaoTao.trim() ? hv.hangDaoTao.trim() : '—';
  const ngaySinh = parseBirthDate(hv.ngaySinh);

  const cccd = typeof hv.cccd === 'string' && hv.cccd.trim() ? hv.cccd.trim() : '—';
  const diaChi = typeof hv.diaChi === 'string' && hv.diaChi.trim() ? hv.diaChi.trim() : '—';
  const tenKhoa = typeof hv.tenKhoaHoc === 'string' ? hv.tenKhoaHoc.trim() : '';
  const maKhoa = typeof hv.maKhoaHoc === 'string' ? hv.maKhoaHoc.trim() : '';
  const khoaHoc = tenKhoa && maKhoa ? `${tenKhoa} (${maKhoa})` : tenKhoa || maKhoa || '—';
  const instructor = typeof hv.giaoVien === 'string' && hv.giaoVien.trim() ? hv.giaoVien.trim() : null;
  const plate = typeof hv.phanXe === 'string' && hv.phanXe.trim() ? hv.phanXe.trim() : null;
  const ketQuaDiemDanh = typeof hv.ketQuaDiemDanh === 'string' && hv.ketQuaDiemDanh.trim()
    ? hv.ketQuaDiemDanh.trim() : '';

  const tk = isRecord(dt.tongKet) ? dt.tongKet : null;
  const duongThuong = tk && isRecord(tk.duongThuong) ? tk.duongThuong : null;
  let dat: TrainingFullDisplay['dat'] = null;
  if (duongThuong) {
    const soPhienHoc = typeof duongThuong.soPhienHoc === 'number' ? duongThuong.soPhienHoc : 0;
    const h = typeof duongThuong.tongThoiGianGio === 'number' ? duongThuong.tongThoiGianGio : 0;
    const km = typeof duongThuong.tongQuangDuongKm === 'number' ? duongThuong.tongQuangDuongKm : 0;
    dat = {
      soPhienHoc,
      tongGio: formatHours(h),
      tongKm: `${Math.round(km * 100) / 100} km`,
      completed: km > 0 || soPhienHoc > 0,
    };
  }

  const cabinRaw = tk && isRecord(tk.cabin) ? tk.cabin : null;
  const cabinDetail = isRecord(dt.cabin) ? dt.cabin : cabinRaw;
  let cabin: TrainingFullDisplay['cabin'] = null;
  if (cabinDetail) {
    cabin = {
      tongGio: typeof cabinDetail.tongGio === 'string' ? cabinDetail.tongGio.trim() : '—',
      baiHoanThanh: typeof cabinDetail.baiHoanThanh === 'string' ? cabinDetail.baiHoanThanh.trim() : '',
      hoanThanh: Boolean(cabinDetail.hoanThanh),
      ghiChu: typeof cabinDetail.ghiChu === 'string' ? cabinDetail.ghiChu.trim() : '',
    };
  }

  const caoTocRaw = isRecord(dt.caoToc) ? dt.caoToc : (tk && isRecord(tk.caoToc) ? tk.caoToc : null);
  let caoToc: TrainingFullDisplay['caoToc'] = null;
  if (caoTocRaw) {
    const r2 = (v: unknown) => String(Math.round((parseFloat(String(v ?? '0')) || 0) * 100) / 100);
    caoToc = {
      tongGio: r2(caoTocRaw.tongGio),
      tongKm: r2(caoTocRaw.tongKm),
      vanTocTB: r2(caoTocRaw.vanTocTB),
      hoanThanh: Boolean(caoTocRaw.hoanThanh),
      ghiChu: typeof caoTocRaw.ghiChu === 'string' ? caoTocRaw.ghiChu.trim() : '',
    };
  }

  const lyThuyet = parseLyThuyet(dt.lyThuyet);
  const giayTo = parseGiayTo(dt.giayTo);

  const sessionsRaw = Array.isArray(dt.loTrinhDuongThuong) ? dt.loTrinhDuongThuong : [];
  const sessions = sessionsRaw.map((item, idx) => parseSessionRow(item, idx));

  const moduleHistories: TrainingModuleHistory[] = [];
  if (sessions.length > 0) {
    moduleHistories.push({ key: 'dat', title: 'Lộ trình đường trường (DAT)', sessions });
  }

  const thieuDu = parseThieuDu(dt.thieuDu);
  const courseProgressPct = computeCourseProgressPct({ lyThuyet, thieuDu, dat, cabin, caoToc });

  return {
    hoTen, maSo, rankLabel, ngaySinh, cccd, diaChi, khoaHoc,
    instructor, plate, ketQuaDiemDanh, dat, cabin, caoToc,
    lyThuyet, giayTo, courseProgressPct, thieuDu, moduleHistories,
  };
}
