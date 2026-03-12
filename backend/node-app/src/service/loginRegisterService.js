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
    let isExist = await db.User.findOne({
        where: { userEmail: userEmail }
    });
    if (isExist) {
        return true;
    }
    return false;
}

const checkPhone = async (userPhone) => {
    let isExist = await db.User.findOne({
        where: { phone: userPhone }
    });
    if (isExist) {
        return true;
    }
    return false;
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
const loginUserService = async (rawUserAccount) => {
    try {
        let user = await db.user.findOne({
            where: {
                [Op.or]: [
                    { email: rawUserAccount.userEmail },
                    { phone: rawUserAccount.userEmail }
                ]
            },
            raw: true
        });
        if (user) {
            console.log("found user", user);
            let isCorrectPassword = compareUserPassword(rawUserAccount.password, user.password);
            // console.log('check rawUserAccount.password', rawUserAccount.password)
            // console.log('check user.password', user.password)
            // console.log('check isCorrectPassword', isCorrectPassword)
            if (isCorrectPassword === true) {
                //test roles
                let groupWithRoles = await getGroupWithRole(user);
                let payload = {
                    email: user.email,
                    username: user.username,
                    groupWithRoles,
                }
                console.log("check payload :>>>", payload);
                let token = createJWT(payload);
                return {
                    EM: 'ok',
                    EC: 0,
                    DT: {
                        userId: user.id,
                        access_token: token,
                        groupWithRoles: groupWithRoles,
                        email: user.userEmail,
                        username: user.userName
                    }
                }
            }
        }
        return {
            EM: 'Your email/phone number or password is incorrect',
            EC: '1',
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
module.exports = {
    registerNewUser,
    loginUserService,
    checkEmail,
    checkPhone,
    hashUserPassword
}