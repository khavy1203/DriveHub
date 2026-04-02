import db from '../models/index';
import { Op } from 'sequelize';
import { isAxiosError } from 'axios';
import { fetchPublicStudent, isTrainingApiConfigured } from './trainingPortalService';
import hocvienService from './hocvienService';

const SYNC_DELAY_MS = 500;
const STALE_HOURS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const syncDebugEnabled = () =>
  process.env.TRAINING_SYNC_DEBUG === '1' || process.env.TRAINING_SYNC_DEBUG === 'true';

/** Last 4 digits only — avoid logging full CCCD. */
const maskCccd = (s) => {
  const t = String(s || '').trim();
  if (!t) return '';
  if (t.length <= 4) return '****';
  return `…${t.slice(-4)}`;
};

const axiosFailDetail = (err) => {
  if (!isAxiosError(err)) return {};
  return {
    axiosCode: err.code || null,
    httpStatus: err.response?.status ?? null,
    requestPath: err.config?.url ? String(err.config.url).split('?')[0] : null,
  };
};

const logSyncDebug = (...args) => {
  if (syncDebugEnabled()) console.log('[TrainingSync:debug]', ...args);
};

const logSyncFail = (ctx) => {
  console.error('[TrainingSync:fail]', JSON.stringify(ctx));
};

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
  if (caoTocRaw) {
    const gioNum = parseFloat(String(caoTocRaw.tongGio ?? '0')) || 0;
    const kmNum = parseFloat(String(caoTocRaw.tongKm ?? '0')) || 0;
    const vanTocNum = parseFloat(String(caoTocRaw.vanTocTB ?? '0')) || 0;
    const caoTocPass = gioNum > 3600 && kmNum > 60 && vanTocNum > 60;
    weights.push(caoTocPass ? 1 : 0);
  }

  if (weights.length === 0) return 0;
  return Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100);
};

/**
 * Resolves the adminId for a hocVien by looking up:
 * hoc_vien.superTeacherId → user(superTeacher).adminId
 * @param {object} hv - hoc_vien instance
 * @returns {Promise<number|null>}
 */
