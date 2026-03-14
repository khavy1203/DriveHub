import React, { useEffect, useRef } from 'react';
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
  const hasHandledCallbackRef = useRef<boolean>(false);

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
        const redirectUri = process.env.REACT_APP_MEZON_REDIRECT_URI || `${window.location.origin}/mezon-callback`;
        const backendUrl = process.env.REACT_APP_MEZON_BACKEND_URL || 'http://localhost:8080';

        if (!code || !state) {
          const message = 'Thieu code hoac state trong callback URL.';
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          window.location.replace('/#/login');
          return;
        }

        if (!isStateValid) {
          const message = 'State mismatch. Vui long dang nhap lai.';
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          window.location.replace('/#/login');
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
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          window.location.replace('/#/login');
          return;
        }

        if (!parsed || parsed?.EC !== 0 || !parsed?.DT?.access_token) {
          const message = extractErrorMessage(parsed);
          notifyOpener({ type: 'error', message });
          if (isPopupFlow) {
            window.close();
          }
          window.location.replace('/#/login');
          return;
        }

        const role = parsed?.DT?.groupWithRoles?.name || 'User';
        const username = parsed?.DT?.username || parsed?.DT?.mezonUser?.username || 'User';
        const avatarUrl = parsed?.DT?.avatarUrl || null;
        const accessToken = parsed.DT.access_token as string;
        sessionStorage.removeItem('mezon_oauth_state');

        if (isPopupFlow) {
          notifyOpener({ type: 'success', token: accessToken, role, username, avatarUrl });
          window.close();
          return;
        }

        localStorage.setItem('token', accessToken);
        setAuth(accessToken, role, username, avatarUrl);
        window.location.replace('/');
      } catch (err: any) {
        const message = err?.message || 'Khong the xu ly callback Mezon.';
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
          return;
        }

        window.location.replace('/#/login');
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
        background: '#ffffff',
      }}
    >
      <style>
        {`@keyframes mezonSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '999px',
          border: '3px solid #bfdbfe',
          borderTopColor: '#2563eb',
          animation: 'mezonSpin 0.8s linear infinite',
        }}
      />
    </div>
  );
};

export default MezonCallback;
