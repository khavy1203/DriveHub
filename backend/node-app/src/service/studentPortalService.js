import db from '../models/index.js';

const getMyProgress = async (userId) => {
  try {
    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      include: [
        {
          model: db.student_assignment,
          as: 'assignments',
          required: false,
          include: [
            {
              model: db.user,
              as: 'teacher',
              attributes: ['id', 'username', 'phone', 'email', 'address'],
              include: [
                { model: db.teacher_profile, as: 'teacherProfile', required: false },
              ],
            },
          ],
        },
      ],
    });

    if (!hocVien) return { EM: 'Không tìm thấy hồ sơ học viên', EC: 1, DT: null };

    const plain = hocVien.get({ plain: true });
    const allAssignments = plain.assignments || [];
    const primaryAssignment = allAssignments.find(a => a.role === 'primary') || allAssignments[0] || null;
    const supervisorAssignment = allAssignments.find(a => a.role === 'supervisor') || null;

    let teacherRating = { avgStars: '0.0', totalRatings: 0 };
    let canRate = false;

    if (primaryAssignment?.teacher?.id) {
      // Self-heal: if training snapshot shows >= 100% but assignment not yet completed, fix it now
      if (primaryAssignment.status !== 'completed') {
        const snap = await db.training_snapshot.findOne({
          where: { hocVienId: hocVien.id },
          attributes: ['courseProgressPct'],
        });
        if (snap && snap.courseProgressPct >= 100) {
          await db.student_assignment.update(
            { status: 'completed', progressPercent: snap.courseProgressPct },
            { where: { id: primaryAssignment.id } },
          );
          await db.hoc_vien.update(
            { status: 'dat_completed' },
            { where: { id: hocVien.id } },
          );
          primaryAssignment.status = 'completed';
        }
      }

      const agg = await db.teacher_rating.findOne({
        where: { teacherUserId: primaryAssignment.teacher.id },
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('stars')), 'avgStars'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings'],
        ],
        raw: true,
      });
      teacherRating = {
        avgStars: agg?.avgStars ? parseFloat(agg.avgStars).toFixed(1) : '0.0',
        totalRatings: parseInt(agg?.totalRatings ?? 0),
      };

      const existingRating = await db.teacher_rating.findOne({
        where: { teacherUserId: primaryAssignment.teacher.id, hocVienId: hocVien.id },
      });
      canRate = primaryAssignment.status === 'completed' && !existingRating;
    }

    const formatAssignment = (a, rating, canRateFlag) => {
      if (!a) return null;
      return {
        id: a.id,
        role: a.role || 'primary',
        status: a.status,
        progressPercent: a.progressPercent,
        datHoursCompleted: a.datHoursCompleted,
        notes: a.notes,
        canRate: canRateFlag,
        teacher: a.teacher
          ? {
              id: a.teacher.id,
              username: a.teacher.username,
              phone: a.teacher.phone,
              email: a.teacher.email,
              address: a.teacher.address,
              profile: a.teacher.teacherProfile || null,
              ...rating,
            }
          : null,
      };
    };

    return {
      EM: 'ok',
      EC: 0,
      DT: {
        hocVien: {
          id: plain.id,
          HoTen: plain.HoTen,
          loaibangthi: plain.loaibangthi,
          status: plain.status,
        },
        // Primary assignment (backward compatible)
        assignment: formatAssignment(primaryAssignment, teacherRating, canRate),
        // Supervisor assignment (SuperTeacher chat)
        supervisorAssignment: formatAssignment(supervisorAssignment, { avgStars: '0.0', totalRatings: 0 }, false),
      },
    };
  } catch (e) {
    console.error('[studentPortalService.getMyProgress]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

const getAllTeachers = async (myHocVienId) => {
  try {
    const myAssignment = myHocVienId
      ? await db.student_assignment.findOne({
          where: { hocVienId: myHocVienId, role: 'primary' },
          attributes: ['teacherId'],
        })
      : null;
    const myTeacherUserId = myAssignment?.teacherId ?? null;

    const teachers = await db.user.findAll({
      where: { groupId: 3 },
      attributes: ['id', 'username', 'email', 'phone', 'address'],
      include: [{ model: db.teacher_profile, as: 'teacherProfile', required: false }],
    });

    const ratingRows = await db.teacher_rating.findAll({
      attributes: [
        'teacherUserId',
        [db.sequelize.fn('AVG', db.sequelize.col('stars')), 'avgStars'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings'],
      ],
      group: ['teacherUserId'],
      raw: true,
    });

    const ratingMap = {};
    for (const r of ratingRows) {
      ratingMap[r.teacherUserId] = {
        avgStars: parseFloat(r.avgStars).toFixed(1),
        totalRatings: parseInt(r.totalRatings),
      };
    }

    return {
      EM: 'ok',
      EC: 0,
      DT: teachers.map((t) => {
        const plain = t.get({ plain: true });
        const isMyTeacher = plain.id === myTeacherUserId;
        return {
          id: plain.id,
          username: plain.username,
          phone: isMyTeacher ? plain.phone : null,
          email: isMyTeacher ? plain.email : null,
          address: isMyTeacher ? plain.address : null,
          profile: plain.teacherProfile || null,
          avgStars: ratingMap[plain.id]?.avgStars ?? '0.0',
          totalRatings: ratingMap[plain.id]?.totalRatings ?? 0,
          isMyTeacher,
        };
      }),
    };
  } catch (e) {
    console.error('[studentPortalService.getAllTeachers]', e);
    return { EM: 'Lỗi server', EC: -1, DT: [] };
  }
};

const submitRating = async (hocVienId, { stars, comment }) => {
  try {
    if (!stars || stars < 1 || stars > 5) {
      return { EM: 'Số sao phải từ 1 đến 5', EC: -1, DT: null };
    }

    const assignment = await db.student_assignment.findOne({ where: { hocVienId, role: 'primary' } });
    if (!assignment) return { EM: 'Không tìm thấy phân công học', EC: -1, DT: null };
    if (assignment.status !== 'completed') {
      return { EM: 'Chỉ được đánh giá sau khi hoàn thành khóa học', EC: -1, DT: null };
    }

    const existing = await db.teacher_rating.findOne({
      where: { teacherUserId: assignment.teacherId, hocVienId },
    });
    if (existing) return { EM: 'Bạn đã đánh giá giáo viên này rồi', EC: -1, DT: null };

    const rating = await db.teacher_rating.create({
      teacherUserId: assignment.teacherId,
      hocVienId,
      stars,
      comment: comment ?? null,
    });

    return { EM: 'Đánh giá thành công', EC: 0, DT: rating.get({ plain: true }) };
  } catch (e) {
    console.error('[studentPortalService.submitRating]', e);
    return { EM: 'Lỗi server', EC: -1, DT: null };
  }
};

export default { getMyProgress, getAllTeachers, submitRating };
