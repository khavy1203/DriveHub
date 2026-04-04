import db from '../models/index.js';
import { Op } from 'sequelize';

// ── Public endpoint ─────────────────────────────────────────────────────────

const SUPPER_TEACHER_GROUP_ID = 6;
const TEACHER_GROUP_ID = 3;

const getPublicTeachers = async (req, res) => {
  try {
    // Only show SupperTeachers belonging to admins featured on homepage
    const featuredAdminIds = await db.user.findAll({
      where: { groupId: 2, featuredOnHomepage: true },
      attributes: ['id'],
      raw: true,
    }).then(rows => rows.map(r => r.id));

    const stWhere = { groupId: SUPPER_TEACHER_GROUP_ID };
    if (featuredAdminIds.length > 0) {
      stWhere.adminId = { [Op.in]: featuredAdminIds };
    } else {
      // No admin featured → show nothing
      return res.status(200).json({ EM: 'ok', EC: 0, DT: [] });
    }

    // Fetch SupperTeachers with their managed assistant teachers
    const supperTeachers = await db.user.findAll({
      where: stWhere,
      attributes: ['id', 'username'],
      include: [
        { model: db.teacher_profile, as: 'teacherProfile', required: false },
        {
          model: db.user, as: 'managedTeachers',
          attributes: ['id', 'username'],
          required: false,
          include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
        },
      ],
    });

    if (supperTeachers.length === 0) {
      return res.status(200).json({ EM: 'ok', EC: 0, DT: [] });
    }

    // Collect all assistant teacher IDs across all teams
    const allTeacherIds = [];
    for (const st of supperTeachers) {
      for (const t of st.managedTeachers || []) allTeacherIds.push(t.id);
    }

    // Fetch aggregated stats for all assistant teachers
    const [assignmentStats, ratingStats] = await Promise.all([
      allTeacherIds.length > 0
        ? db.student_assignment.findAll({
            where: { teacherId: { [Op.in]: allTeacherIds } },
            attributes: ['teacherId', 'status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt']],
            group: ['teacherId', 'status'],
            raw: true,
          })
        : [],
      allTeacherIds.length > 0
        ? db.teacher_rating.findAll({
            where: { teacherUserId: { [Op.in]: allTeacherIds } },
            attributes: [
              'teacherUserId',
              [db.sequelize.fn('AVG', db.sequelize.col('stars')), 'avgStars'],
              [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings'],
            ],
            group: ['teacherUserId'],
            raw: true,
          })
        : [],
    ]);

    const statMap = {};
    for (const row of assignmentStats) {
      if (!statMap[row.teacherId]) statMap[row.teacherId] = { active: 0, completed: 0 };
      if (row.status === 'learning' || row.status === 'waiting') statMap[row.teacherId].active += parseInt(row.cnt);
      if (row.status === 'completed') statMap[row.teacherId].completed += parseInt(row.cnt);
    }

    const ratingMap = {};
    for (const r of ratingStats) {
      ratingMap[r.teacherUserId] = {
        avgStars: parseFloat(r.avgStars),
        totalRatings: parseInt(r.totalRatings),
      };
    }

    // Aggregate per SupperTeacher
    const data = supperTeachers.map(st => {
      const plain = st.get({ plain: true });
      const assistants = plain.managedTeachers || [];
      let teamActive = 0;
      let teamCompleted = 0;
      let teamTotalStars = 0;
      let teamTotalRatings = 0;

      for (const t of assistants) {
        const s = statMap[t.id] || { active: 0, completed: 0 };
        teamActive += s.active;
        teamCompleted += s.completed;
        const r = ratingMap[t.id];
        if (r) {
          teamTotalStars += r.avgStars * r.totalRatings;
          teamTotalRatings += r.totalRatings;
        }
      }

      const teamAvg = teamTotalRatings > 0 ? (teamTotalStars / teamTotalRatings).toFixed(1) : '0.0';

      return {
        id: plain.id,
        username: plain.username,
        profile: plain.teacherProfile || null,
        assistantCount: assistants.length,
        activeStudents: teamActive,
        completedStudents: teamCompleted,
        avgStars: teamAvg,
        totalRatings: teamTotalRatings,
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
    const id = parseInt(req.params.id);

    // Try SupperTeacher first, then fall back to regular teacher
    const supperTeacher = await db.user.findOne({
      where: { id, groupId: SUPPER_TEACHER_GROUP_ID },
      attributes: ['id', 'username'],
      include: [
        { model: db.teacher_profile, as: 'teacherProfile', required: false },
        {
          model: db.user, as: 'managedTeachers',
          attributes: ['id', 'username'],
          required: false,
          include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
        },
      ],
    });

    if (supperTeacher) {
      const stPlain = supperTeacher.get({ plain: true });
      const assistants = stPlain.managedTeachers || [];
      const assistantIds = assistants.map(a => a.id);

      // Fetch all ratings + assignment stats for assistants
      const [allRatings, assignmentStats] = await Promise.all([
        assistantIds.length > 0
          ? db.teacher_rating.findAll({
              where: { teacherUserId: { [Op.in]: assistantIds } },
              order: [['createdAt', 'DESC']],
              include: [{ model: db.hoc_vien, as: 'hocVien', attributes: ['HoTen'], required: false }],
            })
          : [],
        assistantIds.length > 0
          ? db.student_assignment.findAll({
              where: { teacherId: { [Op.in]: assistantIds } },
              attributes: ['teacherId', 'status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt']],
              group: ['teacherId', 'status'],
              raw: true,
            })
          : [],
      ]);

      const ratingsByTeacher = {};
      for (const r of allRatings) {
        const rp = r.get({ plain: true });
        if (!ratingsByTeacher[rp.teacherUserId]) ratingsByTeacher[rp.teacherUserId] = [];
        ratingsByTeacher[rp.teacherUserId].push(rp);
      }

      const statMap = {};
      for (const row of assignmentStats) {
        if (!statMap[row.teacherId]) statMap[row.teacherId] = { active: 0, completed: 0 };
        if (row.status === 'learning' || row.status === 'waiting') statMap[row.teacherId].active += parseInt(row.cnt);
        if (row.status === 'completed') statMap[row.teacherId].completed += parseInt(row.cnt);
      }

      let teamTotalStars = 0;
      let teamTotalRatings = 0;
      let teamActive = 0;
      let teamCompleted = 0;

      const assistantData = assistants.map(a => {
        const aRatings = ratingsByTeacher[a.id] || [];
        const aStats = statMap[a.id] || { active: 0, completed: 0 };
        const aAvg = aRatings.length > 0
          ? (aRatings.reduce((s, r) => s + r.stars, 0) / aRatings.length).toFixed(1)
          : '0.0';

        teamTotalStars += aRatings.reduce((s, r) => s + r.stars, 0);
        teamTotalRatings += aRatings.length;
        teamActive += aStats.active;
        teamCompleted += aStats.completed;

        return {
          id: a.id,
          username: a.username,
          avatarUrl: a.teacherProfile?.avatarUrl || null,
          licenseTypes: a.teacherProfile?.licenseTypes || null,
          avgStars: aAvg,
          totalRatings: aRatings.length,
          activeStudents: aStats.active,
          completedStudents: aStats.completed,
          reviews: aRatings.slice(0, 3).map(r => ({
            id: r.id,
            stars: r.stars,
            comment: r.comment,
            createdAt: r.createdAt,
            studentName: r.hocVien?.HoTen || null,
          })),
        };
      });

      const teamAvg = teamTotalRatings > 0 ? (teamTotalStars / teamTotalRatings).toFixed(1) : '0.0';

      return res.status(200).json({
        EM: 'ok', EC: 0,
        DT: {
          id: stPlain.id,
          username: stPlain.username,
          profile: stPlain.teacherProfile || null,
          isSupperTeacher: true,
          avgStars: teamAvg,
          totalRatings: teamTotalRatings,
          activeStudents: teamActive,
          completedStudents: teamCompleted,
          assistants: assistantData,
        },
      });
    }

    // Fallback: regular teacher (groupId=3)
    const teacher = await db.user.findOne({
      where: { id, groupId: TEACHER_GROUP_ID },
      attributes: ['id', 'username'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });

    if (!teacher) {
      return res.status(404).json({ EM: 'Không tìm thấy giáo viên', EC: -1, DT: null });
    }

    const [assignmentStats, ratings] = await Promise.all([
      db.student_assignment.findAll({
        where: { teacherId: id },
        attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt']],
        group: ['status'],
        raw: true,
      }),
      db.teacher_rating.findAll({
        where: { teacherUserId: id },
        order: [['createdAt', 'DESC']],
        include: [{ model: db.hoc_vien, as: 'hocVien', attributes: ['HoTen'], required: false }],
      }),
    ]);

    let activeStudents = 0;
    let completedStudents = 0;
    for (const row of assignmentStats) {
      if (row.status === 'learning') activeStudents = parseInt(row.cnt);
      if (row.status === 'completed') completedStudents = parseInt(row.cnt);
    }

    const totalStars = ratings.reduce((s, r) => s + r.stars, 0);
    const plain = teacher.get({ plain: true });

    return res.status(200).json({
      EM: 'ok', EC: 0,
      DT: {
        id: plain.id,
        username: plain.username,
        profile: plain.teacherProfile || null,
        isSupperTeacher: false,
        activeStudents,
        completedStudents,
        avgStars: ratings.length > 0 ? (totalStars / ratings.length).toFixed(1) : '0.0',
        totalRatings: ratings.length,
        reviews: ratings.slice(0, 10).map(r => {
          const rp = r.get({ plain: true });
          return {
            id: rp.id,
            stars: rp.stars,
            comment: rp.comment,
            createdAt: rp.createdAt,
            studentName: rp.hocVien?.HoTen || null,
          };
        }),
      },
    });
  } catch (e) {
    console.error('[teacherProfileController.getPublicTeacherDetail]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

// ── Authenticated endpoints ──────────────────────────────────────────────────

const getMyFullProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.user.findOne({
      where: { id: userId },
      attributes: ['id', 'username', 'email', 'phone', 'address', 'genderId'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });

    if (!user) {
      return res.status(404).json({ EM: 'Không tìm thấy người dùng', EC: -1, DT: null });
    }

    return res.status(200).json({ EM: 'ok', EC: 0, DT: user.get({ plain: true }) });
  } catch (e) {
    console.error('[teacherProfileController.getMyFullProfile]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phone, address, genderId, bio, licenseTypes, locationName, yearsExp, avatarUrl } = req.body;

    if (email !== undefined && email !== null && email !== '') {
      const taken = await db.user.findOne({ where: { email, id: { [Op.ne]: userId } } });
      if (taken) {
        return res.status(400).json({ EM: 'Email đã tồn tại trong hệ thống', EC: 1, DT: 'email' });
      }
    }

    await db.user.update(
      {
        username: username ?? undefined,
        email: email ?? undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        genderId: genderId !== undefined ? genderId : undefined,
      },
      { where: { id: userId } }
    );

    let profile = await db.teacher_profile.findOne({ where: { userId } });
    if (profile) {
      await profile.update({
        bio: bio !== undefined ? bio : profile.bio,
        licenseTypes: licenseTypes !== undefined ? licenseTypes : profile.licenseTypes,
        locationName: locationName !== undefined ? locationName : profile.locationName,
        yearsExp: yearsExp !== undefined ? (yearsExp ? parseInt(yearsExp) : null) : profile.yearsExp,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl || null) : profile.avatarUrl,
      });
    } else {
      profile = await db.teacher_profile.create({
        userId,
        bio: bio || null,
        licenseTypes: licenseTypes || null,
        locationName: locationName || null,
        yearsExp: yearsExp ? parseInt(yearsExp) : null,
        avatarUrl: avatarUrl || null,
      });
    }

    return res.status(200).json({ EM: 'Cập nhật thành công', EC: 0, DT: null });
  } catch (e) {
    console.error('[teacherProfileController.updateMyProfile]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

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

export default { getPublicTeachers, getPublicTeacherDetail, getMyFullProfile, updateMyProfile, getProfile, upsertProfile, uploadAvatar };
