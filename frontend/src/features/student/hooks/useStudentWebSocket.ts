/**
 * WebSocket hook for real-time student updates
 * @module features/student/hooks/useStudentWebSocket
 */

import { useEffect, useCallback } from 'react';
import { Student } from '../types/student.types';
import { 
  ENVIRONMENT_CONFIGS, 
  getCurrentEnvironment, 
  isDevelopment 
} from '../../../core/config/environment';

interface UseStudentWebSocketProps {
  courseId: string | null;
  onStudentList: (students: Student[]) => void;
  onStatusUpdate: (students: Student[]) => void;
}

export const useStudentWebSocket = ({
  courseId,
  onStudentList,
  onStatusUpdate,
}: UseStudentWebSocketProps): void => {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'STUDENT_LIST' && Array.isArray(data.payload)) {
          onStudentList(data.payload);
        } else if (data.type === 'USER_STATUS_UPDATE' && Array.isArray(data.payload)) {
          onStatusUpdate(data.payload);
        } else if (isDevelopment()) {
          console.warn('Unexpected message type or payload:', data);
        }
      } catch (error) {
        if (isDevelopment()) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    },
    [onStudentList, onStatusUpdate]
  );

  useEffect(() => {
    if (!courseId) return;

    const env = getCurrentEnvironment();
    const wsBaseUrl = ENVIRONMENT_CONFIGS[env]?.WS_BASE_URL;
    const ws = new WebSocket(wsBaseUrl);

    ws.onopen = () => {
      if (isDevelopment()) {
        console.log('Connected to WebSocket');
      }
      ws.send(JSON.stringify({ type: 'INIT', payload: { IDKhoaHoc: courseId } }));
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      if (isDevelopment()) {
        console.error('WebSocket error:', error);
      }
    };

    ws.onclose = (event) => {
      if (isDevelopment()) {
        console.warn('WebSocket connection closed:', event.reason || 'No reason provided');
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [courseId, handleMessage]);
};

export default useStudentWebSocket;
