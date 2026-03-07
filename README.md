# 📚 HƯỚNG DẪN CÀI ĐẶT DỰ ÁN DRIVEHUB

## 📋 Mục lục
1. [Giới thiệu dự án](#giới-thiệu-dự-án)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cấu trúc dự án](#cấu-trúc-dự-án)
4. [Cài đặt Database](#cài-đặt-database)
5. [Cài đặt Backend](#cài-đặt-backend)
6. [Cài đặt Frontend](#cài-đặt-frontend)
7. [Cài đặt Python App (Optional)](#cài-đặt-python-app-optional)
8. [Cài đặt Electron App (Optional)](#cài-đặt-electron-app-optional)
9. [Chạy dự án với Docker](#chạy-dự-án-với-docker)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới thiệu dự án

**DriveHub** là ứng dụng trợ lý trường dạy lái xe đa nền tảng với các tính năng:
- ✅ Ôn tập lý thuyết với 600 câu hỏi
- ✅ Thi thử trực tuyến
- ✅ Quản lý hồ sơ học viên
- ✅ Hỗ trợ đa môn học (A1, A2, B1, B2, C, D, E, F)
- ✅ Hệ thống xếp hạng và theo dõi tiến độ
- ✅ Quét QR code và nhận diện hình ảnh

---

## 💻 Yêu cầu hệ thống

### Phần mềm cần thiết:
- **Node.js**: v18.20.3 hoặc v20.17.0
- **npm**: 10.x trở lên
- **MySQL**: 5.5.30 hoặc 8.0 trở lên
- **Python**: 3.8+ (nếu chạy Python App)
- **Docker & Docker Compose**: (nếu chạy bằng Docker)

### Hệ điều hành:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

---

## 📁 Cấu trúc dự án

```
DriveHub/
├── backend/                    # Backend services
│   ├── node-app/              # Node.js API server
│   │   ├── src/
│   │   │   ├── server.js      # Entry point
│   │   │   ├── config/        # Cấu hình database
│   │   │   ├── models/        # Sequelize models
│   │   │   ├── routes/        # API routes
│   │   │   ├── controller/    # Business logic
│   │   │   ├── middleware/    # Authentication, validation
│   │   │   ├── service/       # Services
│   │   │   ├── websocket/     # WebSocket server
│   │   │   └── bot/           # Telegram bot
│   │   ├── .env               # Environment variables
│   │   └── package.json
│   ├── python-app/            # Python service (OCR, QR)
│   └── docker-compose.yml     # Docker configuration
├── frontend/                   # React TypeScript app
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API calls
│   │   └── services/          # Business services
│   ├── .env                   # Environment variables
│   └── package.json
├── csv/                       # SQL dump files
├── TN_KT5MON_LAST.sql        # Database schema & data
├── main.js                    # Electron main process
├── preload.js                 # Electron preload script
└── package.json               # Electron configuration
```

---

## 🗄️ Cài đặt Database

### Bước 1: Cài đặt MySQL

**Windows:**
1. Download MySQL từ: https://dev.mysql.com/downloads/installer/
2. Chạy installer và chọn "Developer Default"
3. Thiết lập root password: `12345`

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### Bước 2: Tạo Database

```bash
# Đăng nhập MySQL
mysql -u root -p
# Nhập password: 12345

# Tạo database
CREATE DATABASE userstatus CHARACTER SET utf16 COLLATE utf16_unicode_ci;

# Kiểm tra
SHOW DATABASES;

# Thoát
EXIT;
```

### Bước 3: Import dữ liệu

```bash
# Import file SQL chính
mysql -u root -p12345 userstatus < TN_KT5MON_LAST.sql

# Hoặc từ MySQL prompt
mysql -u root -p
USE userstatus;
SOURCE /path/to/TN_KT5MON_LAST.sql;
```

### Bước 4: Kiểm tra dữ liệu

```sql
USE userstatus;

-- Kiểm tra các bảng
SHOW TABLES;

-- Kiểm tra dữ liệu
SELECT COUNT(*) FROM question;
SELECT COUNT(*) FROM test;
SELECT COUNT(*) FROM subject;
```

**Các bảng chính:**
- `user` - Người dùng (học viên, giáo viên, admin)
- `thisinh` - Thông tin thí sinh
- `question` - Câu hỏi thi
- `test` - Đề thi
- `exam` - Bài thi đã làm
- `subject` - Môn học (A1, A2, B1, B2, C, D, E, F)
- `khoahoc` - Khóa học
- `rank` - Xếp hạng
- `qr` - QR codes
- `detect` - Dữ liệu nhận diện

---

## 🔧 Cài đặt Backend

### Bước 1: Di chuyển vào thư mục backend

```bash
cd backend/node-app
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

**Dependencies chính:**
- `express` - Web framework
- `sequelize` - ORM cho MySQL
- `mysql2` - MySQL driver
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `ws` - WebSocket server
- `multer` - File upload
- `axios` - HTTP client
- `telegraf` - Telegram bot

### Bước 3: Cấu hình môi trường

Tạo/chỉnh sửa file `.env`:

```bash
# Backend .env
JWT_SECRET=Khavy
BOT_TOKEN=6287309426:AAE82kG-sMV8fd54oFIMsk87ZeogOy40Ur8
PORT=8080
IPNLTB=117.2.131.102
NODE_ENV=development
```

### Bước 4: Cấu hình Database

Chỉnh sửa `src/config/config.json`:

```json
{
    "development": {
        "username": "root",
        "password": "12345",
        "database": "userstatus",
        "host": "127.0.0.1",
        "dialect": "mysql",
        "timezone": "+07:00",
        "logging": false,
        "define": {
            "freezeTableName": true
        }
    },
    "test": {
        "username": "root",
        "password": "12345",
        "database": "userstatus",
        "host": "127.0.0.1",
        "dialect": "mysql",
        "timezone": "+07:00",
        "logging": false,
        "define": {
            "freezeTableName": true
        }
    }
}
```

**Lưu ý:** Thay đổi `username`, `password`, `database` theo cấu hình MySQL của bạn.

### Bước 5: Chạy migrations (nếu có)

```bash
# Chạy migrations
npm run rmigration

# Hoặc với environment cụ thể
npx sequelize-cli db:migrate --env development
```

### Bước 6: Chạy seeders (nếu cần)

```bash
# Chạy tất cả seeders
npm run rseederall

# Hoặc chạy seeder cụ thể
npm run rseeder -- --seed seeder-file-name.js
```

### Bước 7: Khởi động Backend

**Development mode (với nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Kiểm tra:**
- Backend sẽ chạy tại: `http://127.0.0.1:8080`
- WebSocket server: `ws://127.0.0.1:8080/ws/student-status`

### Bước 8: Test API

```bash
# Test health check
curl http://localhost:8080/

# Test API endpoint (ví dụ)
curl http://localhost:8080/api/subjects
```

---

## 🎨 Cài đặt Frontend

### Bước 1: Di chuyển vào thư mục frontend

```bash
cd frontend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

**Dependencies chính:**
- `react` v18.2.0 - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `typescript` - Type safety
- `tailwindcss` - CSS framework
- `daisyui` - UI components
- `formik` - Form handling
- `react-toastify` - Notifications
- `moment` - Date handling
- `xlsx` - Excel export
- `html2canvas` & `jspdf` - PDF export

### Bước 3: Cấu hình môi trường

Tạo/chỉnh sửa file `.env`:

```bash
# Frontend .env
REACT_APP_BUILD=development
# REACT_APP_BUILD=buildlocal
# REACT_APP_BUILD=production

# Nếu cần HTTPS (optional)
HTTPS=true
SSL_CRT_FILE=certs/cert.pem
SSL_KEY_FILE=certs/key.pem
```

### Bước 4: Cấu hình API endpoint

Kiểm tra file `src/axios.tsx` hoặc `src/api/` để đảm bảo API endpoint đúng:

```typescript
// Ví dụ trong axios.tsx
const API_BASE_URL = process.env.REACT_APP_BUILD === 'development' 
    ? 'http://localhost:8080'
    : 'https://be-showstatusapp.onrender.com';
```

### Bước 5: Tạo SSL certificates (nếu dùng HTTPS)

```bash
# Tạo thư mục certs
mkdir -p certs

# Tạo self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

### Bước 6: Khởi động Frontend

**Development mode:**
```bash
npm start
```

**Build production:**
```bash
npm run build
```

**Kiểm tra:**
- Frontend sẽ chạy tại: `http://localhost:3000` (hoặc `https://localhost:3000` nếu dùng HTTPS)
- Tự động mở browser

### Bước 7: Test Frontend

1. Mở browser tại `http://localhost:3000`
2. Kiểm tra trang đăng nhập
3. Kiểm tra kết nối với Backend API
4. Test các chức năng chính:
   - Đăng nhập/Đăng ký
   - Xem danh sách câu hỏi
   - Làm bài thi thử
   - Xem kết quả

---

## 🐍 Cài đặt Python App (Optional)

Python App cung cấp các tính năng:
- OCR (Optical Character Recognition)
- QR Code scanning
- Image processing

### Bước 1: Di chuyển vào thư mục python-app

```bash
cd backend/python-app
```

### Bước 2: Tạo virtual environment

```bash
# Tạo venv
python3 -m venv venv

# Kích hoạt venv
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Bước 3: Cài đặt dependencies

```bash
pip install -r requirements.txt
```

**Dependencies:**
- `flask` - Web framework
- `fastapi` - Modern API framework
- `uvicorn` - ASGI server
- `opencv-python` - Computer vision
- `pyzbar` - QR code decoding
- `numpy` - Numerical computing
- `Pillow` - Image processing
- `sqlalchemy` - Database ORM
- `pydantic` - Data validation

### Bước 4: Chạy Python App

```bash
# Với Flask
python app/main.py

# Với FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

**Kiểm tra:**
- Python App sẽ chạy tại: `http://localhost:8081`

---

## ⚡ Cài đặt Electron App (Optional)

Electron App cho phép chạy ứng dụng như desktop app trên Windows/macOS/Linux.

### Bước 1: Build Frontend trước

```bash
cd frontend
npm run build
```

### Bước 2: Di chuyển về root directory

```bash
cd ..
```

### Bước 3: Cài đặt Electron dependencies

```bash
npm install
```

**Dependencies:**
- `electron` - Desktop framework
- `electron-builder` - Build & package
- `electron-updater` - Auto-update

### Bước 4: Chạy Electron App

```bash
npm start
```

### Bước 5: Build Electron App

**Build cho Windows:**
```bash
npm run dist
```

**Output:**
- File `.exe` sẽ được tạo trong thư mục `v1.0.14_buildTestStudent/`
- Tên file: `KiemTraMonHoc-Setup-v1.0.14-x64.exe` hoặc `ia32.exe`

**Cấu hình build:**
- Xem file `package.json` phần `build`
- Có thể tùy chỉnh icon, tên app, target platform

---

## 🐳 Chạy dự án với Docker

Docker giúp chạy toàn bộ stack (MySQL + Backend + Python App) một cách dễ dàng.

### Bước 1: Cài đặt Docker

**Windows/macOS:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop

**Linux:**
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### Bước 2: Di chuyển vào thư mục backend

```bash
cd backend
```

### Bước 3: Build Docker images

```bash
npm run docker:build

# Hoặc trực tiếp
docker-compose build
```

### Bước 4: Khởi động containers

```bash
npm run docker:up

# Hoặc chạy detached mode
docker-compose up -d
```

**Services sẽ chạy:**
- `mysql_db` - MySQL 8.0 (port 3307 → 3306)
- `node-app` - Backend API (port 8080)
- `python-app` - Python service (port 8081)

### Bước 5: Chạy migrations trong Docker

```bash
npm run docker:migrate

# Hoặc
docker exec -it node_app_container npx sequelize-cli db:migrate --env docker_test
```

### Bước 6: Chạy seeders trong Docker

```bash
npm run docker:seed

# Hoặc
docker exec -it node_app_container npx sequelize-cli db:seed:all --env docker_test
```

### Bước 7: Kiểm tra containers

```bash
# Xem containers đang chạy
docker ps

# Xem logs
docker logs node_app_container
docker logs mysql_container
docker logs python_app_container

# Vào container
docker exec -it node_app_container bash
docker exec -it mysql_container mysql -u root -p12345
```

### Bước 8: Dừng containers

```bash
npm run docker:down

# Hoặc giữ lại volumes
docker-compose down

# Xóa tất cả (bao gồm volumes và images)
docker-compose down --rmi all --volumes
```

---

## 🔍 Troubleshooting

### 1. Lỗi kết nối Database

**Lỗi:** `ER_ACCESS_DENIED_ERROR` hoặc `ECONNREFUSED`

**Giải pháp:**
```bash
# Kiểm tra MySQL đang chạy
# Windows
net start MySQL80

# macOS
brew services list

# Linux
sudo systemctl status mysql

# Kiểm tra user và password
mysql -u root -p12345

# Reset password nếu cần
ALTER USER 'root'@'localhost' IDENTIFIED BY '12345';
FLUSH PRIVILEGES;
```

### 2. Lỗi Port đã được sử dụng

**Lỗi:** `EADDRINUSE: address already in use :::8080`

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8080
kill -9 <PID>

# Hoặc đổi port trong .env
PORT=8081
```

### 3. Lỗi npm install

**Lỗi:** `EACCES` hoặc `permission denied`

**Giải pháp:**
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Cài lại
npm install

# Nếu vẫn lỗi, dùng sudo (Linux/macOS)
sudo npm install --unsafe-perm=true --allow-root
```

### 4. Lỗi CORS

**Lỗi:** `Access-Control-Allow-Origin`

**Giải pháp:**
- Kiểm tra file `backend/node-app/src/config/cors.js`
- Đảm bảo frontend URL được thêm vào whitelist
- Restart backend sau khi thay đổi

### 5. Lỗi Sequelize Migration

**Lỗi:** `ERROR: Table already exists`

**Giải pháp:**
```bash
# Undo migrations
npx sequelize-cli db:migrate:undo:all

# Chạy lại
npx sequelize-cli db:migrate

# Hoặc import trực tiếp SQL file
mysql -u root -p12345 userstatus < TN_KT5MON_LAST.sql
```

### 6. Lỗi Frontend không kết nối Backend

**Giải pháp:**
1. Kiểm tra Backend đang chạy: `curl http://localhost:8080`
2. Kiểm tra API endpoint trong frontend code
3. Kiểm tra CORS configuration
4. Xem console log trong browser (F12)
5. Kiểm tra Network tab để xem request/response

### 7. Lỗi Docker

**Lỗi:** `Cannot connect to Docker daemon`

**Giải pháp:**
```bash
# Khởi động Docker service
# Windows/macOS: Mở Docker Desktop

# Linux
sudo systemctl start docker
sudo systemctl enable docker

# Thêm user vào docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 8. Lỗi SSL Certificate (Frontend HTTPS)

**Lỗi:** `NET::ERR_CERT_AUTHORITY_INVALID`

**Giải pháp:**
- Đây là cảnh báo bình thường với self-signed certificate
- Click "Advanced" → "Proceed to localhost"
- Hoặc tắt HTTPS trong `.env`: `HTTPS=false`

### 9. Lỗi WebSocket connection

**Lỗi:** `WebSocket connection failed`

**Giải pháp:**
1. Kiểm tra Backend WebSocket server đang chạy
2. Kiểm tra URL: `ws://localhost:8080/ws/student-status`
3. Kiểm tra firewall không block port
4. Xem backend logs để debug

### 10. Lỗi Python dependencies

**Lỗi:** `ModuleNotFoundError` hoặc build errors

**Giải pháp:**
```bash
# Cài đặt system dependencies (Ubuntu)
sudo apt-get install python3-dev libzbar0

# macOS
brew install zbar

# Windows: Download pre-built wheels
pip install opencv-python-headless

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

---

## 📝 Ghi chú quan trọng

### Thông tin Database:
- **Database name:** `userstatus` (hoặc `TN_KT5` theo yêu cầu)
- **Username:** `root`
- **Password:** `12345`
- **Host:** `127.0.0.1` (localhost)
- **Port:** `3306` (mặc định MySQL)
- **Charset:** `utf16_unicode_ci`

### Ports mặc định:
- **Backend API:** 8080
- **Frontend:** 3000
- **Python App:** 8081
- **MySQL:** 3306 (hoặc 3307 trong Docker)
- **WebSocket:** 8080 (cùng port với Backend)

### Môi trường:
- **Development:** Chạy local với `npm run dev` và `npm start`
- **Production:** Build với `npm run build` và deploy
- **Docker:** Chạy toàn bộ stack với `docker-compose up`

### Tài khoản mặc định (sau khi import database):
- Kiểm tra bảng `user` để xem tài khoản có sẵn
- Hoặc tạo tài khoản mới qua API/Frontend

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Setup Database
mysql -u root -p
CREATE DATABASE userstatus CHARACTER SET utf16 COLLATE utf16_unicode_ci;
EXIT;
mysql -u root -p12345 userstatus < TN_KT5MON_LAST.sql

# 2. Backend
cd backend/node-app
npm install
npm run dev

# 3. Frontend (terminal mới)
cd frontend
npm install
npm start

# 4. Truy cập
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

---

## 📞 Hỗ trợ

- **Author:** Khả Vy (fb: nhoke.bola)
- **GitHub:** https://github.com/khavy1203/DriveHub
- **Version:** v1.0.14

---

## 📄 License

ISC License

---

**Chúc bạn cài đặt thành công! 🎉**
