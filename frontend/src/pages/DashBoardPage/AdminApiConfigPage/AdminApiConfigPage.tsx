import React, { useEffect, useState } from 'react';
import axios from '../../../axios';
import './AdminApiConfigPage.scss';

type TestStatus = 'success' | 'error' | 'untested';

type ConfigData = {
  adminId: number;
  apiBaseUrl: string | null;
  hasApiKey: boolean;
  lastTestedAt: string | null;
  lastTestStatus: TestStatus;
  lastTestMessage: string | null;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Chưa thử';
  return new Date(iso).toLocaleString('vi-VN');
};

const StatusBadge: React.FC<{ status: TestStatus; message: string | null; testedAt: string | null }> = ({
  status,
  message,
  testedAt,
}) => {
  const map: Record<TestStatus, { cls: string; icon: string; label: string }> = {
    success: { cls: 'aac__status--success', icon: 'check_circle', label: 'Kết nối thành công' },
    error:   { cls: 'aac__status--error',   icon: 'error',         label: 'Kết nối thất bại' },
    untested:{ cls: 'aac__status--untested',icon: 'info',          label: 'Chưa kiểm tra' },
  };
  const { cls, icon, label } = map[status] ?? map.untested;
  return (
    <div className={`aac__status ${cls}`}>
      <span className="material-icons">{icon}</span>
      <div>
        <div>{message || label}</div>
        {testedAt && <div className="aac__meta">Lần cuối: {formatDate(testedAt)}</div>}
      </div>
    </div>
  );
};

const AdminApiConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/admin/api-config')
      .then(res => {
        if (res.data?.EC === 0 && res.data.DT) {
          const d = res.data.DT as ConfigData;
          setConfig(d);
          setApiBaseUrl(d.apiBaseUrl || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await axios.put('/api/admin/api-config', { apiBaseUrl, apiKey: apiKey || undefined });
      if (res.data?.EC === 0) {
        setSaveMsg('Đã lưu cấu hình.');
        setApiKey('');
        setConfig(prev => prev ? { ...prev, apiBaseUrl, lastTestStatus: 'untested', lastTestMessage: null } : prev);
      } else {
        setSaveMsg('Lỗi lưu cấu hình.');
      }
    } catch {
      setSaveMsg('Lỗi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await axios.post('/api/admin/api-config/test', { apiBaseUrl });
      const ok = res.data?.EC === 0;
      const msg = res.data?.EM || (ok ? 'Kết nối thành công' : 'Kết nối thất bại');
      setConfig(prev => prev
        ? { ...prev, lastTestStatus: ok ? 'success' : 'error', lastTestMessage: msg, lastTestedAt: new Date().toISOString() }
        : prev
      );
    } catch {
      setConfig(prev => prev
        ? { ...prev, lastTestStatus: 'error', lastTestMessage: 'Lỗi kết nối máy chủ', lastTestedAt: new Date().toISOString() }
        : prev
      );
    } finally {
      setTesting(false);
    }
  };

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
          <label className="aac__label" htmlFor="aac-key">API Key {config?.hasApiKey && '(đã thiết lập)'}</label>
          <input
            id="aac-key"
            className="aac__input"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={config?.hasApiKey ? '••••••••  (để trống để giữ nguyên)' : 'Nhập API key nếu có'}
          />
        </div>

        <div className="aac__actions">
          <button className="aac__btn aac__btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="aac__spinner" /> : <span className="material-icons">save</span>}
            Lưu cấu hình
          </button>
          <button className="aac__btn aac__btn--ghost" onClick={handleTest} disabled={testing || !apiBaseUrl}>
            {testing ? <span className="aac__spinner" /> : <span className="material-icons">wifi_tethering</span>}
            Kiểm tra kết nối
          </button>
        </div>

        {saveMsg && <p className="aac__hint" style={{ color: '#2563eb' }}>{saveMsg}</p>}
      </div>

      {config && (
        <div className="aac__card">
          <h2 className="aac__card-title">Trạng thái kết nối</h2>
          <StatusBadge
            status={config.lastTestStatus}
            message={config.lastTestMessage}
            testedAt={config.lastTestedAt}
          />
        </div>
      )}
    </div>
  );
};

export default AdminApiConfigPage;
