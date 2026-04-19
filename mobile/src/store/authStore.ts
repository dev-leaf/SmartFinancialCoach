import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { authService } from '../api/authService';
import { formatApiError } from '../services/api/httpClient';
import { logger } from '../services/logging/logger';
import { AuthState } from '../types/auth';
import { storage } from '../utils/storage';

interface AuthStoreState extends AuthState {
  hasHydrated: boolean;
  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStoreState>()(
  devtools((set) => ({
    ...initialState,
    hasHydrated: false,

    register: async (email, password, name) => {
      set({ isLoading: true, error: null });

      try {
        const response = await authService.register({ email, password, name });

        if (!response.data) {
          throw new Error('Registration response was empty.');
        }

        const { user, access_token } = response.data;
        
        logger.info('Registration successful, saving token', {
          userId: user?.id,
          email: user?.email,
          tokenLength: access_token ? access_token.length : 0,
        });
        
        await Promise.all([storage.saveToken(access_token), storage.saveUser(user)]);
        
        // Verify token was saved
        const savedToken = await storage.getToken();
        if (!savedToken) {
          throw new Error('Token was not saved to storage');
        }

        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });

      try {
        const response = await authService.login({ email, password });

        if (!response.data) {
          throw new Error('Login response was empty.');
        }

        const { user, access_token } = response.data;
        
        logger.info('Login successful, saving token', {
          userId: user?.id,
          email: user?.email,
          tokenLength: access_token ? access_token.length : 0,
        });
        
        await Promise.all([storage.saveToken(access_token), storage.saveUser(user)]);
        
        // Verify token was saved
        const savedToken = await storage.getToken();
        if (!savedToken) {
          throw new Error('Token was not saved to storage');
        }
        
        logger.info('Token verified in storage', {
          savedTokenLength: savedToken.length,
        });

        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        await storage.clear();
        set({ ...initialState, hasHydrated: true });
      } catch (error) {
        logger.captureException(error, { scope: 'authStore.logout' });
        set({ error: 'Unable to clear your local session right now.' });
      }
    },

    restoreSession: async () => {
      set({ isLoading: true });

      try {
        const [token, user] = await Promise.all([storage.getToken(), storage.getUser()]);

        logger.info('Session restore attempt', {
          hasToken: !!token,
          hasUser: !!user,
          tokenLength: token ? token.length : 0,
          userId: user?.id,
        });

        if (token && user) {
          logger.info('Session restored successfully', {
            userId: user.id,
            email: user.email,
          });
          
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });
          return;
        } else {
          logger.info('No session to restore', {
            hasToken,
            hasUser,
          });
        }
      } catch (error) {
        logger.captureException(error, { scope: 'authStore.restoreSession' });
      }

      set({ ...initialState, hasHydrated: true });
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  })),
);
