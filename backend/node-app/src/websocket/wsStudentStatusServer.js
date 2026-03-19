import { WebSocketServer, WebSocket } from 'ws';
import userServices from "../service/userServices.js"
import db from "../models/index.js";

let wss; // WebSocket server instance

// Set up WebSocket server
function setupStudentStatusWebSocket(server, path) {
    wss = new WebSocketServer({ server, path });

    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');

        // Lắng nghe các tin nhắn từ client
        ws.on('message', async (message) => {
            try {
                const { type, payload } = JSON.parse(message);

                if (type === 'INIT') {
                    // Client gửi yêu cầu khởi tạo với IDKhoaHoc
                    const { IDKhoaHoc } = payload;
                    console.log('Client requested data for IDKhoaHoc:', IDKhoaHoc);
                    const students = await fetchStudentsForOrderList(IDKhoaHoc);
                    ws.send(JSON.stringify({ type: 'STUDENT_LIST', payload: students }));
                }
                if (type === 'INIT_dashboard') {
                    // Client gửi yêu cầu khởi tạo với IDKhoaHoc
                    const { IDKhoaHoc } = payload;
                    console.log('Client requested data for IDKhoaHoc:', IDKhoaHoc);
                    const students = await getInfoStudents(IDKhoaHoc);
                    ws.send(JSON.stringify({ type: 'STUDENT_LIST_DASHBOARD', payload: students }));
                }
            } catch (error) {
                console.error('Error processing client message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected from WebSocket');
        });
    });
}

// Fetch students by course ID
async function fetchStudentsForOrderList(IDKhoaHoc) {
    try {
        const thiSinhInfo = await db.thisinh.findAll({
            where: { IDKhoaHoc },
            attributes: {
                exclude: ['Anh'] // Correctly excluding the `Anh` attribute
            },
            include: [
                {
                    model: db.khoahoc_thisinh,
                    attributes: ['IDThiSinh', 'SoBaoDanh', 'IDstatus', 'stt', 'payment', 'moneypayment'],
                    where: {
                        IDstatus: { [db.Sequelize.Op.ne]: null } // Filter non-null statuses
                    },
                    include: [
                        {
                            model: db.status,
                            attributes: ['id', 'namestatus'],
                        }
                    ]
                }
            ],
            order: [[db.khoahoc_thisinh, 'stt', 'ASC']],
        });

        return thiSinhInfo;
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
