import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { spacing, typography } from '../../theme/Theme';

interface MinimalInsightProps {
  icon: string;
  title: string;
  subtitle?: string;
  severity: 'info' | 'warning' | 'critical';
  colors: any;
  isDark: boolean;
  onPress?: () => void;
}

export const MinimalInsight = ({
  icon,
  title,
  subtitle,
  severity,
  colors,
  isDark,
  onPress,
}: MinimalInsightProps) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return colors.danger;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.row, { backgroundColor: isDark ? '#0E1A2B' : '#F4F7FB' }]}
      >
        {/* Icon indicator */}
        <View style={[styles.indicator, { backgroundColor: getSeverityColor() }]} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Chevron */}
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.s,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: 12,
    gap: spacing.s,
  },
  indicator: {
    width: 3,
    height: 28,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.small,
  },
});
