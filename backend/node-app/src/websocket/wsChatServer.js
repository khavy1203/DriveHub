import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../middleware/JWTaction.js';
import db from '../models/index.js';

// ── Token extraction (cookie OR query param) ────────────────────────────────
function extractWsToken(req) {
  // 1. Try query param: ws://host/ws/chat?token=...
  try {
    const url = new URL(req.url, 'ws://localhost');
    const qToken = url.searchParams.get('token');
    if (qToken) return qToken;
  } catch {}

  // 2. Try cookie header
  const raw = req.headers.cookie || '';
  for (const pair of raw.split(';')) {
    const [k, ...rest] = pair.trim().split('=');
    const key = k?.trim();
    if (key === 'jwt' || key === 'auth_token') {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

// ── Room management: Map<assignmentId string, Set<{ws, userId, role}>> ──────
const chatRooms = new Map();

function joinRoom(assignmentId, info) {
  const key = String(assignmentId);
  if (!chatRooms.has(key)) chatRooms.set(key, new Set());
  chatRooms.get(key).add(info);
}

function leaveRoom(assignmentId, info) {
  const key = String(assignmentId);
  const room = chatRooms.get(key);
  if (room) {
    room.delete(info);
    if (room.size === 0) chatRooms.delete(key);
  }
}

function broadcastToRoom(assignmentId, payload) {
  const room = chatRooms.get(String(assignmentId));
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

export function broadcastChatMessage(assignmentId, message) {
  broadcastToRoom(assignmentId, { type: 'NEW_MESSAGE', payload: { assignmentId, message } });
}

// ── DB helpers ──────────────────────────────────────────────────────────────
async function verifyAccess(userId, assignmentId) {
  const a = await db.student_assignment.findOne({
    where: { id: assignmentId },
    include: [{ model: db.hoc_vien, as: 'hocVien', attributes: ['userId'] }],
  });
  if (!a) {
    console.log(`[ChatWS] verifyAccess: assignment ${assignmentId} not found`);
    return null;
  }
  const isTeacher = a.teacherId === userId;
  const isStudent = a.hocVien?.userId === userId;
  console.log(`[ChatWS] verifyAccess: userId=${userId} teacherId=${a.teacherId} hocVienUserId=${a.hocVien?.userId} isTeacher=${isTeacher} isStudent=${isStudent}`);
  if (!isTeacher && !isStudent) return null;
  return { assignment: a, role: isTeacher ? 'teacher' : 'student' };
}

const SENDER_INCLUDE = [{ model: db.user, as: 'sender', attributes: ['id', 'username'] }];

async function loadHistory(assignmentId, beforeId, limit = 30) {
  const where = { assignmentId: Number(assignmentId) };
  if (beforeId) where.id = { [db.Sequelize.Op.lt]: Number(beforeId) };
  const rows = await db.chat_message.findAll({
    where,
    order: [['id', 'DESC']],
    limit,
    include: SENDER_INCLUDE,
  });
  return rows.reverse();
}

async function markDelivered(assignmentId, byUserId) {
  await db.chat_message.update(
    { deliveredAt: new Date() },
    {
      where: {
        assignmentId: Number(assignmentId),
        senderUserId: { [db.Sequelize.Op.ne]: byUserId },
        deliveredAt: null,
      },
    },
  );
}

async function markRead(assignmentId, byUserId) {
  await db.chat_message.update(
    { readAt: new Date() },
    {
      where: {
        assignmentId: Number(assignmentId),
        senderUserId: { [db.Sequelize.Op.ne]: byUserId },
        readAt: null,
      },
    },
  );
}

// ── WebSocket server ─────────────────────────────────────────────────────────
export function setupChatWebSocket(server, path) {
  // noServer: manually route upgrade events so multiple WSS instances on the
  // same HTTP server don't fight over and abort each other's connections.
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

  wss.on('connection', async (ws, req) => {
    console.log('[ChatWS] new connection, origin:', req.headers.origin, 'url:', req.url);
    // Auth via query param or cookie
    const token = extractWsToken(req);
    console.log('[ChatWS] token found:', !!token, token ? `(${token.substring(0, 20)}...)` : '');

    if (!token) {
      ws.send(JSON.stringify({ type: 'AUTH_ERROR', payload: 'No token' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    const decoded = verifyToken(token);
    console.log('[ChatWS] decoded:', decoded ? `email=${decoded.email}, keys=${Object.keys(decoded).join(',')}` : 'null/invalid');
    if (!decoded?.email) {
      ws.send(JSON.stringify({ type: 'AUTH_ERROR', payload: 'Invalid token' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    // JWT payload has no id — look up by email
    let userRow;
    try {
      userRow = await db.user.findOne({
        where: { email: decoded.email },
        attributes: ['id'],
      });
    } catch (dbErr) {
      console.error('[ChatWS] DB error looking up user:', dbErr.message);
      ws.send(JSON.stringify({ type: 'AUTH_ERROR', payload: 'DB error' }));
      ws.close(4001, 'Unauthorized');
      return;
    }
    console.log('[ChatWS] userRow found:', userRow ? `id=${userRow.id}` : 'null');
    if (!userRow) {
      ws.send(JSON.stringify({ type: 'AUTH_ERROR', payload: 'User not found' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    const userId = userRow.id;
    console.log('[ChatWS] sending AUTH_OK for userId:', userId);
    ws.send(JSON.stringify({ type: 'AUTH_OK', payload: { userId } }));
    console.log('[ChatWS] AUTH_OK sent');

    // Per-connection joined rooms: Map<assignmentId string, clientInfo>
    const myRooms = new Map();

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 25000);

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
        if (!msg || typeof msg !== 'object') return;
      } catch {
        return;
      }

      const { type, payload = {} } = msg;

      try {

      if (type === 'SUBSCRIBE') {
        const { assignmentId } = payload;
        console.log(`[ChatWS] SUBSCRIBE userId=${userId} assignmentId=${assignmentId}`);
        const key = String(assignmentId);
        if (myRooms.has(key)) return;

        const access = await verifyAccess(userId, assignmentId).catch((e) => {
          console.error('[ChatWS] verifyAccess error:', e.message);
          return null;
        });
        console.log(`[ChatWS] verifyAccess result:`, access ? `role=${access.role}` : 'null (no access)');
        if (!access) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: `No access to assignment ${assignmentId}` }));
          return;
        }

        const info = { ws, userId, role: access.role };
        myRooms.set(key, info);
        joinRoom(assignmentId, info);

        const messages = await loadHistory(assignmentId).catch(() => []);
        ws.send(JSON.stringify({ type: 'HISTORY', payload: { assignmentId, messages } }));

        // Mark undelivered messages as delivered (recipient is now connected)
        await markDelivered(assignmentId, userId).catch(() => {});
        broadcastToRoom(assignmentId, { type: 'MESSAGES_DELIVERED', payload: { assignmentId, byUserId: userId } });

        await markRead(assignmentId, userId).catch(() => {});
        broadcastToRoom(assignmentId, { type: 'MESSAGES_READ', payload: { assignmentId, byUserId: userId } });
      }

      if (type === 'SEND_MESSAGE') {
        const { assignmentId, body } = payload;
        const info = myRooms.get(String(assignmentId));
        if (!info || !body?.trim()) return;

        const now = new Date();
        // Check if recipient is currently in the room — if yes, delivered immediately
        const room = chatRooms.get(String(assignmentId));
        const recipientOnline = room
          ? [...room].some((c) => c.userId !== userId && c.ws.readyState === 1 /* OPEN */)
          : false;

        const saved = await db.chat_message.create({
          assignmentId: Number(assignmentId),
          senderUserId: userId,
          senderRole: info.role,
          body: body.trim(),
          deliveredAt: recipientOnline ? now : null,
        });

        const full = await db.chat_message.findByPk(saved.id, { include: SENDER_INCLUDE });
        broadcastToRoom(assignmentId, { type: 'NEW_MESSAGE', payload: { assignmentId, message: full } });
      }

      if (type === 'MARK_READ') {
        const { assignmentId } = payload;
        if (!myRooms.has(String(assignmentId))) return;
        // Ensure delivered before read
        await markDelivered(assignmentId, userId).catch(() => {});
        await markRead(assignmentId, userId).catch(() => {});
        broadcastToRoom(assignmentId, { type: 'MESSAGES_READ', payload: { assignmentId, byUserId: userId } });
      }

      if (type === 'LOAD_MORE') {
        const { assignmentId, beforeId } = payload;
        if (!myRooms.has(String(assignmentId))) return;
        const messages = await loadHistory(assignmentId, beforeId).catch(() => []);
        ws.send(JSON.stringify({ type: 'MORE_MESSAGES', payload: { assignmentId, messages } }));
      }

      if (type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }

      } catch (err) {
        console.error('[ChatWS] message handler error:', err.message);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: 'Internal server error' }));
        }
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[ChatWS] connection closed userId=${userId} code=${code} reason=${reason?.toString() || ''}`);
      clearInterval(pingInterval);
      for (const [key, info] of myRooms) {
        leaveRoom(key, info);
      }
      myRooms.clear();
    });

    ws.on('error', (err) => {
      console.error('[ChatWS] client error:', err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[ChatWS] server error:', err.message);
  });

  console.log(`[INFO] Chat WebSocket ready at ${path}`);
  return wss;
}

export default setupChatWebSocket;
