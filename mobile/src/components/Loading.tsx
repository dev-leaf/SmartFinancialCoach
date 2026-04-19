import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

interface LoadingProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({
  size = 'large',
  message = 'Loading...',
  fullScreen = false,
}: LoadingProps) {
  const containerStyle = fullScreen
    ? [styles.fullScreen, styles.container]
    : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color="#2196F3" />
      {message && (
        <Text style={styles.text} variant="bodyMedium">
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  fullScreen: {
    flex: 1,
  },
  text: {
    marginTop: 12,
    color: '#666',
  },
});
