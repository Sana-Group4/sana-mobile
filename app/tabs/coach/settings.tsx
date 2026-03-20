import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function Settings() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, paddingTop: 50 }}>
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a" }}>
            Settings
          </Text>
        </View>

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

            <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 4, color: "#1a1a1a" }}>
              John Doe
            </Text>

            <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 16 }}>
              john.doe@example.com
            </Text>

            <Pressable
              style={{
                backgroundColor: "#3b82f6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Edit Profile
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" }}>
            Account Information
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>Phone</Text>
              <Text style={{ fontSize: 16, color: "#1a1a1a" }}>+44 7304 446372</Text>
            </View>
            <Text style={{ fontSize: 18 }}>📱</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>Date of Birth</Text>
              <Text style={{ fontSize: 16, color: "#1a1a1a" }}>January 1, 1999</Text>
            </View>
            <Text style={{ fontSize: 18 }}>🎂</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>Location</Text>
              <Text style={{ fontSize: 16, color: "#1a1a1a" }}>United Kingdom</Text>
            </View>
            <Text style={{ fontSize: 18 }}>📍</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" }}>
            Preferences
          </Text>

          <Pressable
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 16, color: "#1a1a1a" }}>Notifications</Text>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 16, color: "#1a1a1a" }}>Privacy</Text>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 16, color: "#1a1a1a" }}>Language</Text>
            <Text style={{ fontSize: 18 }}>🌐</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Pressable
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
