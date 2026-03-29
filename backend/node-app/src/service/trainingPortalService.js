import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 15000;

const getTimeoutMs = () => {
  const n = parseInt(process.env.TRAINING_API_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
};

const getBaseUrl = () => {
  const u = process.env.TRAINING_API_BASE_URL;
  if (!u || !String(u).trim()) return null;
  return String(u).replace(/\/$/, '');
};

export const isTrainingApiConfigured = () => Boolean(getBaseUrl());

/**
 * @param {string} cccd
 * @returns {Promise<import('axios').AxiosResponse<unknown>>}
 */
export const fetchPublicStudent = async (cccd) => {
  const base = getBaseUrl();
  if (!base) {
    const err = new Error('TRAINING_API_BASE_URL is not set');
    err.code = 'TRAINING_CONFIG';
    throw err;
  }
  const url = `${base}/api/public/student`;
  return axios.get(url, {
    params: { cccd },
    timeout: getTimeoutMs(),
    validateStatus: () => true,
  });
};

/**
 * @param {{ maDK?: string, cccd?: string, ngay: string, thoiDiemDangNhap: string, thoiDiemDangXuat: string }} params
 * @returns {Promise<import('axios').AxiosResponse<unknown>>}
 */
export const fetchPublicSessionDetail = async ({ maDK, cccd, ngay, thoiDiemDangNhap, thoiDiemDangXuat }) => {
  const base = getBaseUrl();
  if (!base) {
    const err = new Error('TRAINING_API_BASE_URL is not set');
    err.code = 'TRAINING_CONFIG';
    throw err;
  }
  const url = `${base}/api/public/session-detail`;
  const params = { ngay, thoiDiemDangNhap, thoiDiemDangXuat };
  if (maDK) params.maDK = maDK;
  else if (cccd) params.cccd = cccd;
  return axios.get(url, { params, timeout: getTimeoutMs(), validateStatus: () => true });
};

/**
 * @param {string} pathParam
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
export const fetchPublicAvatar = async (pathParam) => {
  const base = getBaseUrl();
  if (!base) {
    const err = new Error('TRAINING_API_BASE_URL is not set');
    err.code = 'TRAINING_CONFIG';
    throw err;
  }
  const url = `${base}/api/public/avatar`;
  const res = await axios.get(url, {
    params: { path: pathParam },
    timeout: getTimeoutMs(),
    responseType: 'arraybuffer',
    validateStatus: (s) => s >= 200 && s < 400,
  });
  if (res.status < 200 || res.status >= 400) {
    const err = new Error(`Avatar upstream status ${res.status}`);
    err.code = 'TRAINING_UPSTREAM';
    throw err;
  }
  const contentType = res.headers['content-type'] || 'image/jpeg';
  return { buffer: Buffer.from(res.data), contentType };
};
