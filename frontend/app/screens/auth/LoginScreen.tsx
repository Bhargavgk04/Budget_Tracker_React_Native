import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/utils/constants';

interface LoginFormData {
  email: string;
  password: string;
}

function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const { login, demoLogin, isLoading, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.email, data.password);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };



  const handleDemoLogin = async () => {
    try {
      clearError();
      await demoLogin();
    } catch (error) {
      Alert.alert('Demo Login Failed', error instanceof Error ? error.message : 'Failed to login with demo account');
    }
  };

  // Memoize styles to prevent recreation on every render
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xxl || theme.spacing.xl * 1.5,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl * 2,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      ...(theme.shadows?.xl || {}),
      shadowColor: theme.colors.primary,
    },
    logoGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
      fontWeight: '700',
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary || theme.colors.onBackground + '70',
      textAlign: 'center',
      fontSize: 15,
    },
    formContainer: {
      marginBottom: theme.spacing.lg,
    },

    loginButton: {
      marginBottom: theme.spacing.md,
    },
    demoButton: {
      marginBottom: theme.spacing.xl,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border || theme.colors.onBackground + '15',
    },
    dividerText: {
      ...theme.typography.body2,
      color: theme.colors.textSecondary || theme.colors.onBackground + '50',
      marginHorizontal: theme.spacing.md,
      fontWeight: '500',
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    signupText: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary || theme.colors.onBackground + '70',
    },
    signupLink: {
      ...theme.typography.body1,
      color: theme.colors.primary,
      fontWeight: '700',
      marginLeft: theme.spacing.xs,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 999,
      opacity: 0.1,
    },
    circle1: {
      width: 300,
      height: 300,
      top: -150,
      right: -100,
      backgroundColor: theme.colors.primary,
    },
    circle2: {
      width: 200,
      height: 200,
      bottom: -100,
      left: -50,
      backgroundColor: theme.colors.secondary,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surfaceVariant || theme.colors.background]}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        
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
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[theme.colors.gradientStart || theme.colors.primary, theme.colors.gradientEnd || theme.colors.primaryVariant]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <MaterialIcons name="account-balance-wallet" size={50} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue managing your finances</Text>
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
                        color={theme.colors.textSecondary || theme.colors.onSurface + '60'}
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
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    leftIcon={
                      <MaterialIcons
                        name="lock"
                        size={20}
                        color={theme.colors.textSecondary || theme.colors.onSurface + '60'}
                      />
                    }
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={theme.colors.textSecondary || theme.colors.onSurface + '60'}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={!isValid || isLoading}
                fullWidth
                variant="gradient"
                style={styles.loginButton}
              />

              <Button
                title="🚀 Try Demo"
                onPress={handleDemoLogin}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                variant="outlined"
                style={styles.demoButton}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.signupContainer} onPress={navigateToSignup}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default LoginScreen;