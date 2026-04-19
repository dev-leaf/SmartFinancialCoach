import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime?: Date;
  badge?: number;
  sound?: string;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: string;
  recurring?: 'daily' | 'weekly' | 'none';
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  /**
   * Initialize push notifications
   * Call this once on app launch
   */
  async initialize() {
    try {
      // Request permissions
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }

        // Get Expo Push Token
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;

        // Save to local storage for backend registration
        await AsyncStorage.setItem('expoPushToken', token.data);

        console.log('✅ Push notifications initialized:', token.data);
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      // Listen for notifications when app is in foreground
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Setup listeners for foreground & background notifications
   */
  private setupNotificationListeners() {
    // Foreground notification listener
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification);
      // Handle notification in foreground (e.g., show alert, update UI)
    });

    // Notification response listener (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response;
      const screen = notification.request.content.data?.screen;

      console.log('👆 User tapped notification, navigate to:', screen);
      // Navigate to screen specified in notification data
      // Example: navigation.navigate(screen);
    });
  }

  /**
   * Send immediate notification
   */
  async sendNotification(payload: NotificationPayload) {
    try {
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return;
      }

      const notification: Notifications.NotificationContentInput = {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        badge: payload.badge,
        sound: payload.sound || 'default',
        ios: {
          sound: 'default',
        },
        android: {
          sound: 'default',
          vibrate: [0, 250, 250, 250],
          channelId: 'default',
          priority: 'high',
        },
      };

      if (payload.scheduledTime) {
        // Schedule notification
        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger: {
            seconds: Math.ceil(
              (payload.scheduledTime.getTime() - Date.now()) / 1000
            ),
          },
        });
      } else {
        // Send immediately
        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger: null,
        });
      }

      console.log('✅ Notification sent:', payload.title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Schedule daily reminder at specific time
   */
  async scheduleDailyReminder(
    title: string,
    body: string,
    hour: number,
    minute: number = 0
  ) {
    try {
      const id = `daily-reminder-${hour}-${minute}`;

      // Cancel existing if any
      await Notifications.cancelScheduledNotificationAsync(id);

      // Schedule daily at specified time
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const secondsFromNow = Math.ceil(
        (scheduledTime.getTime() - now.getTime()) / 1000
      );

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          data: { screen: 'Dashboard' },
          badge: 1,
          sound: 'default',
          ios: { sound: 'default' },
          android: {
            sound: 'default',
            vibrate: [0, 250, 250, 250],
            channelId: 'default',
            priority: 'high',
          },
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        } as any,
      });

      // Save to local tracking
      this.scheduledNotifications.set(id, {
        id,
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
        recurring: 'daily',
      });

      await AsyncStorage.setItem(
        'scheduledNotifications',
        JSON.stringify(Array.from(this.scheduledNotifications.entries()))
      );

      console.log(`✅ Daily reminder scheduled for ${hour}:${minute}`);
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  /**
   * Schedule weekly reminder
   */
  async scheduleWeeklyReminder(
    title: string,
    body: string,
    dayOfWeek: number = 1, // 0 = Sunday, 1 = Monday, etc.
    hour: number = 8,
    minute: number = 0
  ) {
    try {
      const id = `weekly-reminder-${dayOfWeek}-${hour}`;

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          data: { screen: 'Dashboard' },
          badge: 1,
        },
        trigger: {
          weekday: dayOfWeek,
          hour,
          minute,
          repeats: true,
        } as any,
      });

      this.scheduledNotifications.set(id, {
        id,
        title,
        body,
        scheduledTime: new Date().toISOString(),
        recurring: 'weekly',
      });

      console.log(
        `✅ Weekly reminder scheduled for day ${dayOfWeek} at ${hour}:${minute}`
      );
    } catch (error) {
      console.error('Failed to schedule weekly reminder:', error);
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(id: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      this.scheduledNotifications.delete(id);

      const remaining = Array.from(this.scheduledNotifications.entries());
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(remaining));

      console.log('✅ Notification cancelled:', id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      return all;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get Expo Push Token
   */
  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
