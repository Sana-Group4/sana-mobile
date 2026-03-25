import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type ManualBiometricData = {
  steps: string;
  calories: string;
  heartRate: string;
  bodyWeight: string;
  bloodOxygen: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  hrv: string;
};

type ManualEntry = ManualBiometricData & {
  timestamp: string;
};

type VectorPayload = {
  user_id: number;
  biometric_type: string;
  unit: string;
  times: string[];
  values: number[];
};

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

const initialFormState: ManualBiometricData = {
  steps: "",
  calories: "",
  heartRate: "",
  bodyWeight: "",
  bloodOxygen: "",
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  hrv: "",
};

export default function ManualInputScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<ManualBiometricData>(initialFormState);
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasPickedDate, setHasPickedDate] = useState(false);
  const [hasPickedTime, setHasPickedTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const updateField = (field: keyof ManualBiometricData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hasAnyMetricValue = Object.values(formData).some((value) => value.trim().length > 0);

  const hasRequiredTimestamp = hasPickedDate && hasPickedTime;

  const formatDate = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (value: Date): string => {
    const hour = String(value.getHours()).padStart(2, "0");
    const minute = String(value.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  const buildEntryTimestampIso = (): string => {
    const merged = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );

    return merged.toISOString();
  };

  const parseNumber = (value: string): number | null => {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "set" && value) {
      setSelectedDate(value);
      setHasPickedDate(true);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "set" && value) {
      setSelectedTime(value);
      setHasPickedTime(true);
    }
  };

  const fetchCurrentUserId = async (token: string): Promise<number | null> => {
    try {
      const response = await fetch(`${API_URL}/api/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return typeof data?.id === "number" ? data.id : null;
    } catch {
      return null;
    }
  };

  const buildPayloads = (userId: number, timestampIso: string): VectorPayload[] => {
    const metrics: Array<{ field: keyof ManualBiometricData; type: string; unit: string }> = [
      { field: "steps", type: "steps_per_day", unit: "steps" },
      { field: "calories", type: "calories_per_day", unit: "kcal" },
      { field: "heartRate", type: "heart_rate_avg_per_day", unit: "bpm" },
      { field: "bodyWeight", type: "weight_kg", unit: "kg" },
    ];

    const payloads: VectorPayload[] = [];

    for (const metric of metrics) {
      const value = parseNumber(formData[metric.field]);
      if (value === null) {
        continue;
      }

      payloads.push({
        user_id: userId,
        biometric_type: metric.type,
        unit: metric.unit,
        times: [timestampIso],
        values: [value],
      });
    }

    return payloads;
  };

  const submitPayloads = async (token: string, payloads: VectorPayload[]): Promise<void> => {
    for (const payload of payloads) {
      const response = await fetch(`${API_URL}/api/biometrics/vector`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to save manual data to backend.");
      }
    }
  };

  const handleAddEntry = async () => {
    if (!hasRequiredTimestamp) {
      setValidationError("Date and time are required. Please use the pickers.");
      return;
    }

    if (!hasAnyMetricValue) {
      setValidationError("Enter at least one health metric value.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    const timestampIso = buildEntryTimestampIso();
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      setValidationError("You need to log in again before saving manual data.");
      setIsSubmitting(false);
      return;
    }

    const userId = await fetchCurrentUserId(token);
    if (!userId) {
      setValidationError("Unable to resolve account ID for manual data upload.");
      setIsSubmitting(false);
      return;
    }

    const payloads = buildPayloads(userId, timestampIso);
    if (payloads.length === 0) {
      setValidationError("No valid metric values found.");
      setIsSubmitting(false);
      return;
    }

    try {
      await submitPayloads(token, payloads);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Manual upload failed.";
      setValidationError(message);
      setIsSubmitting(false);
      return;
    }

    const nextEntry: ManualEntry = {
      ...formData,
      timestamp: `${formatDate(selectedDate)} ${formatTime(selectedTime)}`,
    };

    setEntries((prev) => [nextEntry, ...prev]);
    setFormData(initialFormState);
    setHasPickedDate(false);
    setHasPickedTime(false);
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>Manual Biometrics Entry</Text>
          <Text style={styles.subtitle}>
            Add manual values for key health metrics when device sync is unavailable.
          </Text>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Biometric Inputs</Text>

            <View style={styles.rowFields}>
              <View style={[styles.fieldBlock, styles.rowInput]}>
                <Text style={styles.label}>Date *</Text>
                <Pressable style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.pickerButtonText}>
                    {hasPickedDate ? formatDate(selectedDate) : "Select date"}
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.fieldBlock, styles.rowInput]}>
                <Text style={styles.label}>Time *</Text>
                <Pressable style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.pickerButtonText}>
                    {hasPickedTime ? formatTime(selectedTime) : "Select time"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={selectedDate}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                mode="time"
                value={selectedTime}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
              />
            )}

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Steps</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8500"
                keyboardType="numeric"
                value={formData.steps}
                onChangeText={(value) => updateField("steps", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 430"
                keyboardType="numeric"
                value={formData.calories}
                onChangeText={(value) => updateField("calories", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 72"
                keyboardType="numeric"
                value={formData.heartRate}
                onChangeText={(value) => updateField("heartRate", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Body Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 68.5"
                keyboardType="numeric"
                value={formData.bodyWeight}
                onChangeText={(value) => updateField("bodyWeight", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Blood Oxygen (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 98"
                keyboardType="numeric"
                value={formData.bloodOxygen}
                onChangeText={(value) => updateField("bloodOxygen", value)}
              />
            </View>

            <Text style={styles.rowLabel}>Blood Pressure (mmHg)</Text>
            <View style={styles.rowFields}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Systolic"
                keyboardType="numeric"
                value={formData.bloodPressureSystolic}
                onChangeText={(value) => updateField("bloodPressureSystolic", value)}
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Diastolic"
                keyboardType="numeric"
                value={formData.bloodPressureDiastolic}
                onChangeText={(value) => updateField("bloodPressureDiastolic", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>HRV (ms)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 42"
                keyboardType="numeric"
                value={formData.hrv}
                onChangeText={(value) => updateField("hrv", value)}
              />
            </View>

            <Pressable
              style={[
                styles.saveButton,
                (!hasAnyMetricValue || !hasRequiredTimestamp || isSubmitting) && styles.saveButtonDisabled,
              ]}
              onPress={() => void handleAddEntry()}
              disabled={!hasAnyMetricValue || !hasRequiredTimestamp || isSubmitting}
            >
              <Text style={styles.saveButtonText}>{isSubmitting ? "Saving..." : "Add Manual Entry"}</Text>
            </Pressable>

            {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent Manual Entries</Text>
            {entries.length === 0 ? (
              <Text style={styles.emptyText}>No manual entries yet.</Text>
            ) : (
              entries.map((entry, index) => (
                <View key={`${entry.timestamp}-${index}`} style={styles.entryCard}>
                  <Text style={styles.entryTime}>{entry.timestamp}</Text>
                  <Text style={styles.entryLine}>Steps: {entry.steps || "--"}</Text>
                  <Text style={styles.entryLine}>Calories: {entry.calories || "--"} kcal</Text>
                  <Text style={styles.entryLine}>Heart Rate: {entry.heartRate || "--"} bpm</Text>
                  <Text style={styles.entryLine}>Body Weight: {entry.bodyWeight || "--"} kg</Text>
                  <Text style={styles.entryLine}>Blood Oxygen: {entry.bloodOxygen || "--"}%</Text>
                  <Text style={styles.entryLine}>
                    Blood Pressure: {entry.bloodPressureSystolic || "--"}/{entry.bloodPressureDiastolic || "--"}
                  </Text>
                  <Text style={styles.entryLine}>HRV: {entry.hrv || "--"} ms</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 80,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: "#4b5563",
    lineHeight: 19,
    fontSize: 13,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  fieldBlock: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "600",
  },
  rowLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#ffffff",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#111827",
  },
  saveButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
  },
  entryCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  entryTime: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: "600",
  },
  entryLine: {
    fontSize: 13,
    color: "#111827",
    marginBottom: 2,
  },
});
