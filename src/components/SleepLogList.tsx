import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import type { SleepLog } from '../types';
import { format } from 'date-fns';

interface Props {
  logs: SleepLog[];
  onDeleted?: () => void;
}

export const SleepLogList: React.FC<Props> = ({ logs, onDeleted }) => {
  const handleDelete = async (id: string) => {
    Alert.alert('Delete log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('sleep_logs').delete().eq('id', id);
        onDeleted?.();
      }},
    ]);
  };

  if (logs.length === 0) {
    return <Text style={s.empty}>No logs yet.</Text>;
  }

  return (
    <View>
      {logs.map(log => (
        <View key={log.id} style={s.row}>
          <View style={s.info}>
            <Text style={s.date}>{format(new Date(log.log_date), 'EEE, MMM d')}</Text>
            <Text style={s.meta}>{log.bedtime} → {log.rise_time} · {log.tst_minutes}min sleep</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(log.id)} style={s.del}>
            <Text style={s.delTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  info: { flex: 1 },
  date: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  del: { padding: 8 },
  delTxt: { fontSize: 16, color: '#ef4444' },
  empty: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
});
