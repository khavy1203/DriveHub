require("dotenv").config();
import jwt from "jsonwebtoken";
import { ADMIN_ACCOUNT } from "../constants/constants.js";

const nonSecurePaths = [
    '/user/logout', '/user/login', '/user/register',
    '/students', '/students_SBD', '/students/status/bulk', '/students/update-processtest',
    '/course',
    '/status',
    '/file/qr/decode',
    '/rank/getRank',
    '/exam/create-exam',
    '/testpractice/receivetestpractice',
    '/traffic-check/lookup',
    '/gplx/lookup',
];

const createJWT = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {});
    } catch (e) {
        console.log("check error jwt token >>>", e);
    }
    return token;
}

const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let decoded = null;
    try {
        decoded = jwt.verify(token, key);
    } catch (error) {
        console.log("check error verify token", error);
    }
    return decoded;
}

const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.headers['x-auth-token']) {
        return req.headers['x-auth-token'];
    }
    return null;
}

const checkUserJwt = async (req, res, next) => {
    try {
        // Session probe for home / auth hydrate — never 401 when anonymous
        if (req.method === 'GET' && req.path === '/account') {
            const cookies = req.cookies || {};
            const token = cookies.jwt || cookies.auth_token || extractToken(req);
            if (token) {
                const decode = verifyToken(token);
                if (decode) {
                    req.user = decode;
                    req.token = token;
                }
            }
            return next();
        }

        if (req.method === 'GET') return next();
        if (nonSecurePaths.includes(req.path)) return next();

        let cookies = req.cookies || {};
        let token = cookies.jwt || cookies.auth_token || extractToken(req);

        if (!token) {
            return res.status(401).json({ EC: -1, DT: '', EM: 'Bạn phải đăng nhập' });
        }

        let decode = verifyToken(token);
        if (!decode) {
            return res.status(401).json({ EC: -1, DT: '', EM: 'Không thể xác thực người dùng' });
        }

        req.user = decode;
        req.token = token;
        next();
    } catch (err) {
        console.error('[JWTaction] Unexpected error:', err.message);
        return res.status(500).json({ EC: -1, DT: '', EM: 'Lỗi xác thực hệ thống' });
    }
}

const checkUserPermission = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (req.method === 'GET') return next();
    if (nonSecurePaths.includes(req.path) || req.path === '/account') return next();

    if (!req.user) {
        return res.status(401).json({ EC: -1, DT: '', EM: 'Không thể xác thực người dùng' });
    }

    if (req.user.email === ADMIN_ACCOUNT.email) return next();

    // SupperAdmin: full access — bypass API registry + group_api (still subject to JWT + route registration).
    if (req.user.groupWithRoles?.name === 'SupperAdmin') return next();

    const groupId = req.user.groupWithRoles?.id;
    if (!groupId) {
        return res.status(403).json({ EC: -1, DT: '', EM: 'Bạn chưa được Admin cho phép quyền truy cập' });
    }

    try {
        const db = require('../models');
        const { getCachedActiveEndpoints, matchEndpoint } = require('./apiEndpointCache.js');
        const endpoints = await getCachedActiveEndpoints(db);
        const requestPath = (req.originalUrl || '').split('?')[0];
        const matched = matchEndpoint(endpoints, req.method, requestPath);

        if (!matched) {
            return res.status(403).json({ EC: -1, DT: '', EM: 'API chưa được đăng ký trong hệ thống' });
        }

        if (matched.isPublic === true || matched.isPublic === 1) return next();

        const row = await db.group_api.findOne({
            where: { groupId, apiEndpointId: matched.id },
        });
        if (row) return next();

        return res.status(403).json({ EC: -1, DT: '', EM: 'Bạn không có quyền thực hiện thao tác này' });
    } catch (err) {
        console.error('[checkUserPermission] DB error:', err.message);
        return res.status(500).json({ EC: -1, DT: '', EM: 'Lỗi kiểm tra quyền' });
    }
};

module.exports = {
    createJWT,
    verifyToken,
    checkUserJwt,
    checkUserPermission
};
