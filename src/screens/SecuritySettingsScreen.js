import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { biometricManager } from '../utils/BiometricManager';

export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [info, setInfo] = useState({ available: false, label: 'Перевірка...' });

  useEffect(() => {
    (async () => {
      const availability = await biometricManager.checkAvailability();
      setInfo(availability);
      const isOn = await biometricManager.isEnabledByUser();
      setEnabled(isOn);
    })();
  }, []);

  const toggle = async (val) => {
    setEnabled(val);
    await biometricManager.setEnabled(val);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <Text style={styles.header}>🔒 Безпека</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Тип біометрії</Text>
        <Text style={styles.cardValue}>
          {info.available ? `✅ ${info.label}` : '❌ Недоступна на цьому пристрої'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Біометричний вхід</Text>
            <Text style={styles.cardSub}>Запитувати при відкритті застосунку</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggle}
            disabled={!info.available}
            trackColor={{ true: '#2e7d32' }}
          />
        </View>
        {!info.available && (
          <Text style={styles.warning}>⚠️ Увімкніть біометрію в налаштуваннях пристрою</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { fontSize: 26, fontWeight: '700', color: '#1b5e20', margin: 20 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  cardValue: { fontSize: 15, color: '#555', marginTop: 6 },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  warning: { color: '#e65100', fontSize: 13, marginTop: 8 },
});