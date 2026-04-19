import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AIInsight } from '../types/insights';
import { useAppTheme } from '../theme/Theme';

interface InsightCardProps {
  insight: AIInsight;
  onPress?: () => void;
  style?: any;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onPress,
  style,
}) => {
  const { colors } = useAppTheme();

  const impactColor = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#f59e0b',
  }[insight.impact] || colors.primary;

  const impactIcon = {
    positive: 'check-circle',
    negative: 'alert',
    neutral: 'help-circle',
  }[insight.impact] || 'help-circle';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${impactColor}20` },
          ]}
        >
          <MaterialCommunityIcons
            name={impactIcon as any}
            size={24}
            color={impactColor}
          />
        </View>

        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {insight.title}
          </Text>
          <View style={styles.impactBadge}>
            <Text
              style={[
                styles.impactText,
                { color: impactColor },
              ]}
            >
              {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={[styles.description, { color: colors.textDim }]}
        numberOfLines={2}
      >
        {insight.description}
      </Text>

      <View style={styles.footer}>
        {insight.savingsPotential && insight.savingsPotential > 0 && (
          <View style={styles.savingsContainer}>
            <MaterialCommunityIcons
              name="leaf"
              size={16}
              color="#10b981"
            />
            <Text style={[styles.savingsText, { color: '#10b981' }]}>
              Save ₹{insight.savingsPotential.toLocaleString()}
            </Text>
          </View>
        )}

        {insight.actionable && (
          <View style={styles.actionBadge}>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Take Action
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={14}
              color={colors.primary}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface InsightsListProps {
  insights: AIInsight[];
  isLoading?: boolean;
  onInsightPress?: (insight: AIInsight) => void;
  style?: any;
}

export const InsightsList: React.FC<InsightsListProps> = ({
  insights,
  isLoading = false,
  onInsightPress,
  style,
}) => {
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View style={[styles.listContainer, style]}>
        {Array.from({ length: 2 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.skeletonCard,
              { backgroundColor: colors.surface },
            ]}
          />
        ))}
      </View>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <MaterialCommunityIcons
          name="lightbulb-off"
          size={48}
          color={colors.textDim}
        />
        <Text style={[styles.emptyText, { color: colors.textDim }]}>
          No insights yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.listContainer, style]}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {insights.map((insight) => (
        <InsightCard
          key={insight.title}
          insight={insight}
          onPress={() => onInsightPress?.(insight)}
          style={{ marginBottom: 12 }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  impactBadge: {
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 11,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  skeletonCard: {
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
