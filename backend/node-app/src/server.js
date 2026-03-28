import express from 'express';
import compression from 'compression';
import initWebRoutes from './routes/web';
import bodyParser from 'body-parser';
import configCors from './config/cors';
import cookieParser from 'cookie-parser';
import setupStudentStatusWebSocket from './websocket/wsStudentStatusServer'; // WS server for student status
import { setupChatWebSocket } from './websocket/wsChatServer'; // WS server for chat
import http from 'http';
import botTelegram from './bot/botTelegram';
import path from 'path';
const app = express();
configCors(app);
app.use(compression()); // gzip tất cả response >= 1KB — giảm 60-70% bandwidth

// ── Request logger ──────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        const origin = req.headers.origin || '-';
        const referer = req.headers.referer || '-';
        const ua = (req.headers['user-agent'] || '-').slice(0, 80);
        console.log(`[${level}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms | origin=${origin} referer=${referer} ua=${ua}`);
    });
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Static file serving for uploaded assets
app.use('/uploads', express.static(path.join(__dirname, 'upload')));

// botTelegram(app).catch((error) => {
//     console.error("Failed to initialize bot:", error);
// });

// Tạo server HTTP
const server = http.createServer(app);

const chatWss = setupChatWebSocket(server, '/ws/chat');
const statusWss = setupStudentStatusWebSocket(server, '/ws/student-status');

// Route WebSocket upgrades manually so both WSS instances don't fight over
// the same upgrade event and send conflicting HTTP responses on the socket.
server.on('upgrade', (req, socket, head) => {
  try {
    const pathname = new URL(req.url, 'ws://localhost').pathname;
    if (pathname === '/ws/chat') {
      chatWss.handleUpgrade(req, socket, head, (ws) => {
        chatWss.emit('connection', ws, req);
      });
    } else if (pathname === '/ws/student-status') {
      statusWss.handleUpgrade(req, socket, head, (ws) => {
        statusWss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  } catch (e) {
    console.error('[WS] upgrade routing error:', e.message);
    socket.destroy();
  }
});

initWebRoutes(app);


app.use((req, res) => {
    console.log(`[WARN] 404 Not Found: ${req.method} ${req.originalUrl}`);
    return res.status(404).send("404 Not Found");
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`, err.message);
    res.status(500).json({ EC: -1, EM: 'Internal Server Error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] Server started on port ${PORT} | NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`[INFO] DB_HOST=${process.env.DB_HOST} DB_DATABASE=${process.env.DB_DATABASE}`);
});