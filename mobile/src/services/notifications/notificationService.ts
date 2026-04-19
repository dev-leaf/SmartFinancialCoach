import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { env } from '../../config/env';
import { BudgetSummary } from '../../types/budget';
import { logger } from '../logging/logger';

const LAST_BUDGET_ALERT_KEY = 'sfcoach_last_budget_alert';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const budgetAlertContent = (summary: BudgetSummary) => {
  if (summary.alertLevel === 'DANGER') {
    return {
      title: 'Budget exceeded',
      body: `You have spent ${summary.spendingPercentage.toFixed(0)}% of your monthly budget.`,
    };
  }

  return {
    title: 'Budget threshold reached',
    body: `You have used ${summary.spendingPercentage.toFixed(0)}% of this month's budget.`,
  };
};

export const notificationService = {
  async initialize() {
    if (!env.enableNotifications) {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('budget-alerts', {
        name: 'Budget Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  },

  async requestPermissions() {
    if (!env.enableNotifications || !Device.isDevice) {
      return false;
    }

    const existing = await Notifications.getPermissionsAsync();

    if (existing.granted) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  async scheduleBudgetAlert(summary: BudgetSummary) {
    if (!env.enableNotifications || summary.alertLevel === 'SAFE' || summary.alertLevel === 'CAUTION') {
      return;
    }

    const granted = await this.requestPermissions();
    if (!granted) {
      return;
    }

    const alertKey = `${summary.alertLevel}:${Math.round(summary.spendingPercentage)}`;
    const lastAlertKey = await AsyncStorage.getItem(LAST_BUDGET_ALERT_KEY);

    if (lastAlertKey === alertKey) {
      return;
    }

    const content = budgetAlertContent(summary);

    try {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: null,
      });

      await AsyncStorage.setItem(LAST_BUDGET_ALERT_KEY, alertKey);
    } catch (error) {
      logger.captureException(error, { scope: 'notificationService.scheduleBudgetAlert' });
    }
  },
};
