import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
    loadHealthSnapshot,
    openHealthConnectSettings,
    requestHealthPermissionsAndLoad,
    type HealthLoadState,
    type HealthSnapshot,
} from "../../utils/healthData";

const screenWidth = Dimensions.get("window").width;
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

type BackendSummary = {
  stepsTotal: number | null;
  caloriesTotal: number | null;
  sleepAverageHours: number | null;
  heartRateAverageBpm: number | null;
  activeMinutesTotal: number | null;
  weightLatestKg: number | null;
  oxygenLatestPercent: number | null;
  bloodPressureLatest: { systolic: number; diastolic: number } | null;
  hrvLatestMs: number | null;
};

const rangeOptions: RangeKey[] = ["7D", "30D", "90D"];

const rangeToDays: Record<RangeKey, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

const statePalette: Record<HealthLoadState, { background: string; text: string }> = {
  ready: { background: "#dbeafe", text: "#1e40af" },
  unsupported: { background: "#fee2e2", text: "#991b1b" },
  "provider-missing": { background: "#ffedd5", text: "#9a3412" },
  "provider-update-required": { background: "#fef3c7", text: "#92400e" },
  "permissions-required": { background: "#fef9c3", text: "#854d0e" },
  error: { background: "#fee2e2", text: "#991b1b" },
};

function formatInteger(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return Math.round(value).toLocaleString();
}

function formatDecimal(value: number | null, decimals = 1): string {
  if (value === null) {
    return "--";
  }

  return value.toFixed(decimals);
}

