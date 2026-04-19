import React from 'react';
import { enableFreeze } from 'react-native-screens';

import RootNavigator from '../navigation/RootNavigator';
import AppProviders from './providers/AppProviders';
import { usePushNotifications } from '../services/push-notifications/usePushNotifications';
import { initSentry } from './sentry';

enableFreeze(true);

export default function AppRoot() {
  initSentry();
  usePushNotifications();

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
