import db from '../models/index';
import { Op } from 'sequelize';
import { fetchPublicStudent, isTrainingApiConfigured } from './trainingPortalService';

const SYNC_DELAY_MS = 500;
const STALE_HOURS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRecord = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Compute course progress percentage from raw upstream DT — server-side
 * mirror of frontend parseTrainingDisplay logic.
 */
const computeProgressFromDT = (dt) => {
  if (!isRecord(dt)) return 0;

  const n = (v) => {
    if (typeof v === 'number') return v;
    const p = parseFloat(String(v ?? '0'));
    return Number.isFinite(p) ? p : 0;
  };
  const makePct = (actual, threshold) =>
    threshold <= 0 ? 100 : Math.min(100, Math.round((actual / threshold) * 100));

  const thieuDuRaw = isRecord(dt.thieuDu) ? dt.thieuDu : null;
  const lyThuyetArr = Array.isArray(dt.lyThuyet) ? dt.lyThuyet : [];

  if (thieuDuRaw) {
    const nguong = isRecord(thieuDuRaw.nguong) ? thieuDuRaw.nguong : {};
    const thucTe = isRecord(thieuDuRaw.thucTe) ? thieuDuRaw.thucTe : {};
    const danhGia = isRecord(thieuDuRaw.danhGia) ? thieuDuRaw.danhGia : {};

    const statusOf = (s) => {
      if (typeof s !== 'string') return 'thieu';
      if (/không áp dụng/i.test(s)) return 'na';
      if (/^đủ$/i.test(s)) return 'du';
      return 'thieu';
    };

    const criteria = [
      { pct: makePct(n(thucTe.tongGioHoc), n(nguong.gioToiThieu)), st: statusOf(danhGia.gioHoc) },
      { pct: makePct(n(thucTe.tongKm), n(nguong.kmToiThieu)), st: statusOf(danhGia.km) },
      { pct: makePct(n(thucTe.gioBanDem), n(nguong.gioBanDemToiThieu)), st: statusOf(danhGia.banDem) },
      { pct: makePct(n(thucTe.gioTuDong), n(nguong.gioTuDongToiThieu)), st: statusOf(danhGia.tuDong) },
    ];

    const parts = criteria.filter((c) => c.st !== 'na').map((c) => c.pct);

    const validTheory = lyThuyetArr.filter((x) => isRecord(x) && typeof x.mon === 'string' && x.mon.trim());
    if (validTheory.length > 0) {
      const done = validTheory.filter((x) => Boolean(x.hoanThanh)).length;
      parts.push(Math.round((done / validTheory.length) * 100));
    }

    return parts.length === 0 ? 0 : Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }

  // Fallback
  const weights = [];
  const validTheory = lyThuyetArr.filter((x) => isRecord(x) && typeof x.mon === 'string' && x.mon.trim());
  if (validTheory.length > 0) {
    weights.push(validTheory.filter((x) => Boolean(x.hoanThanh)).length / validTheory.length);
  }

  const tk = isRecord(dt.tongKet) ? dt.tongKet : null;
  const duongThuong = tk && isRecord(tk.duongThuong) ? tk.duongThuong : null;
  if (duongThuong) {
    const sessions = typeof duongThuong.soPhienHoc === 'number' ? duongThuong.soPhienHoc : 0;
    weights.push(Math.min(1, sessions / 10));
  }

  const cabinRaw = isRecord(dt.cabin) ? dt.cabin : (tk && isRecord(tk.cabin) ? tk.cabin : null);
  if (cabinRaw) weights.push(cabinRaw.hoanThanh ? 1 : 0);

  const caoTocRaw = isRecord(dt.caoToc) ? dt.caoToc : (tk && isRecord(tk.caoToc) ? tk.caoToc : null);
  if (caoTocRaw) weights.push(caoTocRaw.hoanThanh ? 1 : 0);

  if (weights.length === 0) return 0;
  return Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100);
};

