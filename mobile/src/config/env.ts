import { Platform } from 'react-native';

const resolveApiBaseUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (explicit) {
    return explicit;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  requestTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '12000'),
  defaultBudgetAmount: Number(process.env.EXPO_PUBLIC_DEFAULT_BUDGET ?? '10000'),
  enableNotifications: process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
  appName: 'Smart Financial Coach',
};
