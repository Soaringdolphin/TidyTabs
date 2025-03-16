import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { CustomButton, CustomInput, Card } from '../components';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { login } = useAuth();

  const validateInputs = () => {
    let newErrors = {};
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // Navigation will be handled by the auth state change in App.js
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>TidyTabs</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Sign in to manage your expenses
          </Text>
        </View>

        <Card>
          <CustomInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            accessibilityLabel="Email input"
          />

          <CustomInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
            accessibilityLabel="Password input"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordLink}
            accessibilityLabel="Forgot password"
            accessibilityHint="Navigate to password reset screen"
          >
            <Text style={{ color: colors.primary }}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              accessibilityLabel="Sign in button"
            />
          </View>
        </Card>

        <View style={styles.registerContainer}>
          <Text style={{ color: colors.text }}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            accessibilityLabel="Register"
            accessibilityHint="Navigate to registration screen"
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
}); 