import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./loginStyle";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

const API_URL = "http://192.168.0.62:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  const handleGoogleLogin = async () => {
  const result = await WebBrowser.openAuthSessionAsync(
    `${API_URL}/auth/google/login`,
    "sanamobile://auth"
  );

  if (result.type === "success" && result.url) {
      const data = Linking.parse(result.url);
      const token = data.queryParams?.token;
      const isCoach = data.queryParams?.isCoach === "true";

      if (token) {
        console.log("Logged in:", token);

        if (isCoach) {
          router.replace("/tabs/coach/coach_home");
        } else {
          router.replace("/tabs/client/client_home");
        }
}
    }
  };
  

  // --- Email/Password login ---
  const handleLogin = async () => {
  // temporarily blocking phone login
  if (loginMethod === "phone") {
    Alert.alert("Error", "Phone login not supported yet");
    return;
  }

  if (!email || !password) {
    Alert.alert("Error", "Please enter username and password");
    return;
  }

  setLoading(true);

  try {
    const formBody = new URLSearchParams();
    formBody.append("grant_type", "password");
    formBody.append("username", email);
    formBody.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text }; // fallback
    }

    console.log("Login response:", data);

    if (res.ok) {
      if (data.isCoach) {
        router.replace("/tabs/coach/coach_home");
      } else {
        router.replace("/tabs/client/client_home");
      }
    } else {
      Alert.alert("Login failed", data.detail || "Unknown error");
    }
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Unable to connect to server");
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shadowWrapper}>
        <View style={styles.container}>
          <View style={styles.imgBox}>
            <Image
              source={require("../assets/images/athlete-resting.png")}
              style={styles.image}
            />
          </View>

          <View style={styles.contentBox}>
            <Text style={styles.title}>Login</Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>{loginMethod === "email" ? "Email" : "Phone"}</Text>
              <TextInput
                placeholder={loginMethod === "email" ? "Enter your email" : "Enter your phone number"}
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType={loginMethod === "phone" ? "phone-pad" : "email-address"}
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
              <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
            </Pressable>

            {/* Social login buttons */}
            <View style={styles.socialContainer}>
              <Pressable style={styles.socialButton} onPress={handleGoogleLogin}>
                <FontAwesome5 name="google" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton} onPress={() => setLoginMethod("phone")}>
                <FontAwesome name="phone" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton} onPress={() => setLoginMethod("email")}>
                <FontAwesome name="envelope" size={24} color="#5c6ebe" />
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.register}>
                Not with us? <Text style={styles.registerLink}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}