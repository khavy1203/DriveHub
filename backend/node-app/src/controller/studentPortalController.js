import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import studentPortalService from '../service/studentPortalService.js';

const resolveUserId = async (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.email) return null;
  const user = await db.user.findOne({ where: { email: decoded.email }, attributes: ['id'] });
  return user ? user.id : null;
};

const resolveHocVienId = async (userId) => {
  const hv = await db.hoc_vien.findOne({ where: { userId }, attributes: ['id'] });
  return hv ? hv.id : null;
};

const getMyProgress = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }
    const result = await studentPortalService.getMyProgress(userId);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[studentPortalController.getMyProgress]', e);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};

const getTeachers = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const hocVienId = userId ? await resolveHocVienId(userId) : null;
    const result = await studentPortalService.getAllTeachers(hocVienId);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[studentPortalController.getTeachers]', e);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: [] });
  }
};

const submitRating = async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }
    const hocVienId = await resolveHocVienId(userId);
    if (!hocVienId) {
      return res.status(403).json({ EC: -1, EM: 'Không tìm thấy hồ sơ học viên', DT: null });
    }
    const { stars, comment } = req.body;
    const result = await studentPortalService.submitRating(hocVienId, { stars, comment });
    return res.status(result.EC === 0 ? 200 : 400).json(result);
  } catch (e) {
    console.error('[studentPortalController.submitRating]', e);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};

export default { getMyProgress, getTeachers, submitRating };
