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
    if (!teacherId) return res.status(400).json({ EM: 'Invalid id', EC: -1, DT: null });

    const teacher = await db.user.findOne({
      where: { id: teacherId, groupId: 3 },
      attributes: ['id', 'username'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });
    if (!teacher) return res.status(404).json({ EM: 'Not found', EC: -1, DT: null });

    const [assignmentStats, ratingAgg, ratings] = await Promise.all([
      db.student_assignment.findAll({
        where: { teacherId, status: { [Op.in]: ['learning', 'completed'] } },
        attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt']],
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
      db.teacher_rating.findAll({
        where: { teacherUserId: teacherId },
        attributes: ['id', 'stars', 'comment', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20,
        raw: true,
      }),
    ]);

    let activeStudents = 0;
    let completedStudents = 0;
    for (const row of assignmentStats) {
      if (row.status === 'learning') activeStudents = parseInt(row.cnt);
      if (row.status === 'completed') completedStudents = parseInt(row.cnt);
    }

    const agg = ratingAgg[0] || {};
    const plain = teacher.get({ plain: true });

    return res.status(200).json({
      EM: 'ok',
      EC: 0,
      DT: {
        id: plain.id,
        username: plain.username,
        profile: plain.teacherProfile || null,
        activeStudents,
        completedStudents,
        avgStars: agg.avgStars ? parseFloat(agg.avgStars).toFixed(1) : '0.0',
        totalRatings: agg.totalRatings ? parseInt(agg.totalRatings) : 0,
        reviews: ratings.map(r => ({
          id: r.id,
          stars: r.stars,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (e) {
    console.error('[teacherProfileController.getPublicTeacherDetail]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

// ── Authenticated endpoints ─────────────────────────────────────────────────

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

const getMyFullProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ EM: 'Unauthorized', EC: -1, DT: null });

    const user = await db.user.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'phone', 'address', 'genderId', 'image'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });
    if (!user) return res.status(404).json({ EM: 'User not found', EC: -1, DT: null });

    const plain = user.get({ plain: true });
    const imageBase64 = plain.image ? Buffer.from(plain.image).toString('base64') : null;

    return res.status(200).json({
      EM: 'ok',
      EC: 0,
      DT: {
        id: plain.id,
        username: plain.username,
        email: plain.email,
        phone: plain.phone,
        address: plain.address,
        genderId: plain.genderId,
        imageBase64,
        teacherProfile: plain.teacherProfile || null,
      },
    });
  } catch (e) {
    console.error('[teacherProfileController.getMyFullProfile]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ EM: 'Unauthorized', EC: -1, DT: null });

    const user = await db.user.findByPk(userId);
    if (!user) return res.status(404).json({ EM: 'User not found', EC: -1, DT: null });

    const { username, email, phone, address, genderId, bio, licenseTypes, locationName, yearsExp, avatarUrl } = req.body;

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone || null;
    if (address !== undefined) user.address = address || null;
    if (genderId !== undefined) user.genderId = genderId != null ? parseInt(genderId) : null;

    await user.save();

    let profile = await db.teacher_profile.findOne({ where: { userId } });
    if (profile) {
      if (bio !== undefined) profile.bio = bio || null;
      if (licenseTypes !== undefined) profile.licenseTypes = licenseTypes || null;
      if (locationName !== undefined) profile.locationName = locationName || null;
      if (yearsExp !== undefined) profile.yearsExp = yearsExp != null ? parseInt(yearsExp) : null;
      if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl || null;
      await profile.save();
    } else {
      profile = await db.teacher_profile.create({
        userId,
        bio: bio || null,
        licenseTypes: licenseTypes || null,
        locationName: locationName || null,
        yearsExp: yearsExp != null ? parseInt(yearsExp) : null,
        avatarUrl: avatarUrl || null,
        isActive: 1,
      });
    }

    return res.status(200).json({ EM: 'Cập nhật thành công', EC: 0, DT: { userId } });
  } catch (e) {
    console.error('[teacherProfileController.updateMyProfile]', e);
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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/uploads/teacher-avatars/${req.file.filename}`;
    return res.status(200).json({ EM: 'Upload thành công', EC: 0, DT: { url } });
  } catch (e) {
    console.error('[teacherProfileController.uploadAvatar]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

export default { getPublicTeachers, getPublicTeacherDetail, getProfile, upsertProfile, uploadAvatar, getMyFullProfile, updateMyProfile };
