import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  colors: any;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 32,
  colors,
}) => {
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const { points, isPositive, lastPrice, firstPrice } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], isPositive: false, lastPrice: 0, firstPrice: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const lastPrice = data[data.length - 1];
    const firstPrice = data[0];
    const isPositive = lastPrice >= firstPrice;

    const pointsData = data.map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;
      return { x, y };
    });

    return {
      points: pointsData,
      isPositive,
      lastPrice,
      firstPrice,
    };
  }, [data]);

  if (points.length === 0) {
    return <View style={{ width, height }} />;
  }

  const pointsString = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const lineColor = isPositive ? colors.success : colors.danger;

  return (
    <Svg width={width} height={height}>
      {/* Background gradient area - simple line instead */}
      <Polyline
        points={pointsString}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {/* Last point indicator */}
      {points.length > 0 && (
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={lineColor}
        />
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
