import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import WorldMapSvg from '../components/WorldMapSvg';
import ProgressBar from '../components/ProgressBar';
import { useTravel } from '../context/TravelContext';
import {
  TOTAL_COUNTRIES,
  CONTINENT_COUNTS,
  COUNTRIES_WITH_REGIONS,
  getCountryById,
} from '../data/countries';

export default function MapScreen({ navigation }) {
  const { visited, dream, toggleVisited, toggleDream } = useTravel();
  const [mode, setMode] = useState('visited');

  const getFill = (id) => {
    if (visited.find((c) => c.id === id)) return '#69e36a';
    if (dream.find((c) => c.id === id)) return '#83cfff';
    return '#e0e0e0';
  };

  const handlePress = (id, name) => {
    const hasRegions = !!COUNTRIES_WITH_REGIONS[id];
    const isVisited = visited.find((c) => c.id === id);

    if (hasRegions && isVisited) {
      Alert.alert(
        name,
        'Що зробити?',
        [
          {
            text: 'Відкрити регіони',
            onPress: () => navigation.navigate('CountryDetail', { countryId: id, name }),
          },
          {
            text: mode === 'visited' ? 'Прибрати позначку' : 'У мрії',
            onPress: () =>
              mode === 'visited' ? toggleVisited(id, name) : toggleDream(id, name),
          },
          { text: 'Скасувати', style: 'cancel' },
        ],
        { cancelable: true }
      );
      return;
    }

    if (mode === 'visited') toggleVisited(id, name);
    else toggleDream(id, name);
  };

  const perContinent = {};
  for (const v of visited) {
    const c = getCountryById(v.id);
    if (c) perContinent[c.continent] = (perContinent[c.continent] || 0) + 1;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>🗺️ Моя мапа подорожей</Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'visited' && styles.modeBtnActive]}
          onPress={() => setMode('visited')}
        >
          <Text style={[styles.modeTxt, mode === 'visited' && styles.modeTxtActive]}>
            ✅ Відвідані
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'dream' && styles.modeBtnActive]}
          onPress={() => setMode('dream')}
        >
          <Text style={[styles.modeTxt, mode === 'dream' && styles.modeTxtActive]}>
            💭 Мрії
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Торкнись країни, щоб позначити її. Двома пальцями можна масштабувати.
      </Text>

      <WorldMapSvg getFill={getFill} onCountryPress={handlePress} />

      <View style={styles.progressSection}>
        <ProgressBar
          label="🌍 Весь світ"
          current={visited.length}
          total={TOTAL_COUNTRIES}
          color="#4caf50"
        />
        {Object.keys(CONTINENT_COUNTS).map((continent) => (
          <ProgressBar
            key={continent}
            label={continent}
            current={perContinent[continent] || 0}
            total={CONTINENT_COUNTS[continent]}
            color="#2196f3"
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10, gap: 10 },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  modeBtnActive: { backgroundColor: '#333' },
  modeTxt: { color: '#333', fontWeight: '600' },
  modeTxtActive: { color: '#fff' },
  hint: { textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 8, paddingHorizontal: 20 },
  progressSection: { padding: 16 },
});
