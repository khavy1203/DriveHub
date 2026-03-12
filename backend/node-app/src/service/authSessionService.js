import crypto from 'crypto';
import db from '../models/index.js';

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);

const createSession = async ({ userId, req }) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.authsession.create({
    sessionId,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || null,
    expiresAt,
    revoked: false,
  });

  return {
    sessionId,
    expiresAt,
  };
};

const revokeSession = async (sessionId) => {
  if (!sessionId) {
    return;
  }

  await db.authsession.update(
    { revoked: true },
    {
      where: {
        sessionId,
      },
    }
  );
};

module.exports = {
  createSession,
  revokeSession,
};
