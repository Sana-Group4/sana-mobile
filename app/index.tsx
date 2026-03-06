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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

const API_URL = "http://192.168.0.62:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
      if (response?.type === "success") {
        const { authentication } = response;
        console.log("Google token:", authentication?.accessToken);

        Alert.alert("Success", "Google login successful");

        // later you send this token to backend
      }
    }, [response]);


const handleGoogleLogin = async () => {
  await promptAsync();
};

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

        if (data.isCoach) {
          router.replace("/tabs/coach/coach_home");
        } else {
          router.replace("/tabs/client/client_home");
        }
      }else {
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
              <Text style={styles.label}>
                {loginMethod === "email" ? "Email" : "Phone"}
              </Text>

              <TextInput
                placeholder={
                  loginMethod === "email"
                    ? "Enter your email"
                    : "Enter your phone number"
                }
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
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </Pressable>

            {/* Social login buttons */}
           <View style={styles.socialContainer}>
              <Pressable
                style={styles.socialButton}
                onPress={handleGoogleLogin}
              >
                <FontAwesome5 name="google" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => setLoginMethod("phone")}
              >
                <FontAwesome name="phone" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => setLoginMethod("email")}
              >
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