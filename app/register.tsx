import { SafeAreaView, View, Text, TextInput, Pressable, Image, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"
import { styles } from "./loginStyle";

const API_URL = "http://192.168.0.62:8000";

export default function Register() {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"coach" | "client">("client");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
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
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); 
  const username = email

  const userType = accountType === "client" ? "Client" : "Coach";

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        phone: randomDigit,
        firstName: fname,
        lastName: lname,
        username,
        password,
        userType,
      }),
    });

    const text = await response.text();
    console.log("Register response:", text);

    if (response.ok) {
      Alert.alert("Success", `Account created! Please log in.`);
      router.replace("/");
    } else {
      Alert.alert("Error", text);
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
      <View style={styles.shadowWrapper}>
        <View style={styles.container}>

          <View style={styles.contentBox}>
            <Text style={styles.title}>Account Registration</Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                placeholder="Enter first name"
                placeholderTextColor="#999"
                style={styles.input}
                value={fname}
                onChangeText={setFname}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                placeholder="Enter last name"
                placeholderTextColor="#999"
                style={styles.input}
                value={lname}
                onChangeText={setLname}
              />
            </View>

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
              />
            </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ marginBottom: 8, fontWeight: "300", color: "#333" }}>
              Account Type
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Pressable
                onPress={() => setAccountType("client")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: accountType === "client" ? "blue" : "#ddd",
                  borderRadius: 12,
                  marginRight: 8,
                  backgroundColor: accountType === "client" ? "#e0f0ff" : "#fff",
                  alignItems: "center",
                }}
              >
                <Text>Client</Text>
              </Pressable>

              <Pressable
                onPress={() => setAccountType("coach")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: accountType === "coach" ? "blue" : "#ddd",
                  borderRadius: 12,
                  backgroundColor: accountType === "coach" ? "#e0f0ff" : "#fff",
                  alignItems: "center",
                }}
              >
                <Text>Coach</Text>
              </Pressable>
            </View>
          </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter password"
                placeholderTextColor="#999"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                placeholder="Confirm password"
                placeholderTextColor="#999"
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <Pressable
              onPress={handleRegister}
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Registering..." : "Register"}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/")}>
              <Text style={styles.register}>
                Already have an account? <Text style={styles.registerLink}>Login</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}