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
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import { ERROR_MESSAGES } from '@/utils/constants';

interface PasswordValidationRules {
  required: string | { value: boolean; message: string };
  minLength: { value: number; message: string };
  pattern: { value: RegExp; message: string };
}

const PASSWORD_VALIDATION: PasswordValidationRules = {
  required: { value: true, message: 'Password is required' },
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters',
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/,
    message: 'Password must contain at least one uppercase, one lowercase, one number and one special character',
  },
};

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function ChangePasswordScreen({ navigation }: any) {
  const theme = useTheme();
  const { changePassword, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useOTP, setUseOTP] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(data.currentPassword, data.newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChangePassword = () => {
    navigation.navigate('OTPChangePassword', { email: user?.email });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Change Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Choose how you want to change your password
            </Text>
          </View>

          <View style={styles.form}>
            {/* Method Selection */}
            <View style={styles.methodSelection}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  !useOTP && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                ]}
                onPress={() => setUseOTP(false)}
              >
                <MaterialIcons
                  name="lock"
                  size={24}
                  color={!useOTP ? theme.colors.primary : theme.colors.textSecondary}
                />
                <View style={styles.methodContent}>
                  <Text style={[styles.methodTitle, { color: theme.colors.textPrimary }]}>
                    Current Password
                  </Text>
                  <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                    Use your current password to change it
                  </Text>
                </View>
                {!useOTP && (
                  <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  useOTP && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                ]}
                onPress={() => setUseOTP(true)}
              >
                <MaterialIcons
                  name="email"
                  size={24}
                  color={useOTP ? theme.colors.primary : theme.colors.textSecondary}
                />
                <View style={styles.methodContent}>
                  <Text style={[styles.methodTitle, { color: theme.colors.textPrimary }]}>
                    Email OTP
                  </Text>
                  <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                    Use OTP sent to your email for verification
                  </Text>
                </View>
                {useOTP && (
                  <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            {!useOTP ? (
              <>
                {/* Current Password */}
                <Controller
                  control={control}
                  name="currentPassword"
                  rules={PASSWORD_VALIDATION}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Current Password"
                      placeholder="Enter your current password"
                      secureTextEntry={!showCurrentPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.currentPassword?.message}
                      rightIcon={
                        <MaterialIcons
                          name={showCurrentPassword ? 'visibility-off' : 'visibility'}
                          size={24}
                          color={theme.colors.textSecondary}
                          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        />
                      }
                      containerStyle={{ marginTop: 24 }}
                    />
                  )}
                />

                {/* New Password */}
                <Controller
                  control={control}
                  name="newPassword"
                  rules={PASSWORD_VALIDATION}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="New Password"
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.newPassword?.message}
                      rightIcon={
                        <MaterialIcons
                          name={showNewPassword ? 'visibility-off' : 'visibility'}
                          size={24}
                          color={theme.colors.textSecondary}
                          onPress={() => setShowNewPassword(!showNewPassword)}
                        />
                      }
                      containerStyle={{ marginTop: 16 }}
                    />
                  )}
                />

                {/* Confirm New Password */}
                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    ...PASSWORD_VALIDATION,
                    validate: (value: string) =>
                      value === newPassword || 'Passwords do not match',
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Confirm New Password"
                      placeholder="Confirm your new password"
                      secureTextEntry={!showConfirmPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                      rightIcon={
                        <MaterialIcons
                          name={
                            showConfirmPassword ? 'visibility-off' : 'visibility'
                          }
                          size={24}
                          color={theme.colors.textSecondary}
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        />
                      }
                      containerStyle={{ marginTop: 16 }}
                    />
                  )}
                />

                <Button
                  title="Update Password"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  style={{ marginTop: 32 }}
                />
              </>
            ) : (
              <View style={styles.otpSection}>
                <View style={[styles.otpInfo, { backgroundColor: theme.colors.background + '80' }]}>
                  <MaterialIcons name="info" size={24} color={theme.colors.primary} />
                  <Text style={[styles.otpInfoText, { color: theme.colors.textSecondary }]}>
                    We'll send a 6-digit OTP to your email address ({user?.email}) for password change verification.
                  </Text>
                </View>
                
                <Button
                  title="Continue with OTP"
                  onPress={handleOTPChangePassword}
                  style={{ marginTop: 24 }}
                />
              </View>
            )}

            <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
              {useOTP 
                ? 'OTP verification provides an extra layer of security for your password change.'
                : 'Make sure your new password is strong and different from your previous passwords.'
              }
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  methodSelection: {
    marginBottom: 24,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
  },
  methodContent: {
    flex: 1,
    marginLeft: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  otpSection: {
    marginTop: 24,
  },
  otpInfo: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  otpInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default ChangePasswordScreen;
