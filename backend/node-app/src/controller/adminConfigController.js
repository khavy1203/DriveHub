import { getConfigByAdminId, upsertConfig, testConnection } from '../service/adminConfigService.js';

const resolveAdminId = (req) => {
  const name = req.user?.groupWithRoles?.name;
  if (name === 'Admin') return req.user.id;
  // SupperAdmin can query any adminId via param
  const paramId = parseInt(req.params?.adminId, 10);
  return Number.isFinite(paramId) ? paramId : null;
};

export const getAdminConfig = async (req, res, next) => {
  try {
    const adminId = resolveAdminId(req);
    if (!adminId) return res.status(400).json({ EC: -1, EM: 'Thiếu adminId', DT: null });
    const cfg = await getConfigByAdminId(adminId);
    return res.json({
      EC: 0,
      EM: '',
      DT: cfg
        ? {
            adminId: cfg.adminId,
            apiBaseUrl: cfg.apiBaseUrl,
            apiKey: cfg.apiKey || null,
            hasApiKey: Boolean(cfg.apiKey),
            lastTestedAt: cfg.lastTestedAt,
            lastTestStatus: cfg.lastTestStatus,
            lastTestMessage: cfg.lastTestMessage,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const saveAdminConfig = async (req, res, next) => {
  try {
    const adminId = resolveAdminId(req);
    if (!adminId) return res.status(400).json({ EC: -1, EM: 'Thiếu adminId', DT: null });
    const { apiBaseUrl, apiKey } = req.body;
    const record = await upsertConfig(adminId, { apiBaseUrl, apiKey });
    return res.json({ EC: 0, EM: 'Đã lưu cấu hình', DT: { adminId: record.adminId } });
  } catch (err) {
    next(err);
  }
};

export const testAdminConnection = async (req, res, next) => {
  try {
    const adminId = resolveAdminId(req);
    if (!adminId) return res.status(400).json({ EC: -1, EM: 'Thiếu adminId', DT: null });
    const overrideUrl = req.body?.apiBaseUrl || null;
    const result = await testConnection(adminId, overrideUrl);
    return res.json({ EC: result.ok ? 0 : -1, EM: result.message, DT: result.serverInfo ?? null });
  } catch (err) {
    next(err);
  }
};
