import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, Keyboard, TouchableWithoutFeedback, ScrollView } from "react-native";
import { styles } from "./styles";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // ---------------- LOAD USER ----------------
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        const res = await fetch(`${API_URL}/api/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("ACCOUNT DATA:", data);

        if (!res.ok) {
          Alert.alert("Error", data.detail || "Failed to load account");
          return;
        }

        setUser(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setPhone(data.phone ? String(data.phone) : "");
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load profile");
      }
    };

    loadUser();
  }, []);

  // ---------------- SAVE USER ----------------
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(`${API_URL}/api/update_account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409) {
        Alert.alert("Error", data?.detail || "Conflict error");
        return;
      }

      if (!res.ok) {
        Alert.alert("Error", data?.detail || "Update failed");
        return;
      }

      Alert.alert("Success", "Profile updated");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  if (!user) return <Text>Loading...</Text>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Edit Profile</Text>

          {/* First Name */}
          <Text style={styles.label}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />

          {/* Last Name */}
          <Text style={styles.label}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Phone */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Pressable onPress={handleSave} style={styles.button}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Save Changes</Text>
          </Pressable>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}