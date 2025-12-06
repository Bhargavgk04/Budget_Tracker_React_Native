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
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/utils/constants';
import { withPerformanceTracking } from '@/utils/performance';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignupScreen({ navigation }: any) {
  const theme = useTheme();
  const { register, isLoading, error, clearError } = useAuth();
  const { trackCustom } = usePerformance('SignupScreen');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    try {
      clearError();
      trackCustom('signup_attempt', { email: data.email });
      await register(data.email, data.password, data.name);
      trackCustom('signup_success');
    } catch (error) {
      trackCustom('signup_error', { error: error instanceof Error ? error.message : 'Unknown' });
      Alert.alert('Signup Failed', error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const navigateToLogin = () => {
    trackCustom('navigate_to_login');
    navigation.navigate('Login');
  };

  // Memoize styles to prevent recreation on every render
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
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
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
    },
    formContainer: {
      marginBottom: theme.spacing.xl,
    },
    signupButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.onBackground + '20',
    },
    dividerText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '60',
      marginHorizontal: theme.spacing.md,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginText: {
      ...theme.typography.body2,
      color: theme.colors.onBackground + '80',
    },
    loginLink: {
      ...theme.typography.body2,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
    termsContainer: {
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    termsText: {
      ...theme.typography.caption,
      color: theme.colors.onBackground + '60',
      textAlign: 'center',
      lineHeight: 16,
    },
    termsLink: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
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
            <View style={styles.logo}>
              <MaterialIcons name="account-balance-wallet" size={40} color={theme.colors.onPrimary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to start tracking your budget</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
            <Controller
              control={control}
              name="name"
              rules={{
                required: ERROR_MESSAGES.REQUIRED_FIELD,
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
                maxLength: {
                  value: 50,
                  message: 'Name must be less than 50 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Full Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon={
                    <MaterialIcons
                      name="person"
                      size={20}
                      color={theme.colors.onSurface + '60'}
                    />
                  }
                />
              )}
            />

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
                  label="Email"
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

            <Controller
              control={control}
              name="password"
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
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
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
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={theme.colors.onSurface + '60'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: ERROR_MESSAGES.REQUIRED_FIELD,
                validate: (value) =>
                  value === watchedPassword || 'Passwords do not match',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirm Password"
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

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || isLoading}
              fullWidth
              style={styles.signupButton}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Text style={styles.loginLink} onPress={navigateToLogin}>
                Sign In
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default withPerformanceTracking(SignupScreen, 'SignupScreen');