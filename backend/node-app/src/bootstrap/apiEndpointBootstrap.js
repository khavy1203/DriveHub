import db from '../models/index.js';
import { syncApiRegistryToDb, seedDefaultGroupApiPermissions } from '../service/apiPermissionService.js';

export async function ensureApiEndpointsBootstrapped() {
  try {
    console.log('[api_endpoint] Syncing API registry + seeding default permissions…');
    await syncApiRegistryToDb();
    await seedDefaultGroupApiPermissions();
    console.log('[api_endpoint] Sync complete.');
  } catch (e) {
    console.error('[api_endpoint] Bootstrap skipped:', e?.message || e);
  }
}
