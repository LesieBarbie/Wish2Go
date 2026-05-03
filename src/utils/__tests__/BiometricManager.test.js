import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { biometricManager, AuthState } from '../BiometricManager';

jest.mock('expo-local-authentication');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('BiometricManager', () => {

  // 1
  test('checkAvailability returns unavailable when no hardware', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
    const result = await biometricManager.checkAvailability();
    expect(result.available).toBe(false);
    expect(result.type).toBe('none');
  });

  // 2
  test('checkAvailability returns unavailable when not enrolled', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(false);
    const result = await biometricManager.checkAvailability();
    expect(result.available).toBe(false);
    expect(result.type).toBe('not_enrolled');
  });

  // 3
  test('checkAvailability returns face type for facial recognition', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    const result = await biometricManager.checkAvailability();
    expect(result.available).toBe(true);
    expect(result.type).toBe('face');
  });

  // 4
  test('checkAvailability returns fingerprint type for touch', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    const result = await biometricManager.checkAvailability();
    expect(result.type).toBe('fingerprint');
  });

  // 5
  test('authenticate returns SUCCESS on success', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
    const result = await biometricManager.authenticate('Test');
    expect(result.state).toBe(AuthState.SUCCESS);
  });

  // 6
  test('authenticate returns FAILED on user cancel', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });
    const result = await biometricManager.authenticate('Test');
    expect(result.state).toBe(AuthState.FAILED);
    expect(result.reason).toBe('cancelled');
  });

  // 7
  test('authenticate returns FAILED on system cancel', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'system_cancel' });
    const result = await biometricManager.authenticate();
    expect(result.state).toBe(AuthState.FAILED);
    expect(result.reason).toBe('cancelled');
  });

  // 8
  test('authenticate returns UNAVAILABLE when no hardware', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
    const result = await biometricManager.authenticate('Test');
    expect(result.state).toBe(AuthState.UNAVAILABLE);
  });

  // 9
  test('authenticate returns FAILED with error reason on other errors', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'lockout' });
    const result = await biometricManager.authenticate('Test');
    expect(result.state).toBe(AuthState.FAILED);
    expect(result.reason).toBe('lockout');
  });

  // 10
  test('isEnabledByUser returns true when stored as true', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    const result = await biometricManager.isEnabledByUser();
    expect(result).toBe(true);
  });

  // 11
  test('isEnabledByUser returns false when stored as false', async () => {
    AsyncStorage.getItem.mockResolvedValue('false');
    const result = await biometricManager.isEnabledByUser();
    expect(result).toBe(false);
  });

  // 12
  test('isEnabledByUser returns false when nothing stored', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const result = await biometricManager.isEnabledByUser();
    expect(result).toBe(false);
  });

  // 13
  test('setEnabled saves true to AsyncStorage', async () => {
    await biometricManager.setEnabled(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometric_enabled', 'true');
  });

  // 14
  test('setEnabled saves false to AsyncStorage', async () => {
    await biometricManager.setEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometric_enabled', 'false');
  });
});