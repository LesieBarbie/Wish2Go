import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressBar({ label, current, total, color = '#4caf50' }) {
  const percent = total === 0 ? 0 : Math.min(100, (current / total) * 100);
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current} / {total} ({percent.toFixed(1)}%)
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  value: { fontSize: 13, color: '#666' },
  barBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
});
