import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { httpClient } from '../api/httpClient';
import { PushNotificationService } from './PushNotificationService';
import { Platform } from 'react-native';

/**
 * Hook to initialize push notifications
 * Should be called once in the app root
 */
export const usePushNotifications = () => {
  const { user } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!user) return;

    initializePushNotifications();
    hasInitialized.current = true;
  }, [user]);

  useEffect(() => {
    // Add listener for notification responses
    const subscription = PushNotificationService.addNotificationResponseListener(
      notification => {
        handleNotificationPress(notification);
      }
    );

    return () => {
      subscription?.remove();
    };
  }, []);
};

async function initializePushNotifications(): Promise<void> {
  try {
    // Configure notification handler
    PushNotificationService.configureNotificationHandler();

    // Request permissions
    const hasPermission = await PushNotificationService.requestPermissions();
    if (!hasPermission) {
      console.warn('Push notification permissions not granted');
      return;
    }

    // Get device token
    const deviceToken = await PushNotificationService.getDeviceToken();
    if (!deviceToken) {
      console.warn('Failed to get device token');
      return;
    }

    // Send token to backend
    await registerDeviceToken(deviceToken.token);
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
}

async function registerDeviceToken(token: string): Promise<void> {
  try {
    await httpClient.post('/push-tokens/register', {
      expoPushToken: token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
    });
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}

function handleNotificationPress(notification: any): void {
  const data = notification.request.content.data;

  if (!data.type) return;

  // Track notification opens
  import('../analytics/MobileAnalyticsService')
    .then(({ MobileAnalyticsService }) => MobileAnalyticsService.trackEvent('notification_opened', { type: data.type }))
    .catch(() => undefined);

  // Route to appropriate screen based on notification type
  switch (data.type) {
    case 'budget_exceeded':
      // Navigate to budgets screen
      break;
    case 'investment_alert':
      // Navigate to investments screen
      break;
    case 'subscription_alert':
      // Navigate to subscriptions screen
      break;
    case 'health_score_update':
      // Navigate to health score
      break;
  }

  // Trigger local notification (if needed)
  console.log('Notification pressed:', data);
}
