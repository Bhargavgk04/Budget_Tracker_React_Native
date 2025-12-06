import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePerformance } from '@/hooks/usePerformance';
import { VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import { withPerformanceTracking } from '@/utils/performance';

interface ForgotPasswordFormData {
  email: string;
}

function ForgotPasswordScreen({ navigation }: any) {
  const theme = useTheme();
  const { forgotPassword } = useAuth();
  const { trackCustom } = usePerformance('ForgotPasswordScreen');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      trackCustom('forgot_password_attempt', { email: data.email });
      
      await forgotPassword(data.email);
      
      setEmailSent(true);
      trackCustom('forgot_password_success');
      
      Alert.alert(
        'Email Sent',
        'We\'ve sent a verification code to your email address. Please check your inbox.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('OTPVerification', { 
                email: data.email,
                type: 'forgot_password'
              });
            },
          },
        ]
      );
    } catch (error) {
      trackCustom('forgot_password_error', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async () => {
    const email = getValues('email');
    if (!email) return;

    try {
      setIsLoading(true);
      trackCustom('resend_forgot_password_email');
      
      await forgotPassword(email);
      
      Alert.alert('Email Sent', 'Verification code has been resent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    trackCustom('navigate_to_login_from_forgot_password');
    navigation.navigate('Login');
  };

  const navigateToOTP = () => {
    const email = getValues('email');
    navigation.navigate('OTPVerification', { 
      email,
      type: 'forgot_password'
    });
  };

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
    formContainer: {
      marginBottom: theme.spacing.xl,
    },
    sendButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    successContainer: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    successIcon: {
      marginBottom: theme.spacing.md,
    },
    successTitle: {
      ...theme.typography.h6,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    successText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    actionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    resendText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
    },
    resendLink: {
      ...theme.typography.body2,
      color: theme.colors.primary,
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

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialIcons name="mark-email-read" size={48} color={theme.colors.primary} />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successText}>
                We've sent a verification code to {getValues('email')}. 
                Please check your inbox and enter the code to reset your password.
              </Text>
              <View style={styles.actionContainer}>
                <Button
                  title="Enter Code"
                  onPress={navigateToOTP}
                  variant="contained"
                  style={{ flex: 1, marginRight: theme.spacing.sm }}
                />
                <Button
                  title="Resend"
                  onPress={resendEmail}
                  variant="outlined"
                  loading={isLoading}
                  style={{ flex: 1, marginLeft: theme.spacing.sm }}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <View style={styles.backContainer}>
              <Text style={styles.backText}>Remember your password?</Text>
              <Text style={styles.backLink} onPress={navigateToLogin}>
                Sign In
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              <MaterialIcons name="lock-reset" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry! Enter your email address and we'll send you a verification code to reset your password.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: ERROR_MESSAGES.REQUIRED_FIELD,
                pattern: {
                  value: VALIDATION_RULES.EMAIL,
                  message: ERROR_MESSAGES.INVALID_EMAIL,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={
                    <MaterialIcons
                      name="email"
                      size={20}
                      color={theme.colors.onSurface + '60'}
                    />
                  }
                />
              )}
            />

            <Button
              title="Send Verification Code"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || isLoading}
              fullWidth
              style={styles.sendButton}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <View style={styles.backContainer}>
              <Text style={styles.backText}>Remember your password?</Text>
              <Text style={styles.backLink} onPress={navigateToLogin}>
                Sign In
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default withPerformanceTracking(ForgotPasswordScreen, 'ForgotPasswordScreen');