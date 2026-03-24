import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { styles } from "./loginStyle";

import Constants from "expo-constants";
WebBrowser.maybeCompleteAuthSession();

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function Login() {
  const [username, setUsername] = useState(""); // email OR phone
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
      const isCoach = data.queryParams?.is_coach === "true";

      console.log("[LOGIN] is_coach (Google):", isCoach);

      if (token) {
        await AsyncStorage.setItem("access_token", token as string);

        if (isCoach) {
          router.replace("/tabs/coach/coach-home");
        } else {
          router.replace("/tabs/client/client-home");
        }
      }
    }
  };

  // --- Email/Phone + Password login ---
  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    // simple phone validation
    if (loginMethod === "phone" && username.length < 8) {
      Alert.alert("Error", "Enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("grant_type", "password");
      formBody.append("username", username);
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
        data = { detail: text };
      }

      console.log("Login response:", data);

      if (res.ok) {
        await AsyncStorage.setItem("access_token", data.access_token);

        // fetch account
        const accountRes = await fetch(`${API_URL}/api/account`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        const account = await accountRes.json();

        console.log("[LOGIN ACCOUNT]", account);

        if (account.is_coach) {
          router.replace("/tabs/coach/coach-home");
        } else {
          router.replace("/tabs/client/client-home");
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

                {/* Username input */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>
                    {loginMethod === "email" ? "Email" : "Phone Number"}
                  </Text>
                  <TextInput
                    placeholder={
                      loginMethod === "email"
                        ? "Enter your email"
                        : "Enter your phone number"
                    }
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType={
                      loginMethod === "phone"
                        ? "phone-pad"
                        : "email-address"
                    }
                    value={username}
                    onChangeText={(text) => {
                      if (loginMethod === "phone") {
                        setUsername(text.replace(/[^0-9]/g, ""));
                      } else {
                        setUsername(text);
                      }
                    }}
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                {/* Login button */}
                <Pressable
                  onPress={handleLogin}
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Logging in..." : "Login"}
                  </Text>
                </Pressable>

                {/* Social buttons */}
                <View style={styles.socialContainer}>
                  <Pressable
                    style={styles.socialButton}
                    onPress={handleGoogleLogin}
                  >
                    <FontAwesome5 name="google" size={24} color="#5c6ebe" />
                  </Pressable>

                  <Pressable
                    style={styles.socialButton}
                    onPress={() => {
                      setLoginMethod("phone");
                      setUsername("");
                    }}
                  >
                    <FontAwesome name="phone" size={24} color="#5c6ebe" />
                  </Pressable>

                  <Pressable
                    style={styles.socialButton}
                    onPress={() => {
                      setLoginMethod("email");
                      setUsername("");
                    }}
                  >
                    <FontAwesome name="envelope" size={24} color="#5c6ebe" />
                  </Pressable>
                </View>
                <Pressable onPress={() => router.push("/forgot-password")}>
                  <Text style={{ textAlign: "center", marginTop: 10, color: "#5c6ebe" }}>
                    Forgot Password?
                  </Text>
                </Pressable>

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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
