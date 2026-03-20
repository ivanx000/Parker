import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: async <T = unknown>(key: string): Promise<T | null> => {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  },
  setItem: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  }
};
