import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { CustomButton, CustomInput, Card } from '../components';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { register } = useAuth();

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

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password);
      if (result.user) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
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
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Join TidyTabs to start managing expenses
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
            placeholder="Create a password"
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
            accessibilityLabel="Password input"
          />

          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            placeholder="Confirm your password"
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirmPassword}
            accessibilityLabel="Confirm password input"
          />

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Sign Up"
              onPress={handleRegister}
              isLoading={isLoading}
              accessibilityLabel="Sign up button"
            />
          </View>
        </Card>

        <View style={styles.loginContainer}>
          <Text style={{ color: colors.text }}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessibilityLabel="Login"
            accessibilityHint="Navigate to login screen"
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
              Sign In
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
  buttonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
}); 