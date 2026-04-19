import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface PushNotificationToken {
  token: string;
  platform: string;
}

export class PushNotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  static async getDeviceToken(): Promise<PushNotificationToken | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('EAS Project ID not configured');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return {
        token: token.data,
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }

  static configureNotificationHandler(): void {
    // Configure what happens when notification is received while app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async notification => {
        console.log('Notification received:', notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }

  static addNotificationResponseListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription | null {
    try {
      // Handle notification when user taps on it
      return Notifications.addNotificationResponseReceivedListener(event => {
        callback(event.notification);
      });
    } catch (error) {
      console.error('Failed to add notification listener:', error);
      return null;
    }
  }

  static async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SmartFinancialCoach',
          body: 'Test notification - push notifications are working!',
          data: { type: 'test' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }
}

// Types for notification payloads
export type NotificationPayload =
  | BudgetExceededPayload
  | SpendingSpikePayload
  | InvestmentAlertPayload
  | LowBalancePayload
  | SubscriptionAlertPayload;

export interface BudgetExceededPayload {
  type: 'budget_exceeded';
  budgetName: string;
  percentageUsed: number;
  remainingAmount: number;
}

export interface SpendingSpikePayload {
  type: 'spending_spike';
  categoryName: string;
  percentageIncrease: number;
  currentAmount: number;
}

export interface InvestmentAlertPayload {
  type: 'investment_alert';
  assetName: string;
  changePercent: number;
  action: 'gained' | 'lost';
}

export interface LowBalancePayload {
  type: 'low_balance';
  currentBalance: number;
  walletName: string;
}

export interface SubscriptionAlertPayload {
  type: 'subscription_alert';
  subscriptionName: string;
  amount: number;
  dueDate: string;
}