const resolveAdminIdForStudent = async (hv) => {
  if (!hv.superTeacherId) return null;
  const superTeacher = await db.user.findByPk(hv.superTeacherId, { attributes: ['adminId'] });
  return superTeacher?.adminId ?? null;
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
    logSyncFail({ step: 'no_cccd', hocVienId });
    return { ok: false, error: 'No CCCD' };
  }

  const adminId = await resolveAdminIdForStudent(hv);
  logSyncDebug('sync start', { hocVienId, cccd: maskCccd(cccd), adminId });

  try {
    const upstream = await fetchPublicStudent(cccd, adminId);
    const data = upstream.data;

    logSyncDebug('upstream response', {
      hocVienId,
      cccd: maskCccd(cccd),
      httpStatus: upstream.status,
      ec: isRecord(data) ? data.EC : null,
    });

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
      logSyncFail({
        step: 'upstream_em',
        hocVienId,
        cccd: maskCccd(cccd),
        httpStatus: upstream.status,
        error: msg,
      });
      return { ok: false, error: msg };
    }

    const dt = data.DT;
    const pct = computeProgressFromDT(dt);

    // Sync student personal info from API into hoc_vien
    const apiHv = isRecord(dt.hocVien) ? dt.hocVien : {};
    if (apiHv.hoTen) {
      const hvUpdates = {};
      if (apiHv.hoTen) hvUpdates.HoTen = apiHv.hoTen;
      if (apiHv.ngaySinh) {
        const raw = String(apiHv.ngaySinh).trim();
        // API may return DD/MM/YYYY or ISO — normalise to YYYY-MM-DD for DB
        const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (ddmmyyyy) {
          hvUpdates.NgaySinh = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
        } else {
          hvUpdates.NgaySinh = raw.split('T')[0];
        }
      }
      if (apiHv.diaChi) hvUpdates.DiaChi = apiHv.diaChi;
      if (apiHv.hangDaoTao) hvUpdates.loaibangthi = apiHv.hangDaoTao;
      if (Object.keys(hvUpdates).length > 0) {
        await db.hoc_vien.update(hvUpdates, { where: { id: hocVienId } });
      }
    }

    await db.training_snapshot.upsert({
      hocVienId,
      cccd,
      rawJson: JSON.stringify(dt),
      courseProgressPct: pct,
      syncStatus: 'success',
      syncError: null,
      lastSyncAt: new Date(),
    });

    const assignment = await db.student_assignment.findOne({ where: { hocVienId, role: 'primary' } });
    if (assignment) {
      const updates = { progressPercent: pct };
      if (pct >= 100 && assignment.status !== 'completed') {
        updates.status = 'completed';
        await db.hoc_vien.update({ status: 'dat_completed' }, { where: { id: hocVienId } });
      } else if (pct > 0 && assignment.status === 'waiting') {
        updates.status = 'learning';
      }
      await assignment.update(updates);
    }

    logSyncDebug('sync ok', { hocVienId, cccd: maskCccd(cccd), pct });
    return { ok: true, pct };
  } catch (err) {
    const msg = err?.message || 'Unknown sync error';
    logSyncFail({
      step: 'exception',
      hocVienId,
      cccd: maskCccd(cccd),
      error: msg,
      errCode: err?.code || null,
      ...axiosFailDetail(err),
    });
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
    logSyncDebug('skip: TRAINING_API_BASE_URL empty — set it on deploy and restart process');
    return { success: 0, error: 0, skipped: 0, elapsed: 0 };
  }

  const start = Date.now();
  logSyncDebug('syncAllIncomplete started');
  const students = await db.hoc_vien.findAll({
    where: {
      SoCCCD: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
    },
    include: [
      {
        model: db.student_assignment,
        as: 'assignment',
        required: false,
        where: { role: 'primary' },
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

/**
 * Import + sync danh sách CCCD: tra cứu API → tạo hoc_vien/user nếu chưa có → sync training data.
 * @param {string[]} cccdList
 * @param {number|null|undefined} [adminId]
 */
export const importAndSyncByCccdList = async (cccdList, adminId) => {
  if (!isTrainingApiConfigured()) {
    return { results: [], error: 'TRAINING_API_BASE_URL not configured' };
  }

  const results = [];

  for (const rawCccd of cccdList) {
    const cccd = String(rawCccd).trim();
    if (!cccd) continue;

    try {
      const upstream = await fetchPublicStudent(cccd, adminId);
      const data = upstream.data;

      if (!isRecord(data) || data.EC !== 0 || !isRecord(data.DT)) {
        results.push({ cccd, ok: false, error: (isRecord(data) && data.EM) || 'Không tìm thấy trên CSĐT' });
        await sleep(SYNC_DELAY_MS);
        continue;
      }

      const dt = data.DT;
      const importResult = await hocvienService.importFromCccd(cccd, dt);
      if (!importResult.ok) {
        results.push({ cccd, ok: false, error: importResult.error });
        await sleep(SYNC_DELAY_MS);
        continue;
      }

      // Pull student to admin's pool — always overwrite ownership (handles existing students too)
      if (adminId) {
        if (!importResult.created) {
          // Existing student being claimed — clear old ST assignments
          await db.student_assignment.destroy({ where: { hocVienId: importResult.hocVienId } });
        }
        await db.hoc_vien.update(
          { adminId, superTeacherId: null },
          { where: { id: importResult.hocVienId } },
        );
      }

      const pct = computeProgressFromDT(dt);
      await db.training_snapshot.upsert({
        hocVienId: importResult.hocVienId,
        cccd,
        rawJson: JSON.stringify(dt),
        courseProgressPct: pct,
        syncStatus: 'success',
        syncError: null,
        lastSyncAt: new Date(),
      });

      const assignment = await db.student_assignment.findOne({ where: { hocVienId: importResult.hocVienId, role: 'primary' } });
      if (assignment) {
        const updates = { progressPercent: pct };
        if (pct >= 100 && assignment.status !== 'completed') {
          updates.status = 'completed';
          await db.hoc_vien.update({ status: 'dat_completed' }, { where: { id: importResult.hocVienId } });
        } else if (pct > 0 && assignment.status === 'waiting') {
          updates.status = 'learning';
        }
        await assignment.update(updates);
      }

      results.push({
        cccd,
        ok: true,
        hoTen: importResult.hoTen,
        hocVienId: importResult.hocVienId,
        created: importResult.created,
        pct,
      });
    } catch (err) {
      results.push({ cccd, ok: false, error: err.message || 'Unknown error' });
    }

    await sleep(SYNC_DELAY_MS);
  }

  return { results };
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
