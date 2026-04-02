import userApiServices from "../service/userAPIServices";
import db from '../models/index.js';
const readFunc = async (req, res) => {
    try {

        if (req.query.page && req.query.limit) {
            let page = req.query.page;
            let limit = req.query.limit;
            let data = await userApiServices.getUserWithPagination(+page, +limit);
            res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT,
            });
        }
        else {
            let data = await userApiServices.getAllUsers();
            res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT,
            });
        }

    } catch (e) {
        console.error("check readFunc: ", e);
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        })
    }
}
const createFunc = async (req, res) => {
    try {
        //check validate
        let data = await userApiServices.createUser(req.body);
        res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (e) {
        console.error("check error: ", e);
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        })
    }
}
const updateFunc = async (req, res) => {
    try {
        let data = await userApiServices.updateUser(req.body);
        res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (e) {
        console.error("check error: ", e);
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        })
    }
}
const deleteFunc = async (req, res) => {
    try {
        const id = req.query.id ?? req.body.id;
        let data = await userApiServices.deleteUser(id);
        res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (e) {
        console.error("check error: ", e);
        return res.status(500).json({
            EM: 'error from sever',//error message
            EC: '-1',//error code
            DT: ''
        })
    }
}
const getUserAccount = async (req, res) => {
    if (!req.user || !req.token) {
        return res.status(200).json({
            EM: 'ok',
            EC: 0,
            DT: {
                access_token: null,
                groupWithRoles: null,
                email: null,
                username: null,
                avatarUrl: null,
            },
        });
    }
    // Prefer teacher_profile.avatarUrl (file upload) over JWT-embedded image URL
    let avatarUrl = req.user.avatarUrl || null;
    try {
        const profile = await db.teacher_profile.findOne({
            where: { userId: req.user.id },
            attributes: ['avatarUrl'],
        });
        if (profile?.avatarUrl) avatarUrl = profile.avatarUrl;
    } catch { /* non-critical */ }

    // Also use latest username from DB in case it was updated after JWT was issued
    let username = req.user.username;
    try {
        const u = await db.user.findOne({ where: { id: req.user.id }, attributes: ['username'] });
        if (u?.username) ({ username } = u);
    } catch { /* non-critical */ }

    return res.status(200).json({
        EM: 'ok',
        EC: 0,
        DT: {
            access_token: req.token,
            userId: req.user.id ?? null,
            groupWithRoles: req.user.groupWithRoles,
            email: req.user.email,
            username,
            avatarUrl,
        },
    });
};
module.exports = {
    readFunc, createFunc, updateFunc, deleteFunc, getUserAccount

}