export const syncOneStudent = async (hocVienId) => {
  const hv = await db.hoc_vien.findByPk(hocVienId);
  if (!hv) return { ok: false, error: 'Student not found' };

  const cccd = (hv.SoCCCD || '').trim();
  if (!cccd) {
    await db.training_snapshot.upsert({
      hocVienId,
      cccd: '',
      rawJson: '{}',
      courseProgressPct: 0,
      syncStatus: 'error',
      syncError: 'No CCCD on profile',
      lastSyncAt: null,
    });
    return { ok: false, error: 'No CCCD' };
  }

  try {
    const upstream = await fetchPublicStudent(cccd);
    const data = upstream.data;

    if (!isRecord(data) || data.EC !== 0 || !isRecord(data.DT)) {
      const msg = (isRecord(data) && data.EM) ? String(data.EM) : `Upstream status ${upstream.status}`;
      await db.training_snapshot.upsert({
        hocVienId,
        cccd,
        rawJson: JSON.stringify(data ?? {}),
        courseProgressPct: 0,
        syncStatus: 'error',
        syncError: msg,
        lastSyncAt: new Date(),
      });
      return { ok: false, error: msg };
    }

    const dt = data.DT;
    const pct = computeProgressFromDT(dt);

    await db.training_snapshot.upsert({
      hocVienId,
      cccd,
      rawJson: JSON.stringify(dt),
      courseProgressPct: pct,
      syncStatus: 'success',
      syncError: null,
      lastSyncAt: new Date(),
    });

    const assignment = await db.student_assignment.findOne({ where: { hocVienId } });
    if (assignment) {
      await assignment.update({ progressPercent: pct });
    }

    return { ok: true, pct };
  } catch (err) {
    const msg = err?.message || 'Unknown sync error';
    await db.training_snapshot.upsert({
      hocVienId,
      cccd,
      rawJson: '{}',
      courseProgressPct: 0,
      syncStatus: 'error',
      syncError: msg,
    });
    return { ok: false, error: msg };
  }
};

export const syncAllIncomplete = async () => {
  if (!isTrainingApiConfigured()) {
    console.log('[TrainingSync] TRAINING_API_BASE_URL not configured, skipping');
    return { success: 0, error: 0, skipped: 0, elapsed: 0 };
  }

  const start = Date.now();
  const students = await db.hoc_vien.findAll({
    where: {
      SoCCCD: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
    },
    include: [
      {
        model: db.student_assignment,
        as: 'assignment',
        required: false,
      },
    ],
  });

  const eligible = students.filter(
    (s) => !s.assignment || s.assignment.status !== 'completed',
  );

  let success = 0;
  let error = 0;
  let skipped = 0;

  for (const s of eligible) {
    const cccd = (s.SoCCCD || '').trim();
    if (!cccd) { skipped++; continue; }

    const result = await syncOneStudent(s.id);
    if (result.ok) success++;
    else error++;

    await sleep(SYNC_DELAY_MS);
  }

  const elapsed = Date.now() - start;
  console.log(`[TrainingSync] Complete: ${success} ok, ${error} fail, ${skipped} skip, ${elapsed}ms`);
  return { success, error, skipped, elapsed };
};

export const getSnapshotByCccd = async (cccd) => {
  return db.training_snapshot.findOne({ where: { cccd } });
};

export const getSnapshotByHocVienId = async (hocVienId) => {
  return db.training_snapshot.findOne({ where: { hocVienId } });
};

export const isSnapshotStale = (snapshot) => {
  if (!snapshot || !snapshot.lastSyncAt) return true;
  const age = Date.now() - new Date(snapshot.lastSyncAt).getTime();
  return age > STALE_HOURS * 60 * 60 * 1000;
};

export const getSyncStats = async () => {
  const total = await db.training_snapshot.count();
  const success = await db.training_snapshot.count({ where: { syncStatus: 'success' } });
  const error = await db.training_snapshot.count({ where: { syncStatus: 'error' } });
  const pending = await db.training_snapshot.count({ where: { syncStatus: 'pending' } });

  const latest = await db.training_snapshot.findOne({
    where: { syncStatus: 'success' },
    order: [['lastSyncAt', 'DESC']],
    attributes: ['lastSyncAt'],
  });

  return {
    total,
    success,
    error,
    pending,
    lastRunAt: latest?.lastSyncAt ?? null,
    totalStudents: await db.hoc_vien.count(),
  };
};
