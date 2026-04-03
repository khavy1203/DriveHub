import axios from '../../../axios';
import type {
  PaginatedResponse,
  AdminNotificationRow,
  NotificationRecipient,
  Notification,
  CreateNotificationPayload,
} from '../types';

type ApiRes<T> = { EC: number; EM: string; DT: T };

export const createNotification = async (payload: CreateNotificationPayload) => {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('content', payload.content);
  fd.append('type', payload.type);
  fd.append('targetScope', payload.targetScope);
  fd.append('priority', payload.priority);
  if (payload.recipientIds && payload.recipientIds.length > 0) {
    fd.append('recipientIds', JSON.stringify(payload.recipientIds));
  }
  if (payload.files) {
    for (const f of payload.files) {
      fd.append('files', f);
    }
  }
  const res = await axios.post<ApiRes<Notification>>('/api/notification', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getAdminHistory = async (page = 1, limit = 20, type?: string) => {
  const params: Record<string, string | number> = { page, limit };
  if (type) params.type = type;
  const res = await axios.get<ApiRes<PaginatedResponse<AdminNotificationRow>>>('/api/notification/admin-history', { params });
  return res.data;
};

export const deleteNotification = async (id: number) => {
  const res = await axios.delete<ApiRes<null>>(`/api/notification/${id}`);
  return res.data;
};

export const getMyNotifications = async (page = 1, limit = 20) => {
  const res = await axios.get<ApiRes<PaginatedResponse<NotificationRecipient>>>('/api/notification/my', { params: { page, limit } });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await axios.get<ApiRes<number>>('/api/notification/unread-count');
  return res.data;
};

export const markAsRead = async (recipientId: number) => {
  const res = await axios.put<ApiRes<null>>(`/api/notification/read/${recipientId}`);
  return res.data;
};

export const markAllAsRead = async () => {
  const res = await axios.put<ApiRes<number>>('/api/notification/read-all');
  return res.data;
};
