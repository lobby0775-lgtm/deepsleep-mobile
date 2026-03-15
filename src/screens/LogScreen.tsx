import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function LogScreen() {
  const { user } = useAuth();
  const [sleepQuality, setSleepQuality] = useState(5);
  const [sleepDuration, setSleepDuration] = useState(7);
  const [wakeRefreshed, setWakeRefreshed] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitLog = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('sleep_entries').insert({
        user_id: user.id,
        sleep_quality: sleepQuality,
        sleep_duration: sleepDuration,
        wake_up_refreshed: wakeRefreshed,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Sleep log saved!', [
        { text: 'OK', onPress: () => {
          setSleepQuality(5);
          setSleepDuration(7);
          setWakeRefreshed(false);
          setNotes('');
        }},
      ]);
    } catch (error) {
      console.error('Error saving sleep log:', error);
      Alert.alert('Error', 'Failed to save sleep log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Sleep</Text>
          <Text style={styles.subtitle}>Record your sleep from last night</Text>
        </View>

        {/* Sleep Quality */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Quality</Text>
          <Text style={styles.cardDescription}>How would you rate your sleep quality?</Text>
          <View style={styles.qualityContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.qualityButton,
                  sleepQuality === num && styles.qualityButtonSelected,
                ]}
                onPress={() => setSleepQuality(num)}
              >
                <Text style={[
                  styles.qualityButtonText,
                  sleepQuality === num && styles.qualityButtonTextSelected,
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.qualityLabels}>
            <Text style={styles.qualityLabel}>Poor</Text>
            <Text style={styles.qualityLabel}>Excellent</Text>
          </View>
        </View>

        {/* Sleep Duration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Duration</Text>
          <Text style={styles.cardDescription}>How many hours did you sleep?</Text>
          <View style={styles.durationContainer}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setSleepDuration(Math.max(1, sleepDuration - 0.5))}
            >
              <Text style={styles.durationButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>{sleepDuration.toFixed(1)}</Text>
              <Text style={styles.durationUnit}>hours</Text>
            </View>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setSleepDuration(Math.min(12, sleepDuration + 0.5))}
            >
              <Text style={styles.durationButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wake Refreshed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wake Up Feeling</Text>
          <Text style={styles.cardDescription}>Did you wake up feeling refreshed?</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !wakeRefreshed && styles.toggleButtonSelected]}
              onPress={() => setWakeRefreshed(false)}
            >
              <Text style={[styles.toggleButtonText, !wakeRefreshed && styles.toggleButtonTextSelected]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, wakeRefreshed && styles.toggleButtonSelected]}
              onPress={() => setWakeRefreshed(true)}
            >
              <Text style={[styles.toggleButtonText, wakeRefreshed && styles.toggleButtonTextSelected]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardDescription}>Any additional notes about your sleep?</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g., Woke up at 3am, had vivid dreams, etc."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitLog}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving...' : 'Save Sleep Log'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qualityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  qualityButtonTextSelected: {
    color: '#ffffff',
  },
  qualityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  durationDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  durationUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  toggleButtonTextSelected: {
    color: '#3b82f6',
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});