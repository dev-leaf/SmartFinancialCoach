import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { spacing, typography } from '../../theme/Theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  colors: any;
}

export const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
  colors,
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <MaterialIcons
          name={icon as any}
          size={48}
          color={colors.primary}
          style={{ opacity: 0.7 }}
        />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      )}

      {action && <View style={styles.actionBox}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionBox: {
    marginTop: spacing.s,
    width: '100%',
  },
});
