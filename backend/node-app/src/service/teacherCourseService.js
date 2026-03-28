import db from '../models/index.js';

const getAssignments = async (teacherId) => {
  try {
    const teacher = await db.user.findByPk(teacherId, {
      include: [{
        model: db.khoahoc,
        as: 'assignedCourses',
        attributes: ['IDKhoaHoc', 'TenKhoaHoc', 'NgayThi'],
        through: { attributes: [] },
      }],
    });
    if (!teacher) return { EM: 'Teacher not found', EC: -1, DT: [] };
    return { EM: 'ok', EC: 0, DT: teacher.assignedCourses ?? [] };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: [] };
  }
};

const assignCourse = async (teacherId, courseId) => {
  try {
    const exists = await db.teacher_course.findOne({ where: { teacherId, courseId } });
    if (exists) return { EM: 'Already assigned', EC: -1, DT: null };
    await db.teacher_course.create({ teacherId, courseId });
    return { EM: 'Assigned successfully', EC: 0, DT: null };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

const unassignCourse = async (teacherId, courseId) => {
  try {
    await db.teacher_course.destroy({ where: { teacherId, courseId } });
    return { EM: 'Unassigned successfully', EC: 0, DT: null };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

const setAssignments = async (teacherId, courseIds) => {
  try {
    await db.teacher_course.destroy({ where: { teacherId } });
    if (courseIds.length > 0) {
      await db.teacher_course.bulkCreate(
        courseIds.map(courseId => ({ teacherId, courseId }))
      );
    }
    return { EM: 'Assignments updated', EC: 0, DT: null };
  } catch (e) {
    console.error(e);
    return { EM: 'Server error', EC: -1, DT: null };
  }
};

export default { getAssignments, assignCourse, unassignCourse, setAssignments };
