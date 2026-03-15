import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';

const AlarmScreen: React.FC = () => {
  const [time, setTime] = useState(300); // 5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
    } else if (time === 0) {
      playAlarm();
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  async function playAlarm() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/alarm.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(300);
    if (sound) {
      sound.stopAsync();
    }
  };

  const addTime = (seconds: number) => {
    setTime((prev) => prev + seconds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep Timer</Text>
      <Text style={styles.timer}>{formatTime(time)}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleStart} disabled={isRunning}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePause} disabled={!isRunning}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.addTimeRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => addTime(60)}>
          <Text style={styles.addButtonText}>+1 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => addTime(300)}>
          <Text style={styles.addButtonText}>+5 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => addTime(600)}>
          <Text style={styles.addButtonText}>+10 min</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.instructions}>
        Set a timer to help you fall asleep. The alarm will play when the timer reaches zero.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTimeRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
  },
  addButtonText: {
    color: '#333',
    fontSize: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default AlarmScreen;