import React, { useState, useRef, useEffect } from 'react';
import useNotifications from '../hooks/useNotifications';
import type { NotificationRecipient } from '../types';
import FilePreviewModal from '../../../shared/components/FilePreviewModal/FilePreviewModal';
import { getConfig } from '../../../core/config/environment';
import './NotificationBell.scss';

const timeAgo = (raw: string) => {
  const diff = Date.now() - new Date(raw).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(raw).toLocaleDateString('vi-VN');
};

const getFileIcon = (mime: string) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf')) return 'picture_as_pdf';
  if (mime.includes('sheet') || mime.includes('excel')) return 'table_chart';
  return 'description';
};

type PreviewFile = { fileUrl: string; fileName: string; fileType: string } | null;

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, loading, markRead, markAllRead, loadMore, total } = useNotifications();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = () => {
    setOpen(prev => !prev);
    setExpandedId(null);
  };

  const handleItemClick = (item: NotificationRecipient) => {
    if (!item.isRead) markRead(item.id);
    setExpandedId(prev => prev === item.id ? null : item.id);
  };

  const openFilePreview = (filePath: string, fileName: string, fileType: string) => {
    const base = getConfig().API_BASE_URL;
    setPreviewFile({ fileUrl: `${base}${filePath}`, fileName, fileType });
  };

  return (
    <div className="nb" ref={panelRef}>
      <button type="button" className="nb__trigger" onClick={handleToggle} title="Thông báo">
        <span className="material-icons">notifications</span>
        {unreadCount > 0 && <span className="nb__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="nb__panel">
          <div className="nb__panel-header">
            <h4>Thông báo</h4>
            {unreadCount > 0 && (
              <button type="button" className="nb__mark-all" onClick={markAllRead}>
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="nb__panel-body">
            {loading && notifications.length === 0 ? (
              <p className="nb__empty">Đang tải...</p>
            ) : notifications.length === 0 ? (
              <p className="nb__empty">Không có thông báo</p>
            ) : (
              <>
                {notifications.map(item => {
                  const n = item.notification;
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`nb__item ${!item.isRead ? 'nb__item--unread' : ''} ${n.priority === 'important' ? 'nb__item--important' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="nb__item-top">
                        <div className="nb__item-icon">
                          <span className="material-icons">
                            {n.priority === 'important' ? 'priority_high' : 'campaign'}
                          </span>
                        </div>
                        <div className="nb__item-info">
                          <span className="nb__item-title">{n.title}</span>
                          {!isExpanded && (
                            <span className="nb__item-preview">
                              {n.content.slice(0, 80)}{n.content.length > 80 ? '...' : ''}
                            </span>
                          )}
                          <span className="nb__item-time">
                            {timeAgo(n.createdAt)}
                            {n.attachments?.length > 0 && (
                              <span className="nb__item-attach">
                                <span className="material-icons" style={{ fontSize: 14 }}>attach_file</span>
                                {n.attachments.length}
                              </span>
                            )}
                          </span>
                        </div>
                        {!item.isRead && <span className="nb__item-dot" />}
                      </div>

                      {isExpanded && (
                        <div className="nb__item-expanded" onClick={e => e.stopPropagation()}>
                          <p className="nb__item-content">{n.content}</p>
                          {n.attachments?.length > 0 && (
                            <div className="nb__item-files">
                              {n.attachments.map(att => (
                                <button
                                  key={att.id}
                                  type="button"
                                  className="nb__file-chip"
                                  onClick={() => openFilePreview(att.filePath, att.fileName, att.fileType)}
                                >
                                  <span className="material-icons">{getFileIcon(att.fileType)}</span>
                                  <span className="nb__file-chip-name">{att.fileName}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {n.creator && (
                            <span className="nb__item-sender">Gửi bởi: {n.creator.username}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {notifications.length < total && (
                  <button type="button" className="nb__load-more" onClick={loadMore}>
                    Xem thêm
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          fileUrl={previewFile.fileUrl}
          fileName={previewFile.fileName}
          fileType={previewFile.fileType}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
