import { syncKQSH } from '../service/kqshSyncService.js';
import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import { getMssqlPool } from '../config/mssqlClient.js';

const resolveUserId = async (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.email) return null;
  const user = await db.user.findOne({ where: { email: decoded.email }, attributes: ['id'] });
  return user ? user.id : null;
};

const ALLOWED_SYNC_ROLES = ['Admin', 'SupperAdmin', 'SupperTeacher', 'GiaoVien'];

export const triggerSync = async (req, res, next) => {
  const groupName = req.user?.groupWithRoles?.name;
  if (!ALLOWED_SYNC_ROLES.includes(groupName)) {
    return res.status(403).json({ EC: -1, EM: 'Không có quyền thực hiện thao tác này', DT: null });
  }

  try {
    const result = await syncKQSH();
    return res.json({ EC: 0, EM: 'Sync thành công', DT: result });
  } catch (err) {
    console.error('[triggerSync] Error:', err);
    return res.status(500).json({ EC: -1, EM: err?.message ?? 'Lỗi sync', DT: null });
  }
};

export const testMssqlConnection = async (req, res) => {
  try {
    const pool = await getMssqlPool();

    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const tableNames = tables.recordset.map((r) => r.TABLE_NAME);

    const columnsByTable = {};
    for (const tbl of ['ThiSinh', 'ThiSinh_KQSH']) {
      if (tableNames.includes(tbl)) {
        const cols = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${tbl}'
          ORDER BY ORDINAL_POSITION
        `);
        columnsByTable[tbl] = cols.recordset;
      } else {
        columnsByTable[tbl] = null;
      }
    }

    return res.json({ EC: 0, EM: 'Kết nối thành công', DT: { tables: tableNames, columns: columnsByTable } });
  } catch (err) {
    console.error('[testMssqlConnection]', err);
    return res.status(500).json({ EC: -1, EM: err?.message ?? 'Lỗi kết nối', DT: null });
  }
};

const resolveTokenContext = (req) => {
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
};

export const getHocVienKQSH = async (req, res, next) => {
  try {
    const decoded = resolveTokenContext(req);
    const groupName = decoded?.groupWithRoles?.name;
    if (!['Admin', 'SupperAdmin', 'SupperTeacher', 'GiaoVien'].includes(groupName)) {
      return res.status(403).json({ EC: -1, EM: 'Không có quyền truy cập', DT: null });
    }

    const hocVienId = +req.params.id;
    const hocVien = await db.hoc_vien.findByPk(hocVienId, { attributes: ['id', 'HoTen'] });
    if (!hocVien) return res.json({ EC: 0, EM: 'Không tìm thấy học viên', DT: { hoTen: null, records: [] } });

    const records = await db.kqsh_thisinh.findAll({
      where: { hocVienId },
      include: [{ model: db.kqsh_subjects, as: 'subjects' }],
      order: [['NgaySH', 'DESC']],
    });

    return res.json({ EC: 0, EM: 'OK', DT: { hoTen: hocVien.HoTen, records } });
  } catch (err) {
    next(err);
  }
};

export const getTeacherStudentKQSH = async (req, res, next) => {
  try {
    const decoded = resolveTokenContext(req);
    if (!decoded?.email) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }
    if (decoded.groupWithRoles?.name !== 'GiaoVien') {
      return res.status(403).json({ EC: -1, EM: 'Chỉ giáo viên được phép truy cập', DT: null });
    }

    const teacherUser = await db.user.findOne({ where: { email: decoded.email }, attributes: ['id'] });
    if (!teacherUser) return res.status(401).json({ EC: -1, EM: 'Không tìm thấy tài khoản', DT: null });

    const hocVienId = +req.params.hocVienId;
    const assignment = await db.student_assignment.findOne({
      where: { hocVienId, teacherId: teacherUser.id },
    });
    if (!assignment) {
      return res.status(403).json({ EC: -1, EM: 'Học viên này không thuộc nhóm của bạn', DT: null });
    }

    const hocVien = await db.hoc_vien.findByPk(hocVienId, { attributes: ['id', 'HoTen'] });
    if (!hocVien) return res.json({ EC: 0, EM: 'Không tìm thấy học viên', DT: { hoTen: null, records: [] } });

    const records = await db.kqsh_thisinh.findAll({
      where: { hocVienId },
      include: [{ model: db.kqsh_subjects, as: 'subjects' }],
      order: [['NgaySH', 'DESC']],
    });

    return res.json({ EC: 0, EM: 'OK', DT: { hoTen: hocVien.HoTen, records } });
  } catch (err) {
    next(err);
  }
};

export const getMyKQSH = async (req, res, next) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ EC: -1, EM: 'Chưa đăng nhập hoặc token không hợp lệ', DT: null });
    }

    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      attributes: ['id', 'SoCCCD', 'HoTen'],
    });

    if (!hocVien) {
      return res.json({ EC: 0, EM: 'Không tìm thấy thông tin học viên', DT: null });
    }

    if (!hocVien.SoCCCD) {
      return res.json({ EC: 0, EM: 'Chưa có CCCD', DT: null });
    }

    const records = await db.kqsh_thisinh.findAll({
      where: { SoCCCD: hocVien.SoCCCD.trim() },
      include: [{ model: db.kqsh_subjects, as: 'subjects' }],
      order: [['NgaySH', 'DESC']],
    });

    return res.json({
      EC: 0,
      EM: 'OK',
      DT: { hoTen: hocVien.HoTen, records },
    });
  } catch (err) {
    next(err);
  }
};
