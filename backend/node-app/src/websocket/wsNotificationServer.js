import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../middleware/JWTaction.js';
import db from '../models/index.js';

// ── Token extraction (cookie OR query param) ────────────────────────────────
function extractWsToken(req) {
  try {
    const url = new URL(req.url, 'ws://localhost');
    const qToken = url.searchParams.get('token');
    if (qToken) return qToken;
  } catch {}

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

// Map<id, Set<WebSocket>>
const userClients = new Map();
const hocVienClients = new Map();

function addClient(map, id, ws) {
  if (!map.has(id)) map.set(id, new Set());
  map.get(id).add(ws);
}

function removeClient(map, id, ws) {
  const set = map.get(id);
  if (set) {
    set.delete(ws);
    if (set.size === 0) map.delete(id);
  }
}

function sendToClients(map, id, payload) {
  const set = map.get(id);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Called from notificationController after creating a notification
export function broadcastNotification(recipientId, recipientType, payload) {
  const message = { type: 'NEW_NOTIFICATION', payload };
  if (recipientType === 'user') {
    sendToClients(userClients, recipientId, message);
  } else if (recipientType === 'hocvien') {
    sendToClients(hocVienClients, recipientId, message);
  }
}

// Send a custom-typed message directly to a user (e.g. background job results)
export function sendToUser(userId, message) {
  sendToClients(userClients, userId, message);
}

// ── Setup ───────────────────────────────────────────────────────────────────

export function setupNotificationWebSocket(server, path) {
  const wss = new WebSocketServer({ noServer: true, path });

  wss.on('connection', async (ws, req) => {
    const token = extractWsToken(req);
    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ws.close(4001, 'Invalid token');
      return;
    }

    const userId = decoded.id;
    if (!userId) {
      ws.close(4001, 'Invalid user');
      return;
    }

    // Register as user client
    addClient(userClients, userId, ws);

    // Also check if this user is a hoc_vien
    let hocVienId = null;
    try {
      const hv = await db.hoc_vien.findOne({ where: { userId }, attributes: ['id'] });
      if (hv) {
        hocVienId = hv.id;
        addClient(hocVienClients, hocVienId, ws);
      }
    } catch {}

    ws.on('close', () => {
      removeClient(userClients, userId, ws);
      if (hocVienId) {
        removeClient(hocVienClients, hocVienId, ws);
      }
    });

    ws.on('error', () => {
      removeClient(userClients, userId, ws);
      if (hocVienId) {
        removeClient(hocVienClients, hocVienId, ws);
      }
    });

    // Send initial unread count
    try {
      const { default: notifService } = await import('../service/notificationService.js');
      let count = 0;
      if (hocVienId) {
        count = await notifService.getUnreadCount({ hocVienId });
      } else {
        count = await notifService.getUnreadCount({ userId });
      }
      ws.send(JSON.stringify({ type: 'UNREAD_COUNT', payload: count }));
    } catch {}
  });

  return wss;
}
