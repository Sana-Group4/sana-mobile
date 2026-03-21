import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.62:8000";

/* ---------------- TYPES ---------------- */

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

interface BiometricResponse {
  user_id: number;
  biometric_type: string;
  t: string[];
  y: number[];
}

/* ---------------- COMPONENT ---------------- */

export default function Analytics() {
  const [user, setUser] = useState<User | null>(null);
  const [type, setType] = useState("HEART_RATE");

  const [bio, setBio] = useState<BiometricResponse | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBio, setLoadingBio] = useState(false);

  /* ---------------- LOAD USER ---------------- */

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        const res = await fetch(`${API_URL}/api/account`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("User load error:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  /* ---------------- LOAD BIOMETRICS ---------------- */

  useEffect(() => {
    if (!user) return;

    const loadBio = async () => {
      setLoadingBio(true);

      try {
        const token = await AsyncStorage.getItem("access_token");

        const params = new URLSearchParams({
          user_id: user.id.toString(),
          biometric_type: type,
        });

        const res = await fetch(
          `${API_URL}/api/biometrics/vector?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch biometrics");

        const data = await res.json();
        setBio(data);
      } catch (err) {
        console.error("Biometrics error:", err);
      } finally {
        setLoadingBio(false);
      }
    };

    loadBio();
  }, [user, type]);

  /* ---------------- SIMPLE CHART ---------------- */

  const renderChart = () => {
    if (!bio?.y?.length) {
      return (
        <Text style={{ marginTop: 20, color: "#666" }}>
          No data available
        </Text>
      );
    }

    const max = Math.max(...bio.y);
    const min = Math.min(...bio.y);

    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: "600", marginBottom: 10 }}>
          {type} Trend
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: 140,
          }}
        >
          {bio.y.slice(-25).map((v, i) => {
            const height = ((v - min) / (max - min || 1)) * 100;

            return (
              <View
                key={i}
                style={{
                  width: 8,
                  height: `${height}%`,
                  backgroundColor: "#4f46e5",
                  marginRight: 4,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </View>
      </View>
    );
  };

  /* ---------------- LOADING STATE ---------------- */

  if (loadingUser) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivityIndicator style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Failed to load user
        </Text>
      </SafeAreaView>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* HEADER */}
        <Text style={{ fontSize: 22, fontWeight: "700" }}>
          Hello {user.firstName}
        </Text>

        <Text style={{ color: "#666", marginTop: 4 }}>
          Your personal analytics dashboard
        </Text>

        {/* TYPE SELECTOR */}
        <ScrollView horizontal style={{ marginTop: 20 }}>
          {["HEART_RATE", "SLEEP", "STEPS", "WEIGHT"].map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                padding: 10,
                marginRight: 8,
                borderRadius: 10,
                backgroundColor: type === t ? "#111827" : "#e5e7eb",
              }}
            >
              <Text style={{ color: type === t ? "#fff" : "#000" }}>
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* CHART */}
        {loadingBio ? (
          <ActivityIndicator style={{ marginTop: 30 }} />
        ) : (
          renderChart()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}