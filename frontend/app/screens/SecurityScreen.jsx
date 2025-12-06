import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';

const SecurityScreen = ({ navigation }) => {
  const { user, updatePassword } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [securitySettings, setSecuritySettings] = useState({
    biometricAuth: false,
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChangeText, placeholder, showPassword, toggleShow }) => (
    <AnimatedCard delay={300} style={{ marginBottom: 16 }}>
      <View className="bg-white rounded-2xl p-4" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text className="text-textSecondary text-sm font-medium mb-2">{label}</Text>
        <View className="flex-row items-center">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={!showPassword}
            className="flex-1 text-textPrimary text-base"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
              paddingBottom: 8,
            }}
          />
          <TouchableOpacity onPress={toggleShow} className="ml-2">
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedCard>
  );

  const SecurityOption = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
    <AnimatedCard delay={400} style={{ marginBottom: 16 }}>
      <View className="bg-white rounded-2xl p-4" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <View className="flex-row items-center">
          <PulseAnimation duration={2000}>
            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
              <MaterialIcons name={icon} size={24} color="#6366F1" />
            </View>
          </PulseAnimation>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-base">{title}</Text>
            <Text className="text-textSecondary text-sm mt-1">{subtitle}</Text>
          </View>
          {type === 'switch' ? (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
              thumbColor={value ? '#FFFFFF' : '#64748B'}
            />
          ) : (
            <TouchableOpacity onPress={onValueChange}>
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <SlideInAnimation direction="down" delay={100}>
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textPrimary">Security Settings</Text>
          <View style={{ width: 24 }} />
        </View>
      </SlideInAnimation>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Change Password Section */}
        <SlideInAnimation direction="right" delay={200}>
          <Text className="text-lg font-bold text-textPrimary mb-4 mt-4">Change Password</Text>
        </SlideInAnimation>

        <PasswordInput
          label="Current Password"
          value={passwordData.currentPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
          placeholder="Enter current password"
          showPassword={showPasswords.current}
          toggleShow={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
        />

        <PasswordInput
          label="New Password"
          value={passwordData.newPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
          placeholder="Enter new password"
          showPassword={showPasswords.new}
          toggleShow={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
        />

        <PasswordInput
          label="Confirm New Password"
          value={passwordData.confirmPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
          placeholder="Confirm new password"
          showPassword={showPasswords.confirm}
          toggleShow={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
        />

        <TouchableOpacity
          onPress={handlePasswordChange}
          disabled={isLoading}
          className="bg-primary rounded-2xl p-4 mb-6"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-center">
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Text>
        </TouchableOpacity>

        {/* Security Options */}
        <SlideInAnimation direction="right" delay={300}>
          <Text className="text-lg font-bold text-textPrimary mb-4">Security Options</Text>
        </SlideInAnimation>

        <SecurityOption
          icon="fingerprint"
          title="Biometric Authentication"
          subtitle="Use fingerprint or face ID to unlock"
          value={securitySettings.biometricAuth}
          onValueChange={(value) => {
            setSecuritySettings({ ...securitySettings, biometricAuth: value });
            Alert.alert(
              'Biometric Authentication',
              value ? 'Biometric authentication enabled' : 'Biometric authentication disabled'
            );
          }}
        />

        <SecurityOption
          icon="security"
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
          value={securitySettings.twoFactorAuth}
          onValueChange={(value) => {
            setSecuritySettings({ ...securitySettings, twoFactorAuth: value });
            if (value) {
              Alert.alert(
                'Two-Factor Authentication',
                'SMS verification will be sent to your registered phone number for login attempts.'
              );
            }
          }}
        />

        <SecurityOption
          icon="notifications"
          title="Login Notifications"
          subtitle="Get notified of new login attempts"
          value={securitySettings.loginNotifications}
          onValueChange={(value) => setSecuritySettings({ ...securitySettings, loginNotifications: value })}
        />

        <SecurityOption
          icon="schedule"
          title="Auto Session Timeout"
          subtitle="Automatically log out after inactivity"
          value={securitySettings.sessionTimeout}
          onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
        />

        {/* Account Actions */}
        <SlideInAnimation direction="right" delay={400}>
          <Text className="text-lg font-bold text-textPrimary mb-4 mt-6">Account Actions</Text>
        </SlideInAnimation>

        <SecurityOption
          icon="history"
          title="Login History"
          subtitle="View recent login activity"
          type="button"
          onValueChange={() => {
            Alert.alert(
              'Login History',
              'Recent logins:\n\n• Today, 2:30 PM - Mobile App\n• Yesterday, 9:15 AM - Mobile App\n• Dec 28, 6:45 PM - Mobile App\n\nAll logins from your registered device.'
            );
          }}
        />

        <SecurityOption
          icon="devices"
          title="Active Sessions"
          subtitle="Manage logged in devices"
          type="button"
          onValueChange={() => {
            Alert.alert(
              'Active Sessions',
              'Currently logged in on:\n\n• This Device (Mobile)\n• Last active: Now\n\nNo other active sessions found.'
            );
          }}
        />

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This action cannot be undone. All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Account', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Account Deletion', 'Please contact support to delete your account.');
                  }
                }
              ]
            );
          }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
            <Text className="text-red-600 font-semibold ml-2">Delete Account</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecurityScreen;