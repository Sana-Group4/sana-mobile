import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";
const screenWidth = Dimensions.get("window").width;

type RangeKey = "7D" | "30D" | "90D";
type MetricKey =
  | "steps_per_day"
  | "calories_per_day"
  | "sleep_hours_per_day"
  | "heart_rate_avg_per_day"
  | "weight_kg_per_day"
  | "oxygen_saturation_percent_per_day"
  | "blood_pressure_systolic_per_day"
  | "blood_pressure_diastolic_per_day"
  | "hrv_ms_per_day"
  | "active_minutes_per_day";

type BiometricVectorResponse = {
  user_id: number;
  biometric_type: string;
  t: string[];
  y: number[];
};

const rangeOptions: RangeKey[] = ["7D", "30D", "90D"];

const rangeToDays: Record<RangeKey, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

const metricMeta: Record<MetricKey, { title: string; unit: string; color: string }> = {
  steps_per_day: { title: "Steps", unit: "steps", color: "#2563eb" },
  calories_per_day: { title: "Calories", unit: "kcal", color: "#c2410c" },
  sleep_hours_per_day: { title: "Sleep", unit: "h", color: "#6d28d9" },
  heart_rate_avg_per_day: { title: "Heart Rate", unit: "bpm", color: "#166534" },
  weight_kg_per_day: { title: "Body Weight", unit: "kg", color: "#7c3aed" },
  oxygen_saturation_percent_per_day: { title: "Blood Oxygen", unit: "%", color: "#0f766e" },
  blood_pressure_systolic_per_day: { title: "BP Systolic", unit: "mmHg", color: "#be123c" },
  blood_pressure_diastolic_per_day: { title: "BP Diastolic", unit: "mmHg", color: "#9f1239" },
  hrv_ms_per_day: { title: "HRV", unit: "ms", color: "#1d4ed8" },
  active_minutes_per_day: { title: "Active Minutes", unit: "min", color: "#15803d" },
};

function buildSparseLabels(labels: string[], maxVisible: number): string[] {
  if (labels.length <= maxVisible) {
    return labels;
  }

  const sparse = labels.map(() => "");
  const lastIndex = labels.length - 1;
  const step = Math.max(1, Math.floor(lastIndex / (maxVisible - 1)));

  for (let i = 0; i < labels.length; i += step) {
    sparse[i] = labels[i] ?? "";
  }

  sparse[0] = labels[0] ?? "";
  sparse[lastIndex] = labels[lastIndex] ?? "";
  return sparse;
}

function buildRangeBounds(days: number): { start: string; end: string } {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  ).toISOString();

  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  ).toISOString();

  return { start, end };
}

function formatLabels(times: string[]): string[] {
  return times.map((iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

export default function ClientBiometricsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();

  const clientId = Number(params.clientId);
  const clientName = params.clientName || `Client #${params.clientId || "-"}`;

  const [selectedRange, setSelectedRange] = useState<RangeKey>("7D");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("steps_per_day");
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [series, setSeries] = useState<{ labels: string[]; values: number[] }>({ labels: ["No data"], values: [0] });

  const selectedDays = rangeToDays[selectedRange];
  const chartWidth = Math.max(screenWidth - 52, 280);

  const loadBiometrics = useCallback(async () => {
    if (!clientId || Number.isNaN(clientId)) {
      setErrorText("Invalid client ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText("");
    setNotAllowed(false);

    try {
      const token = await AsyncStorage.getItem("access_token");
      const { start, end } = buildRangeBounds(selectedDays);

      const query = new URLSearchParams({
        user_id: String(clientId),
        biometric_type: selectedMetric,
        start,
        end,
      });

      const response = await fetch(`${API_URL}/api/biometrics/vector?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data?.detail || "Failed to load biometric data";
        if (typeof detail === "string" && detail.toLowerCase().includes("has not granted biometric access")) {
          setNotAllowed(true);
          setErrorText("Client has not granted biometric access.");
        } else {
          setErrorText(detail);
        }
        setSeries({ labels: ["No data"], values: [0] });
        return;
      }

      const vector = data as BiometricVectorResponse;
      if (!Array.isArray(vector.t) || !Array.isArray(vector.y) || vector.t.length === 0 || vector.y.length === 0) {
        setSeries({ labels: ["No data"], values: [0] });
        return;
      }

      const rawLabels = formatLabels(vector.t);
      const maxVisible = rawLabels.length > 60 ? 5 : rawLabels.length > 20 ? 6 : 8;

      setSeries({
        labels: buildSparseLabels(rawLabels, maxVisible),
        values: vector.y.map((value) => Number(value) || 0),
      });
    } catch (error) {
      setErrorText("Network request failed while fetching biometrics.");
      setSeries({ labels: ["No data"], values: [0] });
    } finally {
      setLoading(false);
    }
  }, [clientId, selectedDays, selectedMetric]);

  useEffect(() => {
    void loadBiometrics();
  }, [loadBiometrics]);

  const metricInfo = useMemo(() => metricMeta[selectedMetric], [selectedMetric]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.replace("/tabs/coach/clients")} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Clients</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Client Biometrics</Text>
          <Text style={styles.headerSubtitle}>{clientName}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Metric</Text>
          <View style={styles.rowWrap}>
            {(Object.keys(metricMeta) as MetricKey[]).map((metric) => {
              const active = metric === selectedMetric;
              return (
                <Pressable
                  key={metric}
                  onPress={() => setSelectedMetric(metric)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{metricMeta[metric].title}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Range</Text>
          <View style={styles.rowWrap}>
            {rangeOptions.map((range) => {
              const active = range === selectedRange;
              return (
                <Pressable
                  key={range}
                  onPress={() => setSelectedRange(range)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{range}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>{metricInfo.title} Trend</Text>
            <Pressable onPress={() => void loadBiometrics()} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading biometric vectors...</Text>
            </View>
          ) : notAllowed ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Client has not granted biometric access yet.</Text>
            </View>
          ) : errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : (
            <>
              <LineChart
                data={{
                  labels: series.labels,
                  datasets: [
                    {
                      data: series.values.length > 0 ? series.values : [0],
                      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={chartWidth}
                height={230}
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: selectedMetric === "sleep_hours_per_day" ? 1 : 0,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: metricInfo.color,
                    fill: "#ffffff",
                  },
                  propsForBackgroundLines: {
                    stroke: "#e5e7eb",
                    strokeDasharray: "0",
                  },
                }}
                style={styles.chart}
                bezier
                withShadow={false}
                withOuterLines={false}
              />
              <Text style={styles.caption}>Unit: {metricInfo.unit}</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  scrollContent: {
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
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: "#1d4ed8",
  },
  chipText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#fff",
  },
  refreshButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    color: "#4b5563",
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  chart: {
    marginLeft: -14,
    borderRadius: 16,
    marginTop: 8,
  },
  caption: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 12,
  },
});
