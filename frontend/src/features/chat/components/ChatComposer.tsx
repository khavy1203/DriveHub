import React, { KeyboardEvent, memo, useState } from 'react';

export type ChatComposerStatus = 'connecting' | 'auth_ok' | 'auth_error' | 'closed';

export type ChatComposerProps = {
  status: ChatComposerStatus;
  onSend: (body: string) => void;
  /** `dashboard` = Tin nhắn page classes; `portal` = teacher sidebar panel */
  variant: 'dashboard' | 'portal';
  /** When false, omit the reconnect strip (e.g. portal shows status in header only). */
  showReconnectHint?: boolean;
};

const CLASSES = {
  dashboard: {
    wrap: 'chp__input-bar',
    input: 'chp__input',
    btn: 'chp__send-btn',
    reconnect: 'chp__reconnect-bar',
  },
  portal: {
    wrap: 'cp__input-row',
    input: 'cp__input',
    btn: 'cp__send-btn',
    reconnect: 'chp__reconnect-bar',
  },
} as const;

/**
 * Isolated memo composer: input state lives here so parent re-renders (WebSocket list
 * updates) and keystrokes do not re-mount the textarea — required for Evkey / IME.
 */
export const ChatComposer = memo(function ChatComposer({
  status,
  onSend,
  variant,
  showReconnectHint = true,
}: ChatComposerProps) {
  const c = CLASSES[variant];
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    handleSend();
  };

  const showReconnect =
    showReconnectHint && variant === 'dashboard' && status === 'closed';

  return (
    <>
      {showReconnect && (
        <div className={c.reconnect}>
          <span className="material-icons chp__spin">sync</span>
          Mất kết nối — tin nhắn sẽ được gửi khi kết nối lại
        </div>
      )}
      <div className={c.wrap}>
        <textarea
          className={c.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          rows={1}
          disabled={status !== 'auth_ok'}
          lang="vi"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          className={c.btn}
          onClick={handleSend}
          disabled={status !== 'auth_ok' || !input.trim()}
        >
          <span className="material-icons">send</span>
        </button>
      </div>
    </>
  );
});
