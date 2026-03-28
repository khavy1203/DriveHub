import crypto from 'crypto';
import db from '../models/index.js';
import { hashUserPassword } from '../service/loginRegisterService.js';
import { getGroupWithRole } from '../service/JWTService.js';
import { createJWT } from '../middleware/JWTaction.js';
import mailService from '../service/mailService.js';
import { Op } from 'sequelize';

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ALLOWED_GROUP_IDS = [3, 4]; // GiaoVien, HocVien

const buildSetupLink = (token) => {
  const base = process.env.FRONTEND_URL ?? 'https://localhost:3000';
  return `${base}/#/setup-password?token=${token}`;
};

const verifySetupToken = async (req, res) => {
  const { token } = req.params;
  const user = await db.user.findOne({
    where: {
      setupToken: token,
      setupTokenExpiry: { [Op.gt]: new Date() },
    },
    attributes: ['id', 'username', 'email'],
  });
  if (!user) {
    return res.status(400).json({ EM: 'Link không hợp lệ hoặc đã hết hạn', EC: -1, DT: null });
  }
  return res.status(200).json({ EM: 'ok', EC: 0, DT: { username: user.username, email: user.email } });
};

const setupPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ EM: 'Vui lòng điền đầy đủ thông tin', EC: -1, DT: null });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ EM: 'Mật khẩu xác nhận không khớp', EC: -1, DT: null });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ EM: 'Mật khẩu phải ít nhất 6 ký tự', EC: -1, DT: null });
  }

  try {
    const user = await db.user.findOne({
      where: {
        setupToken: token,
        setupTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ EM: 'Link không hợp lệ hoặc đã hết hạn', EC: -1, DT: null });
    }

    user.password = hashUserPassword(newPassword);
    user.setupToken = null;
    user.setupTokenExpiry = null;
    await user.save();

    const groupWithRoles = await getGroupWithRole(user.get({ plain: true }));
    const token_jwt = createJWT({
      email: user.email,
      username: user.username,
      avatarUrl: null,
      groupWithRoles,
    });

    return res.status(200).json({
      EM: 'Thiết lập mật khẩu thành công',
      EC: 0,
      DT: {
        access_token: token_jwt,
        groupWithRoles,
        email: user.email,
        username: user.username,
      },
    });
  } catch (e) {
    console.error('[setupPasswordController]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(200).json({ EM: 'Vui lòng nhập email', EC: 1, DT: null });
  }

  try {
    const user = await db.user.findOne({
      where: {
        email,
        groupId: { [Op.in]: ALLOWED_GROUP_IDS },
      },
    });

    if (!user) {
      return res.status(200).json({ EM: 'Email này không tồn tại trong hệ thống', EC: 1, DT: null });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.setupToken = token;
    user.setupTokenExpiry = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
    await user.save();

    const setupLink = buildSetupLink(token);
    mailService.sendResetEmail({ toEmail: user.email, hoTen: user.username, setupLink }).catch(() => {});

    return res.status(200).json({ EM: 'Link đặt lại mật khẩu đã được gửi đến email của bạn', EC: 0, DT: null });
  } catch (e) {
    console.error('[forgotPassword]', e);
    return res.status(500).json({ EM: 'Lỗi server', EC: -1, DT: null });
  }
};

export default { verifySetupToken, setupPassword, forgotPassword };
