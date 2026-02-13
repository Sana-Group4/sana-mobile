import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";

const API_URL = "http://192.168.0.62:8000";

export default function ClientRegister() {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
  if (password !== confirmPassword) {
    Alert.alert("Passwords do not match");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        firstName: fname,
        lastName: lname,
        username: email,
        password,
      }),
    });

    const text = await response.text(); // debug-safe
    console.log("Register response:", text);

    if (response.ok) {
      Alert.alert("Success!", "Account created");
      router.push("/login/client");
    } else {
      Alert.alert("Error", text);
    }
  } catch (err) {
    console.error("Network error:", err);
    Alert.alert("Error", "Unable to connect to server");
  }
};



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 8 }}>
          Coach Registration
        </Text>

        <Text style={{ fontSize: 16, marginBottom: 24 }}>
          Create a coach account
        </Text>

        <TextInput
          placeholder="First Name"
          placeholderTextColor="#888"
          style={inputStyle}
          value={fname}
          onChangeText={setFname}
        />

        <TextInput
          placeholder="Last Name"
          placeholderTextColor="#888"
          style={inputStyle}
          value={lname}
          onChangeText={setLname}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={inputStyle}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Pressable
          onPress={handleRegister}
          style={buttonStyle}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Register
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/login/client")}>
          <Text style={{ textAlign: "center" }}>
            Already have an account? <Text style={{ color: "blue" }}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

const buttonStyle = {
  backgroundColor: "#000",
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
  marginBottom: 16,
};
