import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { router } from "expo-router";

export default function CoachRegister() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 8 }}>
          Coach Registration
        </Text>

        <Text style={{ fontSize: 16, marginBottom: 24 }}>
          Create a coach account
        </Text>

        {/* Name */}
        <TextInput
          placeholder="First Name"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        />

        {/* Name */}
        <TextInput
          placeholder="Last Name"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        />

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        />

        {/* Confirm Password */}
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        />

        {/* Register Button */}
        <Pressable
          onPress={() => console.log("Coach register")}
          style={{
            backgroundColor: "#000",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Register
          </Text>
        </Pressable>

        {/* Login */}
        <Pressable onPress={() => router.push("/login/coach")}>
          <Text style={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Text style={{ color: "blue" }}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
