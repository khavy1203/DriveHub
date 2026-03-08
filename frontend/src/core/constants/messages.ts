/**
 * Application messages constants
 * @module core/constants/messages
 */

export const MESSAGES = {
  ERROR: {
    NETWORK: 'Lỗi mạng, vui lòng kiểm tra kết nối.',
    SERVER: 'Lỗi server, vui lòng thử lại sau.',
    NOT_FOUND: 'Không tìm thấy tài nguyên.',
    UNAUTHORIZED: 'Chưa đăng nhập hoặc hết hạn token.',
    FORBIDDEN: 'Không có quyền truy cập.',
    GENERIC: 'Đã có lỗi xảy ra. Vui lòng thử lại!',
  },
  SUCCESS: {
    UPLOAD: 'Upload thành công!',
    UPDATE: 'Cập nhật thành công!',
    LOGIN: 'Đăng nhập thành công!',
    LOGOUT: 'Đăng xuất thành công!',
  },
} as const;
