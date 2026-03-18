import express from 'express';
import initWebRoutes from './routes/web';
import bodyParser from 'body-parser';
import configCors from './config/cors';
import cookieParser from 'cookie-parser';
import setupStudentStatusWebSocket from './websocket/wsStudentStatusServer'; // WS server for student status
import http from 'http';
import botTelegram from './bot/botTelegram';
const app = express();
configCors(app);

// ── Request logger ──────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        const origin = req.headers.origin || req.headers.referer || '-';
        console.log(`[${level}] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms | origin: ${origin}`);
    });
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// botTelegram(app).catch((error) => {
//     console.error("Failed to initialize bot:", error);
// });

// Tạo server HTTP
const server = http.createServer(app);

// Uncomment if using WebSocket servers
// setupChatWebSocket(server, '/ws/chat');
setupStudentStatusWebSocket(server, '/ws/student-status');

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

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] Server started on port ${PORT} | NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`[INFO] DB_HOST=${process.env.DB_HOST} DB_DATABASE=${process.env.DB_DATABASE}`);
});