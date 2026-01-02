import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, Image, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { Friend } from '@/types';
import { FriendService } from '@/services/FriendService';
import { useTheme } from '@/hooks/useTheme';

interface FriendSelectorProps {
  value: string;
  onSelect: (friend: Friend) => void;
  onUidChange: (uid: string) => void;
  placeholder?: string;
  multi?: boolean;
  onSelectMany?: (friends: Friend[]) => void;
  maxFriends?: number;
}

export const FriendSelector: React.FC<FriendSelectorProps> = ({
  value,
  onSelect,
  onUidChange,
  placeholder = 'Enter friend UID or search...',
  multi = false,
  onSelectMany,
  maxFriends = 6
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState(value);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [existingFriends, setExistingFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Load existing friends on component mount
  useEffect(() => {
    const loadExistingFriends = async () => {
      setIsLoadingFriends(true);
      try {
        const friends = await FriendService.getFriendList({ status: 'accepted' });
        setExistingFriends(friends);
      } catch (error) {
        console.error('Error loading existing friends:', error);
      } finally {
        setIsLoadingFriends(false);
      }
    };
    loadExistingFriends();
  }, []);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await FriendService.searchUsers(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      handleSearch(text);
    }, 500);

    setDebounceTimer(timer);
  };

  const handleSelectFriend = (friend: Friend) => {
    console.log('Friend selected:', friend);
    
    if (multi) {
      // Check if max friends limit reached
      if (selectedFriends.length >= maxFriends && !selectedFriends.find(f => f._id === friend._id)) {
        Alert.alert('Limit Reached', `You can select up to ${maxFriends} friends only.`);
        return;
      }
      
      // If not friends yet, send friend request first
      if (!friend.friendshipStatus || friend.friendshipStatus === 'declined') {
        FriendService.sendFriendRequest(friend._id)
          .then(() => {
            friend.friendshipStatus = 'pending';
          })
          .catch((error) => {
            console.error('Error sending friend request:', error);
          });
      }

      // Defer state updates to avoid setState during render
      setTimeout(() => {
        setSelectedFriends(prev => {
          const exists = prev.find(f => f._id === friend._id);
          let next;
          if (exists) {
            next = prev.filter(f => f._id !== friend._id);
          } else {
            next = [...prev, friend];
          }
          console.log('Updated selected friends:', next);
          if (onSelectMany) onSelectMany(next);
          return next;
        });
        setShowResults(false);
      }, 0);
    } else {
      // Single friend selection (original behavior)
      if (!friend.friendshipStatus || friend.friendshipStatus === 'declined') {
        FriendService.sendFriendRequest(friend._id)
          .then(() => {
            friend.friendshipStatus = 'pending';
          })
          .catch((error) => {
            console.error('Error sending friend request:', error);
          });
      }

      setTimeout(() => {
        setSearchQuery(friend.uid);
        setShowResults(false);
        if (onSelect) onSelect(friend);
      }, 0);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  useEffect(() => {
    if (typeof onUidChange === 'function' && searchQuery !== undefined) {
      // Only call if the value actually changed
      const timeoutId = setTimeout(() => {
        onUidChange(searchQuery);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]); // Remove onUidChange from dependencies to prevent infinite loops

  // Only update searchQuery if it's different from value to prevent infinite loop
  useEffect(() => {
    if (value !== undefined && searchQuery !== value) {
      setSearchQuery(value);
    }
  }, [value]); // Only depend on value to avoid infinite loop with searchQuery

  // Get dynamic styles based on theme
  const styles = getStyles(theme);

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isAcceptedFriend = item.friendshipStatus === 'accepted';
    const isPending = item.friendshipStatus === 'pending';
    const isNewUser = !item.friendshipStatus;

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectFriend(item)}
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
            {item.email && (
              <Text style={styles.friendEmail}>{item.email}</Text>
            )}
            {isAcceptedFriend && item.balance && (
              <Text style={styles.balanceText}>
                Balance: {item.balance.direction === 'settled' ? 'Settled' : 
                  `₹${item.balance.amount.toFixed(2)} ${item.balance.direction === 'you_owe' ? 'you owe' : 'owes you'}`}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.statusContainer}>
          {isAcceptedFriend && (
            <View style={[styles.statusBadge, styles.acceptedBadge]}>
              <Text style={styles.acceptedBadgeText}>✓ Friend</Text>
            </View>
          )}
          {isPending && (
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
            </View>
          )}
          {isNewUser && (
            <View style={[styles.statusBadge, styles.addBadge]}>
              <Text style={styles.addBadgeText}>+ Add</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={handleInputChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Show existing friends for quick selection in multi mode */}
      {multi && existingFriends.length > 0 && !showResults && (
        <View style={styles.existingFriendsContainer}>
          <Text style={styles.existingFriendsTitle}>Select from existing friends:</Text>
          <View style={styles.existingFriendsList}>
            {existingFriends.slice(0, 8).map(friend => (
              <TouchableOpacity
                key={friend._id}
                style={[
                  styles.existingFriendChip,
                  selectedFriends.find(sf => sf._id === friend._id) && styles.existingFriendChipSelected
                ]}
                onPress={() => handleSelectFriend(friend)}
              >
                <Text style={[
                  styles.existingFriendChipText,
                  selectedFriends.find(sf => sf._id === friend._id) && styles.existingFriendChipTextSelected
                ]}>
                  {friend.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {multi && selectedFriends.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedCount}>{selectedFriends.length}/{maxFriends} selected</Text>
          {selectedFriends.map(f => (
            <TouchableOpacity
              key={f._id}
              style={styles.selectedChip}
              onPress={() => {
                setTimeout(() => {
                  handleSelectFriend(f);
                }, 0);
              }}
            >
              <Text style={styles.selectedChipText}>{f.name}</Text>
              <Text style={styles.selectedChipRemove}> ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsList}>
            {searchResults.map((item) => (
              <View key={item._id}>
                {renderFriendItem({ item })}
              </View>
            ))}
          </View>
        </View>
      )}

      {showResults && searchResults.length === 0 && !isSearching && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No users found</Text>
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => {
              setShowResults(false);
              // Show warning that new friends can't be used for splits
              Alert.alert(
                "Friend Not Found", 
                `User "${searchQuery}" was not found. To split expenses, you need to add them as a friend first. You can still add this transaction without splitting.`,
                [
                  { text: "OK", style: "default" }
                ]
              );
            }}
          >
            <Text style={styles.addNewText}>+ Add new "{searchQuery}"</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  existingFriendsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  existingFriendsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  existingFriendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  existingFriendChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  existingFriendChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  existingFriendChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  existingFriendChipTextSelected: {
    color: theme.colors.onPrimary,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedCount: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    width: '100%',
    marginBottom: 4,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedChipRemove: {
    color: theme.colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  resultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
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
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  friendUid: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  friendEmail: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  balanceText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedBadge: {
    backgroundColor: theme.colors.success,
  },
  acceptedBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning,
  },
  pendingBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  addBadge: {
    backgroundColor: theme.colors.primary,
  },
  addBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  noResultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  addNewButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNewText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FriendSelector;
