import db from '../models/index.js';

const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Parse tenKhoaHoc / maKhoaHoc from CSĐT training DT (same shape as frontend parseTrainingDisplay). */
export const extractTrainingCourseFromRawJson = (rawJsonStr) => {
  if (!rawJsonStr || typeof rawJsonStr !== 'string') return null;
  try {
    const dt = JSON.parse(rawJsonStr);
    const hv = isRecord(dt) && isRecord(dt.hocVien) ? dt.hocVien : {};
    const tenKhoa = typeof hv.tenKhoaHoc === 'string' ? hv.tenKhoaHoc.trim() : '';
    const maKhoa = typeof hv.maKhoaHoc === 'string' ? hv.maKhoaHoc.trim() : '';
    if (!tenKhoa && !maKhoa) return null;
    const display = tenKhoa && maKhoa ? `${tenKhoa} (${maKhoa})` : tenKhoa || maKhoa;
    const idKey = maKhoa || `~${tenKhoa}`;
    return { maKhoa, tenKhoa, display, idKey };
  } catch {
    return null;
  }
};

export const loadTrainingSnapshotsByHocVienIds = async (hocVienIds) => {
  if (!hocVienIds.length) return new Map();
  const unique = [...new Set(hocVienIds.filter((id) => typeof id === 'number' && !Number.isNaN(id)))];
  if (!unique.length) return new Map();
  const snaps = await db.training_snapshot.findAll({
    where: { hocVienId: unique },
    attributes: ['hocVienId', 'rawJson', 'courseProgressPct', 'syncStatus'],
  });
  const m = new Map();
  for (const s of snaps) {
    m.set(s.hocVienId, s.get({ plain: true }));
  }
  return m;
};

/**
 * Adds trainingProgressPct and synthetic khoahoc when DB join has no course but CSĐT snapshot does.
 * @param {object} hocVienPlain
 * @param {object|null|undefined} snapPlain
 */
export const enrichHocVienPlainWithTrainingSnapshot = (hocVienPlain, snapPlain) => {
  if (!hocVienPlain) return hocVienPlain;
  const out = { ...hocVienPlain };
  if (!snapPlain) return out;

  const pct = typeof snapPlain.courseProgressPct === 'number' ? snapPlain.courseProgressPct : null;
  if (pct != null) out.trainingProgressPct = pct;

  if (snapPlain.syncStatus !== 'success') return out;

  const course = extractTrainingCourseFromRawJson(snapPlain.rawJson);
  if (!course) return out;

  if (!out.khoahoc) {
    out.khoahoc = {
      IDKhoaHoc: course.idKey,
      TenKhoaHoc: course.display,
      NgayThi: null,
    };
    if (!out.IDKhoaHoc && course.maKhoa) out.IDKhoaHoc = course.maKhoa;
  }

  return out;
};
