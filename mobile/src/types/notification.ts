export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'budget' | 'investment' | 'health_score' | 'subscription';
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  statusCode: number;
  data?: Notification[] | null;
  message: string;
  timestamp: string;
}
