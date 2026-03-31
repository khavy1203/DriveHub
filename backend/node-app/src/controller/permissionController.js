import db from '../models/index.js';
import { verifyToken } from '../middleware/JWTaction.js';
import { invalidateApiEndpointCache } from '../middleware/apiEndpointCache.js';
import { syncApiRegistryToDb, seedDefaultGroupApiPermissions } from '../service/apiPermissionService.js';

const SYSTEM_GROUP_IDS = [1, 2, 3, 4, 5, 6];
const PROTECTED_GROUP_NAMES = ['SupperAdmin', 'Admin', 'GiaoVien', 'HocVien', 'KhachHang', 'SupperTeacher'];
const PROTECTED_EMAIL = 'admin@gmail.com';

// GET requests bypass checkUserJwt, so req.user is not populated — resolve token manually
const resolveUser = (req) => {
  if (req.user) return req.user;
  const token =
    req.cookies?.jwt ||
    req.cookies?.auth_token ||
    req.headers?.authorization?.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
};

const isAdminOrSupper = (req) => {
  const user = resolveUser(req);
  const name = user?.groupWithRoles?.name;
  return name === 'SupperAdmin' || name === 'Admin';
};

const isSupperAdmin = (req) => {
  const user = resolveUser(req);
  return user?.groupWithRoles?.name === 'SupperAdmin';
};

// ── Groups ──────────────────────────────────────────────────────────────────

export const getGroups = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  try {
    const plain = await db.group.findAll({
      include: [{ model: db.role, through: { attributes: [] } }],
    });
    const withCount = await Promise.all(plain.map(async (g) => {
      const count = await db.user.count({ where: { groupId: g.id } });
      return { ...g.toJSON(), userCount: count };
    }));

    return res.json({ EC: 0, EM: 'OK', DT: withCount });
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { name, description, roleIds = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ EC: -1, EM: 'Tên nhóm không được để trống', DT: null });

  try {
    const existing = await db.group.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(400).json({ EC: -1, EM: 'Tên nhóm đã tồn tại', DT: null });

    const group = await db.group.create({ name: name.trim(), description: description?.trim() || null });

    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const inserts = roleIds.map(roleId => ({ groupId: group.id, roleId }));
      await db.group_role.bulkCreate(inserts);
    }

    return res.json({ EC: 0, EM: 'Tạo nhóm thành công', DT: group });
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const group = await db.group.findByPk(id);
    if (!group) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy nhóm', DT: null });

    if (PROTECTED_GROUP_NAMES.includes(group.name) && name && name.trim() !== group.name) {
      return res.status(400).json({ EC: -1, EM: 'Không thể đổi tên nhóm hệ thống', DT: null });
    }

    await group.update({
      name: name?.trim() || group.name,
      description: description !== undefined ? description?.trim() || null : group.description,
    });

    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: group });
  } catch (err) {
    next(err);
  }
};

export const deleteGroup = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;

  try {
    const groupId = Number(id);
    if (SYSTEM_GROUP_IDS.includes(groupId)) {
      return res.status(400).json({ EC: -1, EM: 'Không thể xóa nhóm mặc định của hệ thống', DT: null });
    }

    const userCount = await db.user.count({ where: { groupId } });
    if (userCount > 0) {
      return res.status(400).json({ EC: -1, EM: `Nhóm còn ${userCount} thành viên, không thể xóa`, DT: null });
    }

    await db.group_api.destroy({ where: { groupId } });
    await db.group_role.destroy({ where: { groupId } });
    await db.group.destroy({ where: { id: groupId } });

    return res.json({ EC: 0, EM: 'Xóa nhóm thành công', DT: null });
  } catch (err) {
    next(err);
  }
};

// ── Roles ───────────────────────────────────────────────────────────────────

export const getRoles = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  try {
    const roles = await db.role.findAll({
      include: [{ model: db.group, through: { attributes: [] }, attributes: ['id', 'name'] }],
    });
    return res.json({ EC: 0, EM: 'OK', DT: roles });
  } catch (err) {
    next(err);
  }
};

