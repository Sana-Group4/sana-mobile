import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home</Text>

      <Pressable onPress={() => router.push("/login")}>
        <Text style={{ color: "blue", marginTop: 20 }}>
          Go to Login
        </Text>
      </Pressable>
    </View>
  );
}

