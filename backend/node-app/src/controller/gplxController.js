import xlsx from 'xlsx';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import db from '../models/index.js';

const Gplx = db.Gplx;

const GPLX_SITE = 'https://gplx.csgt.bocongan.gov.vn';
const SITE_ID   = '2005782';
const FORM_TYPE = '565f96637f8b9af6558b4567';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Session store: sessionId → { cookieHeader, securityToken, expiresAt }
const sessionStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of sessionStore.entries()) {
        if (v.expiresAt < now) sessionStore.delete(k);
    }
}, 5 * 60 * 1000);

//------- helpers -------
const parseDate = (value) => {
    if (!value) return null;
    // JS Date object (từ cellDates: true)
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
    }
    // Excel serial number
    if (typeof value === 'number') {
        const d = xlsx.SSF.parse_date_code(value);
        if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    }
    const s = String(value).trim();
    // dd/mm/yyyy hoặc dd-mm-yyyy
    const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // mm/dd/yyyy (US format từ xlsx raw:false)
    const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m2) {
        // Heuristic: nếu m2[1] > 12 → là ngày, không phải tháng → dd/mm/yyyy
        if (parseInt(m2[1]) > 12) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
        // Còn lại coi là mm/dd/yyyy
        return `${m2[3]}-${m2[1].padStart(2,'0')}-${m2[2].padStart(2,'0')}`;
    }
    return null;
};

// "2026-02-23" hoặc "23/02/2026" → "23/02/2026"
const toDMY = (isoDate) => {
    if (!isoDate) return '';
    const s = String(isoDate).split('T')[0];
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    }
    return s; // đã ở dạng dd/mm/yyyy
};

