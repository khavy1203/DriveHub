import multer from 'multer';
import { importSupperTeachersFromZip, generateTemplate } from '../service/supperTeacherImportService.js';
import db from '../models/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
export const uploadZip = upload.single('file');

const resolveAdminId = (req) => {
  const name = req.user?.groupWithRoles?.name;
  if (name === 'Admin') return req.user.id;
  if (name === 'SupperAdmin') {
    const paramId = parseInt(req.body?.adminId || req.query?.adminId, 10);
    return Number.isFinite(paramId) ? paramId : null;
  }
  return null;
};

export const importSupperTeachers = async (req, res, next) => {
  try {
    const adminId = resolveAdminId(req);
    if (!adminId) return res.status(400).json({ EC: -1, EM: 'Vui lòng chọn Admin quản lý trước khi import', DT: null });
    if (!req.file) return res.status(400).json({ EC: -1, EM: 'Vui lòng upload file ZIP hoặc RAR', DT: null });

    const result = await importSupperTeachersFromZip(req.file.buffer, adminId);
    return res.json({ EC: 0, EM: 'Import hoàn tất', DT: result });
  } catch (err) {
    if (err.code === 'NO_EXCEL' || err.code === 'EMPTY_DATA') {
      return res.status(400).json({ EC: -1, EM: err.message, DT: null });
    }
    next(err);
  }
};

export const downloadTemplate = async (_req, res, next) => {
  try {
    const buffer = generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="MauImportGiaoVien.xlsx"');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

export const getInstructorProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isFinite(userId)) return res.status(400).json({ EC: -1, EM: 'ID không hợp lệ', DT: null });

    const profile = await db.instructor_profile.findOne({ where: { userId } });
    return res.json({ EC: 0, EM: '', DT: profile ? profile.get({ plain: true }) : null });
  } catch (err) {
    next(err);
  }
};
