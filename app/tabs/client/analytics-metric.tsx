import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { loadHealthSnapshot, type HealthSnapshot } from "../../utils/healthData";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

type RangeKey = "7D" | "30D" | "90D";
type MetricKey =
  | "steps"
  | "calories"
  | "sleep"
  | "heartRate"
  | "bodyWeight"
  | "bloodOxygen"
  | "bloodPressure"
  | "hrv"
  | "activeMinutes";

const screenWidth = Dimensions.get("window").width;

const rangeToDays: Record<RangeKey, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

const metricToBackendType: Record<MetricKey, string | null> = {
  steps: "steps_per_day",
  calories: "calories_per_day",
  sleep: "sleep_hours_per_day",
  heartRate: "heart_rate_avg_per_day",
  bodyWeight: "weight_kg",
  bloodOxygen: null,
  bloodPressure: null,
  hrv: null,
  activeMinutes: null,
};

type BiometricVectorResponse = {
  t: string[];
  y: number[];
};

const metricMeta: Record<MetricKey, { title: string; suffix: string; color: string; accent: string }> = {
  steps: {
    title: "Steps",
    suffix: "",
    color: "#1d4ed8",
    accent: "#dbeafe",
  },
  calories: {
    title: "Calories Burned",
    suffix: " kcal",
    color: "#c2410c",
    accent: "#ffedd5",
  },
  sleep: {
    title: "Sleep Average",
    suffix: " h",
    color: "#6d28d9",
    accent: "#ede9fe",
  },
  heartRate: {
    title: "Average Heart Rate",
    suffix: " bpm",
    color: "#166534",
    accent: "#dcfce7",
  },
  bodyWeight: {
    title: "Body Weight",
    suffix: " kg",
    color: "#7c3aed",
    accent: "#ede9fe",
  },
  bloodOxygen: {
    title: "Blood Oxygen",
    suffix: "%",
    color: "#0f766e",
    accent: "#ccfbf1",
  },
  bloodPressure: {
    title: "Blood Pressure",
    suffix: " mmHg",
    color: "#9f1239",
    accent: "#ffe4e6",
  },
  hrv: {
    title: "HRV",
    suffix: " ms",
    color: "#1d4ed8",
    accent: "#dbeafe",
  },
  activeMinutes: {
    title: "Active Minutes",
    suffix: " min",
    color: "#166534",
    accent: "#dcfce7",
  },
};

function toMetricKey(value: string | string[] | undefined): MetricKey {
  if (
    value === "steps" ||
    value === "calories" ||
    value === "sleep" ||
    value === "heartRate" ||
    value === "bodyWeight" ||
    value === "bloodOxygen" ||
    value === "bloodPressure" ||
    value === "hrv" ||
    value === "activeMinutes"
  ) {
    return value;
  }
  return "steps";
}

function toRangeKey(value: string | string[] | undefined): RangeKey {
  if (value === "7D" || value === "30D" || value === "90D") {
    return value;
  }
  return "7D";
}

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
      0,
    ),
  ).toISOString();

  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  ).toISOString();

  return { start, end };
}

