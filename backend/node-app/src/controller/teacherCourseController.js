import teacherCourseService from '../service/teacherCourseService.js';

const getAssignments = async (req, res) => {
  const { teacherId } = req.query;
  if (!teacherId) return res.status(400).json({ EM: 'teacherId required', EC: -1, DT: [] });
  const data = await teacherCourseService.getAssignments(+teacherId);
  return res.status(200).json(data);
};

const setAssignments = async (req, res) => {
  const { teacherId, courseIds } = req.body;
  if (!teacherId || !Array.isArray(courseIds)) {
    return res.status(400).json({ EM: 'teacherId and courseIds required', EC: -1, DT: null });
  }
  const data = await teacherCourseService.setAssignments(+teacherId, courseIds);
  return res.status(200).json(data);
};

export default { getAssignments, setAssignments };
