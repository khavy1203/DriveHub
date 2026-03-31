import { Op } from 'sequelize';
import db from '../models/index.js';

const SUPPER_ADMIN_GROUP = 'SupperAdmin';
const SUPPER_TEACHER_GROUP_ID = 6;

const getHistory = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const a = await db.student_assignment.findOne({
      where: { id: assignmentId },
      include: [{ model: db.hoc_vien, as: 'hocVien', attributes: ['userId'] }],
    });
    if (!a) return res.status(404).json({ EC: -1, EM: 'Assignment not found', DT: null });

    const uid = req.user.id;
    const isSupperAdmin = req.user.groupWithRoles?.name === SUPPER_ADMIN_GROUP;

    // SuperTeacher can access assignments of students in their team
    let isSuperTeacherAccess = false;
    if (a.teacherId !== uid && a.hocVien?.userId !== uid && !isSupperAdmin) {
      const caller = await db.user.findByPk(uid, { attributes: ['id', 'groupId'] });
      if (caller?.groupId === SUPPER_TEACHER_GROUP_ID) {
        const teacher = await db.user.findByPk(a.teacherId, { attributes: ['superTeacherId'] });
        if (teacher?.superTeacherId === uid) isSuperTeacherAccess = true;
      }
    }

    if (a.teacherId !== uid && a.hocVien?.userId !== uid && !isSupperAdmin && !isSuperTeacherAccess) {
      return res.status(403).json({ EC: -1, EM: 'Access denied', DT: null });
    }

    const where = { assignmentId };
    if (beforeId) where.id = { [Op.lt]: beforeId };

    const rows = await db.chat_message.findAll({
      where,
      order: [['id', 'DESC']],
      limit,
      include: [{ model: db.user, as: 'sender', attributes: ['id', 'username'] }],
    });

    return res.json({ EC: 0, EM: 'OK', DT: rows.reverse() });
  } catch (err) {
    console.error('[chatController.getHistory]', err.message);
    return res.status(500).json({ EC: -1, EM: 'Server error', DT: null });
  }
};

export default { getHistory };
