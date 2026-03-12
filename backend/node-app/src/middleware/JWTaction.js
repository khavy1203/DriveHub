require("dotenv").config();
import jwt from "jsonwebtoken";
import db from '../models/index.js';

const nonSecurePaths = [
    '/user/logout', '/user/login', '/user/register',

    //student
    '/students', '/students_SBD', '/students/status/bulk','/students/update-processtest',

    '/course',

    '/status',

    //file
    // '/file/namestandardizationfile',
    // '/file/createOrUpdateQuestion',
    // '/testStudent/processExcelAndInsert',
    '/file/qr/decode',

    //rank
    '/rank/getRank',
    '/exam/create-exam',
    '/testpractice/receivetestpractice',
];
//mảng này chứa các phần sẽ sẽ không đượccheck quyền

const createJWT = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {
            // expiresIn: process.env.JWT_EXPIRES_IN
        });
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
    return null;
}

const validateSessionFromDb = async (sessionId) => {
    if (!sessionId) {
        return null;
    }

    const session = await db.authsession.findOne({
        where: {
            sessionId,
            revoked: false,
        },
        raw: true,
    });

    if (!session) {
        return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
        return null;
    }

    return session;
}

const checkUserJwt = async (req, res, next) => {
    if (req.method == 'GET' && req.path !== '/account') {
        return next();
    }

    if (nonSecurePaths.includes(req.path)) return next();
    let cookies = req.cookies || {};
    let tokenFromHeader = extractToken(req);
    if ((cookies && cookies.jwt) || tokenFromHeader) {
        let token = cookies && cookies.jwt ? cookies.jwt : tokenFromHeader;

        if (cookies && cookies.jwt) {
            const sessionId = cookies.session_id;
            const session = await validateSessionFromDb(sessionId);
            if (!session) {
                return res.status(401).json({
                    EC: -1,
                    DT: '',
                    EM: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
                })
            }
            req.session = session;
        }

        let decode = verifyToken(token);
        if (decode) {
            req.user = decode;//check phần trung gian gửi dữ liệu từ trung gian sang thằng tiếp theo để xác thực, đính kèm req
            req.token = token;
            next();// chạy tiếp nè. bên phía sever sẽ nhận được xác thực từ thằng trong gian này, có đính kèm req.user
        } else {
            // nếu xác thực người dùng không đúng,(* trường hợp này là đã có cookie nhưng cookie không đúng)
            // return trạng thái luôn, để không chạy thằng sao. tới đây thì gợi là sever đã phản hồi
            return res.status(401).json({
                EC: -1,
                DT: '',
                EM: 'Không thể xác thực người dùng'
            })
        }
    }
    else {
        return res.status(401).json({
            EC: -1,
            DT: '',
            EM: 'Bạn phải đăng nhập'
        })
    }
}
const checkUserPermission = (req, res, next) => {
    // Bỏ qua kiểm tra quyền đối với các yêu cầu GET
    if (req.method == 'GET') {
        return next();
    }

    // Nếu đường dẫn thuộc các path không cần kiểm tra quyền hoặc là "/account" thì bỏ qua kiểm tra quyền
    if (nonSecurePaths.includes(req.path) || req.path === "/account") {
        return next(); // Cho phép tiếp tục mà không cần kiểm tra quyền
    }

    // Nếu có người dùng (req.user) thì kiểm tra quyền
    if (req.user) {
        let email = req.user.email; // Lấy email
        // Nếu là admin, cho phép truy cập mọi thứ
        if (email === 'admin@gmail.com') {
            return next();
        }

        let roles = req.user.groupWithRoles.Roles; // Lấy quyền của người dùng
        let currentUrl = req.path; // Lấy đường dẫn truy cập hiện tại
        console.log("check req.path", currentUrl);

        // Nếu người dùng không có quyền, trả về lỗi
        if (!roles || roles.length == 0) {
            return res.status(403).json({
                EC: -1,
                DT: '',
                EM: 'Bạn chưa được Admin cho phép quyền truy cập'
            });
        }

        // Kiểm tra quyền truy cập của người dùng
        let canAccess = roles.some(item => item.url === currentUrl || currentUrl.includes(item.url));
        if (canAccess === true) {
            return next(); // Nếu có quyền truy cập, cho phép tiếp tục
        } else {
            return res.status(403).json({
                EC: -1,
                DT: '',
                EM: 'Bạn chưa được Admin cho phép quyền truy cập'
            });
        }
    } else {
        // Nếu không có người dùng trong req, trả về lỗi 401
        return res.status(401).json({
            EC: -1,
            DT: '',
            EM: 'Không thể xác thực người dùng'
        });
    }
};


module.exports = {
    createJWT,
    verifyToken,
    checkUserJwt,
    checkUserPermission
};