export const createRole = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { url, description } = req.body;

  if (!url?.trim() || !url.startsWith('/')) {
    return res.status(400).json({ EC: -1, EM: 'URL phải bắt đầu bằng /', DT: null });
  }

  try {
    const existing = await db.role.findOne({ where: { url: url.trim() } });
    if (existing) return res.status(400).json({ EC: -1, EM: 'URL đã tồn tại', DT: null });

    const role = await db.role.create({ url: url.trim(), description: description?.trim() || null });
    return res.json({ EC: 0, EM: 'Tạo quyền thành công', DT: role });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  const { url, description } = req.body;

  try {
    const role = await db.role.findByPk(id);
    if (!role) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy quyền', DT: null });

    if (url && !url.startsWith('/')) {
      return res.status(400).json({ EC: -1, EM: 'URL phải bắt đầu bằng /', DT: null });
    }

    if (url && url.trim() !== role.url) {
      const dup = await db.role.findOne({ where: { url: url.trim() } });
      if (dup) return res.status(400).json({ EC: -1, EM: 'URL đã tồn tại', DT: null });
    }

    await role.update({
      url: url?.trim() || role.url,
      description: description !== undefined ? description?.trim() || null : role.description,
    });

    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: role });
  } catch (err) {
    next(err);
  }
};

export const deleteRole = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  const t = await db.sequelize.transaction();
  try {
    await db.group_role.destroy({ where: { roleId: id }, transaction: t });
    const deleted = await db.role.destroy({ where: { id }, transaction: t });
    if (!deleted) {
      await t.rollback();
      return res.status(404).json({ EC: -1, EM: 'Không tìm thấy quyền', DT: null });
    }
    await t.commit();
    return res.json({ EC: 0, EM: 'Xóa quyền thành công', DT: null });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// ── Group-Role Assignment ────────────────────────────────────────────────────

export const getGroupRoles = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  try {
    const group = await db.group.findByPk(id, {
      include: [{ model: db.role, through: { attributes: [] } }],
    });
    if (!group) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy nhóm', DT: null });
    return res.json({ EC: 0, EM: 'OK', DT: group.roles });
  } catch (err) {
    next(err);
  }
};

export const setGroupRoles = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  const { roleIds } = req.body;

  if (!Array.isArray(roleIds)) {
    return res.status(400).json({ EC: -1, EM: 'roleIds phải là mảng số nguyên', DT: null });
  }

  const t = await db.sequelize.transaction();
  try {
    const group = await db.group.findByPk(id, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ EC: -1, EM: 'Không tìm thấy nhóm', DT: null });
    }

    await db.group_role.destroy({ where: { groupId: id }, transaction: t });

    if (roleIds.length > 0) {
      const inserts = roleIds.map(roleId => ({ groupId: Number(id), roleId: Number(roleId) }));
      await db.group_role.bulkCreate(inserts, { transaction: t });
    }

    await t.commit();
    return res.json({ EC: 0, EM: 'Cập nhật phân quyền thành công', DT: null });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// ── Users ────────────────────────────────────────────────────────────────────

export const getPermissionUsers = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const search = (req.query.search || '').trim();
  const groupId = req.query.groupId ? Number(req.query.groupId) : null;

  const where = {};
  if (search) {
    where[db.Sequelize.Op.or] = [
      { email: { [db.Sequelize.Op.like]: `%${search}%` } },
      { username: { [db.Sequelize.Op.like]: `%${search}%` } },
    ];
  }
  if (groupId) where.groupId = groupId;

  try {
    const { count, rows } = await db.user.findAndCountAll({
      where,
      include: [{ model: db.group, attributes: ['id', 'name'] }],
      attributes: ['id', 'email', 'username', 'phone', 'active', 'groupId'],
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
    });

    return res.json({
      EC: 0,
      EM: 'OK',
      DT: { total: count, page, limit, users: rows },
    });
  } catch (err) {
    next(err);
  }
};

export const setUserGroup = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });

  const { id } = req.params;
  const { groupId } = req.body;

  if (!groupId) return res.status(400).json({ EC: -1, EM: 'groupId là bắt buộc', DT: null });

  try {
    const target = await db.user.findByPk(id, { attributes: ['id', 'email', 'groupId'] });
    if (!target) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy người dùng', DT: null });

    if (target.email === PROTECTED_EMAIL) {
      return res.status(400).json({ EC: -1, EM: 'Không thể thay đổi nhóm của tài khoản hệ thống', DT: null });
    }

    if (String(target.id) === String(req.user?.id)) {
      return res.status(400).json({ EC: -1, EM: 'Không thể thay đổi nhóm của chính mình', DT: null });
    }

    const group = await db.group.findByPk(groupId, { attributes: ['id', 'name'] });
    if (!group) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy nhóm', DT: null });

    await target.update({ groupId });
    return res.json({ EC: 0, EM: 'Đổi nhóm thành công. Người dùng cần đăng nhập lại để có quyền mới.', DT: { groupId, groupName: group.name } });
  } catch (err) {
    next(err);
  }
};

