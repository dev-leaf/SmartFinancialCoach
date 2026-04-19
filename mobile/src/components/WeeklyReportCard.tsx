import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '../theme/Theme';
import { spacing, typography } from '../theme/Theme';
import { WeeklyReport } from '../types/weekly-report';

interface WeeklyReportCardProps {
  report: WeeklyReport | null;
  isLoading?: boolean;
}

/**
 * WeeklyReportCard
 * Minimal, clean card displaying weekly spending summary with one key insight
 * 
 * Design:
 * - Large prominent spending number
 * - Up/down arrow with percentage change
 * - Single human-readable insight
 * - No clutter, focus on clarity
 */
const WeeklyReportCard = memo(({ report, isLoading }: WeeklyReportCardProps) => {
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  if (!report) {
    return null;
  }

  // Parse the change percentage to determine direction and color
  const isIncrease = report.change.startsWith('+');
  const changeNumber = parseInt(report.change.replace('+', '').replace('%', ''));
  const changeColor = isIncrease ? colors.danger : colors.success;
  const arrowIcon = isIncrease ? 'trending-up' : 'trending-down';

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header: "This Week" label */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>This Week</Text>

      {/* Main Spending Amount */}
      <View style={styles.amountSection}>
        <Text style={[styles.amount, { color: colors.text }]}>
          ₹{report.totalSpent.toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Change Indicator */}
      <View style={styles.changeSection}>
        <MaterialIcons name={arrowIcon} size={20} color={changeColor} />
        <Text style={[styles.changeText, { color: changeColor }]}>{report.change}</Text>
        <Text style={[styles.changeSubtext, { color: colors.textSecondary }]}>
          vs last week
        </Text>
      </View>

      {/* Single Insight */}
      <View style={styles.insightSection}>
        <View
          style={[
            styles.insightBullet,
            { backgroundColor: colors.primary + '20' }, // 20% opacity
          ]}
        />
        <Text
          style={[styles.insightText, { color: colors.text }]}
          numberOfLines={2}
        >
          {report.insight}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.m,
    marginHorizontal: spacing.s,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  loadingPlaceholder: {
    height: 140,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: spacing.xs,
  },

  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  amountSection: {
    marginBottom: spacing.s,
  },

  amount: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  changeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.m,
  },

  changeText: {
    fontSize: 16,
    fontWeight: '600',
  },

  changeSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: spacing.xs,
  },

  insightSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
  },

  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8, // Align with first line of text
    flexShrink: 0,
  },

  insightText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
});

export default WeeklyReportCard;
