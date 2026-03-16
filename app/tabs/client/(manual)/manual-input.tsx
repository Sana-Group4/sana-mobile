import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const initialManualData = {
  weight: '',
  sleep: '',
  steps: '',
  calories: '',
  workoutType: '',
  workoutDuration: '',
};

export default function ManualInputScreen() {
  const [manualData, setManualData] = useState(initialManualData);
  const [manualEntries, setManualEntries] = useState<any[]>([]);

  const handleManualChange = (field: string, value: string) => {
    setManualData((prev) => ({ ...prev, [field]: value }));
  };

  const handleManualSubmit = () => {
    setManualEntries((prev) => [manualData, ...prev]);
    setManualData(initialManualData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Manual Health & Workout Entry</Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: '100%' }}
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={manualData.weight}
            onChangeText={(v) => handleManualChange('weight', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Sleep (h)"
            keyboardType="numeric"
            value={manualData.sleep}
            onChangeText={(v) => handleManualChange('sleep', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Steps"
            keyboardType="numeric"
            value={manualData.steps}
            onChangeText={(v) => handleManualChange('steps', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Calories"
            keyboardType="numeric"
            value={manualData.calories}
            onChangeText={(v) => handleManualChange('calories', v)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            style={styles.input}
            placeholder="Workout Type"
            value={manualData.workoutType}
            onChangeText={(v) => handleManualChange('workoutType', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Workout Duration (min)"
            keyboardType="numeric"
            value={manualData.workoutDuration}
            onChangeText={(v) => handleManualChange('workoutDuration', v)}
          />
        </View>
        <Pressable style={styles.button} onPress={handleManualSubmit}>
          <Text style={styles.buttonText}>Add Entry</Text>
        </Pressable>
      </KeyboardAvoidingView>
      {manualEntries.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subtitle}>Manual Entries</Text>
          {manualEntries.map((entry, idx) => (
            <View key={idx} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, gap: 8 }}>
              <Text style={styles.label}>Weight: <Text style={styles.value}>{entry.weight}</Text></Text>
              <Text style={styles.label}>Sleep: <Text style={styles.value}>{entry.sleep}</Text></Text>
              <Text style={styles.label}>Steps: <Text style={styles.value}>{entry.steps}</Text></Text>
              <Text style={styles.label}>Calories: <Text style={styles.value}>{entry.calories}</Text></Text>
              <Text style={styles.label}>Workout: <Text style={styles.value}>{entry.workoutType}</Text></Text>
              <Text style={styles.label}>Duration: <Text style={styles.value}>{entry.workoutDuration}</Text></Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f3f6fb',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4b5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    minWidth: 90,
    fontSize: 14,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  label: {
    fontWeight: '500',
    color: '#374151',
  },
  value: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});
