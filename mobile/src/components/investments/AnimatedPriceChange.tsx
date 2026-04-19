import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedPriceChangeProps {
  price: number;
  previousPrice?: number;
  style?: any;
  colors: any;
  priceFormatter?: (n: number) => string;
}

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

export const AnimatedPriceChange: React.FC<AnimatedPriceChangeProps> = ({
  price,
  previousPrice,
  style,
  colors,
  priceFormatter = (n) => `₹${fmt(n, 0)}`,
}) => {
  const opacity = useSharedValue(1);
  const [displayPrice, setDisplayPrice] = useState(price);
  const priceDirection = previousPrice !== undefined ? price > previousPrice ? 'up' : price < previousPrice ? 'down' : 'neutral' : 'neutral';

  // Animate on price change
  useEffect(() => {
    if (previousPrice !== undefined && previousPrice !== price) {
      // Flash animation
      opacity.value = withTiming(0.3, { duration: 300, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(1, { duration: 500, easing: Easing.in(Easing.quad) });
    }
    setDisplayPrice(price);
  }, [price]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor =
    priceDirection === 'up'
      ? colors.success + '30' // 30% opacity green
      : priceDirection === 'down'
      ? colors.danger + '30' // 30% opacity red
      : 'transparent';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor },
        animStyle,
      ]}
    >
      <Text
        style={[
          style,
          {
            color:
              priceDirection === 'up'
                ? colors.success
                : priceDirection === 'down'
                ? colors.danger
                : colors.text,
          },
        ]}
      >
        {priceFormatter(displayPrice)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
