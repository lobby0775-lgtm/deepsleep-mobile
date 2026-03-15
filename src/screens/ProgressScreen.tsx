import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays } from 'date-fns';

interface SleepEntry {
  id: string;
  created_at: string;
  sleep_quality: number;
  sleep_duration: number;
  wake_up_refreshed: boolean;
  notes?: string;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week'|'month'|'all'>('week');

  useEffect(() => {
    if (user) fetchData();
  }, [user, range]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const from = range === 'week'
        ? subDays(new Date(), 7)
        : range === 'month' ? subDays(new Date(), 30) : new Date('2000-01-01');

      const { data: rows, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setData(rows || []);
    } catch {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgQuality = avg(data.map(e => e.sleep_quality));
  const avgDuration = avg(data.map(e => e.sleep_duration));
  const refreshedPct = data.length
    ? Math.round(data.filter(e => e.wake_up_refreshed).length / data.length * 100) : 0;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Progress</Text>
        </View>

        {/* Range selector */}
        <View style={s.card}>
          <View style={s.seg}>
            {(['week','month','all'] as const).map(r => (
              <TouchableOpacity
                key={r}
                style={[s.segBtn, range === r && s.segBtnSel]}
                onPress={() => setRange(r)}
              >
                <Text style={[s.segTxt, range === r && s.segTxtSel]}>
                  {r === 'week' ? '7 days' : r === 'month' ? '30 days' : 'All time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Summary ({data.length} nights)</Text>
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>{avgQuality.toFixed(1)}</Text>
              <Text style={s.statLbl}>Avg quality</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>{avgDuration.toFixed(1)}h</Text>
              <Text style={s.statLbl}>Avg duration</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>{refreshedPct}%</Text>
              <Text style={s.statLbl}>Refreshed</Text>
            </View>
          </View>
        </View>

        {/* Bar chart — sleep quality */}
        {data.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Sleep quality over time</Text>
            <View style={s.chartWrap}>
              {/* Y-axis labels */}
              <View style={s.yAxis}>
                {[10,8,6,4,2].map(n => (
                  <Text key={n} style={s.yLbl}>{n}</Text>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chartScroll}>
                <View style={s.bars}>
                  {data.map((e, i) => (
                    <View key={i} style={s.barCol}>
                      <View style={[s.bar, { height: e.sleep_quality * 10 }]} />
                      <Text style={s.barLbl}>{format(new Date(e.created_at), 'd')}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Duration bar chart */}
        {data.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Sleep duration (hours)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.bars}>
                {data.map((e, i) => (
                  <View key={i} style={s.barCol}>
                    <View style={[s.bar, { height: e.sleep_duration * 12, backgroundColor: '#10b981' }]} />
                    <Text style={s.barLbl}>{format(new Date(e.created_at), 'd')}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Log list */}
        <View style={s.card}>
          <Text style={s.cardTitle}>All entries</Text>
          {data.length === 0 ? (
            <Text style={s.empty}>No entries for this period.</Text>
          ) : (
            [...data].reverse().map(e => (
              <View key={e.id} style={s.row}>
                <View>
                  <Text style={s.rowDate}>{format(new Date(e.created_at), 'EEE, MMM d')}</Text>
                  <Text style={s.rowMeta}>{e.sleep_duration}h · {e.wake_up_refreshed ? '✅ Refreshed' : '😴 Tired'}</Text>
                  {e.notes ? <Text style={s.rowNotes} numberOfLines={1}>{e.notes}</Text> : null}
                </View>
                <View style={[s.badge, { backgroundColor: e.sleep_quality >= 7 ? '#dcfce7' : e.sleep_quality >= 4 ? '#fef9c3' : '#fee2e2' }]}>
                  <Text style={s.badgeTxt}>{e.sleep_quality}/10</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  seg: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnSel: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segTxt: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  segTxtSel: { color: '#3b82f6' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: 'bold', color: '#3b82f6' },
  statLbl: { fontSize: 11, color: '#64748b', marginTop: 4 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  yAxis: { justifyContent: 'space-between', height: 100, marginRight: 6, paddingBottom: 16 },
  yLbl: { fontSize: 9, color: '#94a3b8' },
  chartScroll: { flex: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 5, paddingBottom: 16 },
  barCol: { width: 24, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#3b82f6', borderRadius: 3, marginBottom: 4 },
  barLbl: { fontSize: 9, color: '#94a3b8' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowDate: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  rowNotes: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontSize: 13, fontWeight: '600', color: '#374151' },
  empty: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
});
