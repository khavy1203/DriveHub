import { WebSocketServer, WebSocket } from 'ws';
import userServices from "../service/userServices.js"
import db from "../models/index.js";

let wss; // WebSocket server instance
const examClients = new Set(); // clients đang trong phòng thi

// Lấy/update visitor_stats row (luôn dùng id=1)
async function getStats() {
    let row = await db.visitorStats.findOne({ where: { id: 1 } });
    if (!row) row = await db.visitorStats.create({ total_visits: 0, current_online: 0, peak_online: 0 });
    return row;
}

// Throttle broadcast: tối đa 1 lần/2s dù có bao nhiêu trigger
let broadcastTimer = null;
async function broadcastVisitorStats() {
    if (broadcastTimer) return; // đang chờ, bỏ qua
    broadcastTimer = setTimeout(async () => {
        broadcastTimer = null;
        try {
            const stats = await getStats();
            const message = JSON.stringify({
                type: 'VISITOR_STATS',
                payload: {
                    total_visits: Number(stats.total_visits),
                    current_online: stats.current_online,
                    peak_online: stats.peak_online,
                    peak_online_at: stats.peak_online_at,
                    last_visit_at: stats.last_visit_at,
                    exam_count: examClients.size,
                }
            });
            sendAllClients(message);
        } catch (e) {
            console.error('broadcastVisitorStats error:', e.message);
        }
    }, 2000);
}

// Set up WebSocket server
function setupStudentStatusWebSocket(server, path) {
    wss = new WebSocketServer({ server, path });

    // Reset current_online về 0 mỗi khi server khởi động
    db.visitorStats.update({ current_online: 0 }, { where: { id: 1 } }).catch(() => {});

    wss.on('connection', async (ws) => {
        console.log('Client connected to WebSocket');

        // Tăng total_visits và current_online
        try {
            const now = new Date();
            const stats = await getStats();
            const newOnline = stats.current_online + 1;
            const newPeak = Math.max(stats.peak_online, newOnline);
            await stats.update({
                total_visits: Number(stats.total_visits) + 1,
                current_online: newOnline,
                peak_online: newPeak,
                peak_online_at: newPeak > stats.peak_online ? now : stats.peak_online_at,
                last_visit_at: now,
            });
            await broadcastVisitorStats();
        } catch (e) {
            console.error('Error updating visitor stats on connect:', e.message);
        }

        // Lắng nghe các tin nhắn từ client
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
                    await broadcastVisitorStats();
                }
            } catch (error) {
                console.error('Error processing client message:', error);
            }
        });

        ws.on('close', async () => {
            console.log('Client disconnected from WebSocket');
            examClients.delete(ws);
            try {
                const stats = await getStats();
                const newOnline = Math.max(0, stats.current_online - 1);
                await stats.update({ current_online: newOnline });
                await broadcastVisitorStats();
            } catch (e) {
                console.error('Error updating visitor stats on disconnect:', e.message);
            }
        });
    });
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
