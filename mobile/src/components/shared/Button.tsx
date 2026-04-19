import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme/Theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) => {
  const { colors } = useAppTheme();

  const baseStyle: ViewStyle = {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: disabled || loading ? 0.6 : 1,
  };

  const sizeStyles = {
    large: { paddingVertical: 16, paddingHorizontal: 24 },
    medium: { paddingVertical: 12, paddingHorizontal: 16 },
    small: { paddingVertical: 8, paddingHorizontal: 12 },
  };

  const variantStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
    danger: { backgroundColor: colors.danger },
    ghost: { backgroundColor: 'transparent' },
  };

  const textColors = {
    primary: colors.white,
    secondary: colors.text,
    danger: colors.white,
    ghost: colors.primary,
  };

  const textSizeStyles: Record<string, TextStyle> = {
    large: { fontSize: 16, fontWeight: '600' },
    medium: { fontSize: 14, fontWeight: '600' },
    small: { fontSize: 12, fontWeight: '500' },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        baseStyle,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      <Text style={[textSizeStyles[size], { color: textColors[variant] }]}>
        {loading ? 'Loading...' : label}
      </Text>
    </Pressable>
  );
};

export default Button;
