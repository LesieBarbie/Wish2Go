import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

// Стани автентифікації
export const AuthState = {
  IDLE: 'idle',
  AUTHENTICATING: 'authenticating',
  SUCCESS: 'success',
  FAILED: 'failed',
  UNAVAILABLE: 'unavailable',
};

class BiometricManager {
  async checkAvailability() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return { available: false, type: 'none' };

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return { available: false, type: 'not_enrolled' };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const hasFaceId = types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    );

    return {
      available: true,
      type: hasFaceId ? 'face' : 'fingerprint',
      label: hasFaceId ? 'Face ID' : 'Touch ID / Fingerprint',
    };
  }

  async authenticate(reason = 'Підтвердіть особу') {
    const { available } = await this.checkAvailability();
    if (!available) return { state: AuthState.UNAVAILABLE };

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Використати пароль',
      cancelLabel: 'Скасувати',
      disableDeviceFallback: false,
    });

    if (result.success) return { state: AuthState.SUCCESS };
    if (result.error === 'user_cancel' || result.error === 'system_cancel') {
      return { state: AuthState.FAILED, reason: 'cancelled' };
    }
    return { state: AuthState.FAILED, reason: result.error };
  }

  async isEnabledByUser() {
    const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  }

  async setEnabled(enabled) {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  }
}

export const biometricManager = new BiometricManager();