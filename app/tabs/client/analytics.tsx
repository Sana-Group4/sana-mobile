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
// Manual input state for health and workout data
const initialManualData = {
  weight: '',
  sleep: '',
  steps: '',
  calories: '',
  workoutType: '',
  workoutDuration: '',
};
  // Manual input state

  const router = useRouter();

const screenWidth = Dimensions.get("window").width;

type RangeKey = "7D" | "30D" | "90D";

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

function compactTrend(snapshot: HealthSnapshot | null): { labels: string[]; values: number[] } {
  if (!snapshot || snapshot.trend.values.length === 0) {
    return { labels: ["No data"], values: [0] };
  }

  if (snapshot.trend.values.length <= 10) {
    return snapshot.trend;
  }

  const stride = Math.ceil(snapshot.trend.values.length / 10);
  const labels: string[] = [];
  const values: number[] = [];

  snapshot.trend.values.forEach((value, index) => {
    const isStridePoint = index % stride === 0;
    const isLastPoint = index === snapshot.trend.values.length - 1;
    if (isStridePoint || isLastPoint) {
      labels.push(snapshot.trend.labels[index] ?? "-");
      values.push(value);
    }
  });

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
  const [selectedRange, setSelectedRange] = useState<RangeKey>("7D");
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loadState, setLoadState] = useState<HealthLoadState>("permissions-required");
  const [statusMessage, setStatusMessage] = useState("Syncing health data...");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const selectedDays = rangeToDays[selectedRange];
  const chartSeries = useMemo(() => compactTrend(snapshot), [snapshot]);
  const chartWidth = Math.max(screenWidth - 56, 280);

  const metricCards = useMemo(
    () => [
      {
        emoji: "STP",
        title: "Steps",
        value: formatInteger(snapshot?.steps ?? null),
        change: `${selectedDays}-day total`,
        accent: "#dbeafe",
        titleColor: "#1e3a8a",
      },
      {
        emoji: "CAL",
        title: "Calories Burned",
        value:
          snapshot?.totalCaloriesKcal === null
            ? "--"
            : `${formatInteger(snapshot?.totalCaloriesKcal ?? null)} kcal`,
        change: "From daily activity",
        accent: "#fff7ed",
        titleColor: "#9a3412",
      },
      {
        emoji: "SLP",
        title: "Sleep Avg",
        value:
          snapshot?.sleepAverageHours === null
            ? "--"
            : `${formatDecimal(snapshot?.sleepAverageHours ?? null)} h`,
        change: `${selectedDays}-day average`,
        accent: "#ede9fe",
        titleColor: "#5b21b6",
      },
      {
        emoji: "HR",
        title: "Avg Heart Rate",
        value:
          snapshot?.averageHeartRateBpm === null
            ? "--"
            : `${formatInteger(snapshot?.averageHeartRateBpm ?? null)} bpm`,
        change: "From connected sensors",
        accent: "#dcfce7",
        titleColor: "#166534",
      },
    ],
    [selectedDays, snapshot]
  );

  const recoveryBreakdown = useMemo(
    () => [
      {
        label: "Sleep target",
        value: toGoalPercent(snapshot?.sleepAverageHours ?? null, 8),
        color: "#2563eb",
      },
      {
        label: "Hydration target",
        value: toGoalPercent(snapshot?.hydrationLiters ?? null, 2.7),
        color: "#06b6d4",
      },
      {
        label: "Activity target",
        value: toGoalPercent(snapshot?.activeMinutes ?? null, 45),
        color: "#16a34a",
      },
    ],
    [snapshot]
  );

  const latestVitals = useMemo(
    () => [
      {
        label: "Body weight",
        value:
          snapshot?.weightKg === null
            ? "No data"
            : `${formatDecimal(snapshot?.weightKg ?? null)} kg`,
        note: "Latest entry",
      },
      {
        label: "Blood oxygen",
        value:
          snapshot?.oxygenSaturationPercent === null
            ? "No data"
            : `${formatInteger(snapshot?.oxygenSaturationPercent ?? null)}%`,
        note: "Latest entry",
      },
      {
        label: "Blood pressure",
        value: snapshot?.bloodPressure
          ? `${snapshot.bloodPressure.systolic}/${snapshot.bloodPressure.diastolic}`
          : "No data",
        note: "mmHg",
      },
      {
        label: "HRV",
        value:
          snapshot?.hrvMs === null
            ? "No data"
            : `${formatInteger(snapshot?.hrvMs ?? null)} ms`,
        note: "RMSSD",
      },
      {
        label: "Active minutes",
        value:
          snapshot?.activeMinutes === null
            ? "No data"
            : `${formatInteger(snapshot?.activeMinutes ?? null)} min`,
        note: "Exercise sessions",
      },
    ],
    [snapshot]
  );

  const syncData = useCallback(
    async (promptPermissions: boolean) => {
      if (promptPermissions) {
        setIsConnecting(true);
      } else {
        setIsLoading(true);
      }

      const result = promptPermissions
        ? await requestHealthPermissionsAndLoad(selectedDays)
        : await loadHealthSnapshot(selectedDays);

      setLoadState(result.state);
      setStatusMessage(result.message);
      setSnapshot(result.snapshot ?? null);
      setIsLoading(false);
      setIsConnecting(false);
    },
    [selectedDays]
  );

  useEffect(() => {
    void syncData(false);
  }, [syncData]);

  const stateColor = statePalette[loadState];
  const canConnect =
    loadState === "permissions-required" ||
    loadState === "unsupported" ||
    loadState === "error";

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
          <Pressable style={styles.actionButton} onPress={() => void syncData(false)}>
            <Text style={styles.actionButtonText}>Refresh</Text>
          </Pressable>

          {canConnect && (
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => void syncData(true)}
              disabled={isConnecting}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                {isConnecting ? "Connecting..." : "Connect Health Data"}
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
            <View key={metric.title} style={[styles.metricCard, { backgroundColor: metric.accent }]}>
              <Text style={styles.metricEmoji}>{metric.emoji}</Text>
              <Text style={[styles.metricTitle, { color: metric.titleColor }]}>{metric.title}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricChange}>{metric.change}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Steps Trend</Text>
          <Text style={styles.panelSubtitle}>Aggregated from phone and connected wearables</Text>
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
            <View key={vital.label} style={styles.vitalRow}>
              <View>
                <Text style={styles.vitalLabel}>{vital.label}</Text>
                <Text style={styles.vitalNote}>{vital.note}</Text>
              </View>
              <Text style={styles.vitalValue}>{vital.value}</Text>
            </View>
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
            onPress={() => router.push('../tabs/client/manual-input')}
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
});
