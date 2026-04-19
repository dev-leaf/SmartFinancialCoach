import { httpClient } from '../services/api/httpClient';
import { NotificationResponse } from '../types/notification';

export const notificationService = {
  async getUnread(): Promise<NotificationResponse> {
    return httpClient.get<NotificationResponse>('/notifications/unread');
  },

  async getAll(): Promise<NotificationResponse> {
    return httpClient.get<NotificationResponse>('/notifications');
  },

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    return httpClient.patch<NotificationResponse>(`/notifications/${notificationId}/read`);
  },

  async delete(notificationId: string): Promise<NotificationResponse> {
    return httpClient.delete<NotificationResponse>(`/notifications/${notificationId}`);
  },
};
