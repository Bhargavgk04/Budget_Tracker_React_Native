import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AnimatedCard from '../components/animations/AnimatedCard';
import SlideInAnimation from '../components/animations/SlideInAnimation';
import PulseAnimation from '../components/animations/PulseAnimation';

const PersonalInfoScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '',
    occupation: user?.occupation || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true }) => (
    <AnimatedCard delay={300} style={{ marginBottom: 16 }}>
      <View className="bg-white rounded-2xl p-4" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text className="text-textSecondary text-sm font-medium mb-2">{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          editable={editable && isEditing}
          className={`text-textPrimary text-base ${!editable || !isEditing ? 'opacity-60' : ''}`}
          style={{
            borderBottomWidth: isEditing ? 1 : 0,
            borderBottomColor: '#E2E8F0',
            paddingBottom: 8,
          }}
        />
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
          <Text className="text-xl font-bold text-textPrimary">Personal Information</Text>
          <TouchableOpacity 
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <PulseAnimation duration={2000}>
              <MaterialIcons 
                name={isEditing ? 'save' : 'edit'} 
                size={24} 
                color="#6366F1" 
              />
            </PulseAnimation>
          </TouchableOpacity>
        </View>
      </SlideInAnimation>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <AnimatedCard delay={200} style={{ marginBottom: 24 }}>
          <View className="bg-white rounded-2xl p-6 items-center" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <PulseAnimation duration={3000}>
              <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
                <Text className="text-white text-3xl font-bold">
                  {formData.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            </PulseAnimation>
            {isEditing && (
              <TouchableOpacity 
                className="bg-gray-100 px-4 py-2 rounded-full"
                activeOpacity={0.7}
                onPress={() => Alert.alert('Photo Upload', 'Photo upload feature coming soon!')}
              >
                <Text className="text-textSecondary font-medium">Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedCard>

        {/* Form Fields */}
        <InputField
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter your full name"
        />

        <InputField
          label="Email Address"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          editable={false}
        />

        <InputField
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <InputField
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
          placeholder="DD/MM/YYYY"
        />

        <InputField
          label="Occupation"
          value={formData.occupation}
          onChangeText={(text) => setFormData({ ...formData, occupation: text })}
          placeholder="Enter your occupation"
        />

        <InputField
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Enter your address"
        />

        {/* Action Buttons */}
        {isEditing && (
          <View className="flex-row mt-6 mb-8">
            <TouchableOpacity
              onPress={() => {
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  dateOfBirth: user?.dateOfBirth || '',
                  address: user?.address || '',
                  occupation: user?.occupation || '',
                });
                setIsEditing(false);
              }}
              className="flex-1 bg-gray-100 rounded-2xl p-4 mr-3"
              activeOpacity={0.7}
            >
              <Text className="text-textSecondary font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="flex-1 bg-primary rounded-2xl p-4 ml-3"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-center">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalInfoScreen;