import crypto from 'crypto';
import db from '../models/index.js';//connectdb
import { checkEmail, checkPhone, hashUserPassword } from './loginRegisterService.js';
import mailService from './mailService.js';

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const buildSetupLink = (token) => {
    const base = process.env.FRONTEND_URL || 'https://localhost:3000';
    return `${base}/#/setup-password?token=${token}`;
};
const getUserWithPagination = async (page, limit) => {
    try {
        let offset = (page - 1) * limit;
        const { count, rows } = await db.user.findAndCountAll({
            offset: offset,
            limit: limit,
            attributes: ["id", "email", "username", "address", "phone", "groupId"],
            include: {
                model: db.group, attributes: ["id", "name", "description"]
            },
            order: [['id', 'DESC']]
        });
        //count tổng số bảng ghi, rows là mảng các phần tử
        let totalPages = Math.ceil(count / limit);
        let data = {
            totalRows: count,
            totalPages: totalPages,
            users: rows
        }

        return {
            EM: 'create page successfully',
            EC: '0',
            DT: data
        }
    } catch (e) {
        console.log("error from service : >>>", e);
        return {
            EM: 'Something wrong ...',
            EC: '-2',
            DT: ''
        }
    }
}
const TEACHER_GROUP_ID = 3;

const getAllUsers = async (adminId = null) => {
    try {
        const where = { groupId: TEACHER_GROUP_ID };
        if (adminId) {
            const { Op } = require('sequelize');
            const stIds = await db.user.findAll({
                where: { groupId: 6, adminId },
                attributes: ['id'],
                raw: true,
            }).then(rows => rows.map(r => r.id));
            where.superTeacherId = stIds.length > 0 ? { [Op.in]: stIds } : -1;
        }

        let users = await db.user.findAll({
            where,
            attributes: ['id', 'email', 'username', 'address', 'phone', 'groupId', 'active', 'superTeacherId'],
            include: [
                {
                    model: db.group,
                    attributes: ['name', 'description'],
                },
                {
                    model: db.user,
                    as: 'superTeacher',
                    attributes: ['id', 'username', 'email'],
                    required: false,
                },
            ],
            order: [['id', 'ASC']],
        });

        if (users) {
            return {
                EM: 'get data successfully',
                EC: 0,
                DT: users.map(u => u.get({ plain: true })),
            };
        }
        return {
            EM: 'get data fail',
            EC: -1,
            DT: []
        }

    } catch (e) {
        console.log("error from service : >>>", e);
        return {
            EM: 'Something wrong ...',
            EC: -2,
            DT: ''
        }
    }
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createUser = async (data) => {
    try {
        if (!data.email || !EMAIL_RE.test(data.email)) {
            return {
                EM: 'Email không hợp lệ',
                EC: 1,
                DT: 'email'
            }
        }
        if (await checkEmail(data.email) === true) {
            return {
                EM: 'Email đã tồn tại',
                EC: 1,
                DT: 'email'
            }
        }
        if (data.phone && await checkPhone(data.phone) === true) {
            return {
                EM: 'Số điện thoại đã tồn tại',
                EC: 1,
                DT: 'phone'
            }
        }
        const setupToken = crypto.randomBytes(32).toString('hex');
        const setupTokenExpiry = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
        const tempPassword = data.password
            ? hashUserPassword(data.password)
            : hashUserPassword(crypto.randomBytes(16).toString('hex'));

        await db.user.create({
            email: data.email,
            username: data.username,
            password: tempPassword,
            address: data.address || null,
            phone: data.phone || null,
            groupId: TEACHER_GROUP_ID,
            superTeacherId: data.superTeacherId || null,
            setupToken,
            setupTokenExpiry,
        });

        // Gửi email setup (không block response)
        mailService.sendSetupEmail({
            toEmail: data.email,
            hoTen: data.username,
            setupLink: buildSetupLink(setupToken),
            role: 'giáo viên',
        }).catch(err => console.error('[userAPIServices] Gửi email lỗi:', err.message));

        return {
            EM: 'Tạo tài khoản thành công',
            EC: 0,
            DT: ''
        }
    } catch (e) {
        console.log("error from service : >>>", e);
        return {
            EM: 'Something wrong ...',
            EC: '-2',
            DT: ''
        }
    }
}
const updateUser = async (user) => {
    try {
        let findUser = await db.user.findOne({ where: { id: user.id } });
        if (findUser) {
            findUser.set({
                username: user.username,
                address: user.address || null,
                phone: user.phone || null,
                superTeacherId: user.superTeacherId !== undefined ? (user.superTeacherId || null) : findUser.superTeacherId,
            });
            if (user.password) {
                findUser.set({ password: hashUserPassword(user.password) });
            }
            await findUser.save();
            return {
                EM: 'Cập nhật thành công',
                EC: 0,
                DT: ''
            }
        }
        return {
            EM: 'Không tìm thấy tài khoản',
            EC: 1,
            DT: ''
        }

    } catch (e) {
        console.log("error from service : >>>", e);
        return {
            EM: 'Something wrong ...',
            EC: '-2',
            DT: ''
        }
    }
}
const deleteUser = async (id) => {
    try {
        const user = await db.user.findOne({ where: { id: id } });

        if (user) {
            await user.destroy();
            return {
                EM: 'Delete successfully',
                EC: '0',
                DT: []
            }
        } else {
            return {
                EM: 'No user find',
                EC: '1',
                DT: []
            }
        }

    } catch (e) {
        console.log("error from service delete: >>>", e);
        return {
            EM: 'Something wrong ...',
            EC: '-2',
            DT: ''
        }
    }
}
module.exports = {
    getAllUsers, createUser, updateUser, deleteUser, getUserWithPagination
}