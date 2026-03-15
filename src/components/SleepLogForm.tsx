import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Props { onSuccess?: () => void; }

export const SleepLogForm: React.FC<Props> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [bedtime, setBedtime] = useState('22:00');
  const [riseTime, setRiseTime] = useState('06:30');
  const [tstMins, setTstMins] = useState('360');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const tib = (() => {
      const [bh, bm] = bedtime.split(':').map(Number);
      const [rh, rm] = riseTime.split(':').map(Number);
      let mins = (rh * 60 + rm) - (bh * 60 + bm);
      if (mins < 0) mins += 1440;
      return mins;
    })();

    const { error } = await supabase.from('sleep_logs').insert({
      user_id: user.id,
      log_date: new Date().toISOString().slice(0, 10),
      bedtime,
      rise_time: riseTime,
      tst_minutes: parseInt(tstMins, 10) || tib,
      tib_minutes: tib,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Saved!'); onSuccess?.(); }
  };

  return (
    <View style={s.container}>
      <Text style={s.label}>Bedtime</Text>
      <TextInput style={s.input} value={bedtime} onChangeText={setBedtime} placeholder="HH:MM" />
      <Text style={s.label}>Rise time</Text>
      <TextInput style={s.input} value={riseTime} onChangeText={setRiseTime} placeholder="HH:MM" />
      <Text style={s.label}>Total sleep (minutes)</Text>
      <TextInput style={s.input} value={tstMins} onChangeText={setTstMins} keyboardType="numeric" />
      <Text style={s.label}>Notes</Text>
      <TextInput style={[s.input, s.textarea]} value={notes} onChangeText={setNotes} multiline />
      <TouchableOpacity style={[s.btn, saving && s.btnDis]} onPress={handleSave} disabled={saving}>
        <Text style={s.btnTxt}>{saving ? 'Saving…' : 'Save log'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnDis: { backgroundColor: '#cbd5e1' },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
