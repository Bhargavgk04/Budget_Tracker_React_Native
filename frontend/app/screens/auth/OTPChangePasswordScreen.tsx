import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePerformance } from '@/hooks/usePerformance';
import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import { withPerformanceTracking } from '@/utils/performance';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import API from '@/config/api.config';

interface OTPChangePasswordScreenProps {
  route?: {
    params?: {
      email?: string;
    };
  };
  navigation?: any; // Add optional navigation prop
}

const OTPChangePasswordScreen = ({ route }: OTPChangePasswordScreenProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { trackScreenLoad, trackAnimation, trackCustom } = usePerformance('OTPChangePasswordScreen');

  const [email, setEmail] = useState(route?.params?.email || user?.email || '');
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const endTracking = trackScreenLoad('otp_change_password_screen');
    return () => endTracking();
  }, [trackScreenLoad]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleOTPChange = (value: string, index: number) => {
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = index + 1;
      // You'll need to add refs for auto-focus functionality
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOTP = [...otp];
      newOTP[index - 1] = '';
      setOTP(newOTP);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      newErrors.otp = 'Please enter all 6 digits';
    }

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOTP = async () => {
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/request-password-change-otp', { email });

      if (response.data.success) {
        Alert.alert(
          'OTP Sent',
          'A 6-digit OTP has been sent to your email. It will expire in 10 minutes.',
          [{ text: 'OK' }]
        );
        setCountdown(600); // 10 minutes in seconds

        // In development, show the OTP for testing
        if (__DEV__ && response.data.otp) {
          Alert.alert(
            'Development Mode',
            `Your OTP is: ${response.data.otp}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const response = await API.post('/auth/resend-password-change-otp', { email });

      if (response.data.success) {
        Alert.alert(
          'OTP Resent',
          'A new OTP has been sent to your email.',
          [{ text: 'OK' }]
        );
        setCountdown(600);

        // In development, show the OTP for testing
        if (__DEV__ && response.data.otp) {
          Alert.alert(
            'Development Mode',
            `Your new OTP is: ${response.data.otp}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const otpString = otp.join('');
      const response = await API.post('/auth/verify-otp-change-password', {
        email,
        otp: otpString,
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          response.data.message || 'Password changed successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to login or home screen
                // navigation.navigate('Login');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.onSurface, marginBottom: 10 }}>
            Change Password
          </Text>
          <Text style={{ fontSize: 16, color: colors.onSurfaceVariant, marginBottom: 30 }}>
            Enter the OTP sent to your email and your new password
          </Text>

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            editable={!user?.email}
            style={{ marginBottom: 20 }}
          />

          {/* OTP Request Button */}
          {!user?.email && (
            <Button
              title={isLoading ? 'Sending...' : 'Send OTP'}
              onPress={handleRequestOTP}
              disabled={isLoading || !email}
              style={{ marginBottom: 20 }}
            />
          )}

          {/* OTP Input */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: 10 }}>
            Enter 6-digit OTP
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                value={digit}
                onChangeText={(value) => handleOTPChange(value.slice(-1), index)}
                onKeyPress={({ nativeEvent: { key } }) => handleOTPKeyPress(key, index)}
                placeholder="0"
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                style={{
                  width: 45,
                  height: 55,
                  borderWidth: 1,
                  borderColor: errors.otp ? colors.error : colors.border,
                  borderRadius: 8,
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.onSurface,
                }}
              />
            ))}
          </View>
          {errors.otp && (
            <Text style={{ color: colors.error, fontSize: 12, marginBottom: 20 }}>
              {errors.otp}
            </Text>
          )}

          {/* Resend OTP */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={countdown > 0 || isResending}
            >
              <Text style={{ color: countdown > 0 ? colors.onSurfaceVariant : colors.primary }}>
                {isResending ? (
                  'Resending...'
                ) : countdown > 0 ? (
                  `Resend OTP in ${formatCountdown()}`
                ) : (
                  'Resend OTP'
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Password */}
          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry
            error={errors.currentPassword}
            style={{ marginBottom: 20 }}
          />

          {/* New Password */}
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry
            error={errors.newPassword}
            style={{ marginBottom: 20 }}
          />

          {/* Confirm Password */}
          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            error={errors.confirmPassword}
            style={{ marginBottom: 30 }}
          />

          {/* Change Password Button */}
          <Button
            title={isLoading ? 'Changing...' : 'Change Password'}
            onPress={handleChangePassword}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default withPerformanceTracking(OTPChangePasswordScreen, 'OTPChangePasswordScreen');
