import React, { useEffect, useRef, useState, useCallback, KeyboardEvent, memo } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useChatSocket } from '../../../features/chat/hooks/useChatSocket';
import axios from '../../../axios';
import './ChatPage.scss';

// ── Types ──────────────────────────────────────────────────────────────────

type Conversation = {
  assignmentId: number;
  name: string;
  avatarUrl?: string;
  role: 'teacher' | 'student';
  status: 'waiting' | 'learning' | 'completed';
};

type TeacherProfile = { avatarUrl?: string; licenseTypes?: string };
type AssignedTeacher = { id: number; username: string; profile: TeacherProfile | null };
type MyAssignment = {
  id: number;
  status: 'waiting' | 'learning' | 'completed';
  teacher: AssignedTeacher | null;
};
type MyProgress = {
  hocVien: { id: number; HoTen: string };
  assignment: MyAssignment | null;
};

type HocVien = { id: number; HoTen: string; status: string };
type TeacherAssignment = {
  id: number;
  status: 'waiting' | 'learning' | 'completed';
  hocVien: HocVien;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    return isToday
      ? 'Hôm nay'
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

const STATUS_DOT: Record<string, string> = {
  waiting: 'chp__status-dot--wait',
  learning: 'chp__status-dot--active',
  completed: 'chp__status-dot--done',
};

// ── Chat input bar (memoized to prevent IME interruption on message updates) ─

type ChatInputBarProps = {
  status: 'connecting' | 'auth_ok' | 'auth_error' | 'closed';
  onSend: (body: string) => void;
};

const ChatInputBar = memo(({ status, onSend }: ChatInputBarProps) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {status === 'closed' && (
        <div className="chp__reconnect-bar">
          <span className="material-icons chp__spin">sync</span>
          Mất kết nối — tin nhắn sẽ được gửi khi kết nối lại
        </div>
      )}
      <div className="chp__input-bar">
        <textarea
          className="chp__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          rows={1}
          disabled={status !== 'auth_ok'}
        />
        <button
          className="chp__send-btn"
          onClick={handleSend}
          disabled={status !== 'auth_ok' || !input.trim()}
        >
          <span className="material-icons">send</span>
        </button>
      </div>
    </>
  );
});

// ── Chat area ──────────────────────────────────────────────────────────────

type ChatAreaProps = {
  assignmentId: number | null;
  contactName: string;
  contactAvatar?: string;
};