function formatLabels(times: string[]): string[] {
  return times.map((iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

function aggregateDailySeries(
  times: string[],
  values: unknown[],
  strategy: "sum" | "avg" | "last" | "max"
): { times: string[]; values: number[] } {
  const buckets = new Map<string, { sum: number; count: number; last: number; max: number }>();

  for (let i = 0; i < times.length; i += 1) {
    const iso = times[i];
    const numeric = Number(values[i]);
    if (!iso || Number.isNaN(numeric)) {
      continue;
    }

    const date = new Date(iso);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.sum += numeric;
      existing.count += 1;
      existing.last = numeric;
      existing.max = Math.max(existing.max, numeric);
    } else {
      buckets.set(key, { sum: numeric, count: 1, last: numeric, max: numeric });
    }
  }

  const keys = Array.from(buckets.keys()).sort();
  const aggregatedTimes = keys.map((key) => `${key}T00:00:00.000Z`);
  const aggregatedValues = keys.map((key) => {
    const bucket = buckets.get(key)!;
    if (strategy === "avg") {
      return bucket.sum / Math.max(bucket.count, 1);
    }
    if (strategy === "last") {
      return bucket.last;
    }
    if (strategy === "max") {
      return bucket.max;
    }
    return bucket.sum;
  });

  return {
    times: aggregatedTimes,
    values: aggregatedValues,
  };
}

function aggregationStrategy(metric: MetricKey): "sum" | "avg" | "last" | "max" {
  if (metric === "steps" || metric === "calories" || metric === "activeMinutes") {
    return "max";
  }

  if (metric === "bloodPressure") {
    return "last";
  }

  return "avg";
}

function formatValue(metric: MetricKey, snapshot: HealthSnapshot | null): string {
  if (!snapshot) {
    return "--";
  }

  switch (metric) {
    case "steps":
      return snapshot.steps === null ? "--" : Math.round(snapshot.steps).toLocaleString();
    case "calories":
      return snapshot.totalCaloriesKcal === null
        ? "--"
        : Math.round(snapshot.totalCaloriesKcal).toLocaleString();
    case "sleep":
      return snapshot.sleepAverageHours === null ? "--" : snapshot.sleepAverageHours.toFixed(1);
    case "heartRate":
      return snapshot.averageHeartRateBpm === null
        ? "--"
        : Math.round(snapshot.averageHeartRateBpm).toLocaleString();
    case "bodyWeight":
      return snapshot.weightKg === null ? "--" : snapshot.weightKg.toFixed(1);
    case "bloodOxygen":
      return snapshot.oxygenSaturationPercent === null
        ? "--"
        : Math.round(snapshot.oxygenSaturationPercent).toLocaleString();
    case "bloodPressure":
      return snapshot.bloodPressure
        ? `${Math.round(snapshot.bloodPressure.systolic)}/${Math.round(snapshot.bloodPressure.diastolic)}`
        : "--";
    case "hrv":
      return snapshot.hrvMs === null ? "--" : Math.round(snapshot.hrvMs).toLocaleString();
    case "activeMinutes":
      return snapshot.activeMinutes === null ? "--" : Math.round(snapshot.activeMinutes).toLocaleString();
    default:
      return "--";
  }
}

function buildMetricSeries(metric: MetricKey, snapshot: HealthSnapshot | null): { labels: string[]; values: number[] } {
  if (!snapshot || snapshot.trend.values.length === 0) {
    return { labels: ["No data"], values: [0] };
  }

  const rawLabels = snapshot.trend.labels;
  const maxVisible = rawLabels.length > 60 ? 5 : rawLabels.length > 20 ? 6 : 8;
  const labels = buildSparseLabels(rawLabels, maxVisible);
  const base = snapshot.trend.values;

  if (metric === "steps") {
    return { labels, values: base };
  }

  if (metric === "calories") {
    const total = snapshot.totalCaloriesKcal ?? 0;
    const stepTotal = base.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
      return { labels, values: new Array(base.length).fill(0) };
    }

    if (stepTotal <= 0) {
      const even = total / Math.max(base.length, 1);
      return { labels, values: base.map(() => Math.round(even)) };
    }

    return {
      labels,
      values: base.map((value) => Math.round((value / stepTotal) * total)),
    };
  }

  if (metric === "sleep") {
    const avgSleep = snapshot.sleepAverageHours ?? 0;
    return { labels, values: base.map(() => Number(avgSleep.toFixed(2))) };
  }

  if (metric === "bodyWeight") {
    const weight = snapshot.weightKg ?? 0;
    return { labels, values: base.map(() => Number(weight.toFixed(1))) };
  }

  if (metric === "bloodOxygen") {
    const oxygen = snapshot.oxygenSaturationPercent ?? 0;
    return { labels, values: base.map(() => Math.round(oxygen)) };
  }

  if (metric === "bloodPressure") {
    const systolic = snapshot.bloodPressure?.systolic ?? 0;
    return { labels, values: base.map(() => Math.round(systolic)) };
  }

  if (metric === "hrv") {
    const hrv = snapshot.hrvMs ?? 0;
    return { labels, values: base.map(() => Math.round(hrv)) };
  }

  if (metric === "activeMinutes") {
    const minutes = snapshot.activeMinutes ?? 0;
    return { labels, values: base.map(() => Math.round(minutes)) };
  }

  const avgHeartRate = snapshot.averageHeartRateBpm ?? 0;
  return { labels, values: base.map(() => Math.round(avgHeartRate)) };
}

export default function AnalyticsMetricScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ metric?: string; range?: string }>();
  const metric = toMetricKey(params.metric);
  const range = toRangeKey(params.range);
  const days = rangeToDays[range];

  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [backendSeries, setBackendSeries] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [snapshotResult, backendResult] = await Promise.all([
        loadHealthSnapshot(days, false),
        (async (): Promise<{ labels: string[]; values: number[] } | null> => {
          try {
            const token = await AsyncStorage.getItem("access_token");
            if (!token) {
              return null;
            }

            const accountResponse = await fetch(`${API_URL}/api/account`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!accountResponse.ok) {
              return null;
            }

            const account = await accountResponse.json();
            if (typeof account?.id !== "number") {
              return null;
            }

            const { start, end } = buildRangeBounds(days);
            const backendType = metricToBackendType[metric];
            if (!backendType) {
              return null;
            }

            const query = new URLSearchParams({
              user_id: String(account.id),
              biometric_type: backendType,
              start,
              end,
            });

            const vectorResponse = await fetch(`${API_URL}/api/biometrics/vector?${query.toString()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!vectorResponse.ok) {
              return null;
            }

            const vector = (await vectorResponse.json()) as BiometricVectorResponse;
            if (!Array.isArray(vector.t) || !Array.isArray(vector.y) || vector.t.length === 0) {
              return null;
            }

            const aggregated = aggregateDailySeries(
              vector.t,
              vector.y,
              aggregationStrategy(metric),
            );
            if (aggregated.times.length === 0) {
              return null;
            }

            const limitedTimes = aggregated.times.slice(-days);
            const limitedValues = aggregated.values.slice(-days);

            const rawLabels = formatLabels(limitedTimes);
            const maxVisible = rawLabels.length > 60 ? 5 : rawLabels.length > 20 ? 6 : 8;

            return {
              labels: buildSparseLabels(rawLabels, maxVisible),
              values: limitedValues,
            };
          } catch {
            return null;
          }
        })(),
      ]);

      setSnapshot(snapshotResult.snapshot ?? null);
      setBackendSeries(backendResult);
      setIsLoading(false);
    };

    void load();
  }, [days, metric]);

  const meta = metricMeta[metric];
  const chartData = useMemo(
    () => backendSeries ?? buildMetricSeries(metric, snapshot),
    [backendSeries, metric, snapshot],
  );
  const headlineValue = formatValue(metric, snapshot);
  const chartWidth = Math.max(screenWidth - 48, 280);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/tabs/client/analytics") }>
          <Text style={styles.backButtonText}>Back to analytics</Text>
        </Pressable>

        <View style={[styles.heroCard, { backgroundColor: meta.accent }]}> 
          <Text style={styles.heroTitle}>{meta.title}</Text>
          <Text style={styles.heroValue}>
            {headlineValue}
            {headlineValue === "--" ? "" : meta.suffix}
          </Text>
          <Text style={styles.heroSubtitle}>Detailed {range} trend view</Text>
        </View>

        <View style={styles.chartPanel}>
          <Text style={styles.chartTitle}>{meta.title} Trend</Text>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={meta.color} />
              <Text style={styles.loadingText}>Loading chart...</Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.values.length > 0 ? chartData.values : [0],
                    color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
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
                decimalPlaces: metric === "sleep" || metric === "bodyWeight" ? 1 : 0,
                color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: meta.color,
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
          )}
          <Text style={styles.chartCaption}>
            {backendSeries
              ? `Data source: backend vector records for ${range}.`
              : `Data source: local sync estimate for ${range} when backend records are unavailable.`}
          </Text>
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
  heroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  heroValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },
  heroSubtitle: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 13,
  },
  chartPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
  },
  loadingText: {
    fontSize: 13,
    color: "#4b5563",
  },
  chart: {
    marginLeft: -14,
    borderRadius: 16,
  },
  chartCaption: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
  },
});
