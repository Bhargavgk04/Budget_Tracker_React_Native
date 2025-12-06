/**
 * ProfilePictureUpload Component
 * Handles profile picture upload with camera and gallery options
 * Requirements: 1.9
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config/api.config';

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  onUploadSuccess: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export default function ProfilePictureUpload({
  currentPicture,
  onUploadSuccess,
  onUploadError,
}: ProfilePictureUploadProps) {
  const theme = useTheme();
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(currentPicture || null);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in settings.'
      );
      return false;
    }
    return true;
  };

  // Request gallery permissions
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select photos. Please enable it in settings.'
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Upload image to server
  const uploadImage = async (uri: string) => {
    setUploading(true);

    try {
      // Check auth token
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create form data
      const formData = new FormData();
      
      // Get file extension
      const fileExtension = uri.split('.').pop() || 'jpg';
      const fileName = `profile-${Date.now()}.${fileExtension}`;

      // Add image to form data
      formData.append('profilePicture', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      // Upload to server
      const response = await fetch(`${API_URL}/user/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update local state
      const imageUrl = `${API_URL.replace('/api', '')}${data.data.profilePicture}`;
      setImageUri(imageUrl);
      onUploadSuccess(imageUrl);

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.message || 'Failed to upload image';
      Alert.alert('Upload Failed', errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Delete profile picture
  const deleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) {
                throw new Error('No authentication token found');
              }

              const response = await fetch(`${API_URL}/user/profile/picture`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Delete failed');
              }

              setImageUri(null);
              onUploadSuccess('');
              Alert.alert('Success', 'Profile picture deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting image:', error);
              Alert.alert('Delete Failed', error.message || 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  // Show upload options
  const showUploadOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        ...(imageUri
          ? [
              {
                text: 'Delete Picture',
                onPress: deleteProfilePicture,
                style: 'destructive' as const,
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.colors.surface,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 50,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={48} color={theme.colors.onPrimary} />
          </View>
        )}
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={showUploadOptions}
        disabled={uploading}
      >
        <MaterialIcons name="camera-alt" size={16} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
