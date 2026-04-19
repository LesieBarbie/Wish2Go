import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import CountryRegionMap from '../components/CountryRegionMap';
import { useTravel } from '../context/TravelContext';
import { COUNTRIES_WITH_REGIONS } from '../data/countries';

export default function CountryDetailScreen({ route }) {
  const { countryId, name } = route.params;
  const config = COUNTRIES_WITH_REGIONS[countryId];
  const { regions, toggleRegion, visited, updateNote } = useTravel();

  const visitedRegions = regions[countryId] || [];
  const country = visited.find((c) => c.id === countryId);

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>
          Для країни {name} поки немає детальної карти регіонів.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.hint}>
        Торкнись регіону, щоб позначити його як відвіданий.
      </Text>

      <CountryRegionMap
        config={config}
        countryId={countryId}
        visitedRegions={visitedRegions}
        onRegionPress={(regionName) => toggleRegion(countryId, regionName)}
      />

      <View style={styles.stats}>
        <Text style={styles.statsTxt}>
          Відвідано регіонів: {visitedRegions.length}
        </Text>
      </View>

      {visitedRegions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Відвідані регіони</Text>
          {visitedRegions.map((r) => (
            <Text key={r} style={styles.regionItem}>• {r}</Text>
          ))}
        </View>
      )}

      {country && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Нотатка</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Твої враження про країну..."
            multiline
            value={country.note || ''}
            onChangeText={(text) => updateNote('visited', countryId, text)}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  hint: { textAlign: 'center', color: '#666', marginVertical: 8, paddingHorizontal: 16 },
  stats: { padding: 16, alignItems: 'center' },
  statsTxt: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#f7f7f7',
    margin: 12, padding: 14, borderRadius: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  regionItem: { fontSize: 14, paddingVertical: 2 },
  noteInput: {
    minHeight: 80, backgroundColor: '#fff',
    borderRadius: 8, padding: 10,
    textAlignVertical: 'top', fontSize: 14,
  },
  notFound: { textAlign: 'center', marginTop: 40, color: '#666' },
});
