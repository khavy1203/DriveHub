import studentAssignmentService from '../service/studentAssignmentService.js';
import { ADMIN_ACCOUNT } from '../constants/constants.js';

const canEditAssignmentProgress = (req) => {
  const name = req.user?.groupWithRoles?.name;
  if (name === 'Admin' || name === 'SupperAdmin') return true;
  if (req.user?.email === ADMIN_ACCOUNT.email) return true;
  return false;
};

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
  const body = req.body || {};
  let payload;
  if (canEditAssignmentProgress(req)) {
    const { status, progressPercent, datHoursCompleted, notes } = body;
    payload = { status, progressPercent, datHoursCompleted, notes };
  } else {
    const { notes } = body;
    payload = { notes };
  }
  const data = await studentAssignmentService.updateAssignment(+id, payload);
  return res.status(200).json(data);
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const data = await studentAssignmentService.deleteAssignment(+id);
  return res.status(200).json(data);
};

export default { getAssignments, createAssignment, updateAssignment, deleteAssignment };
