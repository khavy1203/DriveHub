import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../../axios';
import './AdminApiConfigPage.scss';

type TestStatus = 'success' | 'error' | 'untested' | 'testing';

type ServerInfo = {
  app?: string;
  host?: string;
  os?: string;
  status?: string;
  time?: string;
  version?: string;
};

type ConfigData = {
  adminId: number;
  apiBaseUrl: string | null;
  apiKey: string | null;
  hasApiKey: boolean;
  lastTestedAt: string | null;
  lastTestStatus: 'success' | 'error' | 'untested';
  lastTestMessage: string | null;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Chưa thử';
  return new Date(iso).toLocaleString('vi-VN');
};

const AdminApiConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Connection state
  const [connStatus, setConnStatus] = useState<TestStatus>('untested');
  const [connMessage, setConnMessage] = useState<string | null>(null);
  const [connTestedAt, setConnTestedAt] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const runTest = useCallback(async (url: string) => {
    if (!url) return;
    setConnStatus('testing');
    setConnMessage(null);
    setServerInfo(null);
    try {
      const res = await axios.post('/api/admin/api-config/test', { apiBaseUrl: url });
      const ok = res.data?.EC === 0;
      const now = new Date().toISOString();
      setConnTestedAt(now);
      if (ok) {
        setConnStatus('success');
        setConnMessage(res.data?.EM || 'Kết nối thành công');
        setServerInfo(res.data?.DT ?? null);
      } else {
        setConnStatus('error');
        setConnMessage(res.data?.EM || 'Kết nối thất bại');
      }
    } catch {
      setConnStatus('error');
      setConnMessage('Lỗi kết nối máy chủ');
      setConnTestedAt(new Date().toISOString());
    }
  }, []);

  // Load config + auto-test
  useEffect(() => {
    axios.get('/api/admin/api-config')
      .then(res => {
        if (res.data?.EC === 0 && res.data.DT) {
          const d = res.data.DT as ConfigData;
          setConfig(d);
          setApiBaseUrl(d.apiBaseUrl || '');
          setSavedApiKey(d.apiKey || null);
          // Auto-test if URL is configured
          if (d.apiBaseUrl) {
            runTest(d.apiBaseUrl);
          }
        }
      })
      .catch(() => {});
  }, [runTest]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await axios.put('/api/admin/api-config', {
        apiBaseUrl,
        apiKey: apiKey || undefined,
      });
      if (res.data?.EC === 0) {
        setSaveMsg('Đã lưu cấu hình.');
        if (apiKey) {
          setSavedApiKey(apiKey);
          setConfig(prev => prev ? { ...prev, apiBaseUrl, apiKey, hasApiKey: true } : prev);
          setApiKey('');
        } else {
          setConfig(prev => prev ? { ...prev, apiBaseUrl } : prev);
        }
        // Auto-test after save
        await runTest(apiBaseUrl);
      } else {
        setSaveMsg('Lỗi lưu cấu hình.');
      }
    } catch {
      setSaveMsg('Lỗi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const isTesting = connStatus === 'testing';

  const statusMap: Record<string, { cls: string; icon: string; label: string }> = {
    success:  { cls: 'aac__status--success',  icon: 'check_circle', label: 'Kết nối thành công' },
    error:    { cls: 'aac__status--error',    icon: 'error',        label: 'Kết nối thất bại' },
    untested: { cls: 'aac__status--untested', icon: 'info',         label: 'Chưa kiểm tra' },
    testing:  { cls: 'aac__status--untested', icon: 'sync',         label: 'Đang kiểm tra...' },
  };
  const badge = statusMap[connStatus] ?? statusMap.untested;

  return (
    <div className="aac">
      <div>
        <h1 className="aac__title">Kết nối API Đào tạo</h1>
        <p className="aac__subtitle">Cấu hình địa chỉ máy chủ API của hệ thống đào tạo cho đơn vị này.</p>
      </div>

      <div className="aac__card">
        <h2 className="aac__card-title">Cấu hình máy chủ</h2>

        <div className="aac__field">
          <label className="aac__label" htmlFor="aac-url">URL máy chủ API</label>
          <input
            id="aac-url"
            className="aac__input"
            type="url"
            value={apiBaseUrl}
            onChange={e => setApiBaseUrl(e.target.value)}
            placeholder="http://192.168.1.100:8199"
          />
          <p className="aac__hint">Ví dụ: http://117.2.131.102:8199 — không có dấu / ở cuối</p>
        </div>

        <div className="aac__field">
          <label className="aac__label">Key đang dùng</label>
          {savedApiKey ? (
            <code className="aac__saved-key-value">{savedApiKey}</code>
          ) : (
            <p className="aac__hint">Chưa có API Key</p>
          )}
        </div>

        <div className="aac__field">
          <label className="aac__label" htmlFor="aac-key">
            {savedApiKey ? 'Đổi API Key' : 'Nhập API Key'}
          </label>
          <input
            id="aac-key"
            className="aac__input"
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Nhập API key từ máy chủ đào tạo"
          />
          <p className="aac__hint">Key xác thực do máy chủ đào tạo cung cấp. Tất cả API đồng bộ sẽ gửi kèm key này.</p>
        </div>

        <div className="aac__actions">
          <button className="aac__btn aac__btn--primary" onClick={handleSave} disabled={saving || isTesting}>
            {saving ? <span className="aac__spinner" /> : <span className="material-icons">save</span>}
            Lưu cấu hình
          </button>
          <button className="aac__btn aac__btn--ghost" onClick={() => runTest(apiBaseUrl)} disabled={isTesting || !apiBaseUrl}>
            {isTesting ? <span className="aac__spinner" /> : <span className="material-icons">wifi_tethering</span>}
            Kiểm tra kết nối
          </button>
        </div>

        {saveMsg && <p className="aac__hint" style={{ color: '#2563eb' }}>{saveMsg}</p>}
      </div>

      {/* Connection status */}
      <div className="aac__card">
        <h2 className="aac__card-title">Trạng thái kết nối</h2>
        <div className={`aac__status ${badge.cls}`}>
          <span className={`material-icons${isTesting ? ' aac__spin' : ''}`}>{badge.icon}</span>
          <div>
            <div>{connMessage || badge.label}</div>
            {connTestedAt && <div className="aac__meta">Lần cuối: {formatDate(connTestedAt)}</div>}
          </div>
        </div>

        {serverInfo && connStatus === 'success' && (
          <div className="aac__server-info">
            <h3 className="aac__server-info-title">Thông tin máy chủ</h3>
            <div className="aac__server-info-grid">
              {serverInfo.host && (
                <div className="aac__info-item">
                  <span className="material-icons">dns</span>
                  <div>
                    <span className="aac__info-label">Host</span>
                    <span className="aac__info-value">{serverInfo.host}</span>
                  </div>
                </div>
              )}
              {serverInfo.os && (
                <div className="aac__info-item">
                  <span className="material-icons">desktop_windows</span>
                  <div>
                    <span className="aac__info-label">Hệ điều hành</span>
                    <span className="aac__info-value">{serverInfo.os}</span>
                  </div>
                </div>
              )}
              {serverInfo.app && (
                <div className="aac__info-item">
                  <span className="material-icons">apps</span>
                  <div>
                    <span className="aac__info-label">Ứng dụng</span>
                    <span className="aac__info-value">{serverInfo.app}{serverInfo.version ? ` v${serverInfo.version}` : ''}</span>
                  </div>
                </div>
              )}
              {serverInfo.time && (
                <div className="aac__info-item">
                  <span className="material-icons">schedule</span>
                  <div>
                    <span className="aac__info-label">Thời gian server</span>
                    <span className="aac__info-value">{new Date(serverInfo.time).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              )}
              {serverInfo.status && (
                <div className="aac__info-item">
                  <span className="material-icons">power</span>
                  <div>
                    <span className="aac__info-label">Trạng thái</span>
                    <span className="aac__info-value">{serverInfo.status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApiConfigPage;
