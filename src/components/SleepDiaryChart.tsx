import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface DataPoint { date: string; value: number; }

interface Props {
  data: DataPoint[];
  title?: string;
  color?: string;
  maxValue?: number;
}

export default function SleepDiaryChart({ data, title, color = '#3b82f6', maxValue = 10 }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTxt}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {title && <Text style={s.title}>{title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.chart}>
          {data.map((point, i) => (
            <View key={i} style={s.barCol}>
              <View style={[s.bar, { height: Math.max(4, (point.value / maxValue) * 100), backgroundColor: color }]} />
              <Text style={s.lbl}>{point.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6, paddingBottom: 20 },
  barCol: { width: 28, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, marginBottom: 4 },
  lbl: { fontSize: 9, color: '#94a3b8' },
  empty: { paddingVertical: 20, alignItems: 'center' },
  emptyTxt: { fontSize: 13, color: '#94a3b8' },
});