// ── API endpoint registry & group–API matrix ────────────────────────────────

export const syncApiEndpoints = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  try {
    const { created, updated, total } = await syncApiRegistryToDb();
    await seedDefaultGroupApiPermissions();
    return res.json({
      EC: 0,
      EM: 'Sync thành công',
      DT: { synced: created, updated, total },
    });
  } catch (err) {
    next(err);
  }
};

export const getApiEndpoints = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  try {
    const rows = await db.api_endpoint.findAll({
      include: [{
        model: db.group,
        as: 'groups',
        through: { attributes: [] },
        attributes: ['id'],
      }],
      order: [['featureGroup', 'ASC'], ['sortOrder', 'ASC'], ['path', 'ASC']],
    });
    const DT = rows.map((r) => {
      const j = r.toJSON();
      j.groupIds = (j.groups || []).map((g) => g.id);
      delete j.groups;
      j.isPublic = !!j.isPublic;
      j.isActive = !!j.isActive;
      return j;
    });
    return res.json({ EC: 0, EM: 'OK', DT });
  } catch (err) {
    next(err);
  }
};

export const updateApiEndpoint = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { id } = req.params;
  const { isPublic, isActive, description, sortOrder } = req.body;
  try {
    const row = await db.api_endpoint.findByPk(id);
    if (!row) return res.status(404).json({ EC: -1, EM: 'Không tìm thấy', DT: null });
    await row.update({
      ...(isPublic !== undefined ? { isPublic: !!isPublic } : {}),
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
    });
    invalidateApiEndpointCache();
    return res.json({ EC: 0, EM: 'OK', DT: row });
  } catch (err) {
    next(err);
  }
};

export const getGroupApiMatrix = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  try {
    const groups = await db.group.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']],
    });
    const endpoints = await db.api_endpoint.findAll({
      order: [['featureGroup', 'ASC'], ['sortOrder', 'ASC'], ['path', 'ASC']],
    });
    const links = await db.group_api.findAll({ attributes: ['groupId', 'apiEndpointId'] });
    const matrix = {};
    for (const g of groups) matrix[g.id] = [];
    for (const l of links) {
      if (!matrix[l.groupId]) matrix[l.groupId] = [];
      matrix[l.groupId].push(l.apiEndpointId);
    }
    const epJson = endpoints.map((e) => {
      const j = e.toJSON();
      j.isPublic = !!j.isPublic;
      j.isActive = !!j.isActive;
      return j;
    });
    const groupsJson = groups.map((g) => ({
      ...g.toJSON(),
      isFullAccess: g.name === 'SupperAdmin',
    }));
    return res.json({
      EC: 0,
      EM: 'OK',
      DT: { groups: groupsJson, endpoints: epJson, matrix },
    });
  } catch (err) {
    next(err);
  }
};

export const setGroupApiPermissions = async (req, res, next) => {
  if (!isAdminOrSupper(req)) return res.status(403).json({ EC: -1, EM: 'Không có quyền', DT: null });
  const { groupId, apiEndpointIds } = req.body;
  if (!groupId || !Array.isArray(apiEndpointIds)) {
    return res.status(400).json({ EC: -1, EM: 'groupId và apiEndpointIds (mảng) là bắt buộc', DT: null });
  }
  const t = await db.sequelize.transaction();
  try {
    const g = await db.group.findByPk(groupId, { transaction: t });
    if (!g) {
      await t.rollback();
      return res.status(404).json({ EC: -1, EM: 'Không tìm thấy nhóm', DT: null });
    }
    if (g.name === 'SupperAdmin') {
      await t.rollback();
      return res.status(400).json({ EC: -1, EM: 'SupperAdmin có toàn quyền, không cần cấu hình phân quyền API', DT: null });
    }
    await db.group_api.destroy({ where: { groupId }, transaction: t });
    if (apiEndpointIds.length > 0) {
      await db.group_api.bulkCreate(
        apiEndpointIds.map((apiEndpointId) => ({ groupId, apiEndpointId: Number(apiEndpointId) })),
        { transaction: t },
      );
    }
    await t.commit();
    invalidateApiEndpointCache();
    return res.json({ EC: 0, EM: 'Cập nhật thành công', DT: null });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
