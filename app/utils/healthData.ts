import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
    AggregationGroupResult,
    Permission,
} from "react-native-health-connect";

type HealthConnectModule = typeof import("react-native-health-connect");

export type HealthLoadState =
  | "ready"
  | "unsupported"
  | "provider-missing"
  | "provider-update-required"
  | "permissions-required"
  | "error";

export interface HealthTrendSeries {
  times: string[];
  labels: string[];
  values: number[];
}

export interface HealthSnapshot {
  days: number;
  steps: number | null;
  totalCaloriesKcal: number | null;
  hydrationLiters: number | null;
  averageHeartRateBpm: number | null;
  sleepAverageHours: number | null;
  activeMinutes: number | null;
  hrvMs: number | null;
  oxygenSaturationPercent: number | null;
  weightKg: number | null;
  bloodPressure: { systolic: number; diastolic: number } | null;
  trend: HealthTrendSeries;
  dataOrigins: string[];
}

export interface HealthLoadResult {
  state: HealthLoadState;
  message: string;
  snapshot?: HealthSnapshot;
}

const REQUESTED_PERMISSIONS: Permission[] = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "SleepSession" },
  { accessType: "read", recordType: "TotalCaloriesBurned" },
  { accessType: "read", recordType: "ExerciseSession" },
  { accessType: "read", recordType: "Hydration" },
  { accessType: "read", recordType: "HeartRateVariabilityRmssd" },
  { accessType: "read", recordType: "OxygenSaturation" },
  { accessType: "read", recordType: "Weight" },
  { accessType: "read", recordType: "BloodPressure" },
];

let cachedHealthModule: HealthConnectModule | null = null;
const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

interface BiometricVectorPayload {
  user_id: number;
  biometric_type: string;
  unit: string;
  times: string[];
  values: number[];
}

function signatureKey(metricType: string): string {
  return `biometric_vector_signature:${metricType}`;
}

function payloadSignature(payload: BiometricVectorPayload): string {
  return JSON.stringify({
    user_id: payload.user_id,
    biometric_type: payload.biometric_type,
    times: payload.times,
    values: payload.values,
  });
}

function isMockAnalyticsEnabled(): boolean {
  const rawValue = Constants.expoConfig?.extra?.MOCK_ANALYTICS;
  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    const normalized = rawValue.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function buildMockTrend(days: number): HealthTrendSeries {
  const times: string[] = [];
  const labels: string[] = [];
  const values: number[] = [];

  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const dayStartUtc = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    times.push(dayStartUtc.toISOString());
    labels.push(
      date.toLocaleDateString("en-US", {
        month: days <= 7 ? undefined : "short",
        day: days <= 7 ? undefined : "numeric",
        weekday: days <= 7 ? "short" : undefined,
      }) || "-"
    );

    const dayIndex = days - offset;
    const wave = Math.sin(dayIndex * 0.85) * 1200;
    const trend = dayIndex * 140;
    const baseline = 6200;
    values.push(Math.max(1800, Math.round(baseline + wave + trend)));
  }

  return { times, labels, values };
}

function buildMockSnapshot(days: number): HealthSnapshot {
  const trend = buildMockTrend(days);
  const totalSteps = trend.values.reduce((sum, value) => sum + value, 0);

  return {
    days,
    steps: totalSteps,
    totalCaloriesKcal: Math.round(totalSteps * 0.045),
    hydrationLiters: Number((2.1 + Math.min(days, 14) * 0.03).toFixed(1)),
    averageHeartRateBpm: 74,
    sleepAverageHours: 7.3,
    activeMinutes: Math.round(totalSteps / 240),
    hrvMs: 46,
    oxygenSaturationPercent: 98,
    weightKg: 78.4,
    bloodPressure: {
      systolic: 118,
      diastolic: 76,
    },
    trend,
    dataOrigins: ["mock.analytics.generator"],
  };
}

function permissionKey(permission: Permission): string {
  return `${permission.accessType}:${permission.recordType}`;
}

function buildTimeRange(days: number) {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    operator: "between" as const,
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  };
}

