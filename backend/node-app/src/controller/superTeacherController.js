import {
  getMyTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getMyStudents,
  assignStudentToTeacher,
  dropStudent,
  updateStudentInfo,
  importStudentsByCccd,
  getRatingsOverview,
  getAllSupperTeachers,
  createSupperTeacher,
  updateSupperTeacher,
  deleteSupperTeacher,
  getTeachersPreviewForDelete,
  createTeacherByAdmin,
  reassignTeacher,
  getTeachersWithoutSupper,
  promoteToSuperTeacher,
  demoteToTeacher,
} from '../service/superTeacherService.js';

const handleError = (res, err, next) => {
  if (err.code === 'FORBIDDEN') return res.status(403).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'NOT_FOUND') return res.status(404).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'VALIDATION') return res.status(400).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'DUPLICATE_EMAIL') return res.status(400).json({ EC: -1, EM: err.message, DT: null });
  next(err);
};

// ── SupperTeacher self-management endpoints ──────────────────────────────────

export const listMyTeachers = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    if (!superTeacherId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });
    const data = await getMyTeachers(superTeacherId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const addTeacher = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    if (!superTeacherId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });
    const data = await createTeacher(superTeacherId, req.body);
    return res.json({ EC: 0, EM: 'Tạo giáo viên thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const editTeacher = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    const teacherId = Number(req.params.teacherId);
    const data = await updateTeacher(superTeacherId, teacherId, req.body);
    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const removeTeacher = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    const teacherId = Number(req.params.teacherId);
    await deleteTeacher(superTeacherId, teacherId);
    return res.json({ EC: 0, EM: 'Xóa giáo viên thành công', DT: null });
  } catch (err) { handleError(res, err, next); }
};

export const listMyStudents = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    const data = await getMyStudents(superTeacherId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const assignStudent = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    const { hocVienId, teacherId } = req.body;
    if (!hocVienId || !teacherId) return res.status(400).json({ EC: -1, EM: 'Thiếu hocVienId hoặc teacherId', DT: null });
    const data = await assignStudentToTeacher(superTeacherId, Number(hocVienId), Number(teacherId));
    return res.json({ EC: 0, EM: 'Phân công thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const importCccd = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    if (!superTeacherId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });

    const { cccdList } = req.body;
    if (!Array.isArray(cccdList) || cccdList.length === 0) {
      return res.status(400).json({ EC: -1, EM: 'Danh sách CCCD không hợp lệ', DT: null });
    }
    if (cccdList.length > 100) {
      return res.status(400).json({ EC: -1, EM: 'Tối đa 100 CCCD mỗi lần', DT: null });
    }

    const result = await importStudentsByCccd(superTeacherId, cccdList);

    if (result.error) {
      return res.status(503).json({ EC: -1, EM: result.error, DT: null });
    }

    const created = result.results.filter(r => r.ok && r.created).length;
    const updated = result.results.filter(r => r.ok && !r.created).length;
    const failed = result.results.filter(r => !r.ok).length;

    return res.json({
      EC: 0,
      EM: `Import xong: ${created} tạo mới, ${updated} cập nhật, ${failed} lỗi`,
      DT: result.results,
    });
  } catch (err) { handleError(res, err, next); }
};

export const updateStudentHandler = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    if (!superTeacherId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });
    const hocVienId = Number(req.params.hocVienId);
    if (!hocVienId) return res.status(400).json({ EC: -1, EM: 'Thiếu hocVienId', DT: null });
    const data = await updateStudentInfo(superTeacherId, hocVienId, req.body);
    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: data });
  } catch (err) {
    if (err.code === 'FORBIDDEN') return res.status(403).json({ EC: -1, EM: err.message, DT: null });
    handleError(res, err, next);
  }
};

export const dropStudentHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });
    const hocVienId = Number(req.params.hocVienId);
    if (!hocVienId) return res.status(400).json({ EC: -1, EM: 'Thiếu hocVienId', DT: null });
    const isSupperAdmin = req.user.groupWithRoles?.name === 'SupperAdmin';
    const data = await dropStudent(userId, hocVienId, isSupperAdmin);
    return res.json({ EC: 0, EM: 'Đã xóa học viên khỏi đội', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const ratingsOverview = async (req, res, next) => {
  try {
    const superTeacherId = req.user?.id;
    if (!superTeacherId) return res.status(401).json({ EC: -1, EM: 'Không xác thực', DT: null });
    const data = await getRatingsOverview(superTeacherId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

// ── SupperAdmin management endpoints ────────────────────────────────────────

export const listSupperTeachers = async (req, res, next) => {
  try {
    const data = await getAllSupperTeachers();
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const addSupperTeacher = async (req, res, next) => {
  try {
    const data = await createSupperTeacher(req.body);
    return res.json({ EC: 0, EM: 'Tạo SupperTeacher thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const editSupperTeacher = async (req, res, next) => {
  try {
    const data = await updateSupperTeacher(Number(req.params.id), req.body);
    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const removeSupperTeacher = async (req, res, next) => {
  try {
    await deleteSupperTeacher(Number(req.params.id));
    return res.json({ EC: 0, EM: 'Xóa SupperTeacher thành công', DT: null });
  } catch (err) { handleError(res, err, next); }
};

export const previewDeleteSupperTeacher = async (req, res, next) => {
  try {
    const data = await getTeachersPreviewForDelete(Number(req.params.id));
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const addTeacherByAdmin = async (req, res, next) => {
  try {
    const { superTeacherId, ...teacherData } = req.body;
    const data = await createTeacherByAdmin(Number(superTeacherId), teacherData);
    return res.json({ EC: 0, EM: 'Tạo giáo viên thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const moveTeacherToSupper = async (req, res, next) => {
  try {
    const teacherId = Number(req.params.teacherId);
    const { superTeacherId } = req.body;
    const data = await reassignTeacher(teacherId, Number(superTeacherId));
    return res.json({ EC: 0, EM: 'Chuyển giáo viên thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const listTeachersInTeam = async (req, res, next) => {
  try {
    const superTeacherId = Number(req.params.id);
    const data = await getMyTeachers(superTeacherId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const listTeachersWithoutSupper = async (req, res, next) => {
  try {
    const data = await getTeachersWithoutSupper();
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const promoteTeacher = async (req, res, next) => {
  try {
    const teacherId = Number(req.params.teacherId);
    const data = await promoteToSuperTeacher(teacherId);
    return res.json({ EC: 0, EM: 'Nâng cấp thành SupperTeacher thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const demoteSuperTeacher = async (req, res, next) => {
  try {
    const superTeacherId = Number(req.params.id);
    const { newManagerId } = req.body;
    if (!newManagerId) return res.status(400).json({ EC: -1, EM: 'Phải chọn SupperTeacher tiếp nhận', DT: null });
    const data = await demoteToTeacher(superTeacherId, Number(newManagerId));
    return res.json({ EC: 0, EM: 'Hạ cấp thành giáo viên thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};
