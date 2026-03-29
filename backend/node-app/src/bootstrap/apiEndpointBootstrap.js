import db from '../models/index.js';
import { syncApiRegistryToDb, seedDefaultGroupApiPermissions } from '../service/apiPermissionService.js';

export async function ensureApiEndpointsBootstrapped() {
  try {
    const n = await db.api_endpoint.count();
    if (n > 0) return;
    console.log('[api_endpoint] Empty table — bootstrapping from API_REGISTRY…');
    await syncApiRegistryToDb();
    await seedDefaultGroupApiPermissions();
  } catch (e) {
    console.error('[api_endpoint] Bootstrap skipped:', e?.message || e);
  }
}
