import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store';
import ErrorBanner from '../../components/ErrorBanner';
import { isValidEmail } from '../../utils/formatting';
import { SCREEN_NAMES } from '../../utils/constants';
import { spacing } from '../../theme/Theme';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required');
      setShowError(true);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email');
      setShowError(true);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setShowError(true);
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Login failed');
      setShowError(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerContainer}>
          <Text style={styles.title} variant="headlineLarge">
            Welcome Back
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Sign in to manage your finances
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            editable={!isLoading}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate(SCREEN_NAMES.REGISTER)}
            disabled={isLoading}
            style={styles.registerButton}
          >
            Create New Account
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <ErrorBanner
        visible={showError}
        message={errorMessage}
        onDismiss={() => setShowError(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontWeight: '700',
    color: '#333',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: '#888',
  },
  formContainer: {
    marginBottom: spacing.l,
  },
  input: {
    marginBottom: spacing.m,
  },
  button: {
    marginTop: spacing.l,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: spacing.m,
    color: '#999',
    fontSize: 12,
  },
  registerButton: {
    borderColor: '#2196F3',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: spacing.s,
    borderRadius: 8,
    borderLeftColor: '#F44336',
    borderLeftWidth: 4,
  },
  errorText: {
    color: '#F44336',
    fontWeight: '500',
  },
});
