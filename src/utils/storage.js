import AsyncStorage from '@react-native-async-storage/async-storage';

// Тонкая обёртка над AsyncStorage.
// Все функции асинхронные (возвращают Promise).

const KEYS = {
  VISITED: 'visited_countries',
  DREAM: 'dream_countries',
  REGIONS: 'visited_regions', // { '276': ['Bayern', 'Berlin'], ... }
  PROFILE: 'user_profile',
};

export async function loadData(key, defaultValue) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn('loadData error', key, e);
    return defaultValue;
  }
}

export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('saveData error', key, e);
  }
}

export { KEYS };
