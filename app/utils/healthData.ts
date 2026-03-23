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
      labels: ["No data"],
      values: [0],
    };
  }

  const labels = groups.map((group) => formatTrendLabel(group.startTime, days));
  const values = groups.map((group) => Math.round(group.result.COUNT_TOTAL ?? 0));

  return {
    labels,
    values,
  };
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

export async function loadHealthSnapshot(days: number): Promise<HealthLoadResult> {
  return loadHealthSnapshotInternal(days, false);
}

export async function requestHealthPermissionsAndLoad(
  days: number
): Promise<HealthLoadResult> {
  return loadHealthSnapshotInternal(days, true);
}

async function loadHealthSnapshotInternal(
  days: number,
  promptPermissions: boolean
): Promise<HealthLoadResult> {
  const normalizedDays = Math.max(1, days);
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

    return {
      state: "ready",
      message: summarizeReadinessMessage(snapshot),
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
