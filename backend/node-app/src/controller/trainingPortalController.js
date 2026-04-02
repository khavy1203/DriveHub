import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import * as trainingPortalService from '../service/trainingPortalService.js';
import { isTrainingApiConfiguredForAdmin } from '../service/trainingPortalService.js';

const ALLOWED_GROUPS = new Set(['HocVien', 'GiaoVien', 'SupperTeacher', 'Admin', 'SupperAdmin']);

const resolveTokenContext = (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
};

const normalizeDigits = (s) => String(s || '').replace(/\D/g, '');

/**
 * Resolve the adminId that governs the training API URL for a given caller.
 * Admin → their own id. SupperTeacher → their adminId field.
 * GiaoVien → their ST's adminId. HocVien → their hoc_vien's ST's adminId.
 * SupperAdmin → null (env fallback).
 */
const resolveAdminId = async (groupName, account) => {
  if (groupName === 'Admin') return account.id;
  if (groupName === 'SupperAdmin') return null;
  if (groupName === 'SupperTeacher') return account.adminId || null;
  if (groupName === 'GiaoVien') {
    if (!account.superTeacherId) return null;
    const st = await db.user.findByPk(account.superTeacherId, { attributes: ['adminId'] });
    return st?.adminId || null;
  }
  if (groupName === 'HocVien') {
    const hv = await db.hoc_vien.findOne({ where: { userId: account.id }, attributes: ['superTeacherId'] });
    if (!hv?.superTeacherId) return null;
    const st = await db.user.findByPk(hv.superTeacherId, { attributes: ['adminId'] });
    return st?.adminId || null;
  }
  return null;
};

/**
 * Extract storage path for upstream /api/public/avatar from a string field.
 * @param {string} raw
 * @returns {string}
 */
const extractAvatarPath = (raw) => {
  if (!raw || typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed, 'http://training.local');
    if (u.pathname.includes('avatar')) {
      const p = u.searchParams.get('path');
      if (p) return p;
    }
  } catch (_) {
    /* keep trimmed */
  }
  return trimmed;
};

/**
 * Rewrite anhHocVien under DT to DriveHub proxy paths (relative /api/...).
 * @param {unknown} root
 */
const rewriteTrainingAvatars = (root) => {
  if (!root || typeof root !== 'object') return;
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      const v = o[k];
      if (k === 'anhHocVien' && typeof v === 'string' && v.trim()) {
        const pathVal = extractAvatarPath(v);
        o[k] = `/api/training/avatar?path=${encodeURIComponent(pathVal)}`;
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    }
  };
  walk(root);
};

const resolveEffectiveCccd = async ({ groupName, userId, queryCccd }) => {
  const q = String(queryCccd || '').trim();

  if (groupName === 'HocVien') {
    const hv = await db.hoc_vien.findOne({
      where: { userId },
      attributes: ['id', 'SoCCCD'],
    });
    if (!hv) {
      return { error: { status: 404, body: { EC: -1, EM: 'Không tìm thấy hồ sơ học viên', DT: null } } };
    }
    const own = String(hv.SoCCCD || '').trim();
    const ownN = normalizeDigits(own);
    if (!ownN) {
      return { error: { status: 400, body: { EC: -1, EM: 'Hồ sơ chưa có số CCCD', DT: null } } };
    }
    if (!q) {
      return { cccd: own };
    }
    if (normalizeDigits(q) !== ownN) {
      return { error: { status: 403, body: { EC: -1, EM: 'Chỉ được xem tiến độ của chính bạn', DT: null } } };
    }
    return { cccd: own };
  }

  if (groupName === 'GiaoVien') {
    if (!q) {
      return { error: { status: 400, body: { EC: -1, EM: 'Thiếu tham số cccd', DT: null } } };
    }
    const qn = normalizeDigits(q);
    if (!qn) {
      return { error: { status: 400, body: { EC: -1, EM: 'CCCD không hợp lệ', DT: null } } };
    }
    const assigned = await db.student_assignment.findAll({
      where: { teacherId: userId },
      include: [
        { model: db.hoc_vien, as: 'hocVien', attributes: ['id', 'SoCCCD'] },
      ],
    });
    const match = assigned
      .map((r) => r.hocVien)
      .find((hv) => hv && normalizeDigits(hv.SoCCCD) === qn);
    if (!match || !String(match.SoCCCD || '').trim()) {
      return { error: { status: 403, body: { EC: -1, EM: 'Học viên không thuộc danh sách phân công của bạn', DT: null } } };
    }
    return { cccd: String(match.SoCCCD).trim() };
  }

  if (groupName === 'Admin' || groupName === 'SupperAdmin') {
    if (!q) {
      return { error: { status: 400, body: { EC: -1, EM: 'Thiếu tham số cccd', DT: null } } };
    }
    return { cccd: q };
  }

  return { error: { status: 403, body: { EC: -1, EM: 'Không có quyền truy cập', DT: null } } };
};

