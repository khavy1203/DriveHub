require('dotenv').config();
import axios from 'axios';
import db from '../models/index.js';
import { getGroupWithRole } from '../service/JWTService';
import { createJWT } from '../middleware/JWTaction';
import loginRegisterService from '../service/loginRegisterService';
import authSessionService from '../service/authSessionService';

const DEFAULT_MEZON_TOKEN_URL = 'https://oauth2.mezon.ai/oauth2/token';
const DEFAULT_MEZON_USERINFO_URL = 'https://oauth2.mezon.ai/userinfo';
const OAUTH_TIMEOUT = Number(process.env.MEZON_TIMEOUT_MS || 10000);
const STATE_REGEX = /^[A-Za-z0-9]{11}$/;
const buildCookieOptions = () => ({
    maxAge: Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
});

const pickMezonUser = (userinfo = {}) => {
    const mezonId = userinfo.id || userinfo.sub || userinfo.user_id || null;
    const email = userinfo.email || userinfo.mail || (mezonId ? `${mezonId}@mezon.local` : null);
    const username =
        userinfo.username ||
        userinfo.name ||
        userinfo.global_name ||
        (email ? email.split('@')[0] : null);

    return {
        mezonId,
        email,
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
            address: '',
            phone: null,
            genderId: 1,
            groupId: 3,
            active: 1,
            githubId: mezonId ? String(mezonId) : null,
        });

        user = createdUser.get({ plain: true });
        isNewUser = true;
    }

    return { user, isNewUser };
};

const exchangeCode = async (req, res) => {
    try {
        const { code, state, redirect_uri } = req.body || {};

        if (!code || !state || !redirect_uri) {
            return res.status(400).json({
                error: 'invalid_request',
                details: {
                    message: 'Missing required fields: code, state, redirect_uri',
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

        if (process.env.REDIRECT_URI && redirect_uri !== process.env.REDIRECT_URI) {
            return res.status(400).json({
                error: 'invalid_redirect_uri',
                details: {
                    message: 'redirect_uri does not match server configuration',
                },
            });
        }

        const clientId = process.env.MEZON_CLIENT_ID;
        const clientSecret = process.env.MEZON_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                error: 'server_misconfigured',
                details: {
                    message: 'Missing MEZON_CLIENT_ID or MEZON_CLIENT_SECRET',
                },
            });
        }

        const tokenUrl = process.env.MEZON_TOKEN_URL || DEFAULT_MEZON_TOKEN_URL;
        const userInfoUrl = process.env.MEZON_USERINFO_URL || DEFAULT_MEZON_USERINFO_URL;

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
