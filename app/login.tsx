import {
  SafeAreaView,
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function Login() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Content */}
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 8 }}>
          Welcome to Sana Sports
        </Text>

        <Text style={{ fontSize: 16, marginBottom: 24 }}>
          Choose how you want to log in
        </Text>

        {/* Coach */}
        <Pressable
          onPress={() => router.push("/login/coach")}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Image
            source={require("../assets/images/coach.png")}
            style={{ width: 80, height: 150, marginBottom: 8 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            I’m a Coach
          </Text>
        </Pressable>

        {/* Client */}
        <Pressable
          onPress={() => router.push("/login/client")}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/images/client.png")}
            style={{ width: 80, height: 150, marginBottom: 8 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            I’m a Client
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
