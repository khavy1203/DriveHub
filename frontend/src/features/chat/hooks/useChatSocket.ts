import { useEffect, useRef, useState, useCallback } from 'react';
import { getConfig } from '../../../core/config/environment';
import { ChatMessage } from '../types';

type Status = 'connecting' | 'auth_ok' | 'auth_error' | 'closed';

type UseChatSocketReturn = {
  status: Status;
  myUserId: number | null;
  messages: ChatMessage[];
  hasMore: boolean;
  sendMessage: (body: string) => void;
  markRead: () => void;
  loadMore: () => void;
};

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useChatSocket(assignmentId: number | null): UseChatSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCount = useRef(0);
  const destroyed = useRef(false);
  // Monotonically-increasing counter. Each connect() call captures its own
  // value; handlers check against the current value and bail if stale.
  // Prevents a closing old WS from firing onclose/onmessage into the new
  // conversation when the teacher switches between students.
  const connectionIdRef = useRef(0);
  // Queue of message bodies to send after reconnect
  const pendingQueue = useRef<string[]>([]);

  const [status, setStatus] = useState<Status>('connecting');
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const myUserIdRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const connect = useCallback((id: number) => {
    if (destroyed.current) return;

    connectionIdRef.current += 1;
    const connId = connectionIdRef.current;
    const isStale = () => connectionIdRef.current !== connId;

    const config = getConfig();
    const token = sessionStorage.getItem('auth_token') ?? '';
    const wsUrl =
      config.API_BASE_URL.replace(/^http/, 'ws') +
      '/ws/chat?token=' +
      encodeURIComponent(token);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onmessage = (event) => {
      if (isStale()) return;
      let msg: { type: string; payload: unknown };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'AUTH_OK') {
        reconnectCount.current = 0;
        const p = msg.payload as { userId: number };
        myUserIdRef.current = p.userId;
        setMyUserId(p.userId);
        setStatus('auth_ok');
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', payload: { assignmentId: id } }));
      }

      if (msg.type === 'AUTH_ERROR') {
        setStatus('auth_error');
      }

      if (msg.type === 'HISTORY') {
        const p = msg.payload as { assignmentId: number; messages: ChatMessage[] };
        if (p.assignmentId === id) {
          setMessages((prev) => {
            // Preserve any pending (unsent) messages at the end
            const pending = prev.filter((m) => m.pending);
            return [...p.messages, ...pending];
          });
          setHasMore(p.messages.length >= 30);

          // Flush queued messages now that we're subscribed
          const queue = [...pendingQueue.current];
          pendingQueue.current = [];
          for (const body of queue) {
            ws.send(JSON.stringify({ type: 'SEND_MESSAGE', payload: { assignmentId: id, body } }));
          }
        }
      }

      if (msg.type === 'NEW_MESSAGE') {
        const p = msg.payload as { assignmentId: number; message: ChatMessage };
        if (p.assignmentId === id) {
          setMessages((prev) => {
            // Replace first pending optimistic message with same body (my own flush)
            const pendingIdx = prev.findIndex(
              (m) => m.pending && m.body === p.message.body && m.senderUserId === p.message.senderUserId,
            );
            if (pendingIdx >= 0) {
              const next = [...prev];
              next.splice(pendingIdx, 1, p.message);
              return next;
            }
            return [...prev, p.message];
          });
        }
      }

      if (msg.type === 'MESSAGES_DELIVERED') {
        const p = msg.payload as { assignmentId: number; byUserId: number };
        if (p.assignmentId === id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderUserId !== p.byUserId && !m.deliveredAt
                ? { ...m, deliveredAt: new Date().toISOString() }
                : m,
            ),
          );
        }
      }

      if (msg.type === 'MORE_MESSAGES') {
        const p = msg.payload as { assignmentId: number; messages: ChatMessage[] };
        if (p.assignmentId === id) {
          setMessages((prev) => {
            const confirmed = prev.filter((m) => !m.pending);
            return [...p.messages, ...confirmed];
          });
          setHasMore(p.messages.length >= 30);
        }
      }
    };

    ws.onclose = () => {
      if (destroyed.current || isStale()) return;
      setStatus('closed');
      if (reconnectCount.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount.current += 1;
        const delay = Math.min(RECONNECT_DELAY_MS * reconnectCount.current, 30000);
        reconnectTimer.current = setTimeout(() => connect(id), delay);
      }
    };

    ws.onerror = () => {
      // onclose fires right after onerror — reconnect handled there
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (assignmentId === null) return;

    destroyed.current = false;
    reconnectCount.current = 0;
    pendingQueue.current = [];
    setMessages([]);
    setHasMore(true);
    connect(assignmentId);

    return () => {
      destroyed.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [assignmentId, connect]);

  const sendMessage = useCallback(
    (body: string) => {
      if (!body.trim() || assignmentId === null) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Connected — send immediately
        wsRef.current.send(
          JSON.stringify({ type: 'SEND_MESSAGE', payload: { assignmentId, body: body.trim() } }),
        );
      } else {
        // Disconnected — queue and show optimistically
        pendingQueue.current.push(body.trim());
        const optimistic: ChatMessage = {
          id: -Date.now(),
          assignmentId,
          senderUserId: myUserIdRef.current ?? -1,
          senderRole: 'student',
          body: body.trim(),
          deliveredAt: null,
          readAt: null,
          createdAt: new Date().toISOString(),
          pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);
      }
    },
    [assignmentId],
  );

  const markRead = useCallback(() => {
    if (assignmentId === null || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'MARK_READ', payload: { assignmentId } }));
  }, [assignmentId]);

  const loadMore = useCallback(() => {
    if (assignmentId === null || messages.length === 0) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const firstConfirmed = messages.find((m) => !m.pending);
    if (!firstConfirmed) return;
    wsRef.current.send(
      JSON.stringify({ type: 'LOAD_MORE', payload: { assignmentId, beforeId: firstConfirmed.id } }),
    );
  }, [assignmentId, messages]);

  return { status, myUserId, messages, hasMore, sendMessage, markRead, loadMore };
}
