import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTravel } from '../context/TravelContext';
import { ACHIEVEMENTS } from '../data/achievements';

export default function AchievementsScreen() {
  const { visited, dream } = useTravel();

  const items = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.check(visited, dream),
  }));

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Досягнення</Text>
        <Text style={styles.subtitle}>
          {unlockedCount} з {items.length}
        </Text>
      </View>

      {items.map((a) => (
        <View
          key={a.id}
          style={[styles.card, !a.unlocked && styles.cardLocked]}
        >
          <Text style={[styles.icon, !a.unlocked && styles.iconLocked]}>
            {a.unlocked ? a.icon : '🔒'}
          </Text>
          <View style={styles.info}>
            <Text style={[styles.achTitle, !a.unlocked && styles.textLocked]}>
              {a.title}
            </Text>
            <Text style={[styles.achDesc, !a.unlocked && styles.textLocked]}>
              {a.description}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12, marginVertical: 6,
    padding: 14, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardLocked: { backgroundColor: '#f0f0f0' },
  icon: { fontSize: 36, marginRight: 14 },
  iconLocked: { opacity: 0.5 },
  info: { flex: 1 },
  achTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  achDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  textLocked: { color: '#999' },
});
