import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemeContext, Colors } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { CustomButton, CustomInput, Card } from '../components';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { resetPassword } = useAuth();

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

    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert(
          'Password Reset Email Sent',
          'Check your email for instructions to reset your password.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
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
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Enter your email to receive password reset instructions
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

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Reset Password"
              onPress={handleResetPassword}
              isLoading={isLoading}
              accessibilityLabel="Reset password button"
            />
          </View>
        </Card>

        <View style={styles.backContainer}>
          <CustomButton
            title="Back to Login"
            type="secondary"
            onPress={() => navigation.navigate('Login')}
            accessibilityLabel="Back to login"
            accessibilityHint="Navigate back to login screen"
          />
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
    marginTop: 20,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
}); 