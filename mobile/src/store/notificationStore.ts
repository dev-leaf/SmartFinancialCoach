import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { notificationService } from '../api/notificationService';
import { formatApiError } from '../services/api/httpClient';
import { Notification } from '../types/notification';

interface NotificationStoreState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnread: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await notificationService.getAll();
        const notifications = Array.isArray(response.data) ? response.data : [];
        set({
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    fetchUnread: async () => {
      try {
        const response = await notificationService.getUnread();
        const unread = Array.isArray(response.data) ? response.data : [];
        set({ unreadCount: unread.length });
      } catch (error) {
        // Silent fail for unread count
      }
    },

    markAsRead: async (id: string) => {
      try {
        await notificationService.markAsRead(id);
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage });
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        await notificationService.delete(id);
        set(state => {
          const deleted = state.notifications.find(n => n.id === id);
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: deleted && !deleted.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage });
        throw error;
      }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  })),
);
