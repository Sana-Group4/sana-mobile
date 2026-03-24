import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  // STEP 1: send email
  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Enter your email");
      return;
    }

    try {
      await fetch(
        `${API_URL}/auth/start-passsword-reset?email=${email}`,
        { method: "POST" }
      );

      Alert.alert("Check your email ", "Reset code sent");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to send code");
    }
  };

  // STEP 2: verify code
  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert("Error", "Enter the code");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/auth/verify-reset-code?code=${code}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (res.ok) {
        setResetToken(data.reset_token);
        Alert.alert("Success ", "Code verified");
      } else {
        Alert.alert("Error", data.detail);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Verification failed");
    }
  };

  // STEP 3: reset password
  const handleResetPassword = async () => {
    if (!resetToken) {
      Alert.alert("Error", "Verify code first");
      return;
    }

    if (!newPassword) {
      Alert.alert("Error", "Enter new password");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/auth/finalize-passowrd-reset?token=${resetToken}&new_password=${newPassword}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success ", "Password updated");
        router.replace("/");
      } else {
        Alert.alert("Error", data.detail);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Reset failed");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
        Reset Password 
      </Text>

      {/* EMAIL */}
      <Text>Email</Text>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={input}
      />

      <Pressable onPress={handleSendCode} style={button}>
        <Text style={buttonText}>Send Code ✉️</Text>
      </Pressable>

      {/* CODE */}
      <Text>Reset Code</Text>
      <TextInput
        placeholder="Enter code"
        value={code}
        onChangeText={setCode}
        style={input}
      />

      <Pressable onPress={handleVerifyCode} style={button}>
        <Text style={buttonText}>Verify Code ✅</Text>
      </Pressable>

      {/* NEW PASSWORD */}
      <Text>New Password</Text>
      <TextInput
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={input}
      />

      <Pressable onPress={handleResetPassword} style={button}>
        <Text style={buttonText}>Reset Password 🔄</Text>
      </Pressable>
    </View>
  );
}

const input = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
};

const button = {
  backgroundColor: "#5c6ebe",
  padding: 14,
  borderRadius: 12,
  alignItems: "center" as const,
  marginBottom: 16,
};

const buttonText = {
  color: "#fff",
  fontWeight: "600" as const,
};
