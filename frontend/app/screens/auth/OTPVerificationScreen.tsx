import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePerformance } from '@/hooks/usePerformance';
import { withPerformanceTracking } from '@/utils/performance';

interface OTPVerificationScreenProps {
  route: {
    params: {
      email: string;
      type: 'forgot_password' | 'signup_verification';
    };
  };
  navigation: any;
}

function OTPVerificationScreen({ route, navigation }: OTPVerificationScreenProps) {
  const { email, type } = route.params;
  const theme = useTheme();
  const { verifyOTP, forgotPassword } = useAuth();
  const { trackCustom } = usePerformance('OTPVerificationScreen');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus on the last filled input or next empty input
      const nextIndex = Math.min(pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      trackCustom('otp_verification_attempt', { email, type });
      
      await verifyOTP(email, otpString);
      
      trackCustom('otp_verification_success', { type });
      
      if (type === 'forgot_password') {
        navigation.navigate('ResetPassword', { email, otp: otpString });
      } else {
        Alert.alert('Success', 'Email verified successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      trackCustom('otp_verification_error', { 
        error: error instanceof Error ? error.message : 'Unknown',
        type 
      });
      Alert.alert('Verification Failed', error instanceof Error ? error.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      trackCustom('resend_otp', { email, type });
      
      if (type === 'forgot_password') {
        await forgotPassword(email);
      }
      
      // Reset timer and OTP
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl * 2,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.onBackground + '80',
      textAlign: 'center',
      lineHeight: 24,
    },
    emailText: {
      ...theme.typography.body1,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    },
    otpInput: {
      width: 45,
      height: 55,
      borderWidth: 2,
      borderRadius: theme.borderRadius.sm,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    otpInputFocused: {
      borderColor: theme.colors.primary,
    },
    otpInputFilled: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    otpInputEmpty: {
      borderColor: theme.colors.onBackground + '30',
    },
    verifyButton: {
      marginBottom: theme.spacing.lg,
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    timerText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
      marginBottom: theme.spacing.sm,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resendText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
    },
    resendLink: {
      ...theme.typography.body2,
      color: canResend ? theme.colors.primary : theme.colors.onBackground + '40',
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
    backContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    backText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
    },
    backLink: {
      ...theme.typography.body2,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="verified-user" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : styles.otpInputEmpty,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={6} // Allow paste
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <Button
              title="Verify Code"
              onPress={handleVerifyOTP}
              loading={isLoading}
              disabled={!isOtpComplete || isLoading}
              fullWidth
              style={styles.verifyButton}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <View style={styles.timerContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend code in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </Text>
              ) : null}
              
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <Text 
                  style={styles.resendLink} 
                  onPress={canResend ? handleResendOTP : undefined}
                >
                  Resend
                </Text>
              </View>
            </View>

            <View style={styles.backContainer}>
              <Text style={styles.backText}>Wrong email address?</Text>
              <Text style={styles.backLink} onPress={navigateBack}>
                Go Back
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default withPerformanceTracking(OTPVerificationScreen, 'OTPVerificationScreen');