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

    const hocVienIds = rows.map(r => r.id);
    const latestExams = hocVienIds.length
      ? await db.kqsh_thisinh.findAll({
          where: { hocVienId: hocVienIds },
          attributes: ['hocVienId', 'KetQuaSH', 'NgaySH'],
          order: [['NgaySH', 'DESC']],
        })
      : [];

    const latestByHv = {};
    for (const exam of latestExams) {
      const id = exam.hocVienId;
      if (!latestByHv[id]) latestByHv[id] = { KetQuaSH: exam.KetQuaSH, NgaySH: exam.NgaySH };
    }

    const plain = rows.map(r => ({
      ...r.get({ plain: true }),
      latestKQSH: latestByHv[r.id] ?? null,
    }));

    return { EM: 'ok', EC: 0, DT: plain };
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

// ── Admin update học viên info ────────────────────────────────────────────────
const updateHocVienInfo = async (id, fields) => {
  if (!id || isNaN(Number(id))) {
    return { EM: 'ID học viên không hợp lệ', EC: -1, DT: null };
  }

  try {
    const hocVien = await db.hoc_vien.findByPk(id);
    if (!hocVien) {
      console.warn(`[hocvienService.updateHocVienInfo] hocVienId=${id} not found`);
      return { EM: 'Không tìm thấy học viên', EC: 1, DT: null };
    }

    const allowed = [
      'HoTen', 'SoCCCD', 'NgaySinh', 'GioiTinh',
      'phone', 'email', 'DiaChi', 'loaibangthi', 'GplxDaCo', 'GhiChu',
    ];
    const updates = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates[key] = fields[key] === '' ? null : fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return { EM: 'Không có trường nào được cập nhật', EC: -1, DT: null };
    }

    await hocVien.update(updates);
    console.log(`[hocvienService.updateHocVienInfo] OK hocVienId=${id} fields=${Object.keys(updates).join(',')}`);
    return { EM: 'Cập nhật thành công', EC: 0, DT: hocVien.get({ plain: true }) };
  } catch (e) {
    console.error(`[hocvienService.updateHocVienInfo] hocVienId=${id}`, e.message, e.stack?.split('\n')[1]);
    return { EM: e.message || 'Lỗi server', EC: -1, DT: null };
  }
};

// ── Admin reset password ──────────────────────────────────────────────────────
const adminResetPassword = async (hocVienId, newPassword) => {
  try {
    const hocVien = await db.hoc_vien.findByPk(hocVienId);
    if (!hocVien) return { EM: 'Không tìm thấy học viên', EC: 1, DT: null };
    if (!hocVien.userId) return { EM: 'Học viên chưa có tài khoản', EC: -1, DT: null };

    const user = await db.user.findByPk(hocVien.userId);
    if (!user) return { EM: 'Tài khoản không tồn tại', EC: -1, DT: null };

    const hashed = hashUserPassword(newPassword);
    await user.update({ password: hashed });
    console.log(`[hocvienService.adminResetPassword] OK hocVienId=${hocVienId} userId=${user.id}`);
    return { EM: 'Đặt lại mật khẩu thành công', EC: 0, DT: null };
  } catch (e) {
    console.error('[hocvienService.adminResetPassword]', e.message);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

/**
 * CSĐT returns maKhoaHoc (e.g. 52001K25B0114) which may not exist in local `khoahoc`.
 * FK hoc_vien.IDKhoaHoc → khoahoc.IDKhoaHoc — only set when the row exists.
 */
const resolveIdKhoaHocForFk = async (maKhoaHoc, transaction) => {
  const id = maKhoaHoc != null ? String(maKhoaHoc).trim() : '';
  if (!id) return null;
  const row = await db.khoahoc.findByPk(id, { transaction });
  return row ? id : null;
};

// ── Import học viên từ CCCD qua Training API ─────────────────────────────────
const importFromCccd = async (cccd, upstreamDT) => {
  const t = await db.sequelize.transaction();
  try {
    const hv = upstreamDT.hocVien || {};
    const hoTen = hv.hoTen || `HV_${cccd}`;
    const ngaySinh = hv.ngaySinh ? hv.ngaySinh.split('T')[0] : null;
    const diaChi = hv.diaChi || null;
    const hangDaoTao = hv.hangDaoTao || null;
    const maKhoaHocFromApi = hv.maKhoaHoc || null;

    const idKhoaHocFk = await resolveIdKhoaHocForFk(maKhoaHocFromApi, t);

    const email = `${cccd}@drivehub.local`;
    const hashed = hashUserPassword(cccd);

    const existingUser = await db.user.findOne({ where: { email }, transaction: t });
    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      user = await db.user.create({
        email, password: hashed, username: hoTen,
        phone: null, address: diaChi,
        groupId: HOC_VIEN_GROUP_ID, active: 1, thisinhId: null,
      }, { transaction: t });
    }

    const existingHv = await db.hoc_vien.findOne({ where: { SoCCCD: cccd }, transaction: t });
    let hocVien;
    if (existingHv) {
      const updatePayload = {
        HoTen: hoTen,
        NgaySinh: ngaySinh,
        DiaChi: diaChi,
        loaibangthi: hangDaoTao,
        userId: user.id,
      };
      if (idKhoaHocFk !== null) {
        updatePayload.IDKhoaHoc = idKhoaHocFk;
      }
      await existingHv.update(updatePayload, { transaction: t });
      hocVien = existingHv;
    } else {
      hocVien = await db.hoc_vien.create({
        HoTen: hoTen,
        NgaySinh: ngaySinh,
        GioiTinh: null,
        SoCCCD: cccd,
        phone: null, email: null,
        DiaChi: diaChi,
        loaibangthi: hangDaoTao,
        IDKhoaHoc: idKhoaHocFk,
        userId: user.id,
        status: 'registered',
      }, { transaction: t });
    }

    await t.commit();
    return { ok: true, hocVienId: hocVien.id, userId: user.id, hoTen, created: !existingHv };
  } catch (e) {
    await t.rollback();
    console.error(`[hocvienService.importFromCccd] cccd=${cccd}`, e.message);
    return { ok: false, error: e.message };
  }
};

// ── Student portal: update own email ─────────────────────────────────────────
const updateOwnProfile = async (userId, fields) => {
  try {
    const hocVien = await db.hoc_vien.findOne({ where: { userId } });
    if (!hocVien) return { EM: 'Không tìm thấy hồ sơ học viên', EC: 1, DT: null };

    const updates = {};
    if (fields.email !== undefined) updates.email = fields.email || null;

    if (Object.keys(updates).length === 0) {
      return { EM: 'Không có thay đổi', EC: 0, DT: null };
    }

    await hocVien.update(updates);
    return { EM: 'Cập nhật thành công', EC: 0, DT: hocVien.get({ plain: true }) };
  } catch (e) {
    console.error('[hocvienService.updateOwnProfile]', e.message);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

// ── Student avatar upload ─────────────────────────────────────────────────────
const updateAvatar = async (userId, avatarUrl) => {
  try {
    const hocVien = await db.hoc_vien.findOne({ where: { userId } });
    if (!hocVien) return { EM: 'Không tìm thấy hồ sơ học viên', EC: 1, DT: null };
    await hocVien.update({ avatarUrl });
    return { EM: 'Cập nhật ảnh đại diện thành công', EC: 0, DT: { avatarUrl } };
  } catch (e) {
    console.error('[hocvienService.updateAvatar]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

export default { registerStudent, listByKhoaHoc, deleteHocVien, getPortalData, updateAvatar, updateHocVienInfo, adminResetPassword, importFromCccd, updateOwnProfile };
