import db from '../models/index.js';
import notificationService from '../service/notificationService.js';
import { broadcastNotification } from '../websocket/wsNotificationServer.js';

// POST /api/notification — create notification (admin)
const create = async (req, res, next) => {
  try {
    const adminUserId = req.user.id;
    const { title, content, type, targetScope, priority, recipientIds } = req.body;

    if (!title || !content || !type) {
      return res.status(400).json({ EC: -1, EM: 'Thiếu tiêu đề, nội dung hoặc loại thông báo', DT: null });
    }

    const parsedRecipientIds = recipientIds
      ? (typeof recipientIds === 'string' ? JSON.parse(recipientIds) : recipientIds)
      : [];

    const result = await notificationService.createNotification(adminUserId, {
      title,
      content,
      type,
      targetScope: targetScope || 'all',
      priority: priority || 'normal',
      recipientIds: parsedRecipientIds,
      files: req.files || [],
    });

    // Broadcast to online recipients via WebSocket
    const payload = {
      id: result.notification.id,
      title: result.notification.title,
      type: result.notification.type,
      priority: result.notification.priority,
      createdAt: result.notification.createdAt,
      creator: result.notification.creator,
      attachmentCount: result.notification.attachments?.length || 0,
    };

    for (const r of result.recipients) {
      if (r.recipientUserId) {
        broadcastNotification(r.recipientUserId, 'user', payload);
      } else if (r.recipientHocVienId) {
        broadcastNotification(r.recipientHocVienId, 'hocvien', payload);
      }
    }

    return res.json({
      EC: 0,
      EM: `Đã gửi thông báo đến ${result.recipientCount} người nhận`,
      DT: result.notification,
    });
  } catch (err) {
    console.error('[Notification] create error:', err.message);
    next(err);
  }
};

// GET /api/notification/admin-history
const adminHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const data = await notificationService.listNotificationsAdmin(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      type: type || undefined,
    });
    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) {
    console.error('[Notification] adminHistory error:', err);
    next(err);
  }
};

// DELETE /api/notification/:id
const remove = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(Number(req.params.id), req.user.id);
    if (!result) {
      return res.status(404).json({ EC: -1, EM: 'Không tìm thấy thông báo hoặc bạn không có quyền xóa', DT: null });
    }
    return res.json({ EC: 0, EM: 'Đã xóa thông báo', DT: null });
  } catch (err) {
    next(err);
  }
};

// GET /api/notification/my — get notifications for current user
const my = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Check if user is a hoc_vien (student)
    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      attributes: ['id'],
    });

    let data;
    if (hocVien) {
      data = await notificationService.getNotificationsForHocVien(hocVien.id, {
        page: Number(page),
        limit: Number(limit),
      });
    } else {
      data = await notificationService.getNotificationsForUser(userId, {
        page: Number(page),
        limit: Number(limit),
      });
    }

    return res.json({ EC: 0, EM: 'OK', DT: data });
  } catch (err) {
    console.error('[Notification] my error:', err);
    next(err);
  }
};

// GET /api/notification/unread-count
const unreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      attributes: ['id'],
    });

    let count;
    if (hocVien) {
      count = await notificationService.getUnreadCount({ hocVienId: hocVien.id });
    } else {
      count = await notificationService.getUnreadCount({ userId });
    }

    return res.json({ EC: 0, EM: 'OK', DT: count });
  } catch (err) {
    console.error('[Notification] unreadCount error:', err);
    next(err);
  }
};

// PUT /api/notification/read/:recipientId
const markRead = async (req, res, next) => {
  try {
    const row = await notificationService.markAsRead(Number(req.params.recipientId));
    if (!row) {
      return res.status(404).json({ EC: -1, EM: 'Không tìm thấy', DT: null });
    }
    return res.json({ EC: 0, EM: 'Đã đánh dấu đã đọc', DT: null });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notification/read-all
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const hocVien = await db.hoc_vien.findOne({
      where: { userId },
      attributes: ['id'],
    });

    let updated;
    if (hocVien) {
      updated = await notificationService.markAllAsRead({ hocVienId: hocVien.id });
    } else {
      updated = await notificationService.markAllAsRead({ userId });
    }

    return res.json({ EC: 0, EM: `Đã đánh dấu ${updated} thông báo đã đọc`, DT: updated });
  } catch (err) {
    next(err);
  }
};

export default { create, adminHistory, remove, my, unreadCount, markRead, markAllRead };
