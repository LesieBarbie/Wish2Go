import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, AppState, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockSocketManager as socket } from '../utils/MockSocketManager';
import { SocketState } from '../utils/SocketManager';

const MAX_EVENTS = 20;

function formatEvent(event) {
  if (event.type === 'friend_visited') {
    return {
      id: Date.now() + Math.random(),
      icon: '✈️',
      text: `${event.friendName} відвідав(ла) ${event.countryName}`,
      time: new Date().toLocaleTimeString(),
    };
  }
  if (event.type === 'country_tip') {
    return {
      id: Date.now() + Math.random(),
      icon: '💡',
      text: `Порада про ${event.countryName}: ${event.tip}`,
      time: new Date().toLocaleTimeString(),
    };
  }
  return {
    id: Date.now() + Math.random(),
    icon: '📡',
    text: JSON.stringify(event),
    time: new Date().toLocaleTimeString(),
  };
}

const STATE_LABELS = {
  [SocketState.DISCONNECTED]: { text: 'Відключено', color: '#999' },
  [SocketState.CONNECTING]: { text: 'Підключення...', color: '#f57c00' },
  [SocketState.CONNECTED]: { text: 'Онлайн', color: '#2e7d32' },
  [SocketState.RECONNECTING]: { text: 'Перепідключення...', color: '#f57c00' },
};

export default function LiveFeedScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [connState, setConnState] = useState(socket.state);
  const appState = useRef(AppState.currentState);
  const scrollRef = useRef(null);

  useEffect(() => {
    socket.connect();

    const unsubMsg = socket.onMessage((event) => {
      const formatted = formatEvent(event);
      setEvents(prev => [formatted, ...prev].slice(0, MAX_EVENTS));
    });

    const unsubState = socket.onStateChange(setConnState);

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'background') socket.disconnect();
      if (next === 'active' && appState.current === 'background') socket.connect();
      appState.current = next;
    });

    return () => {
      unsubMsg();
      unsubState();
      appSub.remove();
      socket.disconnect();
    };
  }, []);

  const stateInfo = STATE_LABELS[connState] || STATE_LABELS[SocketState.DISCONNECTED];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Стрічка друзів</Text>
        <View style={styles.statusRow}>
          {connState === SocketState.CONNECTING || connState === SocketState.RECONNECTING
            ? <ActivityIndicator size="small" color={stateInfo.color} style={{ marginRight: 6 }} />
            : <View style={[styles.dot, { backgroundColor: stateInfo.color }]} />
          }
          <Text style={[styles.statusText, { color: stateInfo.color }]}>{stateInfo.text}</Text>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌍</Text>
          <Text style={styles.emptyText}>Очікуємо події...</Text>
          <Text style={styles.emptyHint}>Оновлення приходять кожні 4 секунди</Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={{ paddingBottom: 20 }}>
          {events.map(e => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.cardIcon}>{e.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}>{e.text}</Text>
                <Text style={styles.cardTime}>{e.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '700', color: '#1b5e20' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, color: '#555', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#999', marginTop: 6 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardText: { fontSize: 15, color: '#222', flexShrink: 1 },
  cardTime: { fontSize: 12, color: '#999', marginTop: 4 },
});