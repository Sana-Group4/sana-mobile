import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      // TODO: call backend here
      // await fetch("/api/change-password", ...)

      Alert.alert("Success", "Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
        Change Password
      </Text>

      {/* CURRENT PASSWORD */}
      <Text style={{ marginBottom: 4, color: "#666" }}>
        Current Password
      </Text>
      <TextInput
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        style={inputStyle}
      />

      {/* NEW PASSWORD */}
      <Text style={{ marginBottom: 4, color: "#666" }}>
        New Password
      </Text>
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={inputStyle}
      />

      {/* CONFIRM PASSWORD */}
      <Text style={{ marginBottom: 4, color: "#666" }}>
        Confirm New Password
      </Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={inputStyle}
      />

      {/* BUTTON */}
      <Pressable onPress={handleChangePassword} style={buttonStyle}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Update Password
        </Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
};

const buttonStyle = {
  backgroundColor: "#5c6ebe",
  padding: 14,
  borderRadius: 12,
  alignItems: "center" as const,
  marginTop: 10,
};