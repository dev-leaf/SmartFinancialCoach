import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ErrorBannerProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export default function ErrorBanner({
  visible,
  message,
  onDismiss,
  duration = 5000,
}: ErrorBannerProps) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={styles.snackbar}
    >
      <View style={styles.content}>
        <MaterialIcons name="error-outline" size={20} color="#fff" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: '#fff',
    flex: 1,
  },
});
