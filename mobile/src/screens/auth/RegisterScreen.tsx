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

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('All fields are required');
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

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setShowError(true);
      return;
    }

    try {
      await register(email, password, name);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Registration failed');
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
            Create Account
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Start managing your finances
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            mode="outlined"
            style={styles.input}
          />

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

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            editable={!isLoading}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}
            disabled={isLoading}
            style={styles.loginButton}
          >
            Already Have an Account?
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
    marginBottom: 48,
  },
  title: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 12,
  },
  loginButton: {
    borderColor: '#2196F3',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderLeftColor: '#F44336',
    borderLeftWidth: 4,
  },
  errorText: {
    color: '#F44336',
    fontWeight: '500',
  },
});
