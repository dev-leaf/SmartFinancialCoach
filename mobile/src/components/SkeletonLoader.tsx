import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height,
  borderRadius = 8,
  style,
}) => {
  const animatedStyle = useMemo(
    () => ({
      width,
      height,
      borderRadius,
      backgroundColor: '#e0e0e0',
      opacity: 0.7,
    }),
    [width, height, borderRadius]
  );

  return <View style={[animatedStyle, style]} />;
};

interface SkeletonLineProps {
  width?: number | string;
  style?: any;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({ width = '100%', style }) => (
  <SkeletonLoader width={width} height={16} borderRadius={4} style={style} />
);

interface SkeletonBlockProps {
  count?: number;
  spacing?: number;
  style?: any;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  count = 3,
  spacing = 12,
  style,
}) => {
  const items = Array.from({ length: count });

  return (
    <View style={[styles.container, style]}>
      {items.map((_, index) => (
        <View key={index} style={[styles.item, index > 0 && { marginTop: spacing }]}>
          <SkeletonLine width="80%" />
          <SkeletonLine width="60%" style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
};

interface CardSkeletonProps {
  style?: any;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonLoader width={60} height={60} borderRadius={30} />
    <SkeletonLine width="70%" style={{ marginTop: 12 }} />
    <SkeletonLine width="50%" style={{ marginTop: 8 }} />
  </View>
);

interface PortfolioSkeletonProps {
  style?: any;
}

export const PortfolioSkeleton: React.FC<PortfolioSkeletonProps> = ({ style }) => (
  <View style={[styles.portfolio, style]}>
    <SkeletonLoader width="100%" height={120} borderRadius={12} />
    <View style={styles.gridContainer}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonLoader key={i} width="48%" height={100} borderRadius={12} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    paddingVertical: 8,
  },
  card: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  portfolio: {
    gap: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