const ChatArea: React.FC<ChatAreaProps> = ({ assignmentId, contactName, contactAvatar }) => {
  const { status, myUserId, messages, hasMore, sendMessage, markRead, loadMore } =
    useChatSocket(assignmentId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (status === 'auth_ok' && messages.length > 0) markRead();
  }, [messages.length, status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!assignmentId) {
    return (
      <div className="chp__chat-empty">
        <span className="material-icons">forum</span>
        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="chp__chat">
      {/* Chat header */}
      <div className="chp__chat-header">
        <div className="chp__chat-avatar">
          {contactAvatar
            ? <img src={contactAvatar} alt={contactName} />
            : <span>{getInitials(contactName)}</span>
          }
        </div>
        <div className="chp__chat-contact-info">
          <span className="chp__chat-name">{contactName}</span>
          <span className={`chp__conn-badge ${status === 'auth_ok' ? 'chp__conn-badge--ok' : 'chp__conn-badge--off'}`}>
            {status === 'auth_ok' ? 'Trực tuyến' : status === 'connecting' ? 'Đang kết nối...' : 'Mất kết nối'}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div className="chp__messages">
        {hasMore && messages.length >= 30 && (
          <button className="chp__load-more" onClick={loadMore}>
            <span className="material-icons">expand_less</span>
            Tải thêm
          </button>
        )}

        {messages.length === 0 && status === 'auth_ok' && (
          <div className="chp__msg-placeholder">
            <span className="material-icons">waving_hand</span>
            <p>Bắt đầu cuộc trò chuyện với {contactName}!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderUserId === myUserId;
          const prev = messages[i - 1];
          const showDate = !prev || formatDate(msg.createdAt) !== formatDate(prev.createdAt);
          const showAvatar = !isMine && (!messages[i + 1] || messages[i + 1].senderUserId !== msg.senderUserId);

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="chp__date-sep">
                  <span>{formatDate(msg.createdAt)}</span>
                </div>
              )}
              <div className={`chp__msg ${isMine ? 'chp__msg--out' : 'chp__msg--in'}`}>
                {!isMine && (
                  <div className={`chp__msg-av ${showAvatar ? '' : 'chp__msg-av--hidden'}`}>
                    {contactAvatar
                      ? <img src={contactAvatar} alt={contactName} />
                      : <span>{getInitials(contactName)}</span>
                    }
                  </div>
                )}
                <div className="chp__msg-wrap">
                  <div className={`chp__bubble ${msg.pending ? 'chp__bubble--pending' : ''}`}>
                    {msg.body}
                  </div>
                  <span className="chp__msg-meta">
                    {msg.pending ? (
                      <span className="material-icons chp__tick chp__tick--pending" title="Đang chờ kết nối...">
                        schedule
                      </span>
                    ) : (
                      <>
                        {formatTime(msg.createdAt)}
                        {isMine && (
                          <span
                            className={`material-icons chp__tick ${
                              msg.readAt
                                ? 'chp__tick--read'
                                : msg.deliveredAt
                                ? 'chp__tick--delivered'
                                : ''
                            }`}
                            title={msg.readAt ? 'Đã xem' : msg.deliveredAt ? 'Đã nhận' : 'Đã gửi'}
                          >
                            {msg.readAt || msg.deliveredAt ? 'done_all' : 'done'}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <ChatInputBar status={status} onSend={sendMessage} />
    </div>
  );
};

// ── ChatPage ───────────────────────────────────────────────────────────────

const ChatPage: React.FC = () => {
  const { role, isAuthLoading } = useAuth();
  const isStudent = role === 'HocVien';
  const isTeacher = role === 'GiaoVien';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadConversations = useCallback(async () => {
    if (isAuthLoading) return;
    setLoading(true);
    try {
      if (isStudent) {
        const res = await axios.get<{ EC: number; DT: MyProgress }>('/api/student-portal/my-progress');
        if (res.data.EC === 0 && res.data.DT.assignment?.teacher) {
          const { assignment } = res.data.DT;
          const conv: Conversation = {
            assignmentId: assignment.id,
            name: assignment.teacher!.username,
            avatarUrl: assignment.teacher!.profile?.avatarUrl,
            role: 'teacher',
            status: assignment.status,
          };
          setConversations([conv]);
          setSelectedId(assignment.id);
        }
      } else if (isTeacher) {
        const res = await axios.get<{ EC: number; DT: TeacherAssignment[] }>('/api/teacher/my-students');
        if (res.data.EC === 0) {
          const convs: Conversation[] = res.data.DT.map((a) => ({
            assignmentId: a.id,
            name: a.hocVien?.HoTen ?? 'Học viên',
            role: 'student' as const,
            status: a.status,
          }));
          setConversations(convs);
          if (convs.length > 0) setSelectedId(convs[0].assignmentId);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isStudent, isTeacher, isAuthLoading]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selected = conversations.find((c) => c.assignmentId === selectedId) ?? null;

  const filtered = conversations.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="chp">
      {/* ── Contact list ── */}
      <div className="chp__contacts">
        <div className="chp__contacts-header">
          <h2 className="chp__contacts-title">Tin nhắn</h2>
        </div>
        <div className="chp__search-wrap">
          <span className="material-icons">search</span>
          <input
            className="chp__search"
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chp__contact-list">
          {loading && (
            <div className="chp__contact-loading">
              <span className="material-icons chp__spin">sync</span>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="chp__contact-empty">
              <span className="material-icons">person_off</span>
              <p>{isStudent ? 'Chưa có giáo viên được phân công' : 'Chưa có học viên nào'}</p>
            </div>
          )}
          {filtered.map((c) => (
            <button
              key={c.assignmentId}
              className={`chp__contact-item ${selectedId === c.assignmentId ? 'chp__contact-item--active' : ''}`}
              onClick={() => setSelectedId(c.assignmentId)}
            >
              <div className="chp__contact-av">
                {c.avatarUrl
                  ? <img src={c.avatarUrl} alt={c.name} />
                  : <span>{getInitials(c.name)}</span>
                }
                <span className={`chp__status-dot ${STATUS_DOT[c.status] ?? ''}`} />
              </div>
              <div className="chp__contact-meta">
                <span className="chp__contact-name">{c.name}</span>
                <span className="chp__contact-sub">
                  {c.role === 'teacher' ? 'Giáo viên của tôi' : 'Học viên'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <ChatArea
        assignmentId={selectedId}
        contactName={selected?.name ?? ''}
        contactAvatar={selected?.avatarUrl}
      />
    </div>
  );
};

export default ChatPage;
