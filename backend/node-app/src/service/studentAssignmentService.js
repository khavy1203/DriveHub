import db from '../models/index.js';
import { Op } from 'sequelize';
import {
  loadTrainingSnapshotsByHocVienIds,
  enrichHocVienPlainWithTrainingSnapshot,
} from './trainingSnapshotEnrich.js';

const getAssignmentsByCourse = async (courseId) => {
  try {
    const rows = await db.student_assignment.findAll({
      where: { courseId },
      include: [
        {
          model: db.hoc_vien,
          as: 'hocVien',
          attributes: ['id', 'HoTen', 'SoCCCD', 'NgaySinh', 'GioiTinh',
            'DiaChi', 'loaibangthi', 'phone', 'email', 'status'],
        },
        {
          model: db.user,
          as: 'teacher',
          attributes: ['id', 'username', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return { EM: 'ok', EC: 0, DT: rows.map(r => r.get({ plain: true })) };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: [] };
  }
};

const createAssignment = async ({ hocVienId, teacherId, courseId, notes }) => {
  try {
    const existing = await db.student_assignment.findOne({
      where: {
        hocVienId,
        courseId: courseId ?? { [Op.is]: null },
      },
    });
    if (existing) {
      existing.set({ teacherId, status: 'learning', notes: notes ?? existing.notes });
      await existing.save();
      // Update hoc_vien status
      await db.hoc_vien.update({ status: 'assigned' }, { where: { id: hocVienId, status: 'registered' } });
      return { EM: 'Assignment updated', EC: 0, DT: existing.get({ plain: true }) };
    }
    const row = await db.student_assignment.create({
      hocVienId, teacherId, courseId,
      status: 'learning', progressPercent: 0, datHoursCompleted: 0,
      notes: notes ?? null,
    });
    await db.hoc_vien.update({ status: 'learning' }, { where: { id: hocVienId } });
    return { EM: 'Assigned successfully', EC: 0, DT: row.get({ plain: true }) };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

const updateAssignment = async (id, { status, progressPercent, datHoursCompleted, notes }) => {
  try {
    const row = await db.student_assignment.findByPk(id);
    if (!row) return { EM: 'Not found', EC: -1, DT: null };

    if (status !== undefined) row.status = status;
    if (progressPercent !== undefined) row.progressPercent = progressPercent;
    if (datHoursCompleted !== undefined) row.datHoursCompleted = datHoursCompleted;
    if (notes !== undefined) row.notes = notes;
    await row.save();

    if (status !== undefined) {
      const hvStatus = status === 'completed' ? 'dat_completed' : 'learning';
      await db.hoc_vien.update({ status: hvStatus }, { where: { id: row.hocVienId } });
    }

    return { EM: 'Updated', EC: 0, DT: row.get({ plain: true }) };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

const deleteAssignment = async (id) => {
  try {
    const row = await db.student_assignment.findByPk(id);
    if (row) {
      await db.hoc_vien.update({ status: 'registered' }, { where: { id: row.hocVienId } });
      await row.destroy();
    }
    return { EM: 'Removed', EC: 0, DT: null };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

const getAssignmentsByTeacher = async (teacherUserId) => {
  try {
    const rows = await db.student_assignment.findAll({
      where: { teacherId: teacherUserId },
      include: [
        {
          model: db.hoc_vien,
          as: 'hocVien',
          attributes: ['id', 'HoTen', 'SoCCCD', 'NgaySinh', 'GioiTinh',
            'DiaChi', 'loaibangthi', 'phone', 'email', 'status', 'IDKhoaHoc', 'createdAt'],
          include: [
            {
              model: db.khoahoc,
              as: 'khoahoc',
              required: false,
              attributes: ['IDKhoaHoc', 'TenKhoaHoc', 'NgayThi'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const plain = rows.map((r) => r.get({ plain: true }));
    const hocVienIds = [...new Set(plain.map((p) => p.hocVienId).filter(Boolean))];

    let hasKqshSet = new Set();
    if (hocVienIds.length) {
      const kqshRows = await db.kqsh_thisinh.findAll({
        where: { hocVienId: { [Op.in]: hocVienIds } },
        attributes: ['hocVienId'],
      });
      hasKqshSet = new Set(kqshRows.map((r) => r.hocVienId));
    }

    const snapMap = await loadTrainingSnapshotsByHocVienIds(hocVienIds);

    const withFlag = plain.map((p) => {
      const snap = snapMap.get(p.hocVienId);
      const hocVien = p.hocVien
        ? enrichHocVienPlainWithTrainingSnapshot({ ...p.hocVien }, snap ?? null)
        : p.hocVien;
      return {
        ...p,
        hocVien,
        hasKQSH: hasKqshSet.has(p.hocVienId),
      };
    });

    return { EM: 'ok', EC: 0, DT: withFlag };
  } catch (e) {
    console.error('[getAssignmentsByTeacher]', e);
    return { EM: 'Server error', EC: -1, DT: [] };
  }
};

export default { getAssignmentsByCourse, createAssignment, updateAssignment, deleteAssignment, getAssignmentsByTeacher };
