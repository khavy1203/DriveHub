const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:8080';

const ROUTES = {
    HOME: '/',
    STUDENT_LIST: '/students',
    PAYMENT_UPLOAD: '/upload/payment',
};

const WS_PATHS = {
    STUDENT_STATUS: '/ws/student-status',
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
};

const CONFIG = {
    TIMEZONE: 'Asia/Ho_Chi_Minh',
    LOCALE: 'vi-VN',
    PAGE_SIZE: 20,
};

const MESSAGES = {
    ERROR: {
        NETWORK: 'Lỗi mạng, vui lòng kiểm tra kết nối.',
        SERVER: 'Lỗi server, vui lòng thử lại sau.',
        NOT_FOUND: 'Không tìm thấy tài nguyên.',
    },
    SUCCESS: {
        UPLOAD: 'Upload thành công!',
        UPDATE: 'Cập nhật thành công!',
    },
};

const THEME = {
    COLORS: {
        PRIMARY: '#007bff',
        SECONDARY: '#6c757d',
        SUCCESS: '#28a745',
        ERROR: '#dc3545',
        WARNING: '#ffc107',
    },
};

const MAX_FILE_SIZE_MB = 10; // Max upload size

const CONFIGS = {
    development: {
        API_BASE_URL: 'http://localhost:8080',
        WS_BASE_URL: 'ws://localhost:8080/ws/student-status',
    },
    production: {
        API_BASE_URL: 'http://node-app-9asc.onrender.com',
        WS_BASE_URL: 'wss://node-app-9asc.onrender.com/ws/student-status',
    },
    buildlocal: {
        API_BASE_URL: 'http://192.168.1.99:8080',
        WS_BASE_URL: 'ws://192.168.1.99:8080/ws/student-status',
    },
    adminbuildlocal: {
        API_BASE_URL: 'http://192.168.1.99:8080',
        WS_BASE_URL: 'ws://192.168.1.99:8080/ws/student-status',
    },
    buildlocal_teacher: {
        API_BASE_URL: 'http://localhost:8080',
        WS_BASE_URL: 'ws://localhost:8080/ws/student-status',
    }
};

module.exports = {
    API_BASE_URL,
    WS_BASE_URL,
    ROUTES,
    WS_PATHS,
    HTTP_STATUS,
    CONFIG,
    MESSAGES,
    THEME,
    MAX_FILE_SIZE_MB,
    CONFIGS
};
