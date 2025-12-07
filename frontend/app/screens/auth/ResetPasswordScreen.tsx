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

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordScreenProps {
  route?: {
    params?: {
      email: string;
      otp: string;
    };
  };
  navigation?: any;
}

function ResetPasswordScreen({ route, navigation }: ResetPasswordScreenProps) {
  const { email, otp } = route?.params || {};
  const theme = useTheme();
  const { resetPassword } = useAuth();
  const { trackCustom } = usePerformance('ResetPasswordScreen');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedNewPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email || !otp) {
      Alert.alert('Error', 'Missing required parameters. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      trackCustom('reset_password_attempt', { email });
      
      await resetPassword(email, otp, data.newPassword);
      
      trackCustom('reset_password_success');
      
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      trackCustom('reset_password_error', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    trackCustom('navigate_to_login_from_reset');
    navigation.navigate('Login');
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
    passwordRequirements: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.lg,
    },
    requirementsTitle: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    requirementText: {
      ...theme.typography.caption,
      color: theme.colors.onSurface + '80',
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    requirementMet: {
      color: theme.colors.primary,
    },
    resetButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
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

  const passwordRequirements = [
    {
      text: 'At least 8 characters long',
      met: watchedNewPassword.length >= 8,
    },
    {
      text: 'Contains uppercase letter',
      met: /[A-Z]/.test(watchedNewPassword),
    },
    {
      text: 'Contains lowercase letter',
      met: /[a-z]/.test(watchedNewPassword),
    },
    {
      text: 'Contains a number',
      met: /\d/.test(watchedNewPassword),
    },
    {
      text: 'Contains special character',
      met: /[@$!%*?&]/.test(watchedNewPassword),
    },
  ];

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
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Please create a strong password for your account. Make sure it meets all the requirements below.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
            <Controller
              control={control}
              name="newPassword"
              rules={{
                required: ERROR_MESSAGES.REQUIRED_FIELD,
                minLength: {
                  value: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
                  message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
                },
                pattern: {
                  value: VALIDATION_RULES.PASSWORD.PATTERN,
                  message: ERROR_MESSAGES.WEAK_PASSWORD,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  secureTextEntry={!showNewPassword}
                  autoComplete="new-password"
                  leftIcon={
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={theme.colors.onSurface + '60'}
                    />
                  }
                  rightIcon={
                    <MaterialIcons
                      name={showNewPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={theme.colors.onSurface + '60'}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    />
                  }
                />
              )}
            />

            {watchedNewPassword.length > 0 && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                {passwordRequirements.map((requirement, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <MaterialIcons
                      name={requirement.met ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={requirement.met ? theme.colors.primary : theme.colors.onSurface + '40'}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        requirement.met && styles.requirementMet,
                      ]}
                    >
                      {requirement.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: ERROR_MESSAGES.REQUIRED_FIELD,
                validate: (value) =>
                  value === watchedNewPassword || 'Passwords do not match',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirm New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  leftIcon={
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={theme.colors.onSurface + '60'}
                    />
                  }
                  rightIcon={
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={theme.colors.onSurface + '60'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
              )}
            />

            <Button
              title="Reset Password"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || isLoading}
              fullWidth
              style={styles.resetButton}
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

export default withPerformanceTracking(ResetPasswordScreen, 'ResetPasswordScreen');