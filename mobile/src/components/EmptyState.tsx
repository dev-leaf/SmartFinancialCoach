import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/Theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name={icon as any} size={48} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.description, { color: colors.textDim }]}>
        {description}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, style }) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="alert" size={48} color={colors.danger} />
      </View>

      <Text style={[styles.title, { color: colors.danger }]}>Something went wrong</Text>

      <Text style={[styles.description, { color: colors.textDim }]}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.danger }]}
          onPress={onRetry}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
