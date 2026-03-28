export type ChatMessage = {
  id: number;
  assignmentId: number;
  senderUserId: number;
  senderRole: 'teacher' | 'student';
  body: string;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  sender?: { id: number; username: string };
  /** true = queued locally, not yet confirmed by server */
  pending?: boolean;
};
