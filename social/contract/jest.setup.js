/**
 * Points Config.apiBaseUrl at the local harness before any module reads it, and
 * substitutes AsyncStorage with an in-process map.
 *
 * The `mock` prefix on the store is required: jest only allows a mock factory to
 * close over variables whose names start with "mock".
 */
const mockStorage = new Map();

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: "1.0.0",
      extra: {
        apiBaseUrl: process.env.SOCIAL_CONTRACT_BASE_URL,
        webBaseUrl: process.env.SOCIAL_CONTRACT_BASE_URL,
      },
    },
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: async (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
    setItem: async (key, value) => {
      mockStorage.set(key, value);
    },
    removeItem: async (key) => {
      mockStorage.delete(key);
    },
    multiRemove: async (keys) => {
      keys.forEach((key) => mockStorage.delete(key));
    },
  },
}));

// Node 18+ supplies fetch, FormData, AbortController and XMLHttpRequest is only
// needed for progress uploads, which the contract suite does not exercise.
global.__DEV__ = false;
