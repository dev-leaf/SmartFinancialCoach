import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { spacing } from '../../theme/Theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  colors: any;
}

export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  colors,
}: SkeletonLoaderProps) => {
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      shimmer.value,
      [0, 1],
      [colors.surface, colors.divider]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface SkeletonScreenProps {
  colors: any;
}

export const DashboardSkeleton = ({ colors }: SkeletonScreenProps) => (
  <View style={styles.container}>
    {/* Header */}
    <SkeletonLoader height={24} width="40%" colors={colors} style={{ marginBottom: spacing.xs }} />
    <SkeletonLoader height={14} width="30%" colors={colors} style={{ marginBottom: spacing.m }} />

    {/* Balance section */}
    <SkeletonLoader height={60} width="100%" borderRadius={16} colors={colors} style={{ marginBottom: spacing.m }} />

    {/* Progress bar */}
    <SkeletonLoader height={4} width="100%" borderRadius={2} colors={colors} style={{ marginBottom: spacing.l }} />

    {/* Recent transactions skeleton */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ marginBottom: spacing.m }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLoader height={16} width="40%" colors={colors} />
          <SkeletonLoader height={16} width="25%" colors={colors} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  container: {
    padding: spacing.m,
    flex: 1,
  },
});
