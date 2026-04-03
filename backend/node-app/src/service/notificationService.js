import db from '../models/index.js';
import fs from 'fs-extra';
import path from 'path';

const { Op } = db.Sequelize;

const ATTACHMENT_INCLUDE = {
  model: db.notification_attachment,
  as: 'attachments',
  attributes: ['id', 'fileName', 'filePath', 'fileType', 'fileSize'],
};

const CREATOR_INCLUDE = {
  model: db.user,
  as: 'creator',
  attributes: ['id', 'username', 'email'],
};

// ── Create notification ─────────────────────────────────────────────────────

const createNotification = async (adminUserId, { title, content, type, targetScope, priority, recipientIds, files }) => {
  const transaction = await db.sequelize.transaction();
  try {
    const notif = await db.notification.create(
      { title, content, type, targetScope, priority, createdByUserId: adminUserId },
      { transaction },
    );

    // Save attachments
    if (files && files.length > 0) {
      const attachments = files.map(f => ({
        notificationId: notif.id,
        fileName: f.originalname,
        filePath: `/uploads/notifications/${f.filename}`,
        fileType: f.mimetype,
        fileSize: f.size,
      }));
      await db.notification_attachment.bulkCreate(attachments, { transaction });
    }

    // Build recipient list
    let recipients = [];

    if (type === 'admin_to_st') {
      if (targetScope === 'all') {
        // All SupperTeachers belonging to this admin
        const stGroup = await db.group.findOne({ where: { name: 'SupperTeacher' }, attributes: ['id'] });
        if (stGroup) {
          const sts = await db.user.findAll({
            where: { adminId: adminUserId, groupId: stGroup.id, active: 1 },
            attributes: ['id'],
            transaction,
          });
          recipients = sts.map(st => ({ notificationId: notif.id, recipientUserId: st.id, recipientHocVienId: null }));
        }
      } else {
        // Selected SupperTeachers
        recipients = (recipientIds || []).map(id => ({ notificationId: notif.id, recipientUserId: id, recipientHocVienId: null }));
      }
    } else if (type === 'admin_to_student') {
      if (targetScope === 'all') {
        // All students belonging to this admin
        const hvs = await db.hoc_vien.findAll({
          where: { adminId: adminUserId },
          attributes: ['id'],
          transaction,
        });
        recipients = hvs.map(hv => ({ notificationId: notif.id, recipientUserId: null, recipientHocVienId: hv.id }));
      } else {
        recipients = (recipientIds || []).map(id => ({ notificationId: notif.id, recipientUserId: null, recipientHocVienId: id }));
      }
    }

    if (recipients.length > 0) {
      await db.notification_recipient.bulkCreate(recipients, { transaction });
    }

    await transaction.commit();

    // Return full object for WS broadcast
    const full = await db.notification.findByPk(notif.id, {
      include: [ATTACHMENT_INCLUDE, CREATOR_INCLUDE],
    });

    return { notification: full, recipientCount: recipients.length, recipients };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ── List for admin (sent history) ───────────────────────────────────────────

const listNotificationsAdmin = async (adminUserId, { page = 1, limit = 20, type } = {}) => {
  const where = { createdByUserId: adminUserId };
  if (type) where.type = type;

  const offset = (page - 1) * limit;
  const { count, rows } = await db.notification.findAndCountAll({
    where,
    include: [
      ATTACHMENT_INCLUDE,
      {
        model: db.notification_recipient,
        as: 'recipients',
        attributes: ['id', 'isRead'],
      },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    distinct: true,
  });

  const data = rows.map(n => {
    const plain = n.get({ plain: true });
    plain.totalRecipients = plain.recipients?.length || 0;
    plain.readCount = plain.recipients?.filter(r => r.isRead).length || 0;
    delete plain.recipients;
    return plain;
  });

  return { total: count, page, limit, data };
};

// ── Get notifications for a user (SupperTeacher/GiaoVien) ───────────────────

const getNotificationsForUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await db.notification_recipient.findAndCountAll({
    where: { recipientUserId: userId },
    include: [{
      model: db.notification,
      as: 'notification',
      include: [ATTACHMENT_INCLUDE, CREATOR_INCLUDE],
    }],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });

  return { total: count, page, limit, data: rows };
};

// ── Get notifications for a hoc_vien ────────────────────────────────────────

const getNotificationsForHocVien = async (hocVienId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await db.notification_recipient.findAndCountAll({
    where: { recipientHocVienId: hocVienId },
    include: [{
      model: db.notification,
      as: 'notification',
      include: [ATTACHMENT_INCLUDE, CREATOR_INCLUDE],
    }],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });

  return { total: count, page, limit, data: rows };
};

// ── Unread count ────────────────────────────────────────────────────────────

const getUnreadCount = async ({ userId, hocVienId }) => {
  const where = { isRead: false };
  if (userId) where.recipientUserId = userId;
  else if (hocVienId) where.recipientHocVienId = hocVienId;
  else return 0;

  return db.notification_recipient.count({ where });
};

// ── Mark as read ────────────────────────────────────────────────────────────

const markAsRead = async (recipientId) => {
  const row = await db.notification_recipient.findByPk(recipientId);
  if (!row) return null;
  if (!row.isRead) {
    row.isRead = true;
    row.readAt = new Date();
    await row.save();
  }
  return row;
};

const markAllAsRead = async ({ userId, hocVienId }) => {
  const where = { isRead: false };
  if (userId) where.recipientUserId = userId;
  else if (hocVienId) where.recipientHocVienId = hocVienId;
  else return 0;

  const [updated] = await db.notification_recipient.update(
    { isRead: true, readAt: new Date() },
    { where },
  );
  return updated;
};

// ── Delete notification ─────────────────────────────────────────────────────

const deleteNotification = async (notificationId, adminUserId) => {
  const notif = await db.notification.findOne({
    where: { id: notificationId, createdByUserId: adminUserId },
    include: [ATTACHMENT_INCLUDE],
  });
  if (!notif) return null;

  // Delete files from disk
  for (const att of notif.attachments || []) {
    const fullPath = path.join(__dirname, '..', att.filePath.replace('/uploads/', 'upload/'));
    fs.remove(fullPath).catch(() => {});
  }

  await notif.destroy(); // CASCADE deletes recipients + attachments
  return true;
};

export default {
  createNotification,
  listNotificationsAdmin,
  getNotificationsForUser,
  getNotificationsForHocVien,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
