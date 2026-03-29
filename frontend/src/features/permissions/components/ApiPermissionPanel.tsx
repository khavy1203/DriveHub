import React, { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useGroupApiMatrix } from '../hooks/useGroupApiMatrix';
import { useApiEndpointSync } from '../hooks/useApiEndpointSync';
import type { ApiEndpoint, PermissionMatrixGroup } from '../types';

const GROUP_BADGE: Record<string, string> = {
  supperadmin: 'supperadmin',
  admin: 'admin',
  giaovien: 'giaovien',
  hocvien: 'hocvien',
  khachhang: 'khachhang',
};

type Props = {
  canSyncRegistry: boolean;
};

const ApiPermissionPanel: React.FC<Props> = ({ canSyncRegistry }) => {
  const { data, loading, error, refetch, setGroupApis } = useGroupApiMatrix();
  const { syncing, lastResult, sync } = useApiEndpointSync();
  const [featureFilter, setFeatureFilter] = useState('');
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<string | null>(null);

  const featureGroups = useMemo(() => {
    if (!data?.endpoints) return [];
    const s = new Set(data.endpoints.map((e) => e.featureGroup));
    return [...s].sort();
  }, [data?.endpoints]);

  const groupedEndpoints = useMemo(() => {
    if (!data?.endpoints) return new Map<string, ApiEndpoint[]>();
    const q = search.trim().toLowerCase();
    const m = new Map<string, ApiEndpoint[]>();
    for (const ep of data.endpoints) {
      if (featureFilter && ep.featureGroup !== featureFilter) continue;
      if (q) {
        const hay = `${ep.method} ${ep.path} ${ep.pattern} ${ep.description}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const list = m.get(ep.featureGroup) ?? [];
      list.push(ep);
      m.set(ep.featureGroup, list);
    }
    return m;
  }, [data?.endpoints, featureFilter, search]);

  const matrixGroups = useMemo(
    () => (data?.groups ?? []).filter((g) => g.name !== 'SupperAdmin'),
    [data?.groups],
  );

  const toggleOpen = (key: string) => {
    setOpenGroups((g) => {
      const expanded = g[key] !== false;
      return { ...g, [key]: !expanded };
    });
  };

  const badgeKey = (g: PermissionMatrixGroup) => GROUP_BADGE[g.name.toLowerCase()] ?? 'khachhang';

  const hasAccess = (groupId: number, epId: number) => (data?.matrix[groupId] ?? []).includes(epId);

  const handleToggle = useCallback(
    async (groupId: number, ep: ApiEndpoint, nextChecked: boolean) => {
      if (!data) return;
      const key = `${groupId}-${ep.id}`;
      setPending(key);
      const current = new Set(data.matrix[groupId] ?? []);
      if (nextChecked) current.add(ep.id);
      else current.delete(ep.id);
      try {
        await setGroupApis(groupId, [...current]);
      } finally {
        setPending(null);
      }
    },
    [data, setGroupApis],
  );

  const handleSync = async () => {
    await sync();
    await refetch();
  };

  const renderCell = (g: PermissionMatrixGroup, ep: ApiEndpoint) => {
    if (ep.isPublic) {
      return <span className="perm__api-badge perm__api-badge--public">Public</span>;
    }
    if (ep.method === 'GET') {
      return <span className="perm__api-badge perm__api-badge--get">GET (mở)</span>;
    }
    const checked = hasAccess(g.id, ep.id);
    const key = `${g.id}-${ep.id}`;
    return (
      <label className="perm__api-check">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending === key}
          onChange={(e) => handleToggle(g.id, ep, e.target.checked)}
        />
      </label>
    );
  };

  if (loading && !data) {
    return (
      <div className="perm__loading">
        <span className="perm__spinner" />
        Đang tải ma trận API…
      </div>
    );
  }

  if (error) {
    return <div className="perm__form-error">{error}</div>;
  }

  return (
    <div className="perm__api-panel">
      <div className="perm__api-toolbar">
        <div>
          <h2 className="perm__api-heading">API &amp; Phân quyền</h2>
          <p className="perm__api-sub">
            POST/PUT/DELETE kiểm tra theo DB. GET mặc định không chặn. Thay đổi quyền API có hiệu lực ngay; JWT role cũ vẫn cần đăng nhập lại nếu đổi nhóm.
            {' '}
            Nhóm <strong>SupperAdmin</strong> luôn toàn quyền trên server — không hiển thị cột trong bảng.
          </p>
        </div>
        <div className="perm__api-sync-col">
          {canSyncRegistry ? (
            <button
              type="button"
              className="perm__btn perm__btn--primary"
              disabled={syncing}
              onClick={handleSync}
            >
              {syncing ? (
                <>
                  <span className="perm__spinner perm__spinner--inline" />
                  Đang sync…
                </>
              ) : (
                <>
                  <i className="material-icons">sync</i> Sync API endpoints
                </>
              )}
            </button>
          ) : (
            <p className="perm__api-sync-hint">Chỉ tài khoản SupperAdmin mới sync registry từ mã nguồn.</p>
          )}
        </div>
      </div>

      {lastResult && (
        <div className="perm__api-sync-msg">
          Đã thêm {lastResult.synced} endpoint mới, cập nhật {lastResult.updated} bản ghi (tổng {lastResult.total} trong registry).
        </div>
      )}

      <div className="perm__api-filters">
        <select
          className="perm__select"
          value={featureFilter}
          onChange={(e) => setFeatureFilter(e.target.value)}
        >
          <option value="">Tất cả nhóm tính năng</option>
          {featureGroups.map((fg) => (
            <option key={fg} value={fg}>
              {fg}
            </option>
          ))}
        </select>
        <div className="perm__search-wrap">
          <i className="material-icons">search</i>
          <input
            className="perm__search"
            placeholder="Tìm method, path, mô tả…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="perm__api-scroll">
        {[...groupedEndpoints.entries()].map(([fg, eps]) => {
          const open = openGroups[fg] !== false;
          return (
            <div key={fg} className="perm__api-fg">
              <button type="button" className="perm__api-fg-head" onClick={() => toggleOpen(fg)}>
                <i className="material-icons">{open ? 'expand_less' : 'chevron_right'}</i>
                <span>{fg}</span>
                <span className="perm__api-fg-count">({eps.length} API)</span>
              </button>
              {open && (
                <table className="perm__api-table">
                  <thead>
                    <tr>
                      <th className="perm__api-col-api">API</th>
                      {matrixGroups.map((g) => (
                        <th key={g.id} className="perm__api-col-group">
                          <span className={`perm__group-badge perm__group-badge--${badgeKey(g)}`}>{g.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eps.map((ep) => (
                      <tr key={ep.id}>
                        <td className="perm__api-cell-desc">
                          <div className="perm__api-line">
                            <code className="perm__api-method">{ep.method}</code>
                            <code className="perm__api-path">{ep.path}</code>
                          </div>
                          {ep.pattern !== ep.path && (
                            <div className="perm__api-pattern">{ep.pattern}</div>
                          )}
                          <div className="perm__api-desc">{ep.description}</div>
                        </td>
                        {matrixGroups.map((g) => (
                          <td key={g.id} className="perm__api-cell-check">
                            {renderCell(g, ep)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ApiPermissionPanelWithAuth: React.FC = () => {
  const { role } = useAuth();
  const canSyncRegistry = role === 'SupperAdmin';
  return <ApiPermissionPanel canSyncRegistry={canSyncRegistry} />;
};

export default ApiPermissionPanelWithAuth;
