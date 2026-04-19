import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, FadeIn } from 'react-native-reanimated';
import { spacing, typography } from '../../theme/Theme';

interface ThinProgressBarProps {
  percentage: number;
  colors: any;
  isDark: boolean;
}

export const ThinProgressBar = ({ percentage, colors, isDark }: ThinProgressBarProps) => {
  const clipped = Math.min(Math.max(percentage, 0), 100);

  // Color progression: green -> orange -> red (calculated outside animated context)
  const getProgressColor = () => {
    if (clipped < 50) return colors.success; // Green
    if (clipped < 80) return colors.warning; // Orange
    return colors.danger; // Red
  };

  const progressColor = getProgressColor();

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${clipped}%`,
    backgroundColor: progressColor,
  }));

  return (
    <View style={styles.container}>
      {/* Animated wrapper to avoid opacity conflicts */}
      <Animated.View entering={FadeIn.delay(200)}>
        {/* Track */}
        <View style={[styles.track, { backgroundColor: isDark ? '#1E3451' : '#E8EEF6' }]}>
          <Animated.View style={[styles.fill, animatedStyle]} />
        </View>

        {/* Text label */}
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {Math.round(clipped)}% of budget
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
  label: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
});
