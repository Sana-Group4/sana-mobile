import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;

export async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      await AsyncStorage.setItem('access_token', data.access_token);
      return { success: true, access_token: data.access_token };
    } else {
      return { success: false, ...data };
    }
  } catch (err) {
    return { success: false, detail: 'Network error', error_code: -1 };
  }
}
