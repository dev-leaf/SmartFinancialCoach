import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AnimatedNumber from '../AnimatedNumber';
import { spacing, typography } from '../../theme/Theme';

interface HeroBalanceProps {
  balance: number;
  spent: number;
  budget: number;
  isDark: boolean;
  colors: any;
}

export const HeroBalance = ({ balance, spent, budget, isDark, colors }: HeroBalanceProps) => {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Big balance number */}
      <View style={styles.balanceBox}>
        <Text style={[styles.label, { color: colors.textDim }]}>Available</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.currency, { color: colors.text }]}>₹</Text>
          <AnimatedNumber
            value={Math.max(0, balance)}
            style={[styles.amount, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Minimal meta info */}
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {`Spent ₹${Math.round(spent).toLocaleString('en-IN')} of ₹${Math.round(budget).toLocaleString('en-IN')}`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
    gap: spacing.xs,
  },
  balanceBox: {
    gap: spacing.xs,
  },
  label: {
    ...typography.small,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  currency: {
    ...typography.hero,
    marginTop: -4,
  },
  amount: {
    ...typography.hero,
    fontWeight: '700',
  },
  meta: {
    ...typography.small,
  },
});
