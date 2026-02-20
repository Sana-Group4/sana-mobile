import { SafeAreaView, View, Text, TextInput, Pressable, Image, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./loginStyle"; // reuse the same style file

const API_URL = "http://192.168.0.62:8000";

export default function Register({ role = "coach" }: { role?: "coach" | "client" }) {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // optional: auto-generate username from first+last name
  const generateUsername = (first: string, last: string) => {
    const random = Math.floor(100 + Math.random() * 900);
    return `${first}${last}${random}`.toLowerCase().replace(/\s/g, "");
  };

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
    const username = generateUsername(fname, lname);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: fname,
          lastName: lname,
          username,
          password,
        }),
      });

      const text = await response.text();
      console.log("Register response:", text);

      if (response.ok) {
        Alert.alert(
          "Success",
          `Account created! Your username is: ${username}`
        );
        router.replace("/"); // go to main login page
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

          {/* Form content */}
          <View style={styles.contentBox}>
            <Text style={styles.title}>{role === "coach" ? "Account Registration" : "Register"}</Text>

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

            {/* Optional: social buttons */}
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