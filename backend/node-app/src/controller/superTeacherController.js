import db from '../models/index.js';
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
  assignStudentToST,
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

    const totalCount = cccdList.length;

    // Respond immediately — processing continues in background
    res.json({
      EC: 0,
      EM: `Đang xử lý ${totalCount} CCCD ở chế độ nền. Bạn sẽ nhận thông báo khi hoàn tất.`,
      DT: { background: true, total: totalCount },
    });

    // Background processing
    setImmediate(async () => {
      try {
        const result = await importStudentsByCccd(superTeacherId, cccdList);

        const created = result.results?.filter(r => r.ok && r.created).length ?? 0;
        const transferred = result.results?.filter(r => r.ok && !r.created && r.transferred).length ?? 0;
        const updated = result.results?.filter(r => r.ok && !r.created && !r.transferred).length ?? 0;
        const failed = result.results?.filter(r => !r.ok).length ?? 0;

        const parts = [];
        if (created) parts.push(`${created} tạo mới`);
        if (transferred) parts.push(`${transferred} chuyển đội`);
        if (updated) parts.push(`${updated} cập nhật`);
        if (failed) parts.push(`${failed} lỗi`);
        const summary = parts.join(', ') || 'không có kết quả';

        const { sendToUser } = await import('../websocket/wsNotificationServer.js');
        sendToUser(superTeacherId, {
          type: 'IMPORT_CCCD_DONE',
          payload: {
            title: 'Import CCCD hoàn tất',
            content: `Import ${totalCount} CCCD: ${summary}`,
            results: result.results ?? [],
            created,
            transferred,
            updated,
            failed,
          },
        });

        console.log(`[super-teacher/import-cccd] Background done for stId=${superTeacherId}: ${summary}`);
      } catch (err) {
        console.error('[super-teacher/import-cccd] Background error:', err.message);
        try {
          const { sendToUser } = await import('../websocket/wsNotificationServer.js');
          sendToUser(superTeacherId, {
            type: 'IMPORT_CCCD_DONE',
            payload: {
              title: 'Import CCCD thất bại',
              content: `Lỗi khi xử lý ${totalCount} CCCD: ${err.message}`,
              results: [],
              created: 0, transferred: 0, updated: 0, failed: totalCount,
            },
          });
        } catch {}
      }
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
    const role = req.user?.groupWithRoles?.name;
    let adminId = role === 'Admin' ? req.user.id : null;
    if (role === 'SupperAdmin' && req.query.filterAdminId) {
      const n = parseInt(req.query.filterAdminId, 10);
      if (Number.isFinite(n)) adminId = n;
    }
    const data = await getAllSupperTeachers(adminId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const addSupperTeacher = async (req, res, next) => {
  try {
    const role = req.user?.groupWithRoles?.name;
    const callerAdminId = role === 'Admin' ? req.user.id : (req.body.adminId ?? null);
    const data = await createSupperTeacher(req.body, callerAdminId);
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
    const role = req.user?.groupWithRoles?.name;
    if (role === 'Admin') {
      const st = await db.user.findOne({
        where: { id: superTeacherId, adminId: req.user.id },
        attributes: ['id'],
      });
      if (!st) return res.status(403).json({ EC: -1, EM: 'SupperTeacher không thuộc đơn vị của bạn', DT: null });
    }
    const data = await getMyTeachers(superTeacherId);
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const listTeachersWithoutSupper = async (req, res, next) => {
  try {
    const role = req.user?.groupWithRoles?.name;
    const adminId = role === 'Admin' ? req.user.id : null;
    const data = await getTeachersWithoutSupper(adminId);
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

export const assignStudentToSTHandler = async (req, res, next) => {
  try {
    const role = req.user?.groupWithRoles?.name;
    if (role !== 'Admin') return res.status(403).json({ EC: -1, EM: 'Chỉ Admin mới có quyền này', DT: null });
    const adminId = req.user.id;
    const { hocVienId, stId } = req.body;
    if (!hocVienId || !stId) return res.status(400).json({ EC: -1, EM: 'Thiếu hocVienId hoặc stId', DT: null });
    const data = await assignStudentToST(adminId, Number(hocVienId), Number(stId));
    return res.json({ EC: 0, EM: 'Đã gán học viên cho SupperTeacher', DT: data });
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