// ------- 2captcha auto-solve -------
const solveCaptchaWith2captcha = async (imageBuffer) => {
    const apiKey = process.env.TWOCAPTCHA_API_KEY;
    if (!apiKey) return null;

    const base64 = Buffer.from(imageBuffer).toString('base64');

    // Gửi ảnh lên 2captcha
    const submitRes = await axios.post(
        'https://2captcha.com/in.php',
        new URLSearchParams({
            key: apiKey,
            method: 'base64',
            body: base64,
            json: '1',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    if (submitRes.data?.status !== 1) return null;
    const captchaId = submitRes.data.request;

    // Poll kết quả (tối đa 30s)
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const pollRes = await axios.get(
            `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaId}&json=1`,
            { timeout: 10000 }
        );
        if (pollRes.data?.status === 1) {
            console.log('[2captcha] solved:', pollRes.data.request);
            return pollRes.data.request;
        }
        if (pollRes.data?.request === 'ERROR_CAPTCHA_UNSOLVABLE') return null;
    }
    return null;
};

// ------- GPLX session: home + captcha -------
// Hàm nội bộ: tạo session thô, trả về đầy đủ cookie + token + captcha buffer
const buildRawSession = async () => {
    const homeRes = await axios.get(`${GPLX_SITE}/`, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'vi,en;q=0.9' },
        timeout: 15000,
    });

    const rawCookies = homeRes.headers['set-cookie'] || [];
    const cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');
    const $ = cheerio.load(homeRes.data);

    let securityToken = $('input[name="securityToken"]').val() || $('[name="securityToken"]').val() || '';
    if (!securityToken) {
        const html = homeRes.data;
        const match = html.match(/securityToken["'\s]*[:=]["'\s]*([a-f0-9]{32,128})/i)
            || html.match(/"securityToken"\s*:\s*"([a-f0-9]{32,128})"/i)
            || html.match(/securityToken\s*=\s*"([a-f0-9]{32,128})"/i)
            || html.match(/var\s+token\s*=\s*"([a-f0-9]{32,128})"/i);
        if (match) securityToken = match[1];
    }

    const captchaRes = await axios.get(
        `${GPLX_SITE}/api/Common/Captcha/getCaptcha?returnType=image&site=${SITE_ID}&width=150&height=50&codeLength=4&t=${Date.now()}`,
        {
            responseType: 'arraybuffer',
            headers: { 'Cookie': cookieHeader, 'Referer': `${GPLX_SITE}/`, 'Accept': 'image/*,*/*;q=0.8', 'User-Agent': UA, 'Accept-Language': 'vi,en;q=0.9' },
            timeout: 10000,
        }
    );

    const captchaCookies = (captchaRes.headers['set-cookie'] || []).map(c => c.split(';')[0]);
    const cookieMap = new Map();
    for (const c of cookieHeader.split('; ').concat(captchaCookies).filter(Boolean)) {
        const [k] = c.split('=');
        if (k) cookieMap.set(k.trim(), c);
    }
    const finalCookieHeader = Array.from(cookieMap.values()).join('; ');
    const autoSolvedCode = await solveCaptchaWith2captcha(captchaRes.data).catch(() => null);

    return {
        cookieHeader: finalCookieHeader,
        securityToken,
        captchaImageBuffer: captchaRes.data,
        contentType: captchaRes.headers['content-type'] || 'image/jpeg',
        autoSolvedCode,
    };
};

// Hàm public: tạo 1 session cho FE
const createGplxSession = async () => {
    const raw = await buildRawSession();
    if (raw.autoSolvedCode) console.log('[createGplxSession] auto-solved:', raw.autoSolvedCode);

    const captchaBase64 = `data:${raw.contentType};base64,${Buffer.from(raw.captchaImageBuffer).toString('base64')}`;
    const sessionId = randomUUID();
    sessionStore.set(sessionId, {
        cookieHeader: raw.cookieHeader,
        securityToken: raw.securityToken,
        expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return { sessionId, captchaBase64, autoSolvedCode: raw.autoSolvedCode };
};

// ------- submit lookup -------
// loaiXe: '1' = mô tô (không thời hạn), '2' = ô tô (có thời hạn)
const submitGplxLookup = async (soGplx, ngaySinh, captchaCode, cookieHeader, securityToken, loaiXe = '1') => {
    const body = new URLSearchParams({
        type: '',
        'fields[formTypeId]': FORM_TYPE,
        'fields[chooseGPLX]': loaiXe,
        'fields[codeGPLX]': soGplx,
        'fields[birthDate]': toDMY(ngaySinh),
        'fields[birthDateType2]': '',
        captcha_code: captchaCode,
        securityToken: securityToken,
        submitFormId: '8',
        moduleId: '8',
    });

    console.log('[submitGplxLookup] soGplx:', soGplx, '| birthDate:', toDMY(ngaySinh), '| captcha:', captchaCode || '(reusing session)');

    const apiRes = await axios.post(
        `${GPLX_SITE}/api/Project/GPLX/ApiSearchGPLX/sendRequest?site=${SITE_ID}`,
        body.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': cookieHeader,
                'Referer': `${GPLX_SITE}/`,
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': UA,
                'Accept': '*/*',
                'Accept-Language': 'vi,en;q=0.9',
            },
            timeout: 15000,
        }
    );

    const data = apiRes.data;
    console.log('[submitGplxLookup] response:', JSON.stringify(data)?.slice(0, 300));

    if (data === 'BotDetect') throw new Error('CAPTCHA_WRONG');
    return data;
};

// ------- controllers -------

// GET /api/gplx/captcha-session
export const getCaptchaSession = async (_req, res) => {
    try {
        const { sessionId, captchaBase64, autoSolvedCode } = await createGplxSession();
        return res.json({ EC: 0, DT: { sessionId, captchaBase64, autoSolvedCode } });
    } catch (err) {
        console.error('[getCaptchaSession]', err.message);
        return res.status(500).json({ EC: -1, EM: 'Không kết nối được tới server GPLX: ' + err.message });
    }
};

// GET /api/gplx/captcha-image/:sessionId  (proxy ảnh, giữ làm fallback)
export const getCaptchaImage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessionStore.get(sessionId);
        if (!session) return res.status(404).send('Session không tồn tại hoặc đã hết hạn');

        const imgRes = await axios.get(
            `${GPLX_SITE}/api/Common/Captcha/getCaptcha?returnType=image&site=${SITE_ID}&width=150&height=50&t=${Date.now()}`,
            {
                responseType: 'arraybuffer',
                headers: {
                    'Cookie': session.cookieHeader,
                    'Referer': `${GPLX_SITE}/`,
                    'Accept': 'image/*',
                    'User-Agent': UA,
                },
                timeout: 10000,
            }
        );

        res.set('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
        res.set('Cache-Control', 'no-store');
        return res.send(Buffer.from(imgRes.data));
    } catch (err) {
        console.error('[getCaptchaImage]', err.message);
        return res.status(500).send('Lỗi lấy captcha');
    }
};

// Hạng A (mô tô) → chooseGPLX = '2' (không thời hạn)
// Còn lại (ô tô) → chooseGPLX = '1' (có thời hạn)
const getChooseGPLX = (hang) => {
    if (!hang) return '1';
    return /^A/i.test(String(hang).trim()) ? '2' : '1';
};

// POST /api/gplx/lookup  { cccd, ngaySinh, captchaCode, sessionId, loaiXe }
// loaiXe: 'moto' → chooseGPLX='2', 'oto' → chooseGPLX='1'
export const lookupGPLX = async (req, res) => {
    try {
        const { cccd, ngaySinh, captchaCode, sessionId, loaiXe } = req.body;
        if (!cccd?.trim())        return res.status(400).json({ EC: -1, EM: 'Vui lòng nhập số CMND/CCCD' });
        if (!captchaCode?.trim()) return res.status(400).json({ EC: -1, EM: 'Vui lòng nhập mã captcha' });
        if (!sessionId)           return res.status(400).json({ EC: -1, EM: 'Session captcha không hợp lệ' });

        const session = sessionStore.get(sessionId);
        if (!session) return res.status(400).json({ EC: -1, EM: 'Phiên captcha hết hạn, vui lòng làm mới' });

        const { cookieHeader, securityToken } = session;
        sessionStore.delete(sessionId);

        const chooseGPLX = loaiXe === 'oto' ? '1' : '2'; // moto=2, oto=1

        const records = await Gplx.findAll({
            where: { so_cmnd_cccd: cccd.trim() },
            order: [['createdAt', 'ASC']],
        });

        if (!records.length) return res.json({ EC: 1, EM: 'Không tìm thấy thông tin GPLX trong hệ thống', DT: [] });

        let captchaFailed = false;
        const results = await Promise.all(records.map(async (r) => {
            const base = r.toJSON();
            if (!base.so_gplx) return { ...base, live: null };
            const birthDate = ngaySinh?.trim() || base.ngay_sinh;
            if (!birthDate) return { ...base, live: null, liveError: 'Thiếu ngày sinh để tra cứu' };
            try {
                const live = await submitGplxLookup(base.so_gplx, birthDate, captchaCode.trim(), cookieHeader, securityToken, chooseGPLX);

                // Cache vào cột tương ứng
                const updateData = { live_cached_at: new Date() };
                if (loaiXe === 'oto') updateData.live_oto = JSON.stringify(live);
                else updateData.live_moto = JSON.stringify(live);
                await r.update(updateData);

                return { ...base, live, loaiXe };
            } catch (e) {
                if (e.message === 'CAPTCHA_WRONG') captchaFailed = true;
                const errMsg = e.message === 'CAPTCHA_WRONG' ? 'Mã captcha sai, vui lòng thử lại' : e.message;
                return { ...base, live: null, liveError: errMsg };
            }
        }));

        if (captchaFailed) {
            return res.json({ EC: -1, EM: 'Mã captcha sai, vui lòng thử lại', DT: null });
        }

        return res.json({ EC: 0, EM: `Tìm thấy ${results.length} bằng lái`, DT: results });
    } catch (err) {
        console.error('[lookupGPLX]', err);
        return res.status(500).json({ EC: -1, EM: 'Lỗi server khi tra cứu' });
    }
};

// Normalize: NFC + lowercase + trim (fix Unicode diacritics mismatch)
const norm = (s) => String(s).normalize('NFC').toLowerCase().trim();

// Get cell value by column name (exact → NFC-normalize → includes)
const getCol = (row, ...keys) => {
    // 1. Exact match
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    // 2. Normalize both key and row column names, then compare
    const rowKeys = Object.keys(row).map(k => ({ orig: k, n: norm(k) }));
    for (const k of keys) {
        const kn = norm(k);
        const found = rowKeys.find(rk => rk.n === kn || rk.n.includes(kn) || kn.includes(rk.n));
        if (found && row[found.orig] !== undefined && row[found.orig] !== '') return row[found.orig];
    }
    return '';
};

export const importExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ EC: -1, EM: 'Không có file' });

        // Đọc 2 lần: raw=true để lấy số/Date, raw=false để lấy string ngày tháng
        const wb = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rowsRaw = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: true });
        const rowsStr = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

        if (!rowsRaw.length) return res.status(400).json({ EC: -1, EM: 'File trống' });

        // Log toàn bộ row đầu để debug
        console.log('[importExcel] ALL columns row[0] raw:', JSON.stringify(rowsRaw[0]));
        console.log('[importExcel] ALL columns row[0] str:', JSON.stringify(rowsStr[0]));

        let inserted = 0, updated = 0, errors = 0;
        for (let i = 0; i < rowsRaw.length; i++) {
            const rowR = rowsRaw[i];
            const rowS = rowsStr[i];
            try {
                const cccd = String(getCol(rowR,
                    'Số CMND/CCCD/Hộ chiếu', 'so_cmnd_cccd', 'CMND/CCCD', 'CCCD', 'Số CCCD', 'Số CMND'
                )).trim();
                if (!cccd || cccd === 'undefined') continue;

                // Lấy ngày sinh: ưu tiên string (rowS) vì dễ parse hơn, fallback về raw (Date/number)
                const ngaySinhStr = getCol(rowS,
                    'Ngày Sinh', 'Ngày sinh', 'ngay_sinh', 'NGÀY SINH', 'Năm sinh',
                    'Ngày, tháng, năm sinh', 'Ngày tháng năm sinh', 'Birthday', 'DOB'
                );
                const ngaySinhRaw = getCol(rowR,
                    'Ngày Sinh', 'Ngày sinh', 'ngay_sinh', 'NGÀY SINH', 'Năm sinh',
                    'Ngày, tháng, năm sinh', 'Ngày tháng năm sinh', 'Birthday', 'DOB'
                );
                // Dùng string trước, nếu parse được thì dùng, nếu không thì dùng raw
                const parsedNgaySinh = parseDate(ngaySinhStr) || parseDate(ngaySinhRaw);

                if (i === 0) {
                    console.log('[importExcel] ngaySinh str:', JSON.stringify(ngaySinhStr), '| raw:', JSON.stringify(ngaySinhRaw), '→ parsed:', parsedNgaySinh);
                }

                const data = {
                    ma_dang_ky:       String(getCol(rowR, 'Mã đăng ký', 'ma_dang_ky', 'Mã ĐK')).trim() || null,
                    ho_ten:           String(getCol(rowR, 'Họ và tên', 'ho_ten', 'Họ tên', 'Họ và Tên')).trim() || null,
                    so_cmnd_cccd:     cccd,
                    so_gplx:          String(getCol(rowR, 'Số GPLX', 'so_gplx', 'Số giấy phép lái xe', 'GPLX')).trim() || null,
                    hang:             String(getCol(rowR, 'Hạng', 'hang', 'Hạng GPLX', 'HANG')).trim() || null,
                    ket_qua_xac_thuc: String(getCol(rowR, 'Kết quả xác thực', 'ket_qua_xac_thuc', 'Kết quả')).trim() || null,
                    ly_do_tu_choi:    String(getCol(rowR, 'Lý do từ chối', 'ly_do_tu_choi', 'Lý do')).trim() || null,
                };
                if (parsedNgaySinh) data.ngay_sinh = parsedNgaySinh;

                const soGplx = data.so_gplx;
                const existing = await Gplx.findOne({
                    where: soGplx ? { so_cmnd_cccd: cccd, so_gplx: soGplx } : { so_cmnd_cccd: cccd },
                });
                if (existing) {
                    await existing.update(data);
                    updated++;
                } else {
                    await Gplx.create({ ...data, ngay_sinh: parsedNgaySinh });
                    inserted++;
                }
            } catch (e) { console.error('[importExcel] row error:', e.message); errors++; }
        }
        return res.json({ EC: 0, EM: `Import thành công: ${inserted} mới, ${updated} cập nhật, ${errors} lỗi`, DT: { inserted, updated, errors } });
    } catch (err) {
        console.error('[importExcel]', err);
        return res.status(500).json({ EC: -1, EM: 'Lỗi server khi import: ' + err.message });
    }
};

export const getList = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { count, rows } = await Gplx.findAndCountAll({
            limit, offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']],
        });
        return res.json({ EC: 0, EM: 'OK', DT: { total: count, page, limit, rows } });
    } catch (err) {
        return res.status(500).json({ EC: -1, EM: 'Lỗi server' });
    }
};

export default { getCaptchaSession, getCaptchaImage, importExcel, lookupGPLX, getList };
