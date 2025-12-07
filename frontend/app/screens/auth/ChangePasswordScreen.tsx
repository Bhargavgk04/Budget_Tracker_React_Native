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
  const { changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
              Enter your current and new password
            </Text>
          </View>

          <View style={styles.form}>
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

            <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
              Make sure your new password is strong and different from your previous passwords.
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
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default ChangePasswordScreen;
