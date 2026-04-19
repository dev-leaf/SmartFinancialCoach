import * as Sentry from '@sentry/react-native';

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.05,
    environment: __DEV__ ? 'development' : 'production',
  });
}

