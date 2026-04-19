import { useCallback } from 'react';
import { Alert } from 'react-native';
import { ErrorHandler, type UserError } from '../services/errors/errorHandler';

/**
 * Hook to handle errors in UI components
 * Provides user-friendly error display
 */
export function useErrorHandler() {
  const handleError = useCallback(
    (error: unknown, onRetry?: () => void) => {
      const userError = ErrorHandler.handleApiError(error);

      // Build alert message
      let message = userError.message;

      // Show technical details in development
      if (__DEV__ && userError.isDevelopment) {
        const error_ = error as any;
        const techDetails = ErrorHandler.getTechDetails(error_);
        message = `${userError.message}\n\n${techDetails}`;
      }

      // Prepare alert buttons
      const buttons: any[] = [{ text: 'OK', onPress: () => {} }];

      if (onRetry && userError.action === 'Retry') {
        buttons.unshift({
          text: 'Retry',
          onPress: onRetry,
          style: 'default',
        });
      }

      // Show alert
      Alert.alert(
        userError.severity === 'error' ? '❌ Error' : userError.severity === 'warning' ? '⚠️  Warning' : 'ℹ️  Info',
        message,
        buttons,
      );
    },
    [],
  );

  const handleErrorSilently = useCallback((error: unknown): UserError => {
    return ErrorHandler.handleApiError(error);
  }, []);

  return {
    handleError,
    handleErrorSilently,
  };
}
