import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as api from '../services/notificationApi';
import useNotificationSocket from './useNotificationSocket';
import type { NotificationRecipient } from '../types';

const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationRecipient[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.getMyNotifications(p);
      if (res.EC === 0) {
        if (p === 1) {
          setNotifications(res.DT.data);
        } else {
          setNotifications(prev => [...prev, ...res.DT.data]);
        }
        setTotal(res.DT.total);
        setPage(p);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.getUnreadCount();
      if (res.EC === 0) setUnreadCount(res.DT);
    } catch {
      // silent
    }
  }, []);

  const markRead = useCallback(async (recipientId: number) => {
    try {
      const res = await api.markAsRead(recipientId);
      if (res.EC === 0) {
        setNotifications(prev =>
          prev.map(n => n.id === recipientId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await api.markAllAsRead();
      if (res.EC === 0) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {
      // silent
    }
  }, []);

  const loadMore = useCallback(() => {
    if (notifications.length < total && !loading) {
      fetchNotifications(page + 1);
    }
  }, [notifications.length, total, loading, page, fetchNotifications]);

  // WebSocket real-time
  useNotificationSocket({
    onNewNotification: () => {
      fetchNotifications(1);
      setUnreadCount(prev => prev + 1);
      toast.info('Bạn có thông báo mới', { autoClose: 3000 });
    },
    onUnreadCount: (count) => {
      setUnreadCount(count);
    },
  });

  // Initial load
  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    total,
    markRead,
    markAllRead,
    loadMore,
    refresh: () => fetchNotifications(1),
  };
};

export default useNotifications;
