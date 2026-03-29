import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import './ChatPanel.scss';

type Props = {
  assignmentId: number | null;
  label?: string;
};

const ChatPanel: React.FC<Props> = ({ assignmentId, label }) => {
  const { status, myUserId, messages, hasMore, sendMessage, markRead, loadMore } = useChatSocket(assignmentId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark read when panel is visible and new messages arrive
  useEffect(() => {
    if (status === 'auth_ok' && messages.length > 0) {
      markRead();
    }
  }, [messages.length, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // Do not send while IME is composing Vietnamese (Telex/VNI/etc.) — avoids losing diacritics.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    handleSend();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  if (assignmentId === null) {
    return (
      <div className="cp cp--empty">
        <span className="material-icons">chat_bubble_outline</span>
        <p>Chưa có phân công học viên</p>
      </div>
    );
  }

  return (
    <div className="cp">
      <div className="cp__header">
        <span className="material-icons">chat</span>
        <span className="cp__header-label">{label ?? 'Chat'}</span>
        {status === 'connecting' && <span className="cp__status cp__status--connecting">Đang kết nối...</span>}
        {status === 'closed' && <span className="cp__status cp__status--closed">Mất kết nối</span>}
        {status === 'auth_error' && <span className="cp__status cp__status--error">Lỗi xác thực</span>}
      </div>

      <div className="cp__messages" ref={listRef}>
        {hasMore && messages.length >= 30 && (
          <button className="cp__load-more" onClick={loadMore}>
            <span className="material-icons">expand_less</span>
            Tải thêm tin nhắn cũ
          </button>
        )}

        {messages.length === 0 && status === 'auth_ok' && (
          <div className="cp__empty-state">
            <span className="material-icons">forum</span>
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderUserId === myUserId;
          const prevMsg = messages[i - 1];
          const showDate = !prevMsg || formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt);

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="cp__date-divider">
                  <span>{formatDate(msg.createdAt)}</span>
                </div>
              )}
              <div className={`cp__msg ${isMine ? 'cp__msg--mine' : 'cp__msg--theirs'}`}>
                {!isMine && (
                  <div className="cp__msg-avatar">
                    {(msg.sender?.username ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="cp__msg-content">
                  {!isMine && (
                    <span className="cp__msg-name">{msg.sender?.username ?? ''}</span>
                  )}
                  <div className="cp__msg-bubble">{msg.body}</div>
                  <span className="cp__msg-time">
                    {formatTime(msg.createdAt)}
                    {isMine && msg.readAt && (
                      <span className="cp__msg-read" title="Đã đọc">
                        <span className="material-icons">done_all</span>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="cp__input-row">
        <textarea
          className="cp__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          rows={1}
          disabled={status !== 'auth_ok'}
        />
        <button
          className="cp__send-btn"
          onClick={handleSend}
          disabled={status !== 'auth_ok' || !input.trim()}
          aria-label="Gửi"
        >
          <span className="material-icons">send</span>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
