import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme/Theme';

interface MinimalSectionHeaderProps {
  title: string;
  colors: any;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const MinimalSectionHeader = ({ title, colors, action }: MinimalSectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {action && (
        <Text style={[styles.action, { color: colors.primary }]} onPress={action.onPress}>
          {action.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
  },
  title: {
    ...typography.title,
    fontWeight: '600',
  },
  action: {
    ...typography.small,
    fontWeight: '600',
  },
});
