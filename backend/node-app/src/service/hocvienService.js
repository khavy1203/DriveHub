import crypto from 'crypto';
import db from '../models/index.js';
import { hashUserPassword } from './loginRegisterService.js';
import mailService from './mailService.js';

const HOC_VIEN_GROUP_ID = 4;

const generateSetupToken = () => crypto.randomBytes(32).toString('hex');
const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const buildSetupLink = (token) => {
  const base = process.env.FRONTEND_URL || 'https://localhost:3000';
  return `${base}/#/setup-password?token=${token}`;
};

// ── Register new student (creates hoc_vien + user account) ───────────────────
const registerStudent = async ({
  HoTen, NgaySinh, GioiTinh, SoCCCD, phone, email,
  DiaChi, loaibangthi, GplxDaCo, GhiChu, IDKhoaHoc,
}) => {
  const t = await db.sequelize.transaction();
  try {
    if (email) {
      const exists = await db.user.findOne({ where: { email }, transaction: t });
      if (exists) {
        await t.rollback();
        return { EM: 'Email đã tồn tại trong hệ thống', EC: 1, DT: null };
      }
    }

    const hocVien = await db.hoc_vien.create({
      HoTen, NgaySinh: NgaySinh || null, GioiTinh: GioiTinh || null,
      SoCCCD: SoCCCD || null, phone: phone || null, email: email || null,
      DiaChi: DiaChi || null, loaibangthi: loaibangthi || null,
      GplxDaCo: GplxDaCo || null, GhiChu: GhiChu || null,
      IDKhoaHoc: IDKhoaHoc || null,
      status: 'registered',
    }, { transaction: t });

    const setupToken = generateSetupToken();
    const setupTokenExpiry = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashed = hashUserPassword(tempPassword);
    const userEmail = email || `hv${hocVien.id}@drivehub.local`;

    const newUser = await db.user.create({
      email: userEmail, password: hashed, username: HoTen,
      phone: phone || null, address: DiaChi || null,
      groupId: HOC_VIEN_GROUP_ID, active: 1, thisinhId: null,
      setupToken, setupTokenExpiry,
    }, { transaction: t });

    await hocVien.update({ userId: newUser.id }, { transaction: t });

    await t.commit();

    // Gửi email setup sau khi commit (không block transaction)
    if (email) {
      mailService.sendSetupEmail({
        toEmail: email,
        hoTen: HoTen,
        setupLink: buildSetupLink(setupToken),
        role: 'học viên',
      }).catch(err => console.error('[hocvienService] Gửi email lỗi:', err.message));
    }

    return {
      EM: 'Đăng ký học viên thành công',
      EC: 0,
      DT: {
        hocVienId: hocVien.id,
        userId: newUser.id,
        username: userEmail,
        HoTen,
        emailSent: !!email,
      },
    };
  } catch (e) {
    await t.rollback();
    console.error('[hocvienService.registerStudent]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

// ── List học viên theo khoá học ───────────────────────────────────────────────
const listByKhoaHoc = async (courseId) => {
  try {
    const where = courseId ? { IDKhoaHoc: courseId } : {};
    const rows = await db.hoc_vien.findAll({
      where,
      attributes: ['id', 'HoTen', 'NgaySinh', 'GioiTinh', 'SoCCCD',
        'phone', 'email', 'DiaChi', 'loaibangthi', 'GplxDaCo',
        'GhiChu', 'IDKhoaHoc', 'userId', 'status', 'createdAt'],
      include: [
        {
          model: db.student_assignment,
          as: 'assignment',
          required: false,
          include: [
            { model: db.user, as: 'teacher', attributes: ['id', 'username', 'phone'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return { EM: 'ok', EC: 0, DT: rows.map(r => r.get({ plain: true })) };
  } catch (e) {
    console.error('[hocvienService.listByKhoaHoc]', e);
    return { EM: 'Lỗi server', EC: -1, DT: [] };
  }
};

// ── Delete học viên (kèm assignment + user account) ──────────────────────────
const deleteHocVien = async (id) => {
  const t = await db.sequelize.transaction();
  try {
    const hocVien = await db.hoc_vien.findByPk(id, { transaction: t });
    if (!hocVien) {
      await t.rollback();
      return { EM: 'Không tìm thấy học viên', EC: 1, DT: null };
    }
    await db.student_assignment.destroy({ where: { hocVienId: id }, transaction: t });
    const { userId } = hocVien;
    await hocVien.destroy({ transaction: t });
    if (userId) {
      await db.user.destroy({ where: { id: userId }, transaction: t });
    }
    await t.commit();
    return { EM: 'Đã xoá học viên', EC: 0, DT: null };
  } catch (e) {
    await t.rollback();
    console.error('[hocvienService.deleteHocVien]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

// ── Student portal — data for the logged-in student ───────────────────────────
const getPortalData = async (userId) => {
  try {
    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      include: [
        {
          model: db.student_assignment,
          as: 'assignment',
          required: false,
          include: [
            { model: db.user, as: 'teacher', attributes: ['id', 'username', 'phone'] },
            { model: db.khoahoc, as: 'course', attributes: ['IDKhoaHoc', 'TenKhoaHoc'] },
          ],
        },
      ],
    });
    if (!hocVien) return { EM: 'Không tìm thấy hồ sơ học viên', EC: 1, DT: null };
    return { EM: 'ok', EC: 0, DT: hocVien.get({ plain: true }) };
  } catch (e) {
    console.error('[hocvienService.getPortalData]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

export default { registerStudent, listByKhoaHoc, deleteHocVien, getPortalData };
