import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Friend } from '@/types';
import { FriendService } from '@/services/FriendService';

type FilterType = 'all' | 'owes_you' | 'you_owe' | 'settled';

const FriendListScreen = ({ navigation }: any) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [friends, searchQuery, filter]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const friendList = await FriendService.getFriendList();
      setFriends(friendList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await FriendService.getPendingRequests();
      const incoming = (requests.incoming || []).map(r => ({
        _id: r.user._id,
        uid: r.user.uid,
        name: r.user.name,
        email: r.user.email,
        profilePicture: r.user.profilePicture,
        balance: { amount: 0, direction: 'settled' },
        friendshipStatus: 'pending',
        friendshipId: r.friendshipId,
      } as Friend));
      setPendingRequests(incoming);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setIsRefreshing(false);
  }, []);

  const applyFilters = () => {
    let filtered = [...friends];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.uid.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply balance filter
    if (filter !== 'all') {
      filtered = filtered.filter(friend => friend.balance.direction === filter);
    }

    setFilteredFriends(filtered);
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await FriendService.acceptFriendRequest(friendshipId);
      await Promise.all([loadFriends(), loadPendingRequests()]);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await FriendService.declineFriendRequest(friendshipId);
      await loadPendingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const balanceColor = 
      item.balance.direction === 'owes_you' ? '#10B981' :
      item.balance.direction === 'you_owe' ? '#EF4444' :
      '#6B7280';

    const balanceText =
      item.balance.direction === 'settled' ? 'Settled' :
      item.balance.direction === 'owes_you' ? `Owes you ₹${item.balance.amount.toFixed(2)}` :
      `You owe ₹${item.balance.amount.toFixed(2)}`;

    return (
      <TouchableOpacity
        style={styles.friendCard}
        onPress={() => navigation.navigate('FriendDetail', { friendId: item._id })}
      >
        <View style={styles.friendInfo}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendUid}>UID: {item.uid}</Text>
          </View>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceText, { color: balanceColor }]}>
            {balanceText}
          </Text>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = ({ item }: { item: Friend }) => (
    <View style={styles.requestCard}>
      <View style={styles.friendInfo}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendUid}>UID: {item.uid}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.friendshipId)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item.friendshipId)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFriend')}>
          <MaterialIcons name="person-add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('owes_you', 'Owes You')}
        {renderFilterButton('you_owe', 'You Owe')}
        {renderFilterButton('settled', 'Settled')}
      </View>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.requestsList}
          />
        </View>
      )}

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.friendsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No friends found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add friends to start splitting expenses'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  requestsList: {
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendsList: {
    paddingHorizontal: 20,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  friendUid: {
    fontSize: 14,
    color: '#64748B',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  declineButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FriendListScreen;
