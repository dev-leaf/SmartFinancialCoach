import { httpClient } from '../services/api/httpClient';
import { AuthResponse, RegisterPayload, LoginPayload } from '../types/auth';

/**
 * Authentication API service
 * Handles registration and login API calls
 */

export const authService = {
  /**
   * Register new user
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/register', {
      email: payload.email,
      password: payload.password,
      name: payload.name || payload.email.split('@')[0],
    });
  },

  /**
   * Login user
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
    });
  },
};
