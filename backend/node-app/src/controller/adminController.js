import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  toggleAdminActive,
  deleteAdmin,
  assignSupperTeacher,
  detachSupperTeacher,
} from '../service/adminService.js';

const handleError = (res, err, next) => {
  if (err.code === 'FORBIDDEN') return res.status(403).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'NOT_FOUND') return res.status(404).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'VALIDATION') return res.status(400).json({ EC: -1, EM: err.message, DT: null });
  if (err.code === 'DUPLICATE_EMAIL') return res.status(400).json({ EC: -1, EM: err.message, DT: null });
  next(err);
};

const requireSupperAdmin = (req, res) => {
  if (req.user?.groupWithRoles?.name !== 'SupperAdmin') {
    res.status(403).json({ EC: -1, EM: 'Chỉ SupperAdmin mới có quyền này', DT: null });
    return false;
  }
  return true;
};

export const listAdmins = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    const data = await getAllAdmins();
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const getAdmin = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    const data = await getAdminById(Number(req.params.adminId));
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const createAdminHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    const data = await createAdmin(req.body);
    return res.status(201).json({ EC: 0, EM: 'Tạo Admin thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const updateAdminHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    await updateAdmin(Number(req.params.adminId), req.body);
    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: null });
  } catch (err) { handleError(res, err, next); }
};

export const toggleAdminHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    const data = await toggleAdminActive(Number(req.params.adminId));
    return res.json({ EC: 0, EM: 'Cập nhật trạng thái thành công', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const deleteAdminHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    await deleteAdmin(Number(req.params.adminId));
    return res.json({ EC: 0, EM: 'Đã xóa Admin', DT: null });
  } catch (err) { handleError(res, err, next); }
};

export const assignSupperTeacherHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    const data = await assignSupperTeacher(Number(req.params.adminId), Number(req.body.supperTeacherId));
    return res.json({ EC: 0, EM: 'Đã gán SupperTeacher vào Admin', DT: data });
  } catch (err) { handleError(res, err, next); }
};

export const detachSupperTeacherHandler = async (req, res, next) => {
  if (!requireSupperAdmin(req, res)) return;
  try {
    await detachSupperTeacher(Number(req.params.supperTeacherId));
    return res.json({ EC: 0, EM: 'Đã gỡ SupperTeacher khỏi Admin', DT: null });
  } catch (err) { handleError(res, err, next); }
};
