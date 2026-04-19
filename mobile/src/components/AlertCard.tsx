import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AlertLevel } from '../types/budget';
import { ALERT_COLORS as COLORS } from '../utils/constants';

interface AlertCardProps {
  level: AlertLevel;
  spendingPercentage: number;
  totalSpending: number;
  monthlyBudget: number;
  remainingBudget: number;
}

export default function AlertCard({
  level,
  spendingPercentage,
  totalSpending,
  monthlyBudget,
  remainingBudget,
}: AlertCardProps) {
  const getAlertIcon = () => {
    switch (level) {
      case AlertLevel.SAFE:
        return 'check-circle';
      case AlertLevel.CAUTION:
        return 'info';
      case AlertLevel.WARNING:
        return 'warning';
      case AlertLevel.DANGER:
        return 'error';
      default:
        return 'help-outline';
    }
  };

  const getAlertMessage = () => {
    switch (level) {
      case AlertLevel.SAFE:
        return 'You are within budget.';
      case AlertLevel.CAUTION:
        return 'You are approaching your budget limit.';
      case AlertLevel.WARNING:
        return 'You have exceeded 75% of your budget.';
      case AlertLevel.DANGER:
        return 'You have exceeded your budget!';
      default:
        return 'Unknown status';
    }
  };

  const color = COLORS[level];

  return (
    <Card style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialIcons name={getAlertIcon() as any} size={24} color={color} />
          <Text style={[styles.level, { color }]} variant="headlineSmall">
            {level}
          </Text>
        </View>

        <Text style={styles.message} variant="bodyMedium">
          {getAlertMessage()}
        </Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>${totalSpending.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>${monthlyBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, { color: remainingBudget < 0 ? '#F44336' : '#4CAF50' }]}>
              ${Math.abs(remainingBudget).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(spendingPercentage, 100)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{spendingPercentage.toFixed(1)}% spent</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  level: {
    fontWeight: '700',
  },
  message: {
    marginBottom: 16,
    color: '#555',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});
