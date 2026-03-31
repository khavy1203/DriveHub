import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import studentAssignmentService from '../service/studentAssignmentService.js';

const resolveTeacherId = async (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.email) return null;

  const user = await db.user.findOne({
    where: { email: decoded.email },
    attributes: ['id'],
  });
  return user ? user.id : null;
};

const getMyStudents = async (req, res) => {
  try {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }

    // SupperAdmin sees all assignments across all teachers
    const isSupperAdmin = req.user?.groupWithRoles?.name === 'SupperAdmin';
    if (isSupperAdmin) {
      const result = await studentAssignmentService.getAllAssignments();
      return res.status(result.EC === 0 ? 200 : 500).json(result);
    }

    const result = await studentAssignmentService.getAssignmentsByTeacher(teacherId);
    return res.status(result.EC === 0 ? 200 : 500).json(result);
  } catch (e) {
    console.error('[teacherPortalController.getMyStudents]', e);
    return res.status(500).json({ EC: -1, EM: 'Lỗi server', DT: null });
  }
};

export default { getMyStudents };
