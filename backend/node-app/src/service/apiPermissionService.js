import db from '../models/index.js';
import { API_REGISTRY } from '../config/apiRegistry.js';
import { invalidateApiEndpointCache } from '../middleware/apiEndpointCache.js';

export async function syncApiRegistryToDb() {
  let created = 0;
  let updated = 0;
  let sortOrder = 0;
  for (const api of API_REGISTRY) {
    sortOrder += 1;
    const row = {
      method: api.method,
      path: api.path,
      pattern: api.pattern || api.path,
      featureGroup: api.featureGroup,
      description: api.description || null,
      isPublic: !!api.isPublic,
      isActive: api.isActive !== false,
      sortOrder: api.sortOrder ?? sortOrder,
    };
    const existing = await db.api_endpoint.findOne({
      where: { method: row.method, path: row.path },
    });
    if (existing) {
      await existing.update(row);
      updated += 1;
    } else {
      await db.api_endpoint.create(row);
      created += 1;
    }
  }
  invalidateApiEndpointCache();
  return { created, updated, total: API_REGISTRY.length };
}

async function ensureGroupApiLink(groupId, apiEndpointId, t) {
  await db.group_api.findOrCreate({
    where: { groupId, apiEndpointId },
    defaults: { groupId, apiEndpointId },
    transaction: t,
  });
}

function shouldSeedGiaoVien(ep) {
  if (ep.isPublic) return false;
  const { path, method } = ep;
  if (path.startsWith('/api/student-assignment')) return true;
  if (path.startsWith('/api/teacher-profile')) return true;
  if (path.startsWith('/api/teacher-avatar')) return true;
  if (path.startsWith('/api/teacher-course')) return true;
  if (path === '/api/teacher/my-students') return true;
  if (path.startsWith('/api/teacher/students')) return true;
  if (path.startsWith('/api/chat')) return true;
  if (path.startsWith('/api/training')) return true;
  if (method === 'GET' && path === '/api/hocvien') return true;
  if (method === 'PUT' && (path === '/api/hocvien' || path.startsWith('/api/hocvien/'))) return true;
  return false;
}

function shouldSeedHocVien(ep) {
  if (ep.isPublic) return false;
  const { path } = ep;
  if (path.startsWith('/api/hocvien/portal')) return true;
  if (path.startsWith('/api/student-portal')) return true;
  if (path.startsWith('/api/training')) return true;
  return false;
}

/**
 * Adds default group_api rows (findOrCreate) — does not remove existing assignments.
 */
export async function seedDefaultGroupApiPermissions() {
  const endpoints = await db.api_endpoint.findAll({ where: { isActive: true } });
  const groups = await db.group.findAll({ attributes: ['id', 'name'] });
  const byName = Object.fromEntries(groups.map((g) => [g.name, g.id]));

  const t = await db.sequelize.transaction();
  try {
    const supperId = byName.SupperAdmin;
    const adminId = byName.Admin;
    const gvId = byName.GiaoVien;
    const hvId = byName.HocVien;

    for (const ep of endpoints) {
      const plain = ep.get ? ep.get({ plain: true }) : ep;
      if (plain.isPublic) continue;

      // SupperAdmin: full access via middleware bypass — no group_api rows needed

      if (adminId) {
        const isSyncOnly =
          plain.method === 'POST' && plain.path === '/api/admin/permissions/api-endpoints/sync';
        if (!isSyncOnly) await ensureGroupApiLink(adminId, plain.id, t);
      }

      if (gvId && shouldSeedGiaoVien(plain)) await ensureGroupApiLink(gvId, plain.id, t);
      if (hvId && shouldSeedHocVien(plain)) await ensureGroupApiLink(hvId, plain.id, t);
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  invalidateApiEndpointCache();
}
