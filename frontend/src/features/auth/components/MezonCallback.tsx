import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

interface SafeJsonResult {
  parsed: any;
  rawText: string;
}

const safeJsonParse = (text: string): SafeJsonResult => {
  try {
    return { parsed: JSON.parse(text), rawText: text };
  } catch (error) {
    return { parsed: null, rawText: text };
  }
};

const extractErrorMessage = (payload: any): string => {
  if (!payload) return 'Phan hoi khong hop le tu server.';

  const detailDescription =
    payload?.details?.error_description ||
    payload?.details?.message ||
    payload?.error_description ||
    payload?.EM ||
    payload?.error;

  return detailDescription || 'Dang nhap Mezon that bai.';
};

export const MezonCallback: React.FC = () => {
  const { setAuth } = useAuth();
  const isPopupFlow = typeof window !== 'undefined' && Boolean(window.opener && window.opener !== window);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('Dang xu ly dang nhap Mezon...');
  const hasHandledCallbackRef = useRef<boolean>(false);
  const isError = Boolean(error);

  useEffect(() => {
    if (hasHandledCallbackRef.current) {
      return;
    }
    hasHandledCallbackRef.current = true;

    const processCallback = async () => {
      const notifyOpener = (payload: { type: 'success' | 'error'; token?: string; role?: string; username?: string; avatarUrl?: string | null; message?: string }) => {
        if (isPopupFlow && window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              source: 'mezon-oauth',
              ...payload,
            },
            window.location.origin
          );
        }
      };

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code') || '';
        const state = urlParams.get('state') || '';
        const sessionState = sessionStorage.getItem('mezon_oauth_state') || '';
        const isStateValid = Boolean(state) && state === sessionState;
        const redirectUri = process.env.REACT_APP_MEZON_REDIRECT_URI || 'https://localhost:3000/mezon-callback';
        const backendUrl = process.env.REACT_APP_MEZON_BACKEND_URL || 'http://localhost:8080';

        if (!code || !state) {
          const message = 'Thieu code hoac state trong callback URL.';
          setError(message);
          setStatus('Dang nhap that bai');
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          return;
        }

        if (!isStateValid) {
          const message = 'State mismatch. Vui long dang nhap lai.';
          setError(message);
          setStatus('Dang nhap that bai');
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          return;
        }

        const response = await fetch(`${backendUrl}/api/mezon/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirect_uri: redirectUri,
          }),
        });

        const responseText = await response.text();
        const { parsed } = safeJsonParse(responseText);

        if (!response.ok) {
          const message = extractErrorMessage(parsed) || `HTTP ${response.status}`;
          setError(message);
          setStatus('Dang nhap that bai');
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          return;
        }

        if (!parsed || parsed?.EC !== 0 || !parsed?.DT?.access_token) {
          const message = extractErrorMessage(parsed);
          setError(message);
          setStatus('Dang nhap that bai');
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          return;
        }

        const role = parsed?.DT?.groupWithRoles?.name || 'User';
        const username = parsed?.DT?.username || parsed?.DT?.mezonUser?.username || 'User';
        const avatarUrl = parsed?.DT?.avatarUrl || null;
        sessionStorage.removeItem('mezon_oauth_state');

        if (isPopupFlow) {
          notifyOpener({ type: 'success', token: parsed.DT.access_token, role, username, avatarUrl });
          window.close();
          return;
        }

        setAuth(parsed.DT.access_token, role, username, avatarUrl);

        toast.success('Dang nhap Mezon thanh cong!');
        setStatus('Dang nhap thanh cong, dang chuyen huong...');
        window.location.replace('/#/dashboard');
      } catch (err: any) {
        const message = err?.message || 'Khong the xu ly callback Mezon.';
        setError(message);
        setStatus('Dang nhap that bai');
        if (window.opener && window.opener !== window && !window.opener.closed) {
          window.opener.postMessage(
            {
              source: 'mezon-oauth',
              type: 'error',
              message,
            },
            window.location.origin
          );
          window.close();
        }
      }
    };

    processCallback();
  }, [isPopupFlow, setAuth]);

  if (isPopupFlow) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at 15% 20%, #dbeafe 0%, #eff6ff 45%, #f8fafc 100%)',
      }}
    >
      <style>
        {`@keyframes mezonSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes mezonPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}
      </style>

      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          boxShadow: '0 22px 56px rgba(30, 41, 59, 0.16)',
          padding: '28px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              border: isError ? '2px solid #fda4af' : '2px solid #93c5fd',
              borderTopColor: isError ? '#e11d48' : '#2563eb',
              animation: isError ? 'mezonPulse 1.2s ease-in-out infinite' : 'mezonSpin 0.9s linear infinite',
              flexShrink: 0,
            }}
          />
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '40px', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Mezon Callback
            </h2>
          </div>
        </div>

        <p style={{ marginTop: 0, marginBottom: '10px', color: '#334155', fontSize: '18px', fontWeight: 500 }}>
          {status}
        </p>
        {!error ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            He thong dang hoan tat xac thuc OAuth2 va se chuyen huong sau vai giay...
          </p>
        ) : null}

        {error ? (
          <div
            style={{
              marginTop: '14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#9f1239',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '16px',
              lineHeight: 1.5,
            }}
          >
            <strong>Loi:</strong> {error}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MezonCallback;
