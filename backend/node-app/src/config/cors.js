
require('dotenv').config();

const LOCAL_OR_IP = (hostname) => {
  const h = String(hostname).toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  return false;
};

/**
 * Each explicit origin in CORS_ORIGINS also allows its www ↔ apex twin
 * (e.g. listing https://driverhub.io.vn also allows https://www.driverhub.io.vn).
 * Skips localhost and numeric IPs.
 */
function buildAllowedOriginSet(list) {
  const set = new Set(list);
  for (const o of list) {
    try {
      const u = new URL(o);
      if (!/^https?:$/i.test(u.protocol)) continue;
      const host = u.hostname;
      if (LOCAL_OR_IP(host)) continue;

      const port = u.port ? `:${u.port}` : '';
      const proto = u.protocol;
      if (host.startsWith('www.')) {
        const apex = host.slice(4);
        set.add(`${proto}//${apex}${port}`);
      } else {
        set.add(`${proto}//www.${host}${port}`);
      }
    } catch {
      // ignore invalid URL
    }
  }
  return set;
}

const configCors = (app) => {
    const corsOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (corsOrigins.length === 0) {
        throw new Error('Missing required env: CORS_ORIGINS');
    }

    const allowedOrigins = buildAllowedOriginSet(corsOrigins);

    app.use(function (req, res, next) {
        const requestOrigin = req.headers.origin;
        const isAllowedOrigin =
            !requestOrigin || allowedOrigins.has(requestOrigin);

        if (!isAllowedOrigin) {
            return res.status(403).json({
                error: 'cors_forbidden',
                details: {
                    message: 'Origin is not allowed by CORS',
                    origin: requestOrigin,
                },
            });
        }

        if (requestOrigin) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
            res.setHeader('Vary', 'Origin');
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,x-auth-token');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    });
};

export default configCors;