function toGoalPercent(value: number | null, goal: number): number {
  if (value === null || goal <= 0) {
    return 0;
  }

  const percent = Math.round((value / goal) * 100);
  return Math.max(0, Math.min(percent, 100));
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

function sumValues(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function averageValues(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function lastValue(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values[values.length - 1] ?? null;
}

function compactTrend(snapshot: HealthSnapshot | null): { labels: string[]; values: number[] } {
  if (!snapshot || snapshot.trend.values.length === 0) {
    return { labels: ["No data"], values: [0] };
  }

  const rawLabels = snapshot.trend.labels;
  const maxVisible = rawLabels.length > 60 ? 5 : rawLabels.length > 20 ? 6 : 8;
  const labels = buildSparseLabels(rawLabels, maxVisible);
  const values = snapshot.trend.values;

  return {
    labels,
    values,
  };
}

function shortSourceName(source: string): string {
  const parts = source.split(".");
  return parts[parts.length - 1] || source;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<RangeKey>("7D");
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loadState, setLoadState] = useState<HealthLoadState>("permissions-required");
  const [statusMessage, setStatusMessage] = useState("Syncing health data...");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [backendStepsSeries, setBackendStepsSeries] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [backendSummary, setBackendSummary] = useState<BackendSummary | null>(null);

  const selectedDays = rangeToDays[selectedRange];
  const chartSeries = useMemo(() => backendStepsSeries ?? compactTrend(snapshot), [backendStepsSeries, snapshot]);
  const chartWidth = Math.max(screenWidth - 56, 280);

  const metricCards = useMemo(
    () => [
      {
        key: "steps" as MetricKey,
        emoji: "STP",
        title: "Steps",
        value: formatInteger(backendSummary?.stepsTotal ?? snapshot?.steps ?? null),
        change: `${selectedDays}-day total`,
        accent: "#dbeafe",
        titleColor: "#1e3a8a",
      },
      {
        key: "calories" as MetricKey,
        emoji: "CAL",
        title: "Calories Burned",
        value:
          (backendSummary?.caloriesTotal ?? snapshot?.totalCaloriesKcal ?? null) === null
            ? "--"
            : `${formatInteger(backendSummary?.caloriesTotal ?? snapshot?.totalCaloriesKcal ?? null)} kcal`,
        change: "From daily activity",
        accent: "#fff7ed",
        titleColor: "#9a3412",
      },
      {
        key: "sleep" as MetricKey,
        emoji: "SLP",
        title: "Sleep Avg",
        value:
          (backendSummary?.sleepAverageHours ?? snapshot?.sleepAverageHours ?? null) === null
            ? "--"
            : `${formatDecimal(backendSummary?.sleepAverageHours ?? snapshot?.sleepAverageHours ?? null)} h`,
        change: `${selectedDays}-day average`,
        accent: "#ede9fe",
        titleColor: "#5b21b6",
      },
      {
        key: "heartRate" as MetricKey,
        emoji: "HR",
        title: "Avg Heart Rate",
        value:
          (backendSummary?.heartRateAverageBpm ?? snapshot?.averageHeartRateBpm ?? null) === null
            ? "--"
            : `${formatInteger(backendSummary?.heartRateAverageBpm ?? snapshot?.averageHeartRateBpm ?? null)} bpm`,
        change: "From connected sensors",
        accent: "#dcfce7",
        titleColor: "#166534",
      },
    ],
    [backendSummary, selectedDays, snapshot]
  );

  const recoveryBreakdown = useMemo(
    () => [
      {
        label: "Sleep target",
        value: toGoalPercent(backendSummary?.sleepAverageHours ?? snapshot?.sleepAverageHours ?? null, 8),
        color: "#2563eb",
      },
      {
        label: "Hydration target",
        value: toGoalPercent(snapshot?.hydrationLiters ?? null, 2.7),
        color: "#06b6d4",
      },
      {
        label: "Activity target",
        value: toGoalPercent(backendSummary?.activeMinutesTotal ?? snapshot?.activeMinutes ?? null, 45),
        color: "#16a34a",
      },
    ],
    [backendSummary, snapshot]
  );

  const latestVitals = useMemo(
    () => [
      {
        key: "bodyWeight" as MetricKey,
        label: "Body weight",
        value:
          (backendSummary?.weightLatestKg ?? snapshot?.weightKg ?? null) === null
            ? "No data"
            : `${formatDecimal(backendSummary?.weightLatestKg ?? snapshot?.weightKg ?? null)} kg`,
        note: "Latest entry",
      },
      {
        key: "bloodOxygen" as MetricKey,
        label: "Blood oxygen",
        value:
          (backendSummary?.oxygenLatestPercent ?? snapshot?.oxygenSaturationPercent ?? null) === null
            ? "No data"
            : `${formatInteger(backendSummary?.oxygenLatestPercent ?? snapshot?.oxygenSaturationPercent ?? null)}%`,
        note: "Latest entry",
      },
      {
        key: "bloodPressure" as MetricKey,
        label: "Blood pressure",
        value: (() => {
          const bloodPressure = backendSummary?.bloodPressureLatest ?? snapshot?.bloodPressure ?? null;
          return bloodPressure
            ? `${bloodPressure.systolic}/${bloodPressure.diastolic}`
            : "No data";
        })(),
        note: "mmHg",
      },
      {
        key: "hrv" as MetricKey,
        label: "HRV",
        value:
          (backendSummary?.hrvLatestMs ?? snapshot?.hrvMs ?? null) === null
            ? "No data"
            : `${formatInteger(backendSummary?.hrvLatestMs ?? snapshot?.hrvMs ?? null)} ms`,
        note: "RMSSD",
      },
      {
        key: "activeMinutes" as MetricKey,
        label: "Active minutes",
        value:
          (backendSummary?.activeMinutesTotal ?? snapshot?.activeMinutes ?? null) === null
            ? "No data"
            : `${formatInteger(backendSummary?.activeMinutesTotal ?? snapshot?.activeMinutes ?? null)} min`,
        note: "Exercise sessions",
      },
    ],
    [backendSummary, snapshot]
  );

  const fetchCurrentUserId = useCallback(async (token: string): Promise<number | null> => {
    const accountResponse = await fetch(`${API_URL}/api/account`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!accountResponse.ok) {
      return null;
    }

    const account = await accountResponse.json();
    return typeof account?.id === "number" ? account.id : null;
  }, []);

  const fetchBackendVector = useCallback(
    async (
      token: string,
      userId: number,
      biometricType: string,
      strategy: "sum" | "avg" | "last" | "max"
    ): Promise<{ times: string[]; values: number[] } | null> => {
      const { start, end } = buildRangeBounds(selectedDays);
      const query = new URLSearchParams({
        user_id: String(userId),
        biometric_type: biometricType,
        start,
        end,
      });

      const response = await fetch(`${API_URL}/api/biometrics/vector?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data?.t) || !Array.isArray(data?.y) || data.t.length === 0) {
        return null;
      }

      const aggregated = aggregateDailySeries(data.t, data.y, strategy);
      if (aggregated.times.length === 0) {
        return null;
      }

      return {
        times: aggregated.times.slice(-selectedDays),
        values: aggregated.values.slice(-selectedDays),
      };
    },
    [selectedDays]
  );

  const reloadBackendData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setBackendStepsSeries(null);
        setBackendSummary(null);
        return;
      }

      const userId = await fetchCurrentUserId(token);
      if (!userId) {
        setBackendStepsSeries(null);
        setBackendSummary(null);
        return;
      }

      const [
        steps,
        calories,
        sleep,
        heartRate,
        weight,
      ] = await Promise.all([
        fetchBackendVector(token, userId, "steps_per_day", "max"),
        fetchBackendVector(token, userId, "calories_per_day", "sum"),
        fetchBackendVector(token, userId, "sleep_hours_per_day", "avg"),
        fetchBackendVector(token, userId, "heart_rate_avg_per_day", "avg"),
        fetchBackendVector(token, userId, "weight_kg", "last"),
      ]);

      if (steps && steps.times.length > 0) {
        const rawLabels = formatLabels(steps.times);
        const maxVisible = rawLabels.length > 60 ? 5 : rawLabels.length > 20 ? 6 : 8;
        setBackendStepsSeries({
          labels: buildSparseLabels(rawLabels, maxVisible),
          values: steps.values,
        });
      } else {
        setBackendStepsSeries(null);
      }

      setBackendSummary({
        stepsTotal: sumValues(steps?.values ?? []),
        caloriesTotal: sumValues(calories?.values ?? []),
        sleepAverageHours: averageValues(sleep?.values ?? []),
        heartRateAverageBpm: averageValues(heartRate?.values ?? []),
        activeMinutesTotal: null,
        weightLatestKg: lastValue(weight?.values ?? []),
        oxygenLatestPercent: null,
        bloodPressureLatest: null,
        hrvLatestMs: null,
      });
    } catch {
      setBackendStepsSeries(null);
      setBackendSummary(null);
    }
  }, [fetchBackendVector, fetchCurrentUserId]);

  const loadDeviceData = useCallback(
    async (promptPermissions: boolean, shouldSyncToBackend: boolean) => {
      if (promptPermissions) {
        setIsConnecting(true);
      } else {
        setIsLoading(true);
      }

      const result = promptPermissions
        ? await requestHealthPermissionsAndLoad(selectedDays, shouldSyncToBackend)
        : await loadHealthSnapshot(selectedDays, shouldSyncToBackend);

      setLoadState(result.state);
      setStatusMessage(result.message);
      setSnapshot(result.snapshot ?? null);

      if (shouldSyncToBackend && result.state === "ready") {
        await reloadBackendData();
      }

      setIsLoading(false);
      setIsConnecting(false);
    },
    [reloadBackendData, selectedDays]
  );

  useEffect(() => {
    void loadDeviceData(false, false);
    void reloadBackendData();
  }, [loadDeviceData, reloadBackendData]);

  const stateColor = statePalette[loadState];
  const canConnect =
    loadState === "permissions-required" ||
    loadState === "unsupported" ||
    loadState === "error";
  const canSync = loadState === "ready";

  const canOpenProvider =
    loadState === "provider-missing" || loadState === "provider-update-required";

  const handleOpenProviderSettings = async () => {
    await openHealthConnectSettings();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Health Analytics</Text>
          <Text style={styles.pageSubtitle}>
            Live phone and wearable data from Health Connect.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => void reloadBackendData()}>
            <Text style={styles.actionButtonText}>Reload Backend</Text>
          </Pressable>

          {canConnect && (
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => void loadDeviceData(true, false)}
              disabled={isConnecting}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                {isConnecting ? "Connecting..." : "Connect Health Data"}
              </Text>
            </Pressable>
          )}

          {canSync && (
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => void loadDeviceData(false, true)}
              disabled={isLoading}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                {isLoading ? "Syncing..." : "Sync"}
              </Text>
            </Pressable>
          )}

          {canOpenProvider && (
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleOpenProviderSettings}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                Open Health Connect
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.statusBanner, { backgroundColor: stateColor.background }]}>
          <Text style={[styles.statusText, { color: stateColor.text }]}>{statusMessage}</Text>
        </View>

        <View style={styles.rangeRow}>
          {rangeOptions.map((range) => {
            const isActive = selectedRange === range;

            return (
              <Pressable
                key={range}
                onPress={() => setSelectedRange(range)}
                style={[styles.rangeChip, isActive && styles.rangeChipActive]}
              >
                <Text style={[styles.rangeChipText, isActive && styles.rangeChipTextActive]}>
                  {range}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading && !snapshot && (
          <View style={styles.loadingPanel}>
            <ActivityIndicator size="small" color="#1d4ed8" />
            <Text style={styles.loadingText}>Loading health records...</Text>
          </View>
        )}

        <View style={styles.metricsGrid}>
          {metricCards.map((metric) => (
            <Pressable
              key={metric.title}
              onPress={() =>
                router.push({
                  pathname: "/tabs/client/analytics-metric",
                  params: {
                    metric: metric.key,
                    range: selectedRange,
                  },
                })
              }
              style={[styles.metricCard, { backgroundColor: metric.accent }]}
            >
              <Text style={styles.metricEmoji}>{metric.emoji}</Text>
              <Text style={[styles.metricTitle, { color: metric.titleColor }]}>{metric.title}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricChange}>{metric.change}</Text>
              <Text style={styles.metricOpenHint}>Tap to open chart</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Steps Trend</Text>
          <Text style={styles.panelSubtitle}>
            {backendStepsSeries
              ? "Loaded from backend vector database"
              : "Aggregated from phone and connected wearables"}
          </Text>
          <LineChart
            data={{
              labels: chartSeries.labels,
              datasets: [
                {
                  data: chartSeries.values,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  strokeWidth: 3,
                },
              ],
            }}
            width={chartWidth}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#1d4ed8",
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
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Recovery Breakdown</Text>
          {recoveryBreakdown.map((item) => (
            <View key={item.label} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{item.label}</Text>
                <Text style={styles.progressValue}>{item.value}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Latest Health Readings</Text>
          {latestVitals.map((vital) => (
            <Pressable
              key={vital.label}
              style={styles.vitalRow}
              onPress={() =>
                router.push({
                  pathname: "/tabs/client/analytics-metric",
                  params: {
                    metric: vital.key,
                    range: selectedRange,
                  },
                })
              }
            >
              <View>
                <Text style={styles.vitalLabel}>{vital.label}</Text>
                <Text style={styles.vitalNote}>{vital.note}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.vitalValue}>{vital.value}</Text>
                <Text style={styles.vitalOpenHint}>Tap to view trend</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Data Sources</Text>
          {snapshot?.dataOrigins && snapshot.dataOrigins.length > 0 ? (
            <View style={styles.sourceWrap}>
              {snapshot.dataOrigins.map((source) => (
                <View key={source} style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>{shortSourceName(source)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No source metadata returned yet for this time range.
            </Text>
          )}
        </View>
        {/* Button to navigate to manual input page */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Manual Health & Workout Entry</Text>
          <Pressable
            style={[styles.actionButton, styles.actionButtonPrimary, { alignSelf: 'flex-start', marginTop: 8 }]}
            onPress={() => router.push('./manual-input')}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>Input Data Manually</Text>
          </Pressable>
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
    paddingTop: 22,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  rangeRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
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
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#e5e7eb",
  },
  actionButtonPrimary: {
    backgroundColor: "#1d4ed8",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  actionButtonPrimaryText: {
    color: "#ffffff",
  },
  statusBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  loadingPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: "#4b5563",
    fontSize: 13,
  },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginRight: 10,
  },
  rangeChipActive: {
    backgroundColor: "#1d4ed8",
  },
  rangeChipText: {
    color: "#374151",
    fontWeight: "600",
  },
  rangeChipTextActive: {
    color: "#ffffff",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  metricCard: {
    width: (screenWidth - 46) / 2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  metricEmoji: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  metricChange: {
    fontSize: 12,
    color: "#4b5563",
  },
  metricOpenHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#1d4ed8",
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
  },
  panelSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 10,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
  progressItem: {
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  vitalRow: {
    marginTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vitalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  vitalNote: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  vitalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  vitalOpenHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  sourceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  sourceChip: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  emptyText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 13,
  },
  diagRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  diagLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  diagStatus: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  diagDetail: {
    marginTop: 2,
    fontSize: 12,
    color: "#4b5563",
  },
});