export const getTrainingStudent = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded?.email) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }

    const groupName = decoded.groupWithRoles?.name;
    if (!ALLOWED_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Không có quyền truy cập', DT: null });
    }

    const account = await db.user.findOne({
      where: { email: decoded.email },
      attributes: ['id', 'adminId', 'superTeacherId'],
    });
    if (!account) {
      return res.status(401).json({ EC: -1, EM: 'Không tìm thấy tài khoản', DT: null });
    }

    const adminId = await resolveAdminId(groupName, account);

    if (!await isTrainingApiConfiguredForAdmin(adminId)) {
      return res.status(503).json({
        EC: -1,
        EM: 'Dịch vụ tiến độ đào tạo chưa được cấu hình (TRAINING_API_BASE_URL)',
        DT: null,
      });
    }

    const resolved = await resolveEffectiveCccd({
      groupName,
      userId: account.id,
      queryCccd: req.query.cccd,
    });
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const upstream = await trainingPortalService.fetchPublicStudent(resolved.cccd, adminId);
    const payload = upstream.data;
    const httpStatus = upstream.status < 400 ? 200 : upstream.status >= 500 ? 502 : upstream.status;

    if (payload && typeof payload === 'object' && payload.DT) {
      try {
        const cloned = JSON.parse(JSON.stringify(payload));
        rewriteTrainingAvatars(cloned.DT);
        return res.status(httpStatus).json(cloned);
      } catch (e) {
        console.error('[getTrainingStudent] rewrite failed', e.message);
      }
    }

    return res.status(httpStatus).json(payload);
  } catch (err) {
    if (err.code === 'TRAINING_CONFIG') {
      return res.status(503).json({ EC: -1, EM: err.message, DT: null });
    }
    console.error('[getTrainingStudent]', err.message);
    return res.status(500).json({ EC: -1, EM: 'Lỗi khi gọi dịch vụ đào tạo', DT: null });
  }
};

export const getTrainingSessionDetail = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded?.email) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }
    const groupName = decoded.groupWithRoles?.name;
    if (!ALLOWED_GROUPS.has(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Không có quyền truy cập', DT: null });
    }
    const { ngay, thoiDiemDangNhap, thoiDiemDangXuat, maDK, cccd: queryCccd } = req.query;
    if (!ngay || !thoiDiemDangNhap || !thoiDiemDangXuat) {
      return res.status(400).json({ EC: -1, EM: 'Thiếu tham số ngay, thoiDiemDangNhap hoặc thoiDiemDangXuat', DT: null });
    }

    // HocVien: CCCD is resolved from JWT by resolveEffectiveCccd; other roles must supply maDK or cccd
    if (!maDK && !queryCccd && groupName !== 'HocVien') {
      return res.status(400).json({ EC: -1, EM: 'Cần ít nhất maDK hoặc cccd', DT: null });
    }

    const account = await db.user.findOne({ where: { email: decoded.email }, attributes: ['id', 'adminId', 'superTeacherId'] });
    if (!account) {
      return res.status(401).json({ EC: -1, EM: 'Không tìm thấy tài khoản', DT: null });
    }

    const adminId = await resolveAdminId(groupName, account);

    if (!await isTrainingApiConfiguredForAdmin(adminId)) {
      return res.status(503).json({ EC: -1, EM: 'Dịch vụ tiến độ đào tạo chưa được cấu hình', DT: null });
    }

    if (!maDK) {
      const resolved = await resolveEffectiveCccd({ groupName, userId: account.id, queryCccd });
      if (resolved.error) return res.status(resolved.error.status).json(resolved.error.body);
      const upstream = await trainingPortalService.fetchPublicSessionDetail({
        cccd: resolved.cccd, ngay, thoiDiemDangNhap, thoiDiemDangXuat, adminId,
      });
      return res.status(upstream.status < 400 ? 200 : upstream.status >= 500 ? 502 : upstream.status).json(upstream.data);
    }

    const upstream = await trainingPortalService.fetchPublicSessionDetail({
      maDK, ngay, thoiDiemDangNhap, thoiDiemDangXuat, adminId,
    });
    return res.status(upstream.status < 400 ? 200 : upstream.status >= 500 ? 502 : upstream.status).json(upstream.data);
  } catch (err) {
    if (err.code === 'TRAINING_CONFIG') {
      return res.status(503).json({ EC: -1, EM: err.message, DT: null });
    }
    const detail = err.code || err.message || 'Unknown';
    console.error('[getTrainingSessionDetail]', detail, err.config?.url || '');
    return res.status(500).json({ EC: -1, EM: `Lỗi khi gọi dịch vụ đào tạo: ${detail}`, DT: null });
  }
};

export const getTrainingAvatar = async (req, res) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded?.email) {
      return res.status(401).send('Unauthorized');
    }
    const groupName = decoded.groupWithRoles?.name;
    if (!ALLOWED_GROUPS.has(groupName)) {
      return res.status(403).send('Forbidden');
    }

    const pathParam = req.query.path;
    if (!pathParam || typeof pathParam !== 'string' || !pathParam.trim()) {
      return res.status(400).send('Bad request');
    }

    const account = await db.user.findOne({
      where: { email: decoded.email },
      attributes: ['id', 'adminId', 'superTeacherId'],
    });
    const adminId = account ? await resolveAdminId(groupName, account) : null;

    if (!await isTrainingApiConfiguredForAdmin(adminId)) {
      return res.status(503).send('Service unavailable');
    }

    const { buffer, contentType } = await trainingPortalService.fetchPublicAvatar(pathParam.trim(), adminId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(buffer);
  } catch (err) {
    if (err.code === 'TRAINING_CONFIG') {
      return res.status(503).send('Service unavailable');
    }
    console.error('[getTrainingAvatar]', err.message);
    return res.status(502).send('Bad gateway');
  }
};
