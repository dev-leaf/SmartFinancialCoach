import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { env } from '../../config/env';
import { logger } from '../logging/logger';
import { useNetworkStore } from '../../store/networkStore';
import { storage } from '../../utils/storage';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

const MAX_RETRY_COUNT = 2;
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

const sleep = (timeoutMs: number) => new Promise((resolve) => setTimeout(resolve, timeoutMs));

export function formatApiError(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string | string[] };

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your internet connection.';
  }

  if (!error.response) {
    return useNetworkStore.getState().isOnline
      ? 'Cannot reach the server. Check your backend URL and try again.'
      : 'You are offline. Reconnect and retry.';
  }

  return error.message || 'Something went wrong while talking to the server.';
}

class APIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: env.requestTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await storage.getToken();

        logger.info('API request auth check', {
          url: `${config.baseURL}${config.url}`,
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
        });

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          logger.info('Authorization header set', {
            url: config.url,
            tokenPrefix: token.substring(0, 20) + '...',
          });
        } else {
          logger.warn('No token found for request', {
            url: config.url,
          });
        }

        logger.info('API request', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
        });

        return config;
      },
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.info('API response', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
        });

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined;
        const isRetryableMethod = RETRYABLE_METHODS.has(config?.method ?? '');
        const isRetryableStatus = typeof error.response?.status === 'number' && error.response.status >= 500;
        const isNetworkError = !error.response || error.code === 'ECONNABORTED';
        const retryCount = config?._retryCount ?? 0;

        logger.captureException(error, {
          scope: 'httpClient.response',
          status: error.response?.status,
          url: config?.url,
          hasToken: !!config?.headers?.Authorization,
        });

        if (config && isRetryableMethod && (isRetryableStatus || isNetworkError) && retryCount < MAX_RETRY_COUNT) {
          config._retryCount = retryCount + 1;
          await sleep(400 * config._retryCount);
          return this.axiosInstance(config);
        }

        // Handle 401 (Unauthorized) - clear session and logout
        if (error.response?.status === 401) {
          logger.error('401 Unauthorized - clearing session', {
            url: config?.url,
            hasAuthHeader: !!config?.headers?.Authorization,
          });
          
          await storage.clear();

          try {
            const { useAuthStore } = await import('../../store/authStore');
            await useAuthStore.getState().logout();
          } catch (logoutError) {
            logger.captureException(logoutError, { scope: 'httpClient.unauthorizedLogout' });
          }
        }

        // Handle 403 (Forbidden) - premium feature access denied
        // For development: don't log out, just reject
        if (error.response?.status === 403) {
          const data = error.response.data as any;
          const message = data?.message || 'Access denied. This feature may require a premium subscription.';
          
          const forbiddenError = new Error(message);
          logger.captureException(forbiddenError, {
            scope: 'httpClient.forbidden',
            url: config?.url,
            message,
          });
          
          return Promise.reject(error);
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: object): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: object): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  setBaseURL(url: string): void {
    this.axiosInstance.defaults.baseURL = url;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new APIClient();

// Export as httpClient for consistency with naming
export const httpClient = apiClient;
