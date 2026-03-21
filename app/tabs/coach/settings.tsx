import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.62:8000";

export default function Settings() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        const res = await fetch(`${API_URL}/api/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");

            await fetch(`${API_URL}/auth/logout`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            });

            router.replace("/");
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, paddingTop: 50 }}>

        {/* HEADER */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a" }}>
            Settings
          </Text>
        </View>

        {/* USER CARD */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#dbeafe",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 48 }}>👤</Text>
            </View>

            <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 4 }}>
              {user.firstName} {user.lastName}
            </Text>

            <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 16 }}>
              {user.email}
            </Text>

            <Text style={{ fontSize: 13, color: "#9ca3af" }}>
              Your ID: {user.id}
            </Text>

            {/* EDIT PROFILE */}
            <Pressable
              onPress={() =>
                router.push("/tabs/coach/account/edit-profile")
              }
              style={{
                backgroundColor: "#5c6ebe",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Edit Profile
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ACCOUNT INFO  */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Account Information
          </Text>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Phone</Text>
            <Text>+44 7304 446372 📱</Text>
          </View>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Date of Birth</Text>
            <Text>January 1, 1999 🎂</Text>
          </View>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Location</Text>
            <Text>United Kingdom 📍</Text>
          </View>
        </View>

        {/* STYLES */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Preferences
          </Text>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Notifications</Text>
            <Text>🔔</Text>
          </View>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Privacy</Text>
            <Text>🔒</Text>
          </View>

          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}>
            <Text>Language</Text>
            <Text>🌐</Text>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>

          <Pressable
            onPress={() =>
              router.push("/tabs/coach/account/change-password")
            }
            style={{
              backgroundColor: "#5c6ebe",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
           <Text style={{ fontSize: 16, color: "#fff", fontWeight: "600" }}>
              Change Password
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push("/tabs/coach/account/add-device")
            }
            style={{
              backgroundColor: "#5c6ebe",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "#fff", fontWeight: "600" }}>
              Add Device
            </Text>
          </Pressable>

        </View>

        {/* LOGOUT */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: "#fee",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#fcc",
            }}
          >
            <Text style={{ color: "#c00", fontSize: 16, fontWeight: "600" }}>
              Log Out
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}