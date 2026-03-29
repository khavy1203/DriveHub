import hocvienService from '../service/hocvienService.js';
import mailService from '../service/mailService.js';
import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';

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

const registerStudent = async (req, res) => {
  const { HoTen, NgaySinh, GioiTinh, SoCCCD, phone, email,
    DiaChi, loaibangthi, GplxDaCo, GhiChu, IDKhoaHoc } = req.body;

  if (!HoTen || !loaibangthi) {
    return res.status(400).json({ EM: 'HoTen và loaibangthi là bắt buộc', EC: -1, DT: null });
  }
  const result = await hocvienService.registerStudent({
    HoTen, NgaySinh, GioiTinh, SoCCCD, phone, email,
    DiaChi, loaibangthi, GplxDaCo, GhiChu, IDKhoaHoc,
  });
  return res.status(result.EC === -1 ? 500 : 200).json(result);
};

const listHocVien = async (req, res) => {
  const { courseId } = req.query;
  const result = await hocvienService.listByKhoaHoc(courseId);
  return res.status(200).json(result);
};

const getPortalData = async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ EM: 'Chưa đăng nhập hoặc token không hợp lệ', EC: -1, DT: null });
  const result = await hocvienService.getPortalData(userId);
  return res.status(200).json(result);
};

const deleteHocVien = async (req, res) => {
  const { id } = req.params;
  const result = await hocvienService.deleteHocVien(+id);
  return res.status(result.EC === -1 ? 500 : 200).json(result);
};

const sendCredentials = async (req, res) => {
  const { hocVienId, toEmail, hoTen, username, password } = req.body;
  if (!hocVienId || !toEmail || !username || !password) {
    return res.status(400).json({ EM: 'Thiếu thông tin gửi email', EC: -1, DT: null });
  }
  const result = await mailService.sendHocVienCredentials({ toEmail, hoTen, username, password });
  if (result.ok) {
    return res.status(200).json({ EM: 'Gửi email thành công', EC: 0, DT: null });
  }
  if (result.reason === 'not_configured') {
    return res.status(200).json({ EM: 'Chưa cấu hình email server', EC: 1, DT: null });
  }
  return res.status(500).json({ EM: 'Gửi email thất bại', EC: -1, DT: null });
};

const uploadAvatar = async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ EM: 'Chưa đăng nhập hoặc token không hợp lệ', EC: -1, DT: null });
  if (!req.file) return res.status(400).json({ EM: 'Không có file được upload', EC: -1, DT: null });

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const avatarUrl = `${backendUrl}/uploads/student-avatars/${req.file.filename}`;
  const result = await hocvienService.updateAvatar(userId, avatarUrl);
  return res.status(result.EC === 0 ? 200 : 500).json(result);
};

const updateHocVienInfo = async (req, res) => {
  const { id } = req.params;
  const result = await hocvienService.updateHocVienInfo(+id, req.body);
  return res.status(result.EC === 0 ? 200 : result.EC === 1 ? 404 : 500).json(result);
};

const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ EM: 'Mật khẩu phải có ít nhất 4 ký tự', EC: -1, DT: null });
  }
  const result = await hocvienService.adminResetPassword(+id, newPassword);
  return res.status(result.EC === 0 ? 200 : result.EC === 1 ? 404 : 500).json(result);
};

const updateOwnProfile = async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ EM: 'Chưa đăng nhập', EC: -1, DT: null });
  const result = await hocvienService.updateOwnProfile(userId, req.body);
  return res.status(result.EC === 0 ? 200 : 500).json(result);
};

export default { registerStudent, listHocVien, deleteHocVien, getPortalData, sendCredentials, uploadAvatar, updateHocVienInfo, resetPassword, updateOwnProfile };
