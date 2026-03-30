import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  actionButton,
  actionContainer,
  avatarStyle,
  buttonText,
  cardStyle,
  containerStyle,
  editButton,
  infoCard,
  infoRow,
  loadingStyle,
  logoutButton,
  logoutText,
  nameText,
  profileCard,
  sectionTitle,
  titleText,
} from "../coach/styles/settings-style";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function Settings() {
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Your inputs go here */}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  const [user, setUser] = useState<any>(null);

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
        setUser(data);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");

            await fetch(`${API_URL}/auth/logout`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            router.replace("/");
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={loadingStyle}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView style={{ flex: 1, paddingTop: 50, paddingHorizontal: 16 }}>
        
        {/* HEADER */}
        <View style={cardStyle}>
          <Text style={titleText}>Profile</Text>
        </View>

        {/* PROFILE CARD */}
        <View style={profileCard}>
          <View style={avatarStyle}>
            <Text style={{ fontSize: 54 }}>👤</Text>
          </View>

          <Text style={nameText}>
            {user.firstName} {user.lastName}
          </Text>

          <Pressable
            onPress={() => router.push("/tabs/coach/account/edit-profile")}
            style={editButton}
          >
            <Text style={buttonText}>Edit Details</Text>
          </Pressable>
        </View>

        {/* ACCOUNT INFO */}
        <View style={infoCard}>
          <Text style={sectionTitle}>Account Information</Text>

        <InfoRow
        label="Phone"
        value={user.phone ? `${user.phone} ` : "Not added yet "}
        />
        <InfoRow label="Email" value={`${user.email} `} />
        <InfoRow label="Personal ID" value={`${user.id} `} />

        </View>

        {/* ACTION BUTTONS */}
        <View style={actionContainer}>
          <Pressable
            onPress={handleLogout}
            style={logoutButton}
          >
            <Text style={logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------- COMPONENT ----------------
function InfoRow({ label, value }: any) {
  return (
    <View style={infoRow}>
      <Text>{label}</Text>
      <Text style={{ color: "#555" }}>{value}</Text>
    </View>
  );
}
