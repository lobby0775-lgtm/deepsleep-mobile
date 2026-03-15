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
}

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(7);
      if (error) throw error;
      setSleepData(data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const avgQuality = sleepData.length
    ? (sleepData.reduce((s, e) => s + e.sleep_quality, 0) / sleepData.length).toFixed(1)
    : '—';
  const avgDuration = sleepData.length
    ? (sleepData.reduce((s, e) => s + e.sleep_duration, 0) / sleepData.length).toFixed(1)
    : '—';
  const streak = sleepData.length; // simplified: count of recent logs

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.name}>{profile?.display_name || 'there'} 👋</Text>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>{avgQuality}<Text style={s.statSub}>/10</Text></Text>
            <Text style={s.statLbl}>Avg quality</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{avgDuration}<Text style={s.statSub}>h</Text></Text>
            <Text style={s.statLbl}>Avg duration</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{streak}<Text style={s.statSub}>d</Text></Text>
            <Text style={s.statLbl}>Logged</Text>
          </View>
        </View>

        {/* Mini bar chart */}
        {sleepData.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Last 7 nights — quality</Text>
            <View style={s.bars}>
              {sleepData.slice(0, 7).reverse().map((e, i) => (
                <View key={i} style={s.barCol}>
                  <View style={[s.bar, { height: Math.max(4, e.sleep_quality * 12) }]} />
                  <Text style={s.barLbl}>{format(new Date(e.created_at), 'E')[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent logs */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent sleep logs</Text>
          {sleepData.length === 0 ? (
            <Text style={s.empty}>No logs yet. Tap Log to get started.</Text>
          ) : (
            sleepData.slice(0, 5).map((e) => (
              <View key={e.id} style={s.logRow}>
                <View>
                  <Text style={s.logDate}>{format(new Date(e.created_at), 'EEE, MMM d')}</Text>
                  <Text style={s.logMeta}>{e.sleep_duration}h · {e.wake_up_refreshed ? 'Refreshed' : 'Tired'}</Text>
                </View>
                <View style={[s.qualityBadge, { backgroundColor: e.sleep_quality >= 7 ? '#dcfce7' : e.sleep_quality >= 4 ? '#fef9c3' : '#fee2e2' }]}>
                  <Text style={s.qualityTxt}>{e.sleep_quality}/10</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation?.navigate('Log')}>
            <Text style={s.actionIcon}>📝</Text>
            <Text style={s.actionTxt}>Log sleep</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation?.navigate('Progress')}>
            <Text style={s.actionIcon}>📊</Text>
            <Text style={s.actionTxt}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation?.navigate('Learn')}>
            <Text style={s.actionIcon}>📚</Text>
            <Text style={s.actionTxt}>Learn</Text>
          </TouchableOpacity>
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
  greeting: { fontSize: 15, color: '#64748b' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statVal: { fontSize: 22, fontWeight: 'bold', color: '#3b82f6' },
  statSub: { fontSize: 13, color: '#94a3b8' },
  statLbl: { fontSize: 11, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#3b82f6', borderRadius: 4, marginBottom: 4 },
  barLbl: { fontSize: 10, color: '#94a3b8' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logDate: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  logMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  qualityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  qualityTxt: { fontSize: 13, fontWeight: '600', color: '#374151' },
  empty: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 32 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionTxt: { fontSize: 12, fontWeight: '500', color: '#475569' },
});
