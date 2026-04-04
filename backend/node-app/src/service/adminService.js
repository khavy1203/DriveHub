import crypto from 'crypto';
import db from '../models/index.js';
import { hashUserPassword, checkEmail } from './loginRegisterService.js';
import mailService from './mailService.js';

const ADMIN_GROUP_ID = 2;
const SUPPER_TEACHER_GROUP_ID = 6;
const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildSetupLink = (token) => {
  const base = process.env.FRONTEND_URL || 'https://localhost:3000';
  return `${base}/#/setup-password?token=${token}`;
};

export const getAllAdmins = async () => {
  const admins = await db.user.findAll({
    where: { groupId: ADMIN_GROUP_ID },
    attributes: ['id', 'email', 'username', 'phone', 'address', 'active'],
    include: [
      {
        model: db.admin_server_config,
        as: 'serverConfig',
        attributes: ['apiBaseUrl', 'lastTestStatus', 'lastTestedAt'],
        required: false,
      },
    ],
    order: [['id', 'ASC']],
  });

  return Promise.all(admins.map(async (a) => {
    const plain = a.get({ plain: true });
    const supperTeacherCount = await db.user.count({
      where: { groupId: SUPPER_TEACHER_GROUP_ID, adminId: a.id },
    });
    return { ...plain, supperTeacherCount };
  }));
};

export const getAdminById = async (adminId) => {
  const admin = await db.user.findOne({
    where: { id: adminId, groupId: ADMIN_GROUP_ID },
    attributes: ['id', 'email', 'username', 'phone', 'address', 'active'],
    include: [
      {
        model: db.admin_server_config,
        as: 'serverConfig',
        attributes: ['apiBaseUrl', 'lastTestStatus', 'lastTestedAt', 'lastTestMessage'],
        required: false,
      },
      {
        model: db.user,
        as: 'managedSupperTeachers',
        where: { groupId: SUPPER_TEACHER_GROUP_ID },
        attributes: ['id', 'username', 'email', 'phone', 'active'],
        required: false,
      },
    ],
  });
  if (!admin) throw Object.assign(new Error('Không tìm thấy Admin'), { code: 'NOT_FOUND' });
  return admin.get({ plain: true });
};

export const createAdmin = async ({ email, username, password, phone, address }) => {
  if (!email || !username) throw Object.assign(new Error('Email và tên không được để trống'), { code: 'VALIDATION' });

  const emailExists = await checkEmail(email);
  if (emailExists) throw Object.assign(new Error('Email đã tồn tại trong hệ thống'), { code: 'DUPLICATE_EMAIL' });

  const setupToken = crypto.randomBytes(32).toString('hex');
  const setupTokenExpiry = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
  const hashedPw = password
    ? hashUserPassword(password)
    : hashUserPassword(crypto.randomBytes(16).toString('hex'));

  const created = await db.user.create({
    email,
    username,
    password: hashedPw,
    phone: phone || null,
    address: address || null,
    groupId: ADMIN_GROUP_ID,
    setupToken,
    setupTokenExpiry,
    active: 1,
  });

  mailService.sendSetupEmail({
    toEmail: email,
    hoTen: username,
    setupLink: buildSetupLink(setupToken),
    role: 'quản trị viên',
  }).catch(err => console.error('[adminService] Gửi email lỗi:', err?.message));

  return { id: created.id, email: created.email, username: created.username };
};

export const updateAdmin = async (adminId, { username, password, phone, address }) => {
  const admin = await db.user.findOne({ where: { id: adminId, groupId: ADMIN_GROUP_ID } });
  if (!admin) throw Object.assign(new Error('Không tìm thấy Admin'), { code: 'NOT_FOUND' });

  const updates = {};
  if (username) updates.username = username;
  if (phone !== undefined) updates.phone = phone || null;
  if (address !== undefined) updates.address = address || null;
  if (password) updates.password = hashUserPassword(password);

  await admin.update(updates);
  return { id: admin.id };
};

export const toggleAdminActive = async (adminId) => {
  const admin = await db.user.findOne({ where: { id: adminId, groupId: ADMIN_GROUP_ID } });
  if (!admin) throw Object.assign(new Error('Không tìm thấy Admin'), { code: 'NOT_FOUND' });

  const newActive = admin.active ? 0 : 1;
  const { Op } = db.Sequelize;
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Toggle the Admin
    await admin.update({ active: newActive }, { transaction });

    // 2. Find all SupperTeachers under this Admin
    const stIds = await db.user.findAll({
      where: { adminId, groupId: SUPPER_TEACHER_GROUP_ID },
      attributes: ['id'],
      raw: true,
      transaction,
    }).then(rows => rows.map(r => r.id));

    if (stIds.length > 0) {
      // 3. Toggle SupperTeachers
      await db.user.update({ active: newActive }, {
        where: { id: { [Op.in]: stIds } },
        transaction,
      });

      // 4. Toggle Teachers (GiaoVien) under those STs
      await db.user.update({ active: newActive }, {
        where: { superTeacherId: { [Op.in]: stIds }, groupId: 3 },
        transaction,
      });

      // 5. Toggle student accounts (HocVien) linked via hoc_vien.superTeacherId
      const hvRows = await db.hoc_vien.findAll({
        where: { superTeacherId: { [Op.in]: stIds }, userId: { [Op.ne]: null } },
        attributes: ['userId'],
        raw: true,
        transaction,
      });
      const studentUserIds = hvRows.map(r => r.userId).filter(Boolean);
      if (studentUserIds.length > 0) {
        await db.user.update({ active: newActive }, {
          where: { id: { [Op.in]: studentUserIds } },
          transaction,
        });
      }
    }

    await transaction.commit();
    return { id: admin.id, active: newActive };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const deleteAdmin = async (adminId) => {
  const admin = await db.user.findOne({ where: { id: adminId, groupId: ADMIN_GROUP_ID } });
  if (!admin) throw Object.assign(new Error('Không tìm thấy Admin'), { code: 'NOT_FOUND' });

  // Detach all SupperTeachers under this admin before deleting
  await db.user.update({ adminId: null }, { where: { adminId, groupId: SUPPER_TEACHER_GROUP_ID } });
  await admin.destroy();
};

/**
 * Assign a SupperTeacher to an Admin unit.
 */
export const assignSupperTeacher = async (adminId, supperTeacherId) => {
  const admin = await db.user.findOne({ where: { id: adminId, groupId: ADMIN_GROUP_ID } });
  if (!admin) throw Object.assign(new Error('Không tìm thấy Admin'), { code: 'NOT_FOUND' });

  const st = await db.user.findOne({ where: { id: supperTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('Không tìm thấy SupperTeacher'), { code: 'NOT_FOUND' });

  await st.update({ adminId });
  return { supperTeacherId, adminId };
};

/**
 * Remove a SupperTeacher from their Admin unit.
 */
export const detachSupperTeacher = async (supperTeacherId) => {
  const st = await db.user.findOne({ where: { id: supperTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('Không tìm thấy SupperTeacher'), { code: 'NOT_FOUND' });
  await st.update({ adminId: null });
};
