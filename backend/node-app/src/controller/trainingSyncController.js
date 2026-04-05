import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import {
  syncOneStudent,
  syncAllIncomplete,
  importAndSyncByCccdList,
  getSnapshotByCccd,
  isSnapshotStale,
  getSyncStats,
} from '../service/trainingSyncService.js';
import { getTrainingApiDebugMeta, isTrainingApiConfigured, isTrainingApiConfiguredForAdmin } from '../service/trainingPortalService.js';

const ALLOWED_GROUPS = new Set(['HocVien', 'GiaoVien', 'SupperTeacher', 'Admin', 'SupperAdmin']);
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
      const hv = await db.hoc_vien.findOne({ where: { SoCCCD: targetCccd }, attributes: ['id', 'superTeacherId'] });

      // Resolve adminId from the student's ST chain so the correct API server is used
      let adminId = null;
      if (hv?.superTeacherId) {
        const st = await db.user.findByPk(hv.superTeacherId, { attributes: ['adminId'] });
        adminId = st?.adminId ?? null;
      } else if (groupName === 'Admin') {
        adminId = decoded.id;
      }

      const apiConfigured = await isTrainingApiConfiguredForAdmin(adminId);
      if (!apiConfigured) {
        // API chưa được cấu hình — trả về snapshot cũ nếu có, không log lỗi liên tục
        if (!snapshot) {
          return res.status(503).json({
            EC: -1,
            EM: 'Hệ thống chưa kết nối cổng đào tạo. Vui lòng liên hệ quản trị viên.',
            DT: null,
          });
        }
        // Có snapshot cũ → trả luôn, không sync
      } else if (hv) {
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
 * POST /api/training/import-cccd
 * Admin only — import & sync a list of CCCDs from the external training system.
 * Runs in background, sends WS notification when done.
 * Body: { cccdList: string[] }
 */
export const importByCccdList = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập', DT: null });
    }
    const groupName = decoded.groupWithRoles?.name;
    if (!groupName || !ADMIN_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Chỉ Admin có quyền thực hiện', DT: null });
    }

    const { cccdList } = req.body;
    if (!Array.isArray(cccdList) || cccdList.length === 0) {
      return res.status(400).json({ EC: -1, EM: 'Danh sách CCCD không hợp lệ', DT: null });
    }

    const adminId = groupName === 'Admin' ? decoded.id : null;
    const userId = decoded.id;
    const totalCount = cccdList.length;

    // Respond immediately — processing continues in background
    res.json({
      EC: 0,
      EM: `Đang xử lý ${totalCount} CCCD ở chế độ nền. Bạn sẽ nhận thông báo khi hoàn tất.`,
      DT: { background: true, total: totalCount },
    });

    // Background processing
    setImmediate(async () => {
      try {
        const result = await importAndSyncByCccdList(cccdList, adminId);

        const created = result.results?.filter(r => r.ok && r.created).length ?? 0;
        const transferred = result.results?.filter(r => r.ok && !r.created && r.transferred).length ?? 0;
        const updated = result.results?.filter(r => r.ok && !r.created && !r.transferred).length ?? 0;
        const notFound = result.results?.filter(r => !r.ok && r.notFound).length ?? 0;
        const failed = result.results?.filter(r => !r.ok && !r.notFound).length ?? 0;

        const parts = [];
        if (created) parts.push(`${created} tạo mới`);
        if (transferred) parts.push(`${transferred} chuyển đội`);
        if (updated) parts.push(`${updated} cập nhật`);
        if (notFound) parts.push(`${notFound} không có dữ liệu`);
        if (failed) parts.push(`${failed} lỗi`);
        const summary = parts.join(', ') || 'không có kết quả';

        // Push result to the requesting user via WebSocket
        const { sendToUser } = await import('../websocket/wsNotificationServer.js');
        sendToUser(userId, {
          type: 'IMPORT_CCCD_DONE',
          payload: {
            title: 'Import CCCD hoàn t��t',
            content: `Import ${totalCount} CCCD: ${summary}`,
            results: result.results ?? [],
            created,
            transferred,
            updated,
            notFound,
            failed,
          },
        });

        console.log(`[training/import-cccd] Background done for userId=${userId}: ${summary}`);
      } catch (err) {
        console.error('[training/import-cccd] Background error:', err.message);
        try {
          const { sendToUser } = await import('../websocket/wsNotificationServer.js');
          sendToUser(userId, {
            type: 'IMPORT_CCCD_DONE',
            payload: {
              title: 'Import CCCD thất bại',
              content: `Lỗi khi xử lý ${totalCount} CCCD: ${err.message}`,
              results: [],
              created: 0, transferred: 0, updated: 0, notFound: 0, failed: totalCount,
            },
          });
        } catch {}
      }
    });
  } catch (err) {
    console.error('[training/import-cccd] Error:', err.message);
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
    const deploy = getTrainingApiDebugMeta();
    return res.json({
      EC: 0,
      EM: 'OK',
      DT: {
        ...stats,
        deploy,
        logHint:
          'Server console: set TRAINING_SYNC_DEBUG=true then pm2 logs / docker logs. Fail lines: [TrainingSync:fail].',
      },
    });
  } catch (err) {
    console.error('[training/sync-status] Error:', err.message);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};
