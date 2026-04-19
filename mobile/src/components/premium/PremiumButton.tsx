import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { spacing, typography } from '../../theme/Theme';

interface PremiumButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  colors: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumButton = ({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  colors,
}: PremiumButtonProps) => {
  const scale = useSharedValue(1);
  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, mass: 1 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, mass: 1 });
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surface;
      case 'danger':
        return colors.danger;
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.white;
      case 'danger':
        return colors.white;
      case 'secondary':
      case 'ghost':
        return colors.text;
      default:
        return colors.white;
    }
  };

  const getBorderColor = () => {
    if (variant === 'secondary' || variant === 'ghost') {
      return colors.border;
    }
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.s };
      case 'medium':
        return { paddingVertical: spacing.s, paddingHorizontal: spacing.m };
      case 'large':
      default:
        return { paddingVertical: spacing.m, paddingHorizontal: spacing.l };
    }
  };

  const fontSize = {
    small: typography.small.fontSize,
    medium: typography.body.fontSize,
    large: typography.body.fontSize,
  }[size];

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          ...getPadding(),
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled || isLoading ? 0.6 : 1,
        },
        animatedScale,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize,
                fontWeight:
                  size === 'large' ? '700' : size === 'medium' ? '600' : '500',
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
