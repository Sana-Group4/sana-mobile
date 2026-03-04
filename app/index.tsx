import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./loginStyle";

const API_URL = "http://192.168.0.62:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("grant_type", "password"); // required by OAuth2
      formBody.append("username", email);
      formBody.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        Alert.alert("Success", "Logged in successfully");
        router.replace("/tabs/client/client_home"); // redirect to main app
      } else {
        Alert.alert("Login failed", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Network error:", err);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Shadow wrapper */}
      <View style={styles.shadowWrapper}>
        {/* Inner login panel */}
        <View style={styles.container}>
          {/* Top image */}
          <View style={styles.imgBox}>
            <Image
              source={require("../assets/images/athlete-resting.png")}
              style={styles.image}
            />
          </View>

          {/* Login content */}
          <View style={styles.contentBox}>
            <Text style={styles.title}>Login</Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </Pressable>

            {/* Social login buttons */}
            <View style={styles.socialContainer}>
              <Pressable style={styles.socialButton}>
                <FontAwesome5 name="google" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton}>
                <FontAwesome name="phone" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton}>
                <FontAwesome name="envelope" size={24} color="#5c6ebe" />
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.register}>
                Not with us?{" "}
                <Text style={styles.registerLink}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}