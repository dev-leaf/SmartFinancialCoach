import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useSecurityStore } from '../../store';
import { useAppTheme } from '../../theme/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SecurityLockScreen() {
  const { pin, unlockApp } = useSecurityStore();
  const { colors, spacing } = useAppTheme();
  
  const [pinInput, setPinInput] = useState('');
  const [showPinFallback, setShowPinFallback] = useState(false);

  const attemptBiometric = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Smart Financial Coach',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: true, // We use our custom app PIN constraint
        });

        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          unlockApp();
        } else {
          // If biometric fails or user cancels, show PIN layout
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          setShowPinFallback(true);
        }
      } else {
        setShowPinFallback(true);
      }
    } catch {
      setShowPinFallback(true);
    }
  }, [unlockApp]);

  useEffect(() => {
    attemptBiometric();
  }, [attemptBiometric]);

  const handlePinSubmit = () => {
    if (pinInput === pin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      unlockApp();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Incorrect PIN', 'Please try again.');
      setPinInput('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>App Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textDim, marginBottom: spacing.xl }]}>
          Verify your identity to access your wallets.
        </Text>

        {showPinFallback ? (
          <View style={styles.pinSection}>
            <TextInput
              mode="outlined"
              label="Enter PIN"
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              style={{ width: '100%', marginBottom: spacing.m }}
            />
            <Button mode="contained" onPress={handlePinSubmit} style={{ width: '100%' }}>
              Unlock
            </Button>
          </View>
        ) : (
          <Button 
            mode="contained" 
            onPress={attemptBiometric} 
            icon="fingerprint"
            style={{ width: '100%', paddingVertical: 8 }}
          >
            Use Biometrics
          </Button>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  pinSection: { width: '100%', alignItems: 'center' }
});
