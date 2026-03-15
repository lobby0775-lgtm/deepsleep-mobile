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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

interface Country {
  code: string;
  name: string;
  flag: string;
  crisisOrg: string;
  crisisLine: string;
}

const COUNTRIES: Country[] = [
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', crisisOrg: 'Samaritans of Singapore', crisisLine: '1767' },
  { code: 'US', name: 'United States', flag: '🇺🇸', crisisOrg: 'National Suicide Prevention Lifeline', crisisLine: '988' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', crisisOrg: 'Samaritans', crisisLine: '116 123' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', crisisOrg: 'Lifeline Australia', crisisLine: '13 11 14' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', crisisOrg: 'Crisis Services Canada', crisisLine: '1-833-456-4566' },
  { code: 'IN', name: 'India', flag: '🇮🇳', crisisOrg: 'Vandrevala Foundation', crisisLine: '9999 666 555' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', crisisOrg: 'TELL Lifeline', crisisLine: '03-5774-0992' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', crisisOrg: 'Korea Suicide Prevention Center', crisisLine: '1393' },
];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<string | null>(null);
  const [medications, setMedications] = useState<Array<{ name: string; dose: string }>>([]);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [caffeineTime, setCaffeineTime] = useState('');
  const [alcoholFrequency, setAlcoholFrequency] = useState('');
  const [insomniaDuration, setInsomniaDuration] = useState('');
  const [shiftWorker, setShiftWorker] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const addMedication = () => {
    if (medName.trim() && medDose.trim()) {
      setMedications([...medications, { name: medName.trim(), dose: medDose.trim() }]);
      setMedName('');
      setMedDose('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('onboarding_data').insert({
        user_id: user.id,
        country_code: country,
        medications,
        caffeine_time: caffeineTime,
        alcohol_frequency: alcoholFrequency,
        insomnia_duration: insomniaDuration,
        shift_worker: shiftWorker,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Onboarding completed!', [
        { text: 'OK', onPress: () => navigation.navigate('Main' as never) },
      ]);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where are you located?</Text>
            <Text style={styles.stepDescription}>
              This helps us provide relevant crisis resources if needed.
            </Text>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.countryItem,
                    country === c.code && styles.countryItemSelected,
                  ]}
                  onPress={() => setCountry(c.code)}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{c.name}</Text>
                    <Text style={styles.countryCrisis}>
                      {c.crisisOrg}: {c.crisisLine}
                    </Text>
                  </View>
                  {country === c.code && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Medications & Substances</Text>
            <Text style={styles.stepDescription}>
              Tell us about medications, caffeine, and alcohol that might affect your sleep.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Medications</Text>
              <View style={styles.medInputRow}>
                <TextInput
                  style={[styles.input, styles.medInput]}
                  placeholder="Medication name"
                  value={medName}
                  onChangeText={setMedName}
                />
                <TextInput
                  style={[styles.input, styles.doseInput]}
                  placeholder="Dose"
                  value={medDose}
                  onChangeText={setMedDose}
                />
                <TouchableOpacity style={styles.addButton} onPress={addMedication}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {medications.map((med, idx) => (
                <View key={idx} style={styles.medItem}>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDose}>{med.dose}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMedication(idx)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Caffeine Intake</Text>
              <TextInput
                style={styles.input}
                placeholder="Time (e.g., 14:30)"
                value={caffeineTime}
                onChangeText={setCaffeineTime}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alcohol Frequency</Text>
              <View style={styles.optionsContainer}>
                {['Never', 'Rarely', 'Weekly', 'Daily'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      alcoholFrequency === freq.toLowerCase() && styles.optionButtonSelected,
                    ]}
                    onPress={() => setAlcoholFrequency(freq.toLowerCase())}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      alcoholFrequency === freq.toLowerCase() && styles.optionButtonTextSelected,
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Sleep History</Text>
            <Text style={styles.stepDescription}>
              Help us understand your sleep background.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How long have you had insomnia?</Text>
              <View style={styles.optionsContainer}>
                {['< 1 month', '1-3 months', '3-12 months', '> 1 year'].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.optionButton,
                      insomniaDuration === duration && styles.optionButtonSelected,
                    ]}
                    onPress={() => setInsomniaDuration(duration)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      insomniaDuration === duration && styles.optionButtonTextSelected,
                    ]}>
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Are you a shift worker?</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, !shiftWorker && styles.toggleButtonSelected]}
                  onPress={() => setShiftWorker(false)}
                >
                  <Text style={[styles.toggleButtonText, !shiftWorker && styles.toggleButtonTextSelected]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, shiftWorker && styles.toggleButtonSelected]}
                  onPress={() => setShiftWorker(true)}
                >
                  <Text style={[styles.toggleButtonText, shiftWorker && styles.toggleButtonTextSelected]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Setup Complete! 🎉</Text>
            <Text style={styles.stepDescription}>
              Your profile is ready. You can now start tracking your sleep and getting personalized insights.
            </Text>

            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>All set!</Text>
              <Text style={styles.successText}>
                You'll be redirected to your dashboard where you can:
              </Text>
              
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Log your daily sleep</Text>
                <Text style={styles.featureItem}>• Track sleep quality trends</Text>
                <Text style={styles.featureItem}>• Get personalized insights</Text>
                <Text style={styles.featureItem}>• Access sleep resources</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {step > 1 && step < totalSteps && (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        {step < totalSteps && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Step {step} of {totalSteps - 1}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / (totalSteps - 1)) * 100}%` }]} />
            </View>
          </View>
        )}

        {renderStep()}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={nextStep}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : step === totalSteps ? 'Go to Dashboard' : 'Continue'}
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
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  stepContainer: {
    padding: 20,
    minHeight: 400,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 24,
  },
  countryList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countryItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  countryCrisis: {
    fontSize: 12,
    color: '#64748b',
  },
  selectedIcon: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  medInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  medInput: {
    flex: 2,
  },
  doseInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  medDose: {
    fontSize: 12,
    color: '#64748b',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
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
  successContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    marginTop: 20,
  },
  successIcon: {
    fontSize: 48,
    color: '#3b82f6',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});