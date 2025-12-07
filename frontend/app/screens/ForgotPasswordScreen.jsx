import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(email);
      if (response.success) {
        setOtpSent(true);
        setTimer(60); // 60 seconds countdown
        Alert.alert(
          'OTP Sent',
          'A 6-digit OTP has been sent to your email. Please check your inbox.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      if (response.success) {
        navigation.navigate('NewPasswordScreen', { email, otp });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'OTP verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = () => {
    if (timer === 0) {
      handleSendOTP();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              {otpSent
                ? 'Enter the 6-digit OTP sent to your email'
                : 'Enter your email address to receive a password reset OTP'}
            </Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, otpSent && styles.disabledInput]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!otpSent}
                />
              </View>

              {otpSent && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter 6-digit OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}

              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.otpActions}>
                  <TouchableOpacity
                    style={[styles.button, isVerifying && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resendButton, timer > 0 && styles.buttonDisabled]}
                    onPress={handleResendOTP}
                    disabled={timer > 0}
                  >
                    <Text style={styles.resendButtonText}>
                      {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpActions: {
    marginTop: 8,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
