import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logger } from '../../services/logging/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    logger.captureException(error, { scope: 'AppErrorBoundary' });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected issue. You can retry without losing your stored session.
          </Text>
          <Pressable onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#07111F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#C7D4E6',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0A84FF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
