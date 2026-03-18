require('dotenv').config();
import axios from 'axios';
import db from '../models/index.js';
import { getGroupWithRole } from '../service/JWTService';
import { createJWT } from '../middleware/JWTaction';
import loginRegisterService from '../service/loginRegisterService';
import authSessionService from '../service/authSessionService';

const OAUTH_TIMEOUT = Number(process.env.MEZON_TIMEOUT_MS || 10000);
const STATE_REGEX = /^[A-Za-z0-9]{11}$/;

const requireEnv = (key) => {
    const value = process.env[key];
    if (!value || !String(value).trim()) {
        throw new Error(`Missing required env: ${key}`);
    }
    return value;
};

const parsePositiveIntEnv = (key, fallback) => {
    const raw = process.env[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return fallback;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid env ${key}. Expected a positive integer.`);
    }
    return parsed;
};

const DEFAULT_MEZON_USER_PROFILE = {
    address: '',
    phone: null,
    genderId: parsePositiveIntEnv('DEFAULT_MEZON_USER_GENDER_ID', 1),
    groupId: parsePositiveIntEnv('DEFAULT_MEZON_USER_GROUP_ID', 3),
    active: parsePositiveIntEnv('DEFAULT_MEZON_USER_ACTIVE', 1),
};

const buildCookieOptions = () => ({
    maxAge: Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
});

const pickMezonUser = (userinfo = {}) => {
    const mezonId = userinfo.user_id || null;
    const email = userinfo.email || null;
    const avatarUrl = userinfo.avatar || null;
    const username =
        userinfo.username ||
        userinfo.display_name ||
        userinfo.name ||
        userinfo.global_name ||
        (email ? email.split('@')[0] : null);

    return {
        mezonId,
        email,
        avatarUrl,
        username,
        raw: userinfo,
    };
};

const createDefaultProfileIfNeeded = async ({ mezonId, email, username }) => {
    if (!email || !username) {
        throw new Error('Unable to resolve Mezon user identity');
    }

    let user = await db.user.findOne({
        where: { email },
        raw: true,
    });

    let isNewUser = false;
    if (!user) {
        const randomPassword = `mezon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const hashedPassword = loginRegisterService.hashUserPassword(randomPassword);

        const createdUser = await db.user.create({
            email,
            password: hashedPassword,
            username,
            ...DEFAULT_MEZON_USER_PROFILE,
            githubId: mezonId ? String(mezonId) : null,
        });

        user = createdUser.get({ plain: true });
        isNewUser = true;
    }

    return { user, isNewUser };
};

const exchangeCode = async (req, res) => {
    try {
        const { code, state } = req.body || {};
        const redirect_uri = requireEnv('REDIRECT_URI'); // Luôn dùng URI cứng từ server

        if (!code || !state) {
            return res.status(400).json({
                error: 'invalid_request',
                details: {
                    message: 'Missing required fields: code, state',
                },
            });
        }

        if (!STATE_REGEX.test(state)) {
            return res.status(400).json({
                error: 'invalid_state',
                details: {
                    message: 'state must be exactly 11 alphanumeric characters',
                },
            });
        }

        const clientId = requireEnv('MEZON_CLIENT_ID');
        const clientSecret = requireEnv('MEZON_CLIENT_SECRET');

        const tokenUrl = requireEnv('MEZON_TOKEN_URL');
        const userInfoUrl = requireEnv('MEZON_USERINFO_URL');

        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('code', code);
        body.set('state', state);
        body.set('redirect_uri', redirect_uri);
        body.set('client_id', clientId);
        body.set('client_secret', clientSecret);

        const tokenResponse = await axios.post(tokenUrl, body.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: OAUTH_TIMEOUT,
        });

        const accessToken = tokenResponse?.data?.access_token;
        if (!accessToken) {
            return res.status(502).json({
                error: 'token_exchange_failed',
                details: tokenResponse?.data || {},
            });
        }

        const userinfoResponse = await axios.get(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            timeout: OAUTH_TIMEOUT,
        });

        const mezonUser = pickMezonUser(userinfoResponse?.data || {});
        const { user, isNewUser } = await createDefaultProfileIfNeeded(mezonUser);

        const groupWithRoles = await getGroupWithRole(user);
        const payload = {
            email: user.email,
            username: user.username,
            avatarUrl: mezonUser.avatarUrl,
            groupWithRoles,
        };

        const token = createJWT(payload);
        const cookieOptions = buildCookieOptions();
        const session = await authSessionService.createSession({
            userId: user.id,
            req,
        });

        res.cookie('jwt', token, cookieOptions);
        res.cookie('session_id', session.sessionId, cookieOptions);

        return res.status(200).json({
            EC: 0,
            EM: 'ok',
            DT: {
                userId: user.id,
                access_token: token,
                groupWithRoles,
                email: user.email,
                username: user.username,
                avatarUrl: mezonUser.avatarUrl,
                isNewUser,
                mezonUser: mezonUser.raw,
            },
        });
    } catch (error) {
        const statusCode = error?.response?.status || 500;
        const errorPayload = error?.response?.data || null;

        return res.status(statusCode).json({
            error: errorPayload?.error || 'mezon_exchange_failed',
            details: errorPayload || {
                message: error.message || 'Unknown error',
            },
        });
    }
};

module.exports = {
    exchangeCode,
};
