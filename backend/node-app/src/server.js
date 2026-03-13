import express from 'express';
import initWebRoutes from './routes/web';
import bodyParser from 'body-parser';
import configCors from './config/cors';
import cookieParser from 'cookie-parser';
import setupStudentStatusWebSocket from './websocket/wsStudentStatusServer'; // WS server for student status
import http from 'http';
import botTelegram from './bot/botTelegram';
import https from 'https';
import fs from 'fs';
const app = express();
configCors(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Cấu hình chứng chỉ SSL
const sslOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem'),
};
// botTelegram(app).catch((error) => {
//     console.error("Failed to initialize bot:", error);
// });

// Tạo server HTTPS
const server = https.createServer(sslOptions, app);
// const server = http.createServer( app);

// Uncomment if using WebSocket servers
// setupChatWebSocket(server, '/ws/chat');
setupStudentStatusWebSocket(server, '/ws/student-status');

initWebRoutes(app);


app.use((req, res) => {
    return res.status(404).send("404 Not Found");
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    const host = address.address === '::' ? 'http://192.168.1.254' : address.address;
    console.log('Server host:', host);

    console.log('Server details:', address);
});