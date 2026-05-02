import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTravel } from '../context/TravelContext';
import { COUNTRIES, COUNTRIES_WITH_REGIONS } from '../data/countries';
import Country from '../models/Country';
import CountryRepository from '../repositories/CountryRepository';

/**
 * Екран СПИСКУ всіх країн (через FlatList).
 * Дані беруться напряму з CountryRepository (offline-first).
 * Для кожної країни показується syncStatus.
 */
export default function CountriesListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { visited, dream } = useTravel();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [repoData, setRepoData] = useState([]);

  // Завантажуємо дані з репозиторію при кожному оновленні visited/dream
  useEffect(() => {
    const repo = new CountryRepository();
    repo.getAll().then(setRepoData).catch(() => setRepoData([]));
  }, [visited, dream]);

  // Будуємо колекцію екземплярів Country
  const countries = useMemo(() => {
    return COUNTRIES.map((c) => {
      const fromRepo = repoData.find((r) => r.id === c.id);
      if (fromRepo) {
        // Використовуємо дані з репозиторію (містять syncStatus)
        return new Country(
          fromRepo.id,
          c.name, // беремо свіжу назву з довідника
          c.continent,
          fromRepo.visited,
          fromRepo.isDream,
          fromRepo.dateVisited,
          fromRepo.note,
          fromRepo.photos || [],
          fromRepo.syncStatus
        );
      }
      // Країна без позначок - просто з довідника
      return new Country(c.id, c.name, c.continent);
    });
  }, [repoData]);

  const filtered = useMemo(() => {
    let list = countries;
    if (filter === 'visited') list = list.filter((c) => c.visited);
    else if (filter === 'dream') list = list.filter((c) => c.isDream);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.continent.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const aScore = a.visited ? 0 : a.isDream ? 1 : 2;
      const bScore = b.visited ? 0 : b.isDream ? 1 : 2;
      if (aScore !== bScore) return aScore - bScore;
      return a.name.localeCompare(b.name);
    });
  }, [countries, filter, search]);

  const openDetail = (country) => {
    navigation.navigate('CountryDetail', {
      countryId: country.id,
      name: country.name,
    });
  };

  // Візуальне відображення syncStatus
  const renderSyncBadge = (country) => {
    if (!country.visited && !country.isDream) return null;
    const map = {
      synced: { text: '✓', color: '#2e7d32' },
      pending: { text: '⏳', color: '#ff9800' },
      error: { text: '⚠', color: '#c62828' },
    };
    const s = map[country.syncStatus] || map.pending;
    return <Text style={{ color: s.color, fontSize: 12, marginLeft: 6 }}>{s.text}</Text>;
  };

  const renderItem = ({ item }) => {
    const hasRegions = !!COUNTRIES_WITH_REGIONS[item.id];
    return (
      <TouchableOpacity style={styles.item} onPress={() => openDetail(item)}>
        <View style={styles.itemLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {renderSyncBadge(item)}
          </View>
          <Text style={styles.itemContinent}>{item.continent}</Text>
          {item.dateVisited && (
            <Text style={styles.itemDate}>
              Відвідано: {item.dateVisited.toLocaleDateString('uk-UA')}
              {item.getDaysSinceVisit() !== null &&
                ` (${item.getDaysSinceVisit()} дн. тому)`}
            </Text>
          )}
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.status}>{item.getStatus()}</Text>
          {hasRegions && <Text style={styles.hint}>→ регіони</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>📋 Список країн</Text>

      <TextInput
        style={styles.search}
        placeholder="Пошук за назвою або континентом..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        <FilterButton
          label={`Усі (${countries.length})`}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterButton
          label={`✅ Відвідані (${countries.filter((c) => c.visited).length})`}
          active={filter === 'visited'}
          onPress={() => setFilter('visited')}
        />
        <FilterButton
          label={`💭 Мрії (${countries.filter((c) => c.isDream).length})`}
          active={filter === 'dream'}
          onPress={() => setFilter('dream')}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={filtered.length === 0 && styles.emptyBox}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? 'Нічого не знайдено' : 'Немає країн у цій категорії'}
          </Text>
        }
      />
    </View>
  );
}

function FilterButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterTxt, active && styles.filterTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  search: {
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 16,
  },
  filterBtnActive: { backgroundColor: '#2e7d32' },
  filterTxt: { color: '#333', fontSize: 12, fontWeight: '600' },
  filterTxtActive: { color: '#fff' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
  },
  itemLeft: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111' },
  itemContinent: { fontSize: 13, color: '#666', marginTop: 2 },
  itemDate: { fontSize: 11, color: '#999', marginTop: 4 },
  itemRight: { alignItems: 'flex-end' },
  status: { fontSize: 13, fontWeight: '500' },
  hint: { fontSize: 11, color: '#2196f3', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#eee', marginLeft: 14 },
  empty: { textAlign: 'center', color: '#999', padding: 40 },
  emptyBox: { flexGrow: 1, justifyContent: 'center' },
});