import { AxiosError } from 'axios';
import { logger } from '../logging/logger';
import { useNetworkStore } from '../../store/networkStore';

/**
 * Error severity levels for UI handling
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Standardized error object for UI consumption
 */
export interface UserError {
  message: string; // User-friendly message
  severity: ErrorSeverity;
  action?: string; // Suggested action (e.g., "Retry", "Check Connection")
  code?: string; // Error code for analytics
  isDevelopment?: boolean; // Show technical details in dev mode
}

/**
 * Convert API errors to user-friendly, actionable messages
 */
export class ErrorHandler {
  /**
   * Handle API/Network errors and return user-friendly message
   */
  static handleApiError(error: unknown): UserError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }

    if (error instanceof Error) {
      return {
        message: error.message || 'Something went wrong',
        severity: 'error',
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      severity: 'error',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Handle Axios-specific errors
   */
  private static handleAxiosError(error: AxiosError): UserError {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const isOnline = useNetworkStore.getState().isOnline;

    // Log for debugging
    logger.captureException(error, {
      scope: 'errorHandler.apiError',
      status,
      url: error.config?.url,
      isOnline,
    });

    // Network errors
    if (!error.response && error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your internet connection and try again.',
        severity: 'warning',
        action: 'Retry',
        code: 'TIMEOUT',
      };
    }

    if (!error.response) {
      return {
        message: isOnline
          ? 'Cannot reach the server. Please try again.'
          : 'You are offline. Please check your internet connection.',
        severity: 'warning',
        action: 'Retry',
        code: 'NETWORK_ERROR',
      };
    }

    // 4xx Client errors
    if (status === 400 || status === 422) {
      const validationMessage = this.extractValidationMessage(data);
      return {
        message: validationMessage || 'Invalid input. Please check your data and try again.',
        severity: 'warning',
        code: 'VALIDATION_ERROR',
        isDevelopment: true,
      };
    }

    if (status === 401) {
      return {
        message: 'Your session has expired. Please log in again.',
        severity: 'error',
        action: 'Login',
        code: 'UNAUTHORIZED',
      };
    }

    if (status === 403) {
      return {
        message: 'You do not have permission to access this resource.',
        severity: 'warning',
        code: 'FORBIDDEN',
      };
    }

    if (status === 404) {
      return {
        message: 'The requested resource was not found.',
        severity: 'info',
        code: 'NOT_FOUND',
      };
    }

    if (status === 409) {
      return {
        message: 'This item already exists or there is a conflict. Please try again.',
        severity: 'warning',
        code: 'CONFLICT',
      };
    }

    // 5xx Server errors
    if (status && status >= 500) {
      return {
        message: 'Server error. Our team has been notified. Please try again later.',
        severity: 'error',
        action: 'Retry',
        code: `SERVER_ERROR_${status}`,
      };
    }

    // Generic error
    return {
      message: 'Something went wrong. Please try again.',
      severity: 'error',
      action: 'Retry',
      code: `HTTP_ERROR_${status || 'UNKNOWN'}`,
    };
  }

  /**
   * Extract validation error message from response
   */
  private static extractValidationMessage(data: any): string | null {
    if (!data) return null;

    // Handle NestJS validation errors
    if (Array.isArray(data.message)) {
      return data.message
        .map((msg: any) => {
          if (typeof msg === 'string') return msg;
          if (typeof msg === 'object' && msg.constraints) {
            return Object.values(msg.constraints).join(', ');
          }
          return 'Invalid input';
        })
        .join('. ');
    }

    // Handle single error message
    if (typeof data.message === 'string') {
      return data.message;
    }

    // Handle error object with constraints
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }

    return null;
  }

  /**
   * Get tech details for development debugging
   */
  static getTechDetails(error: AxiosError): string {
    const lines = [
      `Status: ${error.response?.status || 'N/A'}`,
      `URL: ${error.config?.url || 'N/A'}`,
      `Method: ${error.config?.method?.toUpperCase() || 'N/A'}`,
    ];

    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.message) {
        lines.push(`Message: ${data.message}`);
      }
      if (data.code) {
        lines.push(`Code: ${data.code}`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * Alias for shorter usage
 */
export const handleError = ErrorHandler.handleApiError.bind(ErrorHandler);
