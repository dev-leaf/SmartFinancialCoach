import React, { PropsWithChildren, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppTheme } from '../../theme/Theme';
import AppErrorBoundary from './AppErrorBoundary';

export default function AppProviders({ children }: PropsWithChildren) {
  const { colors, isDark, paperTheme } = useAppTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={[styles.root, { backgroundColor: colors.background }]}>{children}</View>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
