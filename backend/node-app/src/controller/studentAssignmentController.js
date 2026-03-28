import studentAssignmentService from '../service/studentAssignmentService.js';

const getAssignments = async (req, res) => {
  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ EM: 'courseId required', EC: -1, DT: [] });
  const data = await studentAssignmentService.getAssignmentsByCourse(courseId);
  return res.status(200).json(data);
};

const createAssignment = async (req, res) => {
  const { hocVienId, teacherId, courseId = null, notes } = req.body;
  if (!hocVienId || !teacherId) {
    return res.status(400).json({ EM: 'hocVienId và teacherId là bắt buộc', EC: -1, DT: null });
  }
  const data = await studentAssignmentService.createAssignment({ hocVienId, teacherId, courseId, notes });
  return res.status(200).json(data);
};

const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { status, progressPercent, datHoursCompleted, notes } = req.body;
  const data = await studentAssignmentService.updateAssignment(+id, { status, progressPercent, datHoursCompleted, notes });
  return res.status(200).json(data);
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const data = await studentAssignmentService.deleteAssignment(+id);
  return res.status(200).json(data);
};

export default { getAssignments, createAssignment, updateAssignment, deleteAssignment };
