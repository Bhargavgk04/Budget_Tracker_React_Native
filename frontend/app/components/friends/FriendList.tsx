import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Friend } from '@/types';

interface FriendListProps {
  friends: Friend[];
  onSelect?: (friend: Friend) => void;
}

const FriendList: React.FC<FriendListProps> = ({ friends, onSelect }) => {
  if (!friends || friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No friends found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={item => item.uid || item._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => onSelect && onSelect(item)}
        >
          <Image
            source={item.profilePicture ? { uri: item.profilePicture } : require('@/assets/icon.png')}
            style={styles.avatar}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.uid}>{item.uid}</Text>
            <Text style={styles.balance}>
              {item.balance?.direction === 'owes_you' ? 'Owes you' : item.balance?.direction === 'you_owe' ? 'You owe' : 'Settled'}: {item.balance?.amount ?? 0}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  uid: {
    fontSize: 12,
    color: '#6B7280',
  },
  balance: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
  },
});

export default FriendList;
