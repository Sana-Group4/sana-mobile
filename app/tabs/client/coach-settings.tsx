import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function CoachSettingsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    coachId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
  }>();

  const coachId = Number(params.coachId);
  const [submitting, setSubmitting] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const handleBiometricAccess = async (allow: boolean) => {
    if (!coachId || Number.isNaN(coachId)) {
      Alert.alert("Error", "Invalid coach ID");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/client/biometric-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coach_id: coachId,
          allow,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data?.detail || "Failed to update biometric access");
        return;
      }

      setAllowed(Boolean(data?.biometric_access_allowed));
      Alert.alert(
        "Success",
        allow
          ? "Coach can now view your biometric data"
          : "Coach biometric data access has been removed"
      );
    } catch (error) {
      Alert.alert("Error", "Network error while updating access");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Pressable
          onPress={() => router.replace("/tabs/client/coach")}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        >
          <Text style={{ color: "#5c6ebe", fontWeight: "700" }}>Back to My Coaches</Text>
        </Pressable>

        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
          Coach Settings
        </Text>

        <View
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#eee",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            {params.firstName || ""} {params.lastName || ""}
            {params.username ? ` (@${params.username})` : ""}
          </Text>
          <Text style={{ color: "#4b5563", marginBottom: 4 }}>
            Coach ID: {params.coachId || "Unknown"}
          </Text>
          <Text style={{ color: "#4b5563", marginBottom: 4 }}>
            Email: {params.email || "Not available"}
          </Text>
          <Text style={{ color: "#4b5563" }}>
            Phone: {params.phone || "Not available"}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#f0f6ff",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#b3d1ff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
            Biometric Data Access
          </Text>
          <Text style={{ color: "#374151", marginBottom: 14 }}>
            Allow this coach to view your biometric data from the app analytics.
          </Text>

          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => void handleBiometricAccess(true)}
              disabled={submitting}
              style={{
                backgroundColor: "#2563eb",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
                {submitting ? "Saving..." : "Allow coach to view your biometric data"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void handleBiometricAccess(false)}
              disabled={submitting}
              style={{
                backgroundColor: "#e5e7eb",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#111827", fontWeight: "700", textAlign: "center" }}>
                Disable
              </Text>
            </Pressable>
          </View>

          <Text style={{ marginTop: 12, color: allowed ? "#166534" : "#6b7280", fontWeight: "600" }}>
            {allowed ? "Current status: Access allowed" : "Current status: Access not allowed"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
