import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { spacing, typography } from '../../theme/Theme';

interface MinimalTransactionRowProps {
  category: string;
  amount: number;
  date: string;
  icon: string;
  colors: any;
  isDark: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export const MinimalTransactionRow = ({
  category,
  amount,
  date,
  icon,
  colors,
  isDark,
  onPress,
  onDelete,
}: MinimalTransactionRowProps) => {
  const handleLongPress = () => {
    if (!onDelete) return;

    Alert.alert('Delete Expense', `Remove ₹${amount}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress,
      },
    ]);
  };

  const timeStr = new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Animated.View entering={FadeInLeft.delay(100)} style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onPress}
        onLongPress={handleLongPress}
        style={styles.row}
      >
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E3451' : '#E8EEF6' }]}>
          <MaterialIcons name={icon as any} size={20} color={colors.primary} />
        </View>

        {/* Category & date */}
        <View style={styles.content}>
          <Text style={[styles.category, { color: colors.text }]}>{category}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{timeStr}</Text>
        </View>

        {/* Amount */}
        <Text style={[styles.amount, { color: colors.text }]}>
          ₹{Math.round(amount).toLocaleString('en-IN')}
        </Text>
      </TouchableOpacity>

      {/* Thin divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#18304B' : '#E8EEF6' }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  category: {
    ...typography.body,
  },
  date: {
    ...typography.caption,
  },
  amount: {
    ...typography.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
