import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../store/notificationStore';
import { useAppTheme, spacing } from '../theme/Theme';
import { SkeletonBlock } from '../components/SkeletonLoader';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Notification } from '../types/notification';
import { Swipeable } from 'react-native-gesture-handler';

export const NotificationsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const store = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await store.fetchNotifications();
    } catch (error) {
      // Silently handle error - notifications optional
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await store.markAsRead(id);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to mark as read');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await store.delete(id);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to delete notification');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  if (store.error && store.notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: colors.danger + '20', borderBottomColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
          </View>
        )}
        <ErrorState
          message={store.error}
          onRetry={loadData}
        />
      </View>
    );
  }

  const renderDeleteAction = (id: string) => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: '#ef4444' }]}
      onPress={() => handleDelete(id)}
    >
      <MaterialCommunityIcons name="delete" size={24} color={colors.white} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Notifications
          </Text>
          {store.unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: colors.primary }]}>
              {store.unreadCount} unread
            </Text>
          )}
        </View>
      </View>

      {/* Notifications List */}
      {store.isLoading ? (
        <View style={styles.listContainer}>
          <SkeletonBlock count={4} spacing={12} />
        </View>
      ) : store.notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bell-off"
            title="No Notifications"
            description="You're all caught up! New notifications will appear here"
          />
        </View>
      ) : (
        <FlatList
          data={store.notifications}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => renderDeleteAction(item.id)}
            >
              <NotificationItem
                notification={item}
                colors={colors}
                onPress={() => {
                  if (!item.read) {
                    handleMarkAsRead(item.id);
                  }
                }}
              />
            </Swipeable>
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

interface NotificationItemProps {
  notification: Notification;
  colors: any;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  colors,
  onPress,
}) => {
  const iconConfig = getNotificationIcon(notification.type);
  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.read ? colors.card : colors.background,
          borderLeftColor: iconConfig.color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${iconConfig.color}20` },
        ]}
      >
        <MaterialCommunityIcons
          name={iconConfig.icon as any}
          size={24}
          color={iconConfig.color}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: colors.text,
                fontWeight: notification.read ? '500' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: iconConfig.color },
              ]}
            />
          )}
        </View>

        <Text
          style={[styles.notificationMessage, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>

        <Text
          style={[styles.timeAgo, { color: colors.textSecondary }]}
        >
          {timeAgo}
        </Text>
      </View>

      <MaterialCommunityIcons
        name={(notification.read ? 'chevron-right' : 'circle') as any}
        size={24}
        color={iconConfig.color}
      />
    </TouchableOpacity>
  );
};

interface IconConfig {
  icon: string;
  color: string;
}

const getNotificationIcon = (type: string): IconConfig => {
  switch (type) {
    case 'budget':
      return { icon: 'wallet', color: '#f59e0b' };
    case 'investment':
      return { icon: 'chart-line', color: '#3b82f6' };
    case 'health_score':
      return { icon: 'heart-pulse', color: '#ef4444' };
    case 'subscription':
      return { icon: 'repeat', color: '#8b5cf6' };
    default:
      return { icon: 'bell', color: '#6b7280' };
  }
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    marginVertical: spacing.xxs,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 11,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  errorBanner: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
