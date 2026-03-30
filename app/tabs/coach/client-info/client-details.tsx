import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Keyboard, Pressable, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function ClientDetails() {
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Your inputs go here */}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  const { client } = useLocalSearchParams();
  const router = useRouter();

  const parsed = JSON.parse(client as string);

  // ---------------- REMOVE CLIENT ----------------
  const removeClient = () => {
    Alert.alert("Remove Client", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");

            await fetch(
              `${API_URL}/api/coach/remove-client?client_id=${parsed.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            router.replace("/tabs/coach/clients"); // go back
          } catch (err) {
            Alert.alert("Error", "Failed to remove client");
          }
        },
      },
    ]);
  };

  // ---------------- ADD ACTIVITY ----------------
  const goToAddActivity = () => {
    router.push({
      pathname: "/tabs/coach/client-info/add-activity",
      params: { clientId: parsed.id },
    });
  };

  const goToClientBiometrics = () => {
    router.push({
      pathname: "/tabs/coach/client-info/client-biometrics",
      params: {
        clientId: String(parsed.id),
        clientName: `${parsed.firstName ?? ""} ${parsed.lastName ?? ""}`.trim(),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 40 }}
      >

        {/* HEADER */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 14,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            Client Profile
          </Text>
        </View>

        {/* PROFILE CARD */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 24,
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#dbeafe",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 44 }}>👤</Text>
          </View>

          {/* Name */}
          <Text style={{ fontSize: 20, fontWeight: "700" }}>
            {parsed.firstName} {parsed.lastName}
          </Text>

          <Text style={{ color: "#6b7280", marginTop: 6 }}>
            {parsed.email}
          </Text>

          <Text style={{ color: "#9ca3af", marginTop: 6 }}>
            Client ID: {parsed.id}
          </Text>
        </View>

        {/* ACCOUNT INFO */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: "#fff",
            padding: 18,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Account Information
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Text>Email</Text>
            <Text style={{ color: "#555" }}>{parsed.email}</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Text>Client ID</Text>
            <Text style={{ color: "#555" }}>{parsed.id}</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={{ marginTop: 24, alignItems: "center" }}>

          {/* VIEW BIOMETRICS */}
          <Pressable
            onPress={goToClientBiometrics}
            style={{
              backgroundColor: "#2563eb",
              paddingVertical: 14,
              borderRadius: 10,
              width: 280,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              View Client Biometrics
            </Text>
          </Pressable>

          {/* ADD ACTIVITY */}
          <Pressable
            onPress={goToAddActivity}
            style={{
              backgroundColor: "rgba(92,110,190,0.7)",
              paddingVertical: 14,
              borderRadius: 10,
              width: 280,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Add Activity
            </Text>
          </Pressable>

          {/* REMOVE CLIENT */}
          <Pressable
            onPress={removeClient}
            style={{
              backgroundColor: "#b51d1d",
              paddingVertical: 14,
              borderRadius: 10,
              width: 280,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Remove Client
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}