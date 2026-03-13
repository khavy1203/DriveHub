require("dotenv").config();
import jwt from "jsonwebtoken";

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
        if (req.method === 'GET' && req.path !== '/account') return next();
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

const checkUserPermission = (req, res, next) => {
    if (req.method === 'GET') return next();
    if (nonSecurePaths.includes(req.path) || req.path === "/account") return next();

    if (req.user) {
        let email = req.user.email;
        if (email === process.env.ADMIN_EMAIL) return next();

        let roles = req.user.groupWithRoles.Roles;
        let currentUrl = req.path;

        if (!roles || roles.length == 0) {
            return res.status(403).json({ EC: -1, DT: '', EM: 'Bạn chưa được Admin cho phép quyền truy cập' });
        }

        let canAccess = roles.some(item => item.url === currentUrl || currentUrl.includes(item.url));
        if (canAccess) {
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
