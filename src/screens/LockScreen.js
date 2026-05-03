import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { biometricManager, AuthState } from '../utils/BiometricManager';

export default function LockScreen({ onUnlock }) {
  const insets = useSafeAreaInsets();
  const [authState, setAuthState] = useState(AuthState.IDLE);
  const [biometricLabel, setBiometricLabel] = useState('Біометрія');

  useEffect(() => {
    (async () => {
      const info = await biometricManager.checkAvailability();
      if (info.available) setBiometricLabel(info.label);
      tryAuthenticate();
    })();
  }, []);

  const tryAuthenticate = async () => {
    setAuthState(AuthState.AUTHENTICATING);
    const result = await biometricManager.authenticate('Увійдіть у Wish2Go');
    setAuthState(result.state);
    if (result.state === AuthState.SUCCESS) onUnlock();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.icon}>🌍</Text>
      <Text style={styles.title}>Wish2Go</Text>
      <Text style={styles.subtitle}>Підтвердіть особу для входу</Text>

      {authState === AuthState.AUTHENTICATING && (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 32 }} />
      )}

      {authState === AuthState.FAILED && (
        <Text style={styles.error}>Автентифікацію скасовано</Text>
      )}

      {authState === AuthState.UNAVAILABLE && (
        <Text style={styles.error}>Біометрія недоступна на цьому пристрої</Text>
      )}

      {(authState === AuthState.IDLE || authState === AuthState.FAILED) && (
        <TouchableOpacity style={styles.btn} onPress={tryAuthenticate}>
          <Text style={styles.btnText}>🔐 {biometricLabel}</Text>
        </TouchableOpacity>
      )}

      {authState === AuthState.UNAVAILABLE && (
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onUnlock}>
          <Text style={styles.btnText}>Увійти без біометрії</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 72 },
  title: { fontSize: 32, fontWeight: '700', color: '#1b5e20', marginTop: 12 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  error: { color: '#c62828', marginTop: 24, fontSize: 15 },
  btn: {
    marginTop: 32, backgroundColor: '#2e7d32', paddingHorizontal: 36,
    paddingVertical: 14, borderRadius: 12,
  },
  btnSecondary: { backgroundColor: '#888', marginTop: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});