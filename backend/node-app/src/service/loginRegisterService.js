require("dotenv").config();
import db from '../models/index.js';//connectdb
import bcryptjs from 'bcryptjs';
import { Op } from 'sequelize';
import { getGroupWithRole } from './JWTService';
import { createJWT, verifyToken } from '../middleware/JWTaction';

const salt = bcryptjs.genSaltSync(10);

const hashUserPassword = (userPassword) => {
    return bcryptjs.hashSync(userPassword, salt);
}

const compareUserPassword = (userPassword, hashPassword) => {
    return bcryptjs.compareSync(userPassword, hashPassword);
}

const checkEmail = async (userEmail) => {
    let isExist = await db.user.findOne({
        where: { email: userEmail }
    });
    if (isExist) {
        return true;
    }
    return false;
}

const checkPhone = async (userPhone) => {
    let isExist = await db.user.findOne({
        where: { phone: userPhone }
    });
    if (isExist) {
        return true;
    }
    return false;
}

const resolveAvatarUrl = (user) => {
    if (!user || !user.image) {
        return null;
    }

    if (typeof user.image === 'string') {
        return user.image;
    }

    return null;
}

const registerNewUser = async (rawUserData) => {
    try {
        //check email/phone number are exist
        let emailExists = await checkEmail(rawUserData.email);
        if (emailExists === true) {
            return {
                EM: 'Email exist',
                EC: 1
            }
        }
        let phoneExists = await checkPhone(rawUserData.phone);
        if (phoneExists === true) {
            return {
                EM: 'Phone exist',
                EC: 1
            }
        }
        //hash user password
        let hashPassword = hashUserPassword(rawUserData.password);
        //crete new user
        await db.User.create({
            userEmail: rawUserData.email,
            userName: rawUserData.username,
            userPassword: hashPassword,
            phone: rawUserData.phone,
            groupId: 4
        });
        return {
            EM: 'Create new user successfully ',
            EC: '0'
        }
    } catch (e) {
        console.log("check error : ", e)
        return {
            EM: 'Something wrong ...',
            EC: '-2'
        }
    }
}
/** National ID: digits only, 8-20 chars (login with CCCD same as import default account). */
const looksLikeNationalId = (s) => /^\d{8,20}$/.test(s);

const findUserRowByCccd = async (cccd) => {
    // Check hoc_vien (students)
    const hv = await db.hoc_vien.findOne({
        where: { SoCCCD: cccd },
        attributes: ['userId'],
        raw: true,
    });
    if (hv?.userId) return db.user.findByPk(hv.userId, { raw: true });

    // Check instructor_profile (teachers / supper teachers)
    const ip = await db.instructor_profile.findOne({
        where: { cccd },
        attributes: ['userId'],
        raw: true,
    });
    if (ip?.userId) return db.user.findByPk(ip.userId, { raw: true });

    return null;
};

const loginUserService = async (rawUserAccount) => {
    try {
        const loginId = String(rawUserAccount.userEmail ?? '').trim();
        if (!loginId || !rawUserAccount.password) {
            return {
                EM: 'Your email/CCCD or password is incorrect',
                EC: 1,
                DT: '',
            };
        }

        let user = null;
        if (looksLikeNationalId(loginId)) {
            user = await findUserRowByCccd(loginId);
        }
        if (!user) {
            user = await db.user.findOne({
                where: {
                    [Op.or]: [{ email: loginId }, { phone: loginId }],
                },
                raw: true,
            });
        }

        if (!user) {
            return {
                EM: 'Your email/CCCD or password is incorrect',
                EC: 1,
                DT: '',
            };
        }

        const isCorrectPassword = compareUserPassword(rawUserAccount.password, user.password);
        if (!isCorrectPassword) {
            return {
                EM: 'Your email/CCCD or password is incorrect',
                EC: 1,
                DT: '',
            };
        }

        if (user.active === 0 || user.active === false) {
            return {
                EM: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
                EC: 1,
                DT: '',
            };
        }

        const groupWithRoles = await getGroupWithRole(user);
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            avatarUrl: resolveAvatarUrl(user),
            groupWithRoles,
        };
        const token = createJWT(payload);
        return {
            EM: 'ok',
            EC: 0,
            DT: {
                userId: user.id,
                access_token: token,
                groupWithRoles,
                email: user.email,
                username: user.username,
                avatarUrl: resolveAvatarUrl(user),
            },
        };
    } catch (e) {
        console.error('[loginUserService]', e);
        return {
            EM: 'Something wrong ...',
            EC: -2,
            DT: '',
        };
    }
};
module.exports = {
    registerNewUser,
    loginUserService,
    checkEmail,
    checkPhone,
    hashUserPassword,
    compareUserPassword
}