import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import {
  syncOneStudent,
  syncAllIncomplete,
  getSnapshotByCccd,
  isSnapshotStale,
  getSyncStats,
} from '../service/trainingSyncService.js';

const ALLOWED_GROUPS = new Set(['HocVien', 'GiaoVien', 'Admin', 'SupperAdmin']);
const ADMIN_GROUPS = new Set(['Admin', 'SupperAdmin']);

const resolveTokenContext = (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
};

/**
 * GET /api/training/student-cached?cccd=...
 *
 * Returns cached training data from training_snapshot.
 * If snapshot is stale (>3h) or missing, triggers on-demand sync.
 */
export const getTrainingStudentCached = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập', DT: null });
    }

    const groupName = decoded.groupWithRoles?.name;
    if (!groupName || !ALLOWED_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Không có quyền truy cập', DT: null });
    }

    let targetCccd = (req.query.cccd || '').trim();

    if (groupName === 'HocVien') {
      const account = await db.user.findOne({ where: { email: decoded.email } });
      if (!account) return res.status(404).json({ EC: -1, EM: 'Tài khoản không tồn tại', DT: null });
      const hv = await db.hoc_vien.findOne({ where: { userId: account.id }, attributes: ['id', 'SoCCCD'] });
      if (!hv) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy hồ sơ học viên', DT: null });
      targetCccd = (hv.SoCCCD || '').trim();
    }

    if (!targetCccd) {
      return res.status(400).json({ EC: -1, EM: 'Thiếu CCCD', DT: null });
    }

    let snapshot = await getSnapshotByCccd(targetCccd);

    if (!snapshot || isSnapshotStale(snapshot)) {
      const hv = await db.hoc_vien.findOne({ where: { SoCCCD: targetCccd }, attributes: ['id'] });
      if (hv) {
        await syncOneStudent(hv.id);
        snapshot = await getSnapshotByCccd(targetCccd);
      }
    }

    if (!snapshot) {
      return res.status(404).json({ EC: -1, EM: 'Không có dữ liệu đào tạo cho CCCD này', DT: null });
    }

    if (snapshot.syncStatus === 'error' && !snapshot.rawJson) {
      return res.status(502).json({
        EC: -1,
        EM: snapshot.syncError || 'Lỗi đồng bộ dữ liệu',
        DT: null,
      });
    }

    let dt;
    try {
      dt = JSON.parse(snapshot.rawJson);
    } catch {
      return res.status(500).json({ EC: -1, EM: 'Dữ liệu cache bị lỗi', DT: null });
    }

    return res.json({
      EC: 0,
      EM: 'OK',
      DT: dt,
      _sync: {
        lastSyncAt: snapshot.lastSyncAt,
        courseProgressPct: snapshot.courseProgressPct,
        syncStatus: snapshot.syncStatus,
      },
    });
  } catch (err) {
    console.error('[training/student-cached] Error:', err.message);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};

/**
 * POST /api/training/sync-all
 * Admin only — triggers full sync for all incomplete students.
 */
export const triggerSyncAll = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập', DT: null });
    }

    const groupName = decoded.groupWithRoles?.name;
    if (!groupName || !ADMIN_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Chỉ Admin có quyền thực hiện', DT: null });
    }

    syncAllIncomplete().catch((err) => {
      console.error('[training/sync-all] Background error:', err.message);
    });

    return res.json({ EC: 0, EM: 'Đồng bộ đã bắt đầu', DT: null });
  } catch (err) {
    console.error('[training/sync-all] Error:', err.message);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};

/**
 * GET /api/training/sync-status
 * Admin only — returns current sync statistics.
 */
export const getTrainingSyncStatus = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập', DT: null });
    }

    const groupName = decoded.groupWithRoles?.name;
    if (!groupName || !ADMIN_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Chỉ Admin có quyền truy cập', DT: null });
    }

    const stats = await getSyncStats();
    return res.json({ EC: 0, EM: 'OK', DT: stats });
  } catch (err) {
    console.error('[training/sync-status] Error:', err.message);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};
