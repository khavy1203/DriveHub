import { WebSocketServer, WebSocket } from 'ws';
import userServices from "../service/userServices.js"
import db from "../models/index.js";

let wss;
const examClients = new Set();

// ── In-memory stats — không DB write trên mỗi connection ────────────────────
let memStats = { total_visits: 0, monthly_visits: 0, monthly_reset_at: null, current_online: 0, peak_online: 0, peak_online_at: null, last_visit_at: null };

function isSameMonth(date) {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Load từ DB khi khởi động, reset current_online về 0
async function loadStatsFromDB() {
    try {
        let row = await db.visitorStats.findOne({ where: { id: 1 } });
        if (!row) row = await db.visitorStats.create({ total_visits: 0, current_online: 0, peak_online: 0, monthly_visits: 0 });
        const monthly = isSameMonth(row.monthly_reset_at) ? Number(row.monthly_visits) : 0;
        memStats = {
            total_visits: Number(row.total_visits),
            monthly_visits: monthly,
            monthly_reset_at: isSameMonth(row.monthly_reset_at) ? row.monthly_reset_at : new Date(),
            current_online: 0, // reset khi server restart
            peak_online: row.peak_online || 0,
            peak_online_at: row.peak_online_at,
            last_visit_at: row.last_visit_at,
        };
        await db.visitorStats.update({ current_online: 0 }, { where: { id: 1 } });
    } catch (e) {
        console.error('loadStatsFromDB error:', e.message);
    }
}

// Sync in-memory → DB mỗi 30s (thay vì ghi mỗi connection)
setInterval(async () => {
    try {
        await db.visitorStats.update({
            total_visits: memStats.total_visits,
            monthly_visits: memStats.monthly_visits,
            monthly_reset_at: memStats.monthly_reset_at,
            current_online: memStats.current_online,
            peak_online: memStats.peak_online,
            peak_online_at: memStats.peak_online_at,
            last_visit_at: memStats.last_visit_at,
        }, { where: { id: 1 } });
    } catch (e) {
        console.error('Stats sync error:', e.message);
    }
}, 30000);

// Throttle broadcast: tối đa 1 lần/2s
let broadcastTimer = null;
function broadcastVisitorStats() {
    if (broadcastTimer) return;
    broadcastTimer = setTimeout(() => {
        broadcastTimer = null;
        const message = JSON.stringify({
            type: 'VISITOR_STATS',
            payload: { ...memStats, exam_count: examClients.size }
        });
        sendAllClients(message);
    }, 2000);
}

// Set up WebSocket server
function setupStudentStatusWebSocket(server, path) {
    wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
    loadStatsFromDB();

    wss.on('connection', (ws) => {
        // Cập nhật in-memory — không chạm DB
        const now = new Date();
        // Reset monthly nếu sang tháng mới
        if (!isSameMonth(memStats.monthly_reset_at)) {
            memStats.monthly_visits = 0;
            memStats.monthly_reset_at = now;
        }
        memStats.total_visits++;
        memStats.monthly_visits++;
        memStats.current_online++;
        memStats.last_visit_at = now;
        if (memStats.current_online > memStats.peak_online) {
            memStats.peak_online = memStats.current_online;
            memStats.peak_online_at = now;
        }
        broadcastVisitorStats();

        ws.on('message', async (message) => {
            try {
                const { type, payload } = JSON.parse(message);

                if (type === 'INIT') {
                    const { IDKhoaHoc } = payload;
                    const students = await fetchStudentsForOrderList(IDKhoaHoc);
                    ws.send(JSON.stringify({ type: 'STUDENT_LIST', payload: students }));
                }
                if (type === 'INIT_dashboard') {
                    const { IDKhoaHoc } = payload;
                    const students = await getInfoStudents(IDKhoaHoc);
                    ws.send(JSON.stringify({ type: 'STUDENT_LIST_DASHBOARD', payload: students }));
                }
                if (type === 'JOIN_EXAM') {
                    examClients.add(ws);
                    broadcastVisitorStats();
                }
            } catch (error) {
                console.error('Error processing client message:', error);
            }
        });

        ws.on('close', () => {
            examClients.delete(ws);
            memStats.current_online = Math.max(0, memStats.current_online - 1);
            broadcastVisitorStats();
        });
    });
    return wss;
}

// Fetch students by course ID
async function fetchStudentsForOrderList(IDKhoaHoc) {
    try {
        return await db.thisinh.findAll({
            where: { IDKhoaHoc },
            attributes: { exclude: ['Anh'] },
            include: [
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['IDThiSinh', 'SoBaoDanh', 'IDstatus', 'stt', 'payment', 'moneypayment'],
                    where: { IDstatus: { [db.Sequelize.Op.ne]: null } },
                    include: [{ model: db.status, attributes: ['id', 'namestatus'] }]
                }
            ],
            order: [[db.khoahoc_thisinh, 'stt', 'ASC']],
        });
    } catch (error) {
        console.error("Error fetching student list:", error);
        return [];
    }
}

const getInfoStudents = async (IDKhoaHoc) => {
    try {
      const studentList =  await userServices.getInfoStudentServices(IDKhoaHoc);
      return studentList.DT;
    } catch (error) {
        return []
    }
};

// Broadcast cập nhật trạng thái học viên
export async function sendStatusUpdate(updatedStudent) {
    const message = JSON.stringify({
        type: 'USER_STATUS_UPDATE',
        payload: updatedStudent
    });
    sendAllClients(message);
}

export async function sendImportStatus(result) {
    const message = JSON.stringify({
        type: 'IMPORT_XML_STATUS',
        payload: result
    });
    sendAllClients(message);
}

export async function sendStudentDashBoardUpdate(updatedStudent) {
    // {
    //     "type": "NEW_EXAM_RESULT",
    //     "courseId": "SH100",
    //     "studentId": 12345,
    //     "exams": [
    //         { "IDSubject": 1, "point": 8, "result": "ĐẠT" },
    //         { "IDSubject": 2, "point": 7, "result": "ĐẠT" }
    //     ]
    // }
    const message = JSON.stringify({
        type: 'NEW_EXAM_RESULT',
        payload: updatedStudent
    });
    sendAllClients(message);
}

function sendAllClients(message) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

export default setupStudentStatusWebSocket;
