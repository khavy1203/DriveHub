import { Op } from 'sequelize';
import db from '../models/index.js';

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
    if (a.teacherId !== uid && a.hocVien?.userId !== uid) {
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
