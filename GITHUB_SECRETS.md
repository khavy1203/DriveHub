# GitHub Secrets — DriveHub

> **Cách vào:** GitHub → repo → Settings → Secrets and variables → Actions → New repository secret

---

## VPS / SSH

| Secret | Giá trị |
|--------|---------|
| `VPS_HOST` | IP của VPS, ví dụ: `167.172.78.124` |
| `VPS_USER` | User SSH, ví dụ: `deploy` |
| `VPS_SSH_KEY` | Nội dung private key SSH (bắt đầu bằng `-----BEGIN OPENSSH PRIVATE KEY-----`) |

---

## Frontend (baked vào lúc build Docker image)

| Secret | Giá trị |
|--------|---------|
| `REACT_APP_API_URL` | URL backend production, ví dụ: `https://www.driverhub.io.vn` |
| `REACT_APP_MEZON_REDIRECT_URI` | `https://www.driverhub.io.vn/account/login/callback ` |
| `MEZON_CLIENT_ID` | Client ID từ Mezon Developer Portal |
| `MEZON_AUTHORIZE_URL` | `https://oauth2.mezon.ai/oauth2/auth` |

---

## Backend (.env inject lúc deploy)

| Secret | Giá trị |
|--------|---------|
| `JWT_SECRET` | Chuỗi bất kỳ, dùng để ký JWT, ví dụ: `Khavy` |
| `MEZON_CLIENT_ID` | Client ID từ Mezon Developer Portal |
| `MEZON_CLIENT_SECRET` | Client Secret từ Mezon Developer Portal |
| `MEZON_AUTHORIZE_URL` | `https://oauth2.mezon.ai/oauth2/auth` |
| `MEZON_TOKEN_URL` | `https://oauth2.mezon.ai/oauth2/token` |
| `MEZON_USERINFO_URL` | `https://oauth2.mezon.ai/userinfo` |
| `CORS_ORIGINS` | `https://www.driverhub.io.vn` |

---

## Database

| Secret | Giá trị |
|--------|---------|
| `DB_NAME` | Tên database, ví dụ: `drivehub` |
| `DB_USER` | User MySQL, ví dụ: `drivehub_user` |
| `DB_PASS` | Password MySQL user |
| `MYSQL_ROOT_PASSWORD` | Password root MySQL (dùng để healthcheck) |

---

## Lưu ý

- `REACT_APP_MEZON_REDIRECT_URI` dùng cho **cả frontend lẫn backend** (`REDIRECT_URI` trong docker-compose)
- `MEZON_CLIENT_ID` và `MEZON_AUTHORIZE_URL` dùng cho **cả frontend lẫn backend**
- Sau khi sửa secret liên quan đến frontend → phải **push code mới** để rebuild Docker image
- Sau khi sửa secret liên quan đến backend/DB → chỉ cần **re-run pipeline** là đủ
