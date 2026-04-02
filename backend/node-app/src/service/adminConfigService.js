import axios from 'axios';
import db from '../models/index.js';

const TEST_TIMEOUT_MS = 10000;

export const getConfigByAdminId = async (adminId) => {
  return db.admin_server_config.findOne({ where: { adminId } });
};

const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return String(url).trim().replace(/\/connect\/?$/, '').replace(/\/$/, '') || null;
};

export const upsertConfig = async (adminId, { apiBaseUrl, apiKey }) => {
  const existing = await db.admin_server_config.findOne({ where: { adminId } });
  const updates = { apiBaseUrl: normalizeBaseUrl(apiBaseUrl) };
  if (apiKey !== undefined && apiKey !== null && apiKey !== '') updates.apiKey = apiKey;
  if (existing) {
    await existing.update(updates);
    return existing;
  }
  return db.admin_server_config.create({ adminId, ...updates });
};

export const testConnection = async (adminId, overrideUrl = null) => {
  const cfg = await db.admin_server_config.findOne({ where: { adminId } });
  const rawUrl = overrideUrl || cfg?.apiBaseUrl;
  if (!rawUrl) {
    return { ok: false, message: 'Chưa có cấu hình URL API', serverInfo: null };
  }

  const base = String(rawUrl).replace(/\/connect\/?$/, '').replace(/\/$/, '');
  const url = `${base}/connect`;

  try {
    const res = await axios.get(url, {
      timeout: TEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    const body = res.data;
    const ok = res.status < 500 && body?.EC === 0 && body?.DT?.status === 'connected';
    const serverInfo = ok ? (body.DT ?? null) : null;
    const message = ok
      ? (body.EM || 'Kết nối thành công')
      : body?.EC !== undefined
        ? (body.EM || `Máy chủ phản hồi EC=${body.EC}`)
        : `Máy chủ trả về lỗi HTTP ${res.status}`;

    const testResult = { lastTestedAt: new Date(), lastTestStatus: ok ? 'success' : 'error', lastTestMessage: message };
    if (cfg) await cfg.update(testResult);
    return { ok, message, serverInfo };
  } catch (err) {
    const message = err?.code === 'ECONNREFUSED'
      ? 'Không thể kết nối — máy chủ từ chối kết nối'
      : err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED'
        ? 'Kết nối quá thời gian chờ'
        : err?.message || 'Lỗi không xác định';
    if (cfg) await cfg.update({ lastTestedAt: new Date(), lastTestStatus: 'error', lastTestMessage: message });
    return { ok: false, message, serverInfo: null };
  }
};

/**
 * Returns the API base URL for a given adminId.
 * Falls back to process.env.TRAINING_API_BASE_URL if no DB config.
 * @param {number|null|undefined} adminId
 * @returns {Promise<string|null>}
 */
export const getApiBaseUrlForAdmin = async (adminId) => {
  if (adminId) {
    const cfg = await db.admin_server_config.findOne({
      where: { adminId },
      attributes: ['apiBaseUrl'],
    });
    if (cfg?.apiBaseUrl) return String(cfg.apiBaseUrl).replace(/\/connect\/?$/, '').replace(/\/$/, '');
  }
  const env = process.env.TRAINING_API_BASE_URL;
  if (!env || !String(env).trim()) return null;
  return String(env).replace(/\/$/, '');
};
