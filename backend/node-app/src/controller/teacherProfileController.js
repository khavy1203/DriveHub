import db from '../models/index.js';
import { Op } from 'sequelize';

// ── Public endpoint ─────────────────────────────────────────────────────────

const getPublicTeachers = async (req, res) => {
  try {
    const teachers = await db.user.findAll({
      where: { groupId: 3 },
      attributes: ['id', 'username'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });

    if (teachers.length === 0) {
      return res.status(200).json({ EM: 'ok', EC: 0, DT: [] });
    }

    const teacherIds = teachers.map(t => t.id);

    const [assignmentStats, ratingStats] = await Promise.all([
      db.student_assignment.findAll({
        where: {
          teacherId: { [Op.in]: teacherIds },
          status: { [Op.in]: ['learning', 'completed'] },
        },
        attributes: [
          'teacherId', 'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt'],
        ],
        group: ['teacherId', 'status'],
        raw: true,
      }),
      db.teacher_rating.findAll({
        where: { teacherUserId: { [Op.in]: teacherIds } },
        attributes: [
          'teacherUserId',
          [db.sequelize.fn('AVG', db.sequelize.col('stars')), 'avgStars'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings'],
        ],
        group: ['teacherUserId'],
        raw: true,
      }),
    ]);

    const statMap = {};
    for (const row of assignmentStats) {
      if (!statMap[row.teacherId]) statMap[row.teacherId] = { activeStudents: 0, completedStudents: 0 };
      if (row.status === 'learning') statMap[row.teacherId].activeStudents = parseInt(row.cnt);
      if (row.status === 'completed') statMap[row.teacherId].completedStudents = parseInt(row.cnt);
    }

    const ratingMap = {};
    for (const r of ratingStats) {
      ratingMap[r.teacherUserId] = {
        avgStars: parseFloat(r.avgStars).toFixed(1),
        totalRatings: parseInt(r.totalRatings),
      };
    }

    // No contact info (phone/email/address) returned
    const data = teachers.map(t => {
      const plain = t.get({ plain: true });
      return {
        id: plain.id,
        username: plain.username,
        profile: plain.teacherProfile || null,
        activeStudents: statMap[plain.id]?.activeStudents ?? 0,
        completedStudents: statMap[plain.id]?.completedStudents ?? 0,
        avgStars: ratingMap[plain.id]?.avgStars ?? '0.0',
        totalRatings: ratingMap[plain.id]?.totalRatings ?? 0,
      };
    });

    return res.status(200).json({ EM: 'ok', EC: 0, DT: data });
  } catch (e) {
    console.error('[teacherProfileController.getPublicTeachers]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: [] });
  }
};

const getPublicTeacherDetail = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const teacher = await db.user.findOne({
      where: { id: teacherId, groupId: 3 },
      attributes: ['id', 'username'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });

    if (!teacher) {
      return res.status(404).json({ EM: 'Không tìm thấy giáo viên', EC: -1, DT: null });
    }

    const [assignmentStats, ratingStats] = await Promise.all([
      db.student_assignment.findAll({
        where: {
          teacherId,
          status: { [Op.in]: ['learning', 'completed'] },
        },
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt'],
        ],
        group: ['status'],
        raw: true,
      }),
      db.teacher_rating.findAll({
        where: { teacherUserId: teacherId },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('stars')), 'avgStars'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings'],
        ],
        raw: true,
      }),
    ]);

    let activeStudents = 0;
    let completedStudents = 0;
    for (const row of assignmentStats) {
      if (row.status === 'learning') activeStudents = parseInt(row.cnt);
      if (row.status === 'completed') completedStudents = parseInt(row.cnt);
    }

    const rating = ratingStats[0] || {};
    const plain = teacher.get({ plain: true });

    const data = {
      id: plain.id,
      username: plain.username,
      profile: plain.teacherProfile || null,
      activeStudents,
      completedStudents,
      avgStars: rating.avgStars ? parseFloat(rating.avgStars).toFixed(1) : '0.0',
      totalRatings: rating.totalRatings ? parseInt(rating.totalRatings) : 0,
    };

    return res.status(200).json({ EM: 'ok', EC: 0, DT: data });
  } catch (e) {
    console.error('[teacherProfileController.getPublicTeacherDetail]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

// ── Authenticated endpoints ──────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const profile = await db.teacher_profile.findOne({ where: { userId } });
    return res.status(200).json({ EM: 'ok', EC: 0, DT: profile ? profile.get({ plain: true }) : null });
  } catch (e) {
    console.error('[teacherProfileController.getProfile]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

const upsertProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { bio, licenseTypes, locationName, yearsExp, isActive, avatarUrl } = req.body;

    let profile = await db.teacher_profile.findOne({ where: { userId } });
    if (profile) {
      await profile.update({
        bio: bio ?? profile.bio,
        licenseTypes: licenseTypes ?? profile.licenseTypes,
        locationName: locationName ?? profile.locationName,
        yearsExp: yearsExp !== undefined ? parseInt(yearsExp) || null : profile.yearsExp,
        isActive: isActive !== undefined ? parseInt(isActive) : profile.isActive,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl || null) : profile.avatarUrl,
      });
    } else {
      profile = await db.teacher_profile.create({
        userId,
        bio: bio || null,
        licenseTypes: licenseTypes || null,
        locationName: locationName || null,
        yearsExp: yearsExp ? parseInt(yearsExp) : null,
        isActive: isActive !== undefined ? parseInt(isActive) : 1,
        avatarUrl: avatarUrl || null,
      });
    }

    return res.status(200).json({ EM: 'Cập nhật thành công', EC: 0, DT: profile.get({ plain: true }) });
  } catch (e) {
    console.error('[teacherProfileController.upsertProfile]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ EM: 'Không có file được upload', EC: -1, DT: null });
    }

    const userId = parseInt(req.params.userId);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/uploads/teacher-avatars/${req.file.filename}`;

    // Auto-save avatarUrl to database
    let profile = await db.teacher_profile.findOne({ where: { userId } });
    if (profile) {
      await profile.update({ avatarUrl: url });
    } else {
      profile = await db.teacher_profile.create({ userId, avatarUrl: url });
    }

    return res.status(200).json({ EM: 'Upload thành công', EC: 0, DT: { url } });
  } catch (e) {
    console.error('[teacherProfileController.uploadAvatar]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

export default { getPublicTeachers, getPublicTeacherDetail, getProfile, upsertProfile, uploadAvatar };
