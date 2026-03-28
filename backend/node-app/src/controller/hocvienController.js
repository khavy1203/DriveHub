import hocvienService from '../service/hocvienService.js';
import mailService from '../service/mailService.js';

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
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ EM: 'Unauthorized', EC: -1, DT: null });
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

export default { registerStudent, listHocVien, deleteHocVien, getPortalData, sendCredentials };
