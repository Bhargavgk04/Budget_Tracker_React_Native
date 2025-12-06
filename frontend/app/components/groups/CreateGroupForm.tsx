import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Friend } from '@/types';
import { FriendService } from '@/services/FriendService';

interface CreateGroupFormProps {
  onSubmit: (data: GroupFormData) => void;
  onCancel: () => void;
}

interface GroupFormData {
  name: string;
  type: string;
  description: string;
  memberIds: string[];
}

const GROUP_TYPES = [
  { id: 'trip', label: 'Trip', icon: 'flight', color: '#3B82F6' },
  { id: 'rent', label: 'Rent', icon: 'home', color: '#8B5CF6' },
  { id: 'office_lunch', label: 'Office Lunch', icon: 'restaurant', color: '#F59E0B' },
  { id: 'custom', label: 'Custom', icon: 'group', color: '#6B7280' },
];

export const CreateGroupForm: React.FC<CreateGroupFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const friendList = await FriendService.getFriendList();
      setFriends(friendList.filter(f => f.friendshipStatus === 'accepted'));
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const toggleMember = (friendId: string) => {
    setSelectedMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedMembers.length < 1) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        description: description.trim(),
        memberIds: selectedMembers
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedMembers.includes(item._id);

    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleMember(item._id)}
      >
        <View style={styles.friendInfo}>
          <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendUid}>UID: {item.uid}</Text>
          </View>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <MaterialIcons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Goa Trip 2024"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Group Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Group Type</Text>
          <View style={styles.typeGrid}>
            {GROUP_TYPES.map((groupType) => (
              <TouchableOpacity
                key={groupType.id}
                style={[
                  styles.typeCard,
                  type === groupType.id && styles.typeCardActive
                ]}
                onPress={() => setType(groupType.id)}
              >
                <View style={[styles.typeIcon, { backgroundColor: groupType.color }]}>
                  <MaterialIcons name={groupType.icon as any} size={24} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    type === groupType.id && styles.typeLabelActive
                  ]}
                >
                  {groupType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Select Members * ({selectedMembers.length} selected)
          </Text>
          {isLoadingFriends ? (
            <Text style={styles.loadingText}>Loading friends...</Text>
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends available</Text>
              <Text style={styles.emptySubtext}>Add friends first to create a group</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item._id}
              style={styles.friendsList}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Creating...' : 'Create Group'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 100,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  typeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  friendItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  friendUid: {
    fontSize: 12,
    color: '#64748B',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGroupForm;
