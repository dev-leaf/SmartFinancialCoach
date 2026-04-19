import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';
import { storage } from '../utils/storage';

/**
 * API Client with JWT authentication support.
 * - Automatically attaches Bearer token to every request
 * - Logs all requests/responses in __DEV__ mode
 * - On 401: clears storage and calls authStore.logout() to trigger navigation
 */

/** Convert an AxiosError into a readable string for the UI */
export function formatApiError(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  if (!error.response && error.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your connection.';
  }
  if (!error.response) {
    return 'Cannot reach the server. Check your network or backend URL.';
  }
  return error.message || 'An unexpected error occurred';
}

class APIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ── Request interceptor ────────────────────────────────────────────────
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (__DEV__) {
          console.log(
            `[API] ▶ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
            config.data ?? '',
          );
        }

        return config;
      },
      (error) => {
        if (__DEV__) console.error('[API] Request setup error:', error);
        return Promise.reject(error);
      },
    );

    // ── Response interceptor ───────────────────────────────────────────────
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(
            `[API] ◀ ${response.status} ${response.config.url}`,
            response.data,
          );
        }
        return response;
      },
      async (error: AxiosError) => {
        if (__DEV__) {
          console.error(
            `[API] ✖ ${error.response?.status ?? 'NET_ERR'} ${error.config?.url}`,
            error.response?.data ?? error.message,
          );
        }

        if (error.response?.status === 401) {
          // Token expired / invalid — clear storage then drive the app to login
          await storage.clear();
          try {
            // Lazy import to avoid circular dependency (authStore → apiClient → authStore)
            const { useAuthStore } = await import('../store/authStore');
            await useAuthStore.getState().logout();
          } catch {
            // Silently ignore if store isn't ready yet (e.g. during bootstrap)
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /** GET request — returns the `data` field of the API envelope */
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /** POST request */
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /** PUT request */
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /** PATCH request */
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /** DELETE request */
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /** Dynamically swap the base URL (e.g. for production deploys) */
  setBaseURL(url: string): void {
    this.axiosInstance.defaults.baseURL = url;
  }

  /** Expose the raw axios instance for advanced use cases */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Singleton — import this everywhere; do NOT create new instances
export const apiClient = new APIClient();
