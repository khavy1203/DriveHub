import { useEffect, useRef, useCallback } from 'react';
import { getConfig } from '../../../core/config/environment';

type WsMessage = {
  type: 'NEW_NOTIFICATION' | 'UNREAD_COUNT';
  payload: unknown;
};

type UseNotificationSocketOptions = {
  onNewNotification?: (payload: unknown) => void;
  onUnreadCount?: (count: number) => void;
};

const useNotificationSocket = ({ onNewNotification, onUnreadCount }: UseNotificationSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return;

    const baseWsUrl = getConfig().API_BASE_URL.replace(/^http/, 'ws');
    const url = `${baseWsUrl}/ws/notification?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'NEW_NOTIFICATION' && onNewNotification) {
          onNewNotification(msg.payload);
        }
        if (msg.type === 'UNREAD_COUNT' && onUnreadCount) {
          onUnreadCount(msg.payload as number);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // Reconnect after 5s
      reconnectTimer.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [onNewNotification, onUnreadCount]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
      }
    };
  }, [connect]);
};

export default useNotificationSocket;
