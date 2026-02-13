import { Pressable, Text, View } from "react-native";

export default function CoachHome() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "600" }}>Coach Home</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: "#ddd",
          backgroundColor: "#fff",
          paddingVertical: 12,
          paddingBottom: 20,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>🏠</Text>
          <Text style={{ fontSize: 12, fontWeight: "600" }}>Home</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>✨</Text>
          <Text style={{ fontSize: 12 }}>Sana</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
          <Text style={{ fontSize: 12 }}>Analytics</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>👤</Text>
          <Text style={{ fontSize: 12 }}>Coach</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>⚙️</Text>
          <Text style={{ fontSize: 12 }}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}