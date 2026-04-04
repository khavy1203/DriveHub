export type NotificationAttachment = {
  id: number;
  notificationId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
};

export type NotificationCreator = {
  id: number;
  username: string;
  email: string;
};

export type Notification = {
  id: number;
  title: string;
  content: string;
  type: 'admin_to_st' | 'admin_to_student' | 'admin_to_all' | 'superadmin_to_admin' | 'superadmin_to_student';
  targetScope: 'all' | 'selected';
  priority: 'normal' | 'important';
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  attachments: NotificationAttachment[];
  creator?: NotificationCreator;
};

export type NotificationRecipient = {
  id: number;
  notificationId: number;
  recipientUserId: number | null;
  recipientHocVienId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  notification: Notification;
};

export type AdminNotificationRow = Notification & {
  totalRecipients: number;
  readCount: number;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

export type CreateNotificationPayload = {
  title: string;
  content: string;
  type: 'admin_to_st' | 'admin_to_student' | 'admin_to_all' | 'superadmin_to_admin' | 'superadmin_to_student';
  targetScope: 'all' | 'selected';
  priority: 'normal' | 'important';
  recipientIds?: number[];
  files?: File[];
};
