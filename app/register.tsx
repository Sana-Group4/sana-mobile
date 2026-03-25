import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
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

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function Register() {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Hide keyboard when pressing register
    Keyboard.dismiss();

    // Validate all fields
    if (!fname || !lname || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const randomDigit = Math.floor(Math.random() * 2147483647);
    const username = normalizedEmail;

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          phone: randomDigit,
          firstName: fname,
          lastName: lname,
          username,
          password,
          isCoach: false
        }),
      });

      const data = await response.json();
      console.log("Register response:", data);

      // Log JWT access token
      if (data.access_token) {
        console.log("JWT access token received:", data.access_token);
      }

      // Try to log refresh token from Set-Cookie header (if available)
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log("Refresh token Set-Cookie header:", setCookie);
      } else {
        console.log("No Set-Cookie header for refresh token found. (This is expected in React Native, as fetch does not expose HTTP-only cookies)");
      }

      if (response.ok) {
        // STORE token securely
        await AsyncStorage.setItem('accessToken', data.access_token);

        // go to ChooseCoach
        router.replace("/choose-coach");
      } else {
        Alert.alert("Error", data.detail || JSON.stringify(data));
      }
    } catch (err) {
      console.error("Network error:", err);
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
              <View style={styles.contentBox}>
                <Text style={styles.title}>Account Registration</Text>

                {/* First Name */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    placeholder="Enter first name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={fname}
                    onChangeText={setFname}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Last Name */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    placeholder="Enter last name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={lname}
                    onChangeText={setLname}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    placeholder="Enter email"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Confirm Password */}
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister} // submit on Enter/Done
                  />
                </View>

                {/* Register Button */}
                <Pressable
                  onPress={handleRegister}
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Registering..." : "Register"}
                  </Text>
                </Pressable>

                {/* Already have an account */}
                <Pressable onPress={() => router.replace("/")}>
                  <Text style={styles.register}>
                    Already have an account? <Text style={styles.registerLink}>Login</Text>
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