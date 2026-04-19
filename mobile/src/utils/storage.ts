import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';
import { STORAGE_KEYS } from './constants';

/**
 * Secure storage utilities for sensitive data (tokens, user info)
 * Uses expo-secure-store which encrypts data at rest
 */

export const storage = {
  /**
   * Save token securely
   */
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Failed to save token:', error);
      throw error;
    }
  },

  /**
   * Retrieve token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  },

  /**
   * Retrieve user data
   */
  async getUser(): Promise<User | null> {
    try {
      const user = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  },

  /**
   * Clear all stored data (logout)
   */
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  },

  /**
   * Verify if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      return token != null;
    } catch {
      return false;
    }
  },
};
