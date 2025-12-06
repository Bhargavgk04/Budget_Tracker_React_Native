// Mock AsyncStorage for Jest
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: async (key, value) => { store[key] = value; },
    getItem: async (key) => store[key] || null,
    removeItem: async (key) => { delete store[key]; },
    clear: async () => { store = {}; },
    getAllKeys: async () => Object.keys(store),
  };
});

// Mock constants to provide BASE_URL
jest.mock('@/utils/constants', () => ({
  API_ENDPOINTS: { BASE_URL: 'http://localhost:3000/api' },
  STORAGE_KEYS: { AUTH_TOKEN: 'auth_token' },
}), { virtual: true });

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'mock-token' })),
  AndroidImportance: { MAX: 5 },
  setNotificationChannelAsync: jest.fn(),
}), { virtual: true });

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}), { virtual: true });