function appendOrigins(originSet: Set<string>, origins: string[] | undefined): void {
  if (!origins) {
    return;
  }

  origins.forEach((origin) => {
    if (origin) {
      originSet.add(origin);
    }
  });
}

function appendRecordOrigins(
  originSet: Set<string>,
  records: Array<{ metadata?: { dataOrigin?: string | null } }>
): void {
  records.forEach((record) => {
    const origin = record.metadata?.dataOrigin;
    if (origin) {
      originSet.add(origin);
    }
  });
}

function formatTrendLabel(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  if (days <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildTrend(
  groups: AggregationGroupResult<"Steps">[] | null,
  days: number
): HealthTrendSeries {
  if (!groups || groups.length === 0) {
    return {
      times: [new Date().toISOString()],
      labels: ["No data"],
      values: [0],
    };
  }

  const times = groups.map((group) => {
    const start = new Date(group.startTime);
    const dayStartUtc = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    );
    return dayStartUtc.toISOString();
  });
  const labels = groups.map((group) => formatTrendLabel(group.startTime, days));
  const values = groups.map((group) => Math.round(group.result.COUNT_TOTAL ?? 0));

  return {
    times,
    labels,
    values,
  };
}

function buildVectorPayloads(
  snapshot: HealthSnapshot,
  userId: number
): BiometricVectorPayload[] {
  const times = snapshot.trend.times;
  const stepValues = snapshot.trend.values;

  if (times.length === 0 || times.length !== stepValues.length) {
    return [];
  }

  const stepsTotal = stepValues.reduce((sum, value) => sum + value, 0);
  const safeStepsTotal = stepsTotal > 0 ? stepsTotal : 1;

  const caloriesTotal = snapshot.totalCaloriesKcal ?? 0;
  const sleepAverage = snapshot.sleepAverageHours ?? 0;
  const avgHeartRate = snapshot.averageHeartRateBpm ?? 0;
  const weightKg = snapshot.weightKg ?? 0;

  const caloriesPerDay = stepValues.map((value) =>
    Math.round((value / safeStepsTotal) * caloriesTotal)
  );
  const sleepPerDay = stepValues.map(() => Number(sleepAverage.toFixed(2)));
  const heartRatePerDay = stepValues.map(() => Math.round(avgHeartRate));
  const weightPerDay = stepValues.map(() => Number(weightKg.toFixed(1)));

  return [
    {
      user_id: userId,
      biometric_type: "steps_per_day",
      unit: "steps",
      times,
      values: stepValues,
    },
    {
      user_id: userId,
      biometric_type: "calories_per_day",
      unit: "kcal",
      times,
      values: caloriesPerDay,
    },
    {
      user_id: userId,
      biometric_type: "sleep_hours_per_day",
      unit: "hours",
      times,
      values: sleepPerDay,
    },
    {
      user_id: userId,
      biometric_type: "heart_rate_avg_per_day",
      unit: "bpm",
      times,
      values: heartRatePerDay,
    },
    {
      user_id: userId,
      biometric_type: "weight_kg",
      unit: "kg",
      times,
      values: weightPerDay,
    },
  ];
}

async function fetchCurrentUserId(token: string): Promise<number | null> {
  if (!API_URL) {
    return null;
  }

  try {
    console.log("[SYNC ACCOUNT] Request", {
      url: `${API_URL}/api/account`,
      tokenPrefix: token.slice(0, 20),
      tokenLength: token.length,
    });

    const response = await fetch(`${API_URL}/api/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[SYNC ACCOUNT] Response status", response.status);

    if (!response.ok) {
      const body = await response.text();
      console.log("[SYNC ACCOUNT] Response body", body);
      return null;
    }

    const data = await response.json();
    const id = data?.id;
    return typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}

async function syncSnapshotToBackend(
  snapshot: HealthSnapshot,
): Promise<{ uploaded: number; failed: number }> {
  console.log("[SYNC] syncSnapshotToBackend called");

  if (!API_URL) {
    console.log("[SYNC] Skipped: API_URL is missing");
    return { uploaded: 0, failed: 0 };
  }

  const token = await AsyncStorage.getItem("access_token");
  if (!token) {
    console.log("[SYNC] Skipped: no access_token in storage");
    return { uploaded: 0, failed: 0 };
  }

  const userId = await fetchCurrentUserId(token);
  if (!userId) {
    console.log("[SYNC] Skipped: could not resolve user_id from /api/account");
    return { uploaded: 0, failed: 0 };
  }

  const payloads = buildVectorPayloads(snapshot, userId);
  console.log("[SYNC] Prepared payloads", {
    userId,
    payloadCount: payloads.length,
    biometricTypes: payloads.map((payload) => payload.biometric_type),
  });

  if (payloads.length === 0) {
    console.log("[SYNC] Skipped: no payloads generated from snapshot");
    return { uploaded: 0, failed: 0 };
  }

  let uploaded = 0;
  let failed = 0;

  for (const payload of payloads) {
    const key = signatureKey(payload.biometric_type);
    const nextSignature = payloadSignature(payload);
    const previousSignature = await AsyncStorage.getItem(key);

    if (previousSignature === nextSignature) {
      console.log("[SYNC] Skipped unchanged payload", {
        biometricType: payload.biometric_type,
      });
      continue;
    }

    try {
      console.log("[SYNC REQUEST]", {
        method: "POST",
        url: `${API_URL}/api/biometrics/vector`,
        hasAuthToken: !!token,
        payload,
      });

      const response = await fetch(`${API_URL}/api/biometrics/vector`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        failed += 1;
        continue;
      }

      uploaded += 1;
      await AsyncStorage.setItem(key, nextSignature);
    } catch {
      failed += 1;
    }
  }

  console.log("[SYNC] Finished", { uploaded, failed });

  return { uploaded, failed };
}

async function safeRead<T>(reader: () => Promise<T>): Promise<T | null> {
  try {
    return await reader();
  } catch {
    return null;
  }
}

async function getHealthConnectModule(): Promise<HealthConnectModule | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  if (cachedHealthModule) {
    return cachedHealthModule;
  }

  try {
    cachedHealthModule = await import("react-native-health-connect");
    return cachedHealthModule;
  } catch {
    return null;
  }
}

async function readHealthSnapshot(
  healthConnect: HealthConnectModule,
  days: number
): Promise<HealthSnapshot> {
  const timeRangeFilter = buildTimeRange(days);

  const [
    stepsAggregate,
    caloriesAggregate,
    hydrationAggregate,
    heartRateAggregate,
    exerciseAggregate,
    stepTrendGroups,
    sleepResult,
    hrvResult,
    oxygenResult,
    weightResult,
    bloodPressureResult,
  ] = await Promise.all([
    safeRead(() =>
      healthConnect.aggregateRecord({
        recordType: "Steps",
        timeRangeFilter,
      })
    ),
    safeRead(() =>
      healthConnect.aggregateRecord({
        recordType: "TotalCaloriesBurned",
        timeRangeFilter,
      })
    ),
    safeRead(() =>
      healthConnect.aggregateRecord({
        recordType: "Hydration",
        timeRangeFilter,
      })
    ),
    safeRead(() =>
      healthConnect.aggregateRecord({
        recordType: "HeartRate",
        timeRangeFilter,
      })
    ),
    safeRead(() =>
      healthConnect.aggregateRecord({
        recordType: "ExerciseSession",
        timeRangeFilter,
      })
    ),
    safeRead(() =>
      healthConnect.aggregateGroupByPeriod({
        recordType: "Steps",
        timeRangeFilter,
        timeRangeSlicer: {
          period: "DAYS",
          length: 1,
        },
      })
    ),
    safeRead(() =>
      healthConnect.readRecords("SleepSession", {
        timeRangeFilter,
        ascendingOrder: false,
        pageSize: 200,
      })
    ),
    safeRead(() =>
      healthConnect.readRecords("HeartRateVariabilityRmssd", {
        timeRangeFilter,
        ascendingOrder: false,
        pageSize: 1,
      })
    ),
    safeRead(() =>
      healthConnect.readRecords("OxygenSaturation", {
        timeRangeFilter,
        ascendingOrder: false,
        pageSize: 1,
      })
    ),
    safeRead(() =>
      healthConnect.readRecords("Weight", {
        timeRangeFilter,
        ascendingOrder: false,
        pageSize: 1,
      })
    ),
    safeRead(() =>
      healthConnect.readRecords("BloodPressure", {
        timeRangeFilter,
        ascendingOrder: false,
        pageSize: 1,
      })
    ),
  ]);

  const sleepRecords = sleepResult?.records ?? [];
  const hrvRecord = hrvResult?.records[0];
  const oxygenRecord = oxygenResult?.records[0];
  const weightRecord = weightResult?.records[0];
  const bloodPressureRecord = bloodPressureResult?.records[0];

  const totalSleepMillis = sleepRecords.reduce((sum, record) => {
    const start = Date.parse(record.startTime);
    const end = Date.parse(record.endTime);

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return sum;
    }

    return sum + (end - start);
  }, 0);

  const oxygenRaw = oxygenRecord?.percentage ?? null;
  const oxygenSaturationPercent =
    oxygenRaw === null
      ? null
      : oxygenRaw <= 1
      ? Math.round(oxygenRaw * 100)
      : Math.round(oxygenRaw);

  const originSet = new Set<string>();
  appendOrigins(originSet, stepsAggregate?.dataOrigins);
  appendOrigins(originSet, caloriesAggregate?.dataOrigins);
  appendOrigins(originSet, hydrationAggregate?.dataOrigins);
  appendOrigins(originSet, heartRateAggregate?.dataOrigins);
  appendOrigins(originSet, exerciseAggregate?.dataOrigins);
  appendRecordOrigins(originSet, sleepRecords);
  appendRecordOrigins(originSet, hrvResult?.records ?? []);
  appendRecordOrigins(originSet, oxygenResult?.records ?? []);
  appendRecordOrigins(originSet, weightResult?.records ?? []);
  appendRecordOrigins(originSet, bloodPressureResult?.records ?? []);

  return {
    days,
    steps: stepsAggregate?.COUNT_TOTAL ?? null,
    totalCaloriesKcal: caloriesAggregate?.ENERGY_TOTAL?.inKilocalories ?? null,
    hydrationLiters: hydrationAggregate?.VOLUME_TOTAL?.inLiters ?? null,
    averageHeartRateBpm: heartRateAggregate?.BPM_AVG ?? null,
    sleepAverageHours:
      totalSleepMillis > 0 ? totalSleepMillis / days / (1000 * 60 * 60) : null,
    activeMinutes: exerciseAggregate?.EXERCISE_DURATION_TOTAL?.inSeconds
      ? Math.round(exerciseAggregate.EXERCISE_DURATION_TOTAL.inSeconds / 60)
      : null,
    hrvMs: hrvRecord?.heartRateVariabilityMillis ?? null,
    oxygenSaturationPercent,
    weightKg: weightRecord?.weight?.inKilograms ?? null,
    bloodPressure: bloodPressureRecord
      ? {
          systolic: Math.round(
            bloodPressureRecord.systolic.inMillimetersOfMercury
          ),
          diastolic: Math.round(
            bloodPressureRecord.diastolic.inMillimetersOfMercury
          ),
        }
      : null,
    trend: buildTrend(stepTrendGroups, days),
    dataOrigins: Array.from(originSet),
  };
}

function summarizeReadinessMessage(snapshot: HealthSnapshot): string {
  const hasAnyValues = [
    snapshot.steps,
    snapshot.totalCaloriesKcal,
    snapshot.hydrationLiters,
    snapshot.averageHeartRateBpm,
    snapshot.sleepAverageHours,
    snapshot.activeMinutes,
    snapshot.hrvMs,
    snapshot.oxygenSaturationPercent,
    snapshot.weightKg,
    snapshot.bloodPressure?.systolic ?? null,
  ].some((value) => value !== null);

  if (!hasAnyValues) {
    return "Connected to Health Connect, but no records were found for this time range.";
  }

  if (snapshot.dataOrigins.length > 0) {
    return `Live data loaded from ${snapshot.dataOrigins.length} source(s), including wearable-synced records.`;
  }

  return "Live health data loaded from Health Connect.";
}

export async function loadHealthSnapshot(
  days: number,
  shouldSyncToBackend = false
): Promise<HealthLoadResult> {
  return loadHealthSnapshotInternal(days, false, shouldSyncToBackend);
}

export async function requestHealthPermissionsAndLoad(
  days: number,
  shouldSyncToBackend = false
): Promise<HealthLoadResult> {
  return loadHealthSnapshotInternal(days, true, shouldSyncToBackend);
}

async function loadHealthSnapshotInternal(
  days: number,
  promptPermissions: boolean,
  shouldSyncToBackend: boolean
): Promise<HealthLoadResult> {
  const normalizedDays = Math.max(1, days);

  if (isMockAnalyticsEnabled()) {
    const snapshot = buildMockSnapshot(normalizedDays);
    const syncResult = shouldSyncToBackend
      ? await syncSnapshotToBackend(snapshot)
      : { uploaded: 0, failed: 0 };

    const syncMessage =
      syncResult.uploaded > 0
        ? ` Uploaded ${syncResult.uploaded} metric vector(s) to backend.`
        : "";

    return {
      state: "ready",
      message: `Mock analytics mode is enabled. Showing generated demo health data.${syncMessage}`,
      snapshot,
    };
  }

  const healthConnect = await getHealthConnectModule();

  if (!healthConnect) {
    return {
      state: "unsupported",
      message:
        "Health data sync is available on Android development builds. Expo Go and web cannot access Health Connect native APIs.",
    };
  }

  try {
    const sdkStatus = await healthConnect.getSdkStatus();

    if (sdkStatus === healthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      return {
        state: "provider-missing",
        message:
          "Health Connect is not installed on this device. Install it to read wearable and phone health data.",
      };
    }

    if (
      sdkStatus ===
      healthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
    ) {
      return {
        state: "provider-update-required",
        message:
          "Health Connect requires an update before data can be read. Update it and try again.",
      };
    }

    const initialized = await healthConnect.initialize();
    if (!initialized) {
      return {
        state: "error",
        message: "Unable to initialize Health Connect on this device.",
      };
    }

    if (promptPermissions) {
      await healthConnect.requestPermission(REQUESTED_PERMISSIONS);
    }

    const grantedPermissionsRaw = await healthConnect.getGrantedPermissions();
    const grantedPermissions = grantedPermissionsRaw.filter(
      (permission): permission is Permission =>
        permission.accessType === "read" &&
        permission.recordType !== "ExerciseRoute" &&
        permission.recordType !== "BackgroundAccessPermission" &&
        permission.recordType !== "ReadHealthDataHistory"
    );

    const grantedKeys = new Set(grantedPermissions.map(permissionKey));
    const requestedGrantedCount = REQUESTED_PERMISSIONS.filter((permission) =>
      grantedKeys.has(permissionKey(permission))
    ).length;

    if (requestedGrantedCount === 0) {
      return {
        state: "permissions-required",
        message:
          "Health permissions have not been granted yet. Connect Health Data to allow wearable and phone health sync.",
      };
    }

    const snapshot = await readHealthSnapshot(healthConnect, normalizedDays);
    const syncResult = shouldSyncToBackend
      ? await syncSnapshotToBackend(snapshot)
      : { uploaded: 0, failed: 0 };

    const syncMessage =
      syncResult.uploaded > 0
        ? ` Synced ${syncResult.uploaded} metric vector(s) to backend.`
        : "";

    return {
      state: "ready",
      message: `${summarizeReadinessMessage(snapshot)}${syncMessage}`,
      snapshot,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Health Connect error while loading data.";

    return {
      state: "error",
      message,
    };
  }
}

export async function openHealthConnectSettings(): Promise<boolean> {
  const healthConnect = await getHealthConnectModule();
  if (!healthConnect) {
    return false;
  }

  try {
    healthConnect.openHealthConnectSettings();
    return true;
  } catch {
    return false;
  }
}
