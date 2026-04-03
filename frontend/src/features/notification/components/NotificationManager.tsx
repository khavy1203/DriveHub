import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as api from '../services/notificationApi';
import type { AdminNotificationRow, PaginatedResponse } from '../types';
import NotificationForm from './NotificationForm';
import './NotificationManager.scss';

const TYPE_LABEL: Record<string, string> = {
  admin_to_st: 'SupperTeacher',
  admin_to_student: 'Học viên',
};

const PRIORITY_LABEL: Record<string, string> = {
  normal: 'Bình thường',
  important: 'Quan trọng',
};

const formatDate = (raw: string) => {
  try {
    return new Date(raw).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return raw;
  }
};

const NotificationManager: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<AdminNotificationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.getAdminHistory(p, 20, filterType || undefined);
      if (res.EC === 0) setData(res.DT);
    } catch {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { load(page); }, [load, page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      const res = await api.deleteNotification(id);
      if (res.EC === 0) {
        toast.success('Đã xóa');
        load(page);
      } else {
        toast.error(res.EM);
      }
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleCreated = () => {
    setShowForm(false);
    setPage(1);
    load(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="nm">
      <div className="nm__header">
        <div>
          <h2 className="nm__title">Quản lý thông báo</h2>
          <p className="nm__subtitle">Tạo và quản lý thông báo gửi đến SupperTeacher hoặc Học viên</p>
        </div>
        <button className="nm__btn-create" onClick={() => setShowForm(true)}>
          <span className="material-icons">campaign</span> Tạo thông báo
        </button>
      </div>

      <div className="nm__filters">
        <select
          className="nm__select"
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả loại</option>
          <option value="admin_to_st">Gửi SupperTeacher</option>
          <option value="admin_to_student">Gửi Học viên</option>
        </select>
      </div>

      {loading ? (
        <p className="nm__loading">Đang tải...</p>
      ) : !data || data.data.length === 0 ? (
        <div className="nm__empty">
          <span className="material-icons">notifications_none</span>
          <p>Chưa có thông báo nào</p>
        </div>
      ) : (
        <>
          <div className="nm__table-wrap">
            <table className="nm__table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Loại</th>
                  <th>Mức độ</th>
                  <th>File</th>
                  <th>Đã đọc</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(n => (
                  <tr key={n.id}>
                    <td className="nm__td-title">
                      <strong>{n.title}</strong>
                      <span className="nm__td-preview">{n.content.slice(0, 60)}{n.content.length > 60 ? '...' : ''}</span>
                    </td>
                    <td>
                      <span className={`nm__badge nm__badge--${n.type}`}>
                        {TYPE_LABEL[n.type]}
                      </span>
                    </td>
                    <td>
                      <span className={`nm__badge nm__badge--${n.priority}`}>
                        {PRIORITY_LABEL[n.priority]}
                      </span>
                    </td>
                    <td>
                      {n.attachments?.length > 0 ? (
                        <span className="nm__file-count">
                          <span className="material-icons" style={{ fontSize: 16 }}>attach_file</span>
                          {n.attachments.length}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="nm__read-count">{n.readCount}/{n.totalRecipients}</span>
                    </td>
                    <td>{formatDate(n.createdAt)}</td>
                    <td>
                      <button className="nm__btn-delete" onClick={() => handleDelete(n.id)} title="Xóa">
                        <span className="material-icons">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="nm__pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </>
      )}

      {showForm && <NotificationForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default NotificationManager;
