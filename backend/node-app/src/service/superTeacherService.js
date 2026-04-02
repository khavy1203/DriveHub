import crypto from 'crypto';
import db from '../models/index.js';
import { hashUserPassword, checkEmail } from './loginRegisterService.js';
import mailService from './mailService.js';

const TEACHER_GROUP_ID = 3;
const SUPPER_TEACHER_GROUP_ID = 6;
const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildSetupLink = (token) => {
  const base = process.env.FRONTEND_URL || 'https://localhost:3000';
  return `${base}/#/setup-password?token=${token}`;
};

// Verify teacher belongs to this superTeacher (or is the superTeacher themselves)
const assertOwnership = async (superTeacherId, teacherId) => {
  if (teacherId === superTeacherId) {
    const self = await db.user.findOne({ where: { id: superTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
    if (!self) throw Object.assign(new Error('Giáo viên không thuộc quyền quản lý của bạn'), { code: 'FORBIDDEN' });
    return self;
  }
  const teacher = await db.user.findOne({
    where: { id: teacherId, groupId: TEACHER_GROUP_ID, superTeacherId },
  });
  if (!teacher) throw Object.assign(new Error('Giáo viên không thuộc quyền quản lý của bạn'), { code: 'FORBIDDEN' });
  return teacher;
};

export const getMyTeachers = async (superTeacherId) => {
  const assistants = await db.user.findAll({
    where: { groupId: TEACHER_GROUP_ID, superTeacherId },
    attributes: ['id', 'email', 'username', 'address', 'phone', 'active', 'superTeacherId'],
    include: [
      { model: db.teacher_profile, as: 'teacherProfile', attributes: ['bio', 'licenseTypes', 'locationName', 'yearsExp', 'avatarUrl', 'isActive'], required: false },
    ],
    order: [['id', 'ASC']],
  });
  return assistants.map(t => t.get({ plain: true }));
};

export const createTeacher = async (superTeacherId, data) => {
  const { email, username, password, phone, address } = data;
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
    groupId: TEACHER_GROUP_ID,
    superTeacherId,
    setupToken,
    setupTokenExpiry,
    active: 1,
  });

  mailService.sendSetupEmail({
    toEmail: email,
    hoTen: username,
    setupLink: buildSetupLink(setupToken),
    role: 'giáo viên',
  }).catch(err => console.error('[superTeacherService] Gửi email lỗi:', err.message));

  const { password: _, setupToken: __, setupTokenExpiry: ___, ...safe } = created.get({ plain: true });
  return safe;
};

export const updateTeacher = async (superTeacherId, teacherId, data) => {
  const teacher = await assertOwnership(superTeacherId, teacherId);
  const { username, phone, address, active } = data;
  const updates = {};
  if (username !== undefined) updates.username = username;
  if (phone !== undefined) updates.phone = phone || null;
  if (address !== undefined) updates.address = address || null;
  if (active !== undefined) updates.active = active;

  await teacher.update(updates);
  const { password: _, ...safe } = teacher.get({ plain: true });
  return safe;
};

export const deleteTeacher = async (superTeacherId, teacherId) => {
  const teacher = await assertOwnership(superTeacherId, teacherId);
  await teacher.destroy();
};

export const getMyStudents = async (superTeacherId) => {
  const { Op } = require('sequelize');

  // Get all teachers in team + the SuperTeacher themselves
  const teachers = await db.user.findAll({
    where: { groupId: TEACHER_GROUP_ID, superTeacherId },
    attributes: ['id', 'username'],
  });
  const self = await db.user.findByPk(superTeacherId, { attributes: ['id', 'username'] });
  const allTeachers = self ? [self, ...teachers] : teachers;
  const teacherIds = allTeachers.map(t => t.id);
  const teacherMap = Object.fromEntries(allTeachers.map(t => [t.id, t.username]));

  // 1) Students with a primary assignment to a teacher in this team
  const assigned = teacherIds.length > 0
    ? await db.student_assignment.findAll({
        where: { teacherId: { [Op.in]: teacherIds }, role: 'primary' },
        include: [{
          model: db.hoc_vien,
          as: 'hocVien',
          attributes: ['id', 'HoTen', 'SoCCCD', 'NgaySinh', 'GioiTinh', 'phone', 'DiaChi', 'GhiChu'],
          required: false,
          include: [{
            model: db.training_snapshot,
            as: 'trainingSnapshot',
            attributes: ['courseProgressPct', 'syncStatus', 'lastSyncAt'],
            required: false,
          }],
        }],
        order: [['createdAt', 'DESC']],
      })
    : [];

  const assignedResult = assigned.map(a => {
    const plain = a.get({ plain: true });
    return { ...plain, teacherName: teacherMap[plain.teacherId] || null };
  });

  // 2) Unassigned students owned by this SupperTeacher (superTeacherId set, no assignment yet)
  const assignedHocVienIds = assigned
    .map(a => a.hocVienId)
    .filter(Boolean);

  const unassignedWhere = { superTeacherId };
  if (assignedHocVienIds.length > 0) {
    unassignedWhere.id = { [Op.notIn]: assignedHocVienIds };
  }

  const unassignedHv = await db.hoc_vien.findAll({
    where: unassignedWhere,
    attributes: ['id', 'HoTen', 'SoCCCD', 'NgaySinh', 'GioiTinh', 'phone', 'DiaChi', 'GhiChu'],
    include: [{
      model: db.training_snapshot,
      as: 'trainingSnapshot',
      attributes: ['courseProgressPct', 'syncStatus', 'lastSyncAt'],
      required: false,
    }],
    order: [['createdAt', 'DESC']],
  });

  const unassignedResult = unassignedHv.map(hv => ({
    id: null,
    hocVienId: hv.id,
    teacherId: null,
    courseId: null,
    status: 'waiting',
    progressPercent: 0,
    datHoursCompleted: 0,
    notes: null,
    teacherName: null,
    hocVien: hv.get({ plain: true }),
  }));

  // Unassigned (newly imported) first, then assigned — both sorted by newest first
  return [...unassignedResult, ...assignedResult];
};

export const assignStudentToTeacher = async (superTeacherId, hocVienId, teacherId) => {
  // Verify target teacher is in this team
  await assertOwnership(superTeacherId, teacherId);

  // Find existing primary assignment for this student
  const existing = await db.student_assignment.findOne({
    where: { hocVienId, role: 'primary' },
  });
  if (existing) {
    await existing.update({ teacherId });
  } else {
    await db.student_assignment.create({ hocVienId, teacherId, role: 'primary' });
  }

  // Ensure supervisor assignment exists so student can chat with the SuperTeacher
  if (teacherId !== superTeacherId) {
    const supervisorExists = await db.student_assignment.findOne({
      where: { hocVienId, teacherId: superTeacherId, role: 'supervisor' },
    });
    if (!supervisorExists) {
      await db.student_assignment.create({
        hocVienId,
        teacherId: superTeacherId,
        role: 'supervisor',
      });
    }
  }

  const result = await db.student_assignment.findOne({
    where: { hocVienId, role: 'primary' },
  });
  return result.get({ plain: true });
};

export const dropStudent = async (superTeacherId, hocVienId, isAdmin = false) => {
  const hv = await db.hoc_vien.findByPk(hocVienId);
  if (!hv) {
    const err = new Error('Học viên không tồn tại');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Verify ownership (SupperAdmin bypasses)
  const assignment = await db.student_assignment.findOne({ where: { hocVienId, role: 'primary' } });
  if (assignment) {
    if (!isAdmin) await assertOwnership(superTeacherId, assignment.teacherId);
    // Remove all assignments for this student (primary + supervisor)
    await db.student_assignment.destroy({ where: { hocVienId } });
  } else if (!isAdmin && hv.superTeacherId !== superTeacherId) {
    const err = new Error('Học viên không thuộc đội của bạn');
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Clear superTeacher ownership and mark as dropped
  await hv.update({ superTeacherId: null, status: 'dropped' });

  // Clean up training snapshot
  await db.training_snapshot.destroy({ where: { hocVienId } });

  return { hocVienId };
};

/**
 * Update a pending-sync student's personal info.
 * Blocked once the student has a trainingSnapshot (data is owned by sync).
 */
export const updateStudentInfo = async (superTeacherId, hocVienId, data) => {
  const student = await db.hoc_vien.findOne({
    where: { id: hocVienId, superTeacherId },
    include: [{ model: db.training_snapshot, as: 'trainingSnapshot', required: false }],
  });
  if (!student) {
    const err = new Error('Không tìm thấy học viên hoặc không có quyền');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (student.trainingSnapshot) {
    const err = new Error('Học viên đã đồng bộ, không thể chỉnh sửa thông tin cá nhân');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const ALLOWED = ['HoTen', 'NgaySinh', 'GioiTinh', 'phone', 'DiaChi', 'GhiChu', 'SoCCCD'];
  const updates = {};
  for (const key of ALLOWED) {
    if (data[key] !== undefined) updates[key] = data[key] || null;
  }
  if (Object.keys(updates).length > 0) await student.update(updates);
  return student.get({ plain: true });
};

// ── SupperAdmin helpers ──────────────────────────────────────────────────────

export const getAllSupperTeachers = async (adminId = null) => {
  const where = { groupId: SUPPER_TEACHER_GROUP_ID };
  if (adminId) where.adminId = adminId;

  const list = await db.user.findAll({
    where,
    attributes: ['id', 'email', 'username', 'phone', 'address', 'active', 'adminId'],
    order: [['id', 'ASC']],
  });

  return Promise.all(list.map(async (st) => {
    const plain = st.get({ plain: true });
    const teacherCount = await db.user.count({ where: { groupId: TEACHER_GROUP_ID, superTeacherId: plain.id } });
    return { ...plain, teacherCount };
  }));
};

export const createSupperTeacher = async (data, adminId = null) => {
  const { email, username, password, phone, address } = data;
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
    groupId: SUPPER_TEACHER_GROUP_ID,
    superTeacherId: null,
    adminId: adminId || null,
    setupToken,
    setupTokenExpiry,
    active: 1,
  });

  mailService.sendSetupEmail({
    toEmail: email,
    hoTen: username,
    setupLink: buildSetupLink(setupToken),
    role: 'supper teacher',
  }).catch(err => console.error('[superTeacherService] Gửi email lỗi:', err.message));

  const { password: _, setupToken: __, setupTokenExpiry: ___, ...safe } = created.get({ plain: true });
  return safe;
};

export const updateSupperTeacher = async (id, data) => {
  const st = await db.user.findOne({ where: { id, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('Không tìm thấy SupperTeacher'), { code: 'NOT_FOUND' });

  const { username, phone, address, active } = data;
  const updates = {};
  if (username !== undefined) updates.username = username;
  if (phone !== undefined) updates.phone = phone || null;
  if (address !== undefined) updates.address = address || null;
  if (active !== undefined) updates.active = active;

  await st.update(updates);
  const { password: _, ...safe } = st.get({ plain: true });
  return safe;
};

export const deleteSupperTeacher = async (id) => {
  const st = await db.user.findOne({ where: { id, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('Không tìm thấy SupperTeacher'), { code: 'NOT_FOUND' });
  // managedTeachers are cascade-deleted by DB constraint
  await st.destroy();
};

export const getTeachersPreviewForDelete = async (id) => {
  return db.user.findAll({
    where: { groupId: TEACHER_GROUP_ID, superTeacherId: id },
    attributes: ['id', 'email', 'username'],
  }).then(rows => rows.map(r => r.get({ plain: true })));
};

export const createTeacherByAdmin = async (superTeacherId, data) => {
  if (!superTeacherId) throw Object.assign(new Error('Phải chỉ định SupperTeacher quản lý'), { code: 'VALIDATION' });
  const st = await db.user.findOne({ where: { id: superTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('SupperTeacher không tồn tại'), { code: 'NOT_FOUND' });
  return createTeacher(superTeacherId, data);
};

export const reassignTeacher = async (teacherId, newSuperTeacherId) => {
  const teacher = await db.user.findOne({ where: { id: teacherId, groupId: TEACHER_GROUP_ID } });
  if (!teacher) throw Object.assign(new Error('Không tìm thấy giáo viên'), { code: 'NOT_FOUND' });
  const st = await db.user.findOne({ where: { id: newSuperTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('SupperTeacher không tồn tại'), { code: 'NOT_FOUND' });
  await teacher.update({ superTeacherId: newSuperTeacherId });
  const { password: _, ...safe } = teacher.get({ plain: true });
  return safe;
};

/**
 * Import students by CCCD list and assign them to this SupperTeacher.
 * Reuses the training sync service, then stamps superTeacherId on each hoc_vien.
 */
export const importStudentsByCccd = async (superTeacherId, cccdList) => {
  const { importAndSyncByCccdList } = require('../service/trainingSyncService.js');

  const st = await db.user.findByPk(superTeacherId, { attributes: ['adminId'] });
  const adminId = st?.adminId ?? null;

  const result = await importAndSyncByCccdList(cccdList, adminId);
  if (result.error) return result;

  // Stamp superTeacherId on all successfully imported/existing hoc_vien
  const successIds = result.results
    .filter(r => r.ok && r.hocVienId)
    .map(r => r.hocVienId);

  if (successIds.length > 0) {
    const { Op } = require('sequelize');

    // Pull all students to this ST — clear old assignments and fully reassign
    await db.student_assignment.destroy({ where: { hocVienId: { [Op.in]: successIds } } });
    await db.hoc_vien.update(
      { superTeacherId, adminId: adminId || null },
      { where: { id: { [Op.in]: successIds } } },
    );

    // Create fresh primary assignments to this ST
    await db.student_assignment.bulkCreate(
      successIds.map(hocVienId => ({ hocVienId, teacherId: superTeacherId })),
    );

    // Sync assignment status from training snapshot
    const snapshots = await db.training_snapshot.findAll({
      where: { hocVienId: { [Op.in]: successIds } },
      attributes: ['hocVienId', 'courseProgressPct'],
      raw: true,
    });
    for (const snap of snapshots) {
      if (snap.courseProgressPct > 0) {
        const updates = { progressPercent: snap.courseProgressPct };
        if (snap.courseProgressPct >= 100) {
          updates.status = 'completed';
          await db.hoc_vien.update(
            { status: 'dat_completed' },
            { where: { id: snap.hocVienId } },
          );
        } else {
          updates.status = 'learning';
        }
        await db.student_assignment.update(updates, {
          where: { hocVienId: snap.hocVienId, role: 'primary' },
        });
      }
    }
  }

  return result;
};

/**
 * Admin assigns a student from their pool to a SupperTeacher.
 * Student must have adminId = adminId and superTeacherId = null.
 * ST must belong to the same admin.
 */
export const assignStudentToST = async (adminId, hocVienId, stId) => {
  const { Op } = require('sequelize');
  // Accept students explicitly linked to this admin OR legacy students with no admin link yet
  const hv = await db.hoc_vien.findOne({
    where: {
      id: hocVienId,
      superTeacherId: null,
      [Op.or]: [{ adminId }, { adminId: null }],
    },
  });
  if (!hv) {
    throw Object.assign(
      new Error('Học viên không tồn tại, đã được gán SupperTeacher, hoặc không thuộc phạm vi của bạn'),
      { code: 'FORBIDDEN' },
    );
  }

  // Stamp adminId if not set yet (backward compat for legacy students)
  if (!hv.adminId) {
    await hv.update({ adminId });
  }

  const st = await db.user.findOne({
    where: { id: stId, groupId: SUPPER_TEACHER_GROUP_ID, adminId },
  });
  if (!st) {
    throw Object.assign(
      new Error('SupperTeacher không thuộc đơn vị của bạn'),
      { code: 'FORBIDDEN' },
    );
  }

  await hv.update({ superTeacherId: stId });

  const existing = await db.student_assignment.findOne({
    where: { hocVienId, role: 'primary' },
  });
  if (!existing) {
    await db.student_assignment.create({ hocVienId, teacherId: stId, role: 'primary' });
  } else {
    await existing.update({ teacherId: stId });
  }

  return { hocVienId, stId };
};

export const getRatingsOverview = async (superTeacherId) => {
  const { Op } = require('sequelize');

  // Team teachers + the SuperTeacher themselves
  const teamTeachers = await db.user.findAll({
    where: { groupId: TEACHER_GROUP_ID, superTeacherId },
    attributes: ['id', 'username'],
    include: [
      { model: db.teacher_profile, as: 'teacherProfile', attributes: ['avatarUrl', 'licenseTypes', 'locationName'], required: false },
    ],
  });
  const self = await db.user.findByPk(superTeacherId, {
    attributes: ['id', 'username'],
    include: [
      { model: db.teacher_profile, as: 'teacherProfile', attributes: ['avatarUrl', 'licenseTypes', 'locationName'], required: false },
    ],
  });
  const teachers = self ? [self, ...teamTeachers] : teamTeachers;
  const teacherIds = teachers.map(t => t.id);
  if (teacherIds.length === 0) {
    return { avgStars: '0.0', totalReviews: 0, completedRatio: '0/0', teachers: [] };
  }

  const [ratings, assignmentStats] = await Promise.all([
    db.teacher_rating.findAll({
      where: { teacherUserId: { [Op.in]: teacherIds } },
      attributes: ['id', 'teacherUserId', 'stars', 'comment', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [{
        model: db.hoc_vien, as: 'hocVien', attributes: ['HoTen'],
        required: false,
        include: [{ model: db.khoahoc, as: 'khoahoc', attributes: ['TenKhoaHoc'], required: false }],
      }],
    }),
    db.student_assignment.findAll({
      where: { teacherId: { [Op.in]: teacherIds }, role: 'primary' },
      attributes: ['teacherId', 'status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt']],
      group: ['teacherId', 'status'],
      raw: true,
    }),
  ]);

  const ratingsByTeacher = {};
  let totalStars = 0;
  for (const r of ratings) {
    const plain = r.get({ plain: true });
    if (!ratingsByTeacher[plain.teacherUserId]) ratingsByTeacher[plain.teacherUserId] = [];
    ratingsByTeacher[plain.teacherUserId].push(plain);
    totalStars += plain.stars;
  }

  const statMap = {};
  let totalCompleted = 0;
  let totalStudents = 0;
  for (const row of assignmentStats) {
    if (!statMap[row.teacherId]) statMap[row.teacherId] = { active: 0, completed: 0 };
    if (row.status === 'learning' || row.status === 'waiting') statMap[row.teacherId].active += parseInt(row.cnt);
    if (row.status === 'completed') statMap[row.teacherId].completed += parseInt(row.cnt);
    totalStudents += parseInt(row.cnt);
    if (row.status === 'completed') totalCompleted += parseInt(row.cnt);
  }

  const avgStars = ratings.length > 0 ? (totalStars / ratings.length).toFixed(1) : '0.0';

  const teacherCards = teachers.map(t => {
    const plain = t.get({ plain: true });
    const tRatings = ratingsByTeacher[plain.id] || [];
    const tAvg = tRatings.length > 0
      ? (tRatings.reduce((s, r) => s + r.stars, 0) / tRatings.length).toFixed(1)
      : '0.0';
    const stats = statMap[plain.id] || { active: 0, completed: 0 };
    return {
      id: plain.id,
      username: plain.username,
      avatarUrl: plain.teacherProfile?.avatarUrl || null,
      licenseTypes: plain.teacherProfile?.licenseTypes || null,
      locationName: plain.teacherProfile?.locationName || null,
      avgStars: tAvg,
      totalRatings: tRatings.length,
      activeStudents: stats.active,
      completedStudents: stats.completed,
      recentReviews: tRatings.map(r => ({
        id: r.id,
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
        studentName: r.hocVien?.HoTen || null,
        courseName: r.hocVien?.khoahoc?.TenKhoaHoc || null,
      })),
    };
  });

  return {
    avgStars,
    totalReviews: ratings.length,
    completedRatio: `${totalCompleted}/${totalStudents}`,
    teachers: teacherCards,
  };
};

/**
 * Promote a teacher to SuperTeacher.
 * - Changes groupId from TEACHER to SUPPER_TEACHER
 * - Removes link to old SuperTeacher
 * - Keeps all student_assignment records (students they teach stay with them)
 * - Transfers those students' superTeacherId on hoc_vien to the new SuperTeacher
 */
export const promoteToSuperTeacher = async (teacherId) => {
  const { Op } = require('sequelize');
  const teacher = await db.user.findOne({ where: { id: teacherId, groupId: TEACHER_GROUP_ID } });
  if (!teacher) throw Object.assign(new Error('Không tìm thấy giáo viên'), { code: 'NOT_FOUND' });

  const oldSuperTeacherId = teacher.superTeacherId;

  // Change role
  await teacher.update({ groupId: SUPPER_TEACHER_GROUP_ID, superTeacherId: null });

  // Transfer students they directly teach: set hoc_vien.superTeacherId to the new SuperTeacher
  const assignments = await db.student_assignment.findAll({
    where: { teacherId, role: 'primary' },
    attributes: ['hocVienId'],
    raw: true,
  });
  const hocVienIds = assignments.map(a => a.hocVienId);
  if (hocVienIds.length > 0) {
    await db.hoc_vien.update(
      { superTeacherId: teacherId },
      { where: { id: { [Op.in]: hocVienIds } } },
    );

    // Remove old supervisor assignments and create new ones pointing to the new SuperTeacher
    if (oldSuperTeacherId) {
      await db.student_assignment.destroy({
        where: { hocVienId: { [Op.in]: hocVienIds }, teacherId: oldSuperTeacherId, role: 'supervisor' },
      });
    }
  }

  const { password: _, ...safe } = teacher.get({ plain: true });
  return safe;
};

/**
 * Demote a SuperTeacher to a regular teacher under a target SuperTeacher.
 * - Changes groupId from SUPPER_TEACHER to TEACHER
 * - Sets superTeacherId to the target SuperTeacher
 * - Keeps all student_assignment records (students they teach stay with them)
 * - Transfers those students' superTeacherId on hoc_vien to the new managing SuperTeacher
 * - Reassigns managed teachers (their old team) to the new SuperTeacher
 */
export const demoteToTeacher = async (superTeacherId, newManagerId) => {
  const { Op } = require('sequelize');
  const st = await db.user.findOne({ where: { id: superTeacherId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!st) throw Object.assign(new Error('Không tìm thấy SupperTeacher'), { code: 'NOT_FOUND' });

  const manager = await db.user.findOne({ where: { id: newManagerId, groupId: SUPPER_TEACHER_GROUP_ID } });
  if (!manager) throw Object.assign(new Error('SupperTeacher tiếp nhận không tồn tại'), { code: 'NOT_FOUND' });
  if (superTeacherId === newManagerId) {
    throw Object.assign(new Error('Không thể hạ cấp cho chính mình'), { code: 'VALIDATION' });
  }

  // Reassign managed teachers to the new manager
  await db.user.update(
    { superTeacherId: newManagerId },
    { where: { groupId: TEACHER_GROUP_ID, superTeacherId } },
  );

  // Transfer students owned by this SuperTeacher to the new manager
  const ownedStudentIds = await db.hoc_vien.findAll({
    where: { superTeacherId },
    attributes: ['id'],
    raw: true,
  });
  const hvIds = ownedStudentIds.map(h => h.id);
  if (hvIds.length > 0) {
    await db.hoc_vien.update(
      { superTeacherId: newManagerId },
      { where: { id: { [Op.in]: hvIds } } },
    );

    // Replace old supervisor assignments with new manager
    await db.student_assignment.destroy({
      where: { hocVienId: { [Op.in]: hvIds }, teacherId: superTeacherId, role: 'supervisor' },
    });

    // Create supervisor assignments for new manager (skip students they already teach directly)
    const newManagerPrimary = await db.student_assignment.findAll({
      where: { hocVienId: { [Op.in]: hvIds }, teacherId: newManagerId, role: 'primary' },
      attributes: ['hocVienId'],
      raw: true,
    });
    const skipIds = new Set(newManagerPrimary.map(a => a.hocVienId));
    const toCreate = hvIds.filter(id => !skipIds.has(id));

    const existingSupervisor = await db.student_assignment.findAll({
      where: { hocVienId: { [Op.in]: toCreate }, teacherId: newManagerId, role: 'supervisor' },
      attributes: ['hocVienId'],
      raw: true,
    });
    const alreadyHas = new Set(existingSupervisor.map(a => a.hocVienId));
    const finalCreate = toCreate.filter(id => !alreadyHas.has(id));

    if (finalCreate.length > 0) {
      await db.student_assignment.bulkCreate(
        finalCreate.map(hocVienId => ({ hocVienId, teacherId: newManagerId, role: 'supervisor' })),
      );
    }
  }

  // Demote: change role and assign to new manager
  await st.update({ groupId: TEACHER_GROUP_ID, superTeacherId: newManagerId });

  const { password: _, ...safe } = st.get({ plain: true });
  return safe;
};

export const getTeachersWithoutSupper = async (adminId = null) => {
  // For Admin: all teachers visible to them are already linked through their STs — none are "unassigned"
  if (adminId) return [];

  return db.user.findAll({
    where: { groupId: TEACHER_GROUP_ID, superTeacherId: null },
    attributes: ['id', 'email', 'username', 'phone', 'active'],
    order: [['id', 'ASC']],
  }).then(rows => rows.map(r => r.get({ plain: true })));
};
