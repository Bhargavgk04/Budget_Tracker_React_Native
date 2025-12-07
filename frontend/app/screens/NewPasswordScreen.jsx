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

const NewPasswordScreen = ({ route, navigation }) => {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Password Error', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPasswordWithOTP(email, otp, newPassword);
      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. Please login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'LoginScreen' }],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: '#e5e7eb', text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'];
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    
    return {
      strength: (strength / 6) * 100,
      color: colors[strength - 1] || '#e5e7eb',
      text: texts[strength - 1] || '',
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Create a strong password for your account
            </Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {newPassword && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          { width: `${passwordStrength.strength}%`, backgroundColor: passwordStrength.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.text}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {confirmPassword && newPassword !== confirmPassword && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || newPassword !== confirmPassword || !newPassword}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 8 characters long</Text>
              <Text style={styles.requirementText}>• Contains uppercase and lowercase letters</Text>
              <Text style={styles.requirementText}>• Contains at least one number</Text>
              <Text style={styles.requirementText}>• Special characters recommended</Text>
            </View>
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
    marginBottom: 24,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordRequirements: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default NewPasswordScreen;
