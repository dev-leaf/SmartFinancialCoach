import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInputProps, TextInput } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps extends Omit<TextInputProps, 'value'> {
  value: number;
  format?: (val: number) => string;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  format = (v) => v.toFixed(0), // Default to whole numbers
  duration = 1000,
  style,
  ...rest
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(() => format(value));
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedValue, duration, value]);

  const updateDisplayValue = useCallback((nextValue: number) => {
    setDisplayValue(format(nextValue));
  }, [format]);

  useAnimatedReaction(
    () => animatedValue.value,
    (nextValue) => {
      runOnJS(updateDisplayValue)(nextValue);
    },
    [format],
  );

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={displayValue}
      style={[styles.text, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
    color: '#000', // Usually overridden by caller
  },
});
