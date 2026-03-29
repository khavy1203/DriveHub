let cache = { at: 0, data: null };
const TTL_MS = 60_000;

export function invalidateApiEndpointCache() {
  cache = { at: 0, data: null };
}

export async function getCachedActiveEndpoints(db) {
  if (cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  const rows = await db.api_endpoint.findAll({
    where: { isActive: true },
    raw: true,
  });
  cache = { at: Date.now(), data: rows };
  return rows;
}

/**
 * Longest-prefix match for method + request path (full path e.g. /api/hocvien/1).
 */
export function matchEndpoint(endpoints, method, requestPath) {
  const m = String(method || 'GET').toUpperCase();
  const norm = requestPath.split('?')[0];
  const candidates = endpoints.filter((ep) => ep.method === m || ep.method === 'ALL');
  const matches = candidates.filter(
    (ep) => norm === ep.path || norm.startsWith(`${ep.path}/`),
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}
