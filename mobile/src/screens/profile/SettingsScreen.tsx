import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme, spacing, typography } from '../../theme/Theme';
import Button from '../../components/shared/Button';
import PressableScale from '../../components/PressableScale';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthStore } from '../../store/authStore';
import { useRetentionStore } from '../../store/retentionStore';
import { pushNotificationService } from '../../services/notifications/pushNotifications';

interface SettingItem {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: string;
  description?: string;
}

export default function SettingsScreen({ navigation }: any) {
  const { colors, isDark } = useAppTheme();
  const { user, logout } = useAuthStore();
  const { generateDailyReminder } = useRetentionStore();

  // Notification settings
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklySummary: true,
    budgetAlert: true,
    insights: true,
  });

  const [generalSettings, setGeneralSettings] = useState({
    darkMode: isDark,
    offlineMode: true,
    biometric: false,
  });

  // Handle daily reminder toggle
  const handleDailyReminderToggle = useCallback(async (value: boolean) => {
    setNotifications((prev) => ({ ...prev, dailyReminder: value }));

    if (value) {
      // Schedule daily reminder at 9 PM
      await pushNotificationService.scheduleDailyReminder(
        'Daily Spending Update',
        'Check how much you spent today',
        21, // 9 PM
        0
      );
    } else {
      // Cancel daily reminder
      await pushNotificationService.cancelNotification('daily-reminder-21-0');
    }
  }, []);

  // Handle weekly summary toggle
  const handleWeeklySummaryToggle = useCallback(async (value: boolean) => {
    setNotifications((prev) => ({ ...prev, weeklySummary: value }));

    if (value) {
      // Schedule weekly summary on Monday at 8 AM
      await pushNotificationService.scheduleWeeklyReminder(
        'Weekly Spending Summary',
        'See your spending insights',
        1, // Monday
        8, // 8 AM
        0
      );
    } else {
      // Cancel weekly summary
      await pushNotificationService.cancelNotification('weekly-reminder-1-8');
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            // Navigation will handle this via RootNavigator checking isAuthenticated
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]);
  }, [logout]);

  // Handle help & support
  const handleOpenSupport = useCallback(async () => {
    const email = 'support@smartfinancialcoach.com';
    const subject = 'Help & Support';
    const url = `mailto:${email}?subject=${subject}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open email client');
    }
  }, []);

  // Settings group component
  const SettingGroup = ({
    title,
    items,
  }: {
    title: string;
    items: SettingItem[];
  }) => (
    <View style={styles.settingGroup}>
      <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{title}</Text>

      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.settingItem,
            {
              borderBottomColor: colors.divider,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
            },
          ]}
        >
          <View style={styles.settingItemLeft}>
            <MaterialIcons name={item.icon as any} size={20} color={colors.primary} />
            <View style={styles.settingItemText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              {item.description && (
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>

          <Switch
            value={item.value}
            onValueChange={item.onChange}
            trackColor={{ false: colors.surface, true: colors.success }}
            thumbColor={item.value ? colors.success : colors.textMuted}
          />
        </View>
      ))}
    </View>
  );

  // Notification settings
  const notificationSettings: SettingItem[] = [
    {
      id: 'daily-reminder',
      label: 'Daily Reminder',
      value: notifications.dailyReminder,
      onChange: handleDailyReminderToggle,
      icon: 'notifications-active',
      description: 'Daily spending update at 9 PM',
    },
    {
      id: 'weekly-summary',
      label: 'Weekly Summary',
      value: notifications.weeklySummary,
      onChange: handleWeeklySummaryToggle,
      icon: 'calendar-today',
      description: 'Every Monday at 8 AM',
    },
    {
      id: 'budget-alert',
      label: 'Budget Alert',
      value: notifications.budgetAlert,
      onChange: (value) =>
        setNotifications((prev) => ({ ...prev, budgetAlert: value })),
      icon: 'warning',
      description: 'When you reach 80% of budget',
    },
    {
      id: 'insights',
      label: 'Insights',
      value: notifications.insights,
      onChange: (value) =>
        setNotifications((prev) => ({ ...prev, insights: value })),
      icon: 'lightbulb',
      description: 'Smart spending insights',
    },
  ];

  // General settings
  const generalSettingsItems: SettingItem[] = [
    {
      id: 'dark-mode',
      label: 'Dark Mode',
      value: generalSettings.darkMode,
      onChange: (value) => setGeneralSettings((prev) => ({ ...prev, darkMode: value })),
      icon: 'dark-mode',
      description: isDark ? 'Enabled' : 'Disabled',
    },
    {
      id: 'offline-mode',
      label: 'Offline Support',
      value: generalSettings.offlineMode,
      onChange: (value) => setGeneralSettings((prev) => ({ ...prev, offlineMode: value })),
      icon: 'cloud-off',
      description: 'Save transactions offline',
    },
    {
      id: 'biometric',
      label: 'Biometric Login',
      value: generalSettings.biometric,
      onChange: (value) => setGeneralSettings((prev) => ({ ...prev, biometric: value })),
      icon: 'fingerprint',
      description: 'Face/Touch ID login',
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          </View>

          {/* User Profile Card */}
          {user && (
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {user.name}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                  {user.email}
                </Text>
              </View>

              <MaterialIcons
                name="edit"
                size={20}
                color={colors.textMuted}
              />
            </View>
          )}

          {/* Notification Settings */}
          <SettingGroup title="Notifications" items={notificationSettings} />

          {/* General Settings */}
          <SettingGroup title="General" items={generalSettingsItems} />

          {/* Subscription */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupTitle, { color: colors.textMuted }]}>
              Subscription
            </Text>

            <View
              style={[
                styles.subscriptionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View>
                <Text style={[styles.subscriptionBadge, { color: colors.success }]}>
                  FREE PLAN
                </Text>
                <Text style={[styles.subscriptionFeature, { color: colors.text }]}>
                  ✓ Basic expenses tracking
                </Text>
                <Text style={[styles.subscriptionFeature, { color: colors.text }]}>
                  ✓ Budget management
                </Text>
                <Text style={[styles.subscriptionFeature, { color: colors.text }]}>
                  ✓ Monthly insights
                </Text>
              </View>

              <Button
                label="Upgrade to Premium"
                variant="primary"
                size="medium"
                onPress={() => navigation.navigate('Subscription')}
                style={{ marginTop: spacing.m }}
                fullWidth
              />
            </View>
          </View>

          {/* Support & About */}
          <View style={styles.settingGroup}>
            <Text style={[styles.groupTitle, { color: colors.textMuted }]}>
              Support
            </Text>

            <PressableScale
              onPress={handleOpenSupport}
              style={[
                styles.supportItem,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <MaterialIcons name="help" size={20} color={colors.primary} />
              <Text style={[styles.supportText, { color: colors.text }]}>
                Help & Support
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </PressableScale>

            <PressableScale
              onPress={() => Alert.alert('About', 'SmartFinancialCoach v1.0.0')}
              style={styles.supportItem}
            >
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <Text style={[styles.supportText, { color: colors.text }]}>
                About
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </PressableScale>
          </View>

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <Button
              label="Logout"
              variant="danger"
              onPress={handleLogout}
              fullWidth
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.l,
  },
  headerTitle: {
    ...typography.title,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.body,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  settingGroup: {
    marginBottom: spacing.l,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  subscriptionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  subscriptionBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.s,
  },
  subscriptionFeature: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.m,
  },
  supportText: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  logoutContainer: {
    marginTop: spacing.xl,
  },
});
