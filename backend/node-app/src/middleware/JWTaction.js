require("dotenv").config();
import jwt from "jsonwebtoken";
import db from '../models/index.js';

const nonSecurePaths = [
    '/user/logout', '/user/login', '/user/register',
    '/students', '/students_SBD', '/students/status/bulk', '/students/update-processtest',
    '/course',
    '/status',
    '/file/qr/decode',
    '/rank/getRank',
    '/exam/create-exam',
    '/testpractice/receivetestpractice',
    '/gplx/lookup',
    '/traffic-check/lookup',
];

const createJWT = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {});
        console.log('chekc token JWT', token)
    } catch (e) {
        console.log("check error jwt token >>>", e)
    }
    return token;
}

const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let decoded = null;
    try {
        decoded = jwt.verify(token, key);
    } catch (error) {
        console.log("check error verify token", error)
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

const validateSessionFromDb = async (sessionId) => {
    if (!sessionId) return null;

    const session = await db.authsession.findOne({
        where: { sessionId, revoked: false },
        raw: true,
    });

    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
}

const checkUserJwt = async (req, res, next) => {
    try {

        console.log('=== REQUEST INFO ===');
        console.log('Method:', req.method);
        console.log('Path:', req.path);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Cookies:', req.cookies);
        console.log('Body:', req.body);
        console.log('Query:', req.query);
        if (req.method == 'GET' && req.path !== '/account') return next();
        if (nonSecurePaths.includes(req.path)) return next();

        let cookies = req.cookies || {};
        let tokenFromHeader = extractToken(req);
        let cookieToken = cookies.jwt || cookies.auth_token;
        if (cookieToken || tokenFromHeader) {
            let token = cookieToken || tokenFromHeader;
            if (cookieToken) {
                try {
                    const sessionId = cookies.session_id;
                    const session = await validateSessionFromDb(sessionId);
                    if (!session) {
                        return res.status(401).json({ EC: -1, DT: '', EM: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
                    }
                    req.session = session;
                } catch (dbErr) {
                    console.error('[JWTaction] Session DB error, falling back to JWT-only:', dbErr.message);
                }
            }

            let decode = verifyToken(token);
            if (decode) {
                req.user = decode;
                req.token = token;
                next();
            } else {
                return res.status(401).json({ EC: -1, DT: '', EM: 'Không thể xác thực người dùng' });
            }
        } else {
            return res.status(401).json({ EC: -1, DT: '', EM: 'Bạn phải đăng nhập' });
        }
    } catch (err) {
        console.error('[JWTaction] Unexpected error:', err.message);
        return res.status(500).json({ EC: -1, DT: '', EM: 'Lỗi xác thực hệ thống' });
    }
}

const checkUserPermission = (req, res, next) => {
    if (req.method == 'GET') return next();
    if (nonSecurePaths.includes(req.path) || req.path === "/account") return next();

    if (req.user) {
        let email = req.user.email;
        if (email === 'admin@gmail.com') return next();

        let roles = req.user.groupWithRoles.Roles;
        let currentUrl = req.path;
        console.log("check req.path", currentUrl);

        if (!roles || roles.length == 0) {
            return res.status(403).json({ EC: -1, DT: '', EM: 'Bạn chưa được Admin cho phép quyền truy cập' });
        }

        let canAccess = roles.some(item => item.url === currentUrl || currentUrl.includes(item.url));
        if (canAccess === true) {
            return next();
        } else {
            return res.status(403).json({ EC: -1, DT: '', EM: 'Bạn chưa được Admin cho phép quyền truy cập' });
        }
    } else {
        return res.status(401).json({ EC: -1, DT: '', EM: 'Không thể xác thực người dùng' });
    }
};

module.exports = {
    createJWT,
    verifyToken,
    checkUserJwt,
    checkUserPermission
};
