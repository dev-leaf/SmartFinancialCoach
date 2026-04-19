import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HealthScore } from '../types/health-score';
import { useAppTheme } from '../theme/Theme';

interface HealthScoreCardProps {
  healthScore: HealthScore | null;
  isLoading?: boolean;
  onPress?: () => void;
  style?: any;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  healthScore,
  isLoading = false,
  onPress,
  style,
}) => {
  const { colors } = useAppTheme();

  const scoreColor = useMemo(() => {
    if (!healthScore) return colors.textDim;

    switch (healthScore.grade) {
      case 'Excellent':
        return '#10b981'; // Green
      case 'Good':
        return '#3b82f6'; // Blue
      case 'Fair':
        return '#f59e0b'; // Amber
      case 'Poor':
        return '#ef4444'; // Red
      default:
        return colors.primary;
    }
  }, [healthScore, colors.primary, colors.textDim]);

  const gradeIcon = useMemo(() => {
    if (!healthScore) return 'help-circle';

    switch (healthScore.grade) {
      case 'Excellent':
        return 'star';
      case 'Good':
        return 'check-circle';
      case 'Fair':
        return 'alert';
      case 'Poor':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  }, [healthScore]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { marginTop: 8, width: '60%' }]} />
      </View>
    );
  }

  if (!healthScore) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderLeftColor: scoreColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Financial Health
          </Text>
          <MaterialCommunityIcons name={gradeIcon} size={20} color={scoreColor} />
        </View>

        <View style={[styles.scoreContainer, { borderColor: scoreColor }]}>
          <Text style={[styles.score, { color: scoreColor }]}>
            {healthScore.overallScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
            / 100
          </Text>
        </View>

        <Text style={[styles.grade, { color: scoreColor }]}>
          {healthScore.grade}
        </Text>

        {healthScore.scoreBreakdown && (
          <View style={styles.breakdown}>
            <BreakdownItem
              label="Budget"
              value={Math.round(healthScore.scoreBreakdown.budgetHealth)}
              colors={colors}
            />
            <BreakdownItem
              label="Savings"
              value={Math.round(healthScore.scoreBreakdown.savingsRate)}
              colors={colors}
            />
            <BreakdownItem
              label="Investment"
              value={Math.round(healthScore.scoreBreakdown.investmentScore)}
              colors={colors}
            />
            <BreakdownItem
              label="Consistency"
              value={Math.round(healthScore.scoreBreakdown.consistencyScore)}
              colors={colors}
            />
          </View>
        )}

        {healthScore.recommendations && healthScore.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={[styles.recommendationTitle, { color: colors.text }]}>
              Top Recommendation
            </Text>
            <Text style={[styles.recommendationText, { color: colors.textDim }]}>
              {healthScore.recommendations[0]}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface BreakdownItemProps {
  label: string;
  value: number;
  colors: any;
}

const BreakdownItem: React.FC<BreakdownItemProps> = ({ label, value, colors }) => (
  <View style={styles.breakdownItem}>
    <View style={styles.breakdownBar}>
      <View
        style={[
          styles.breakdownFill,
          {
            width: `${value}%`,
            backgroundColor: value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444',
          },
        ]}
      />
    </View>
    <View style={styles.breakdownLabel}>
      <Text style={[styles.breakdownText, { color: colors.textDim }]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, { color: colors.text }]}>
        {Math.min(100, value)}%
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginVertical: 8,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 2,
    paddingBottom: 8,
  },
  score: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    marginLeft: 4,
  },
  grade: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdown: {
    gap: 8,
    marginTop: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownLabel: {
    width: 50,
    alignItems: 'flex-end',
  },
  breakdownText: {
    fontSize: 12,
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  recommendations: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 16,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
});
