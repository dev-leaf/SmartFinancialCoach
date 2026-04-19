import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { useAppBootstrap } from '../core/hooks/useAppBootstrap';
import OfflineBanner from '../components/OfflineBanner';
import { useAuthStore, useSecurityStore } from '../store';
import { useAppTheme } from '../theme/Theme';
import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import SecurityLockScreen from '../screens/auth/SecurityLockScreen';

/**
 * Root Navigator
 * Handles navigation between Auth and Main app stacks
 * Also restores session on app startup
 */

export default function RootNavigator() {
  const { isAuthenticated, isLoading, hasHydrated } = useAuthStore();
  const { isLocked, isReady, lockApp } = useSecurityStore();
  const { colors, navigationTheme } = useAppTheme();
  const { isBootstrapping } = useAppBootstrap();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        lockApp();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [lockApp]);

  if (isLoading || isBootstrapping || !hasHydrated || !isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isLocked && isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SecurityLockScreen />
        <OfflineBanner />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationContainer theme={navigationTheme}>
        {isAuthenticated ? <BottomTabNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
