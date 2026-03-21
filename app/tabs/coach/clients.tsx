import { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.62:8000";

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");

  // ---------------- LOAD CLIENTS ----------------
  useEffect(() => {
    const loadClients = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        if (!token) {
          Alert.alert("Error", "No auth token found");
          return;
        }

        const res = await fetch(`${API_URL}/api/coach/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          Alert.alert("Error", data.detail || "Failed to load clients");
          return;
        }

        setClients(data);
      } catch (err) {
        console.log(err);
        Alert.alert("Error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // ---------------- ADD CLIENT ----------------
  const addClient = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      if (!clientId.trim()) {
        Alert.alert("Error", "Please enter a client ID");
        return;
      }

      const cleanId = parseInt(clientId, 10);

      if (isNaN(cleanId)) {
        Alert.alert("Error", "Invalid client ID");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/coach/add-client?client_id=${cleanId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Failed to add client");
        return;
      }

      Alert.alert("Success", "Client added!");

      setClientId("");

      // refresh list
      const refreshed = await fetch(`${API_URL}/api/coach/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updated = await refreshed.json();
      setClients(updated);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ---------------- UI ----------------
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading clients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      {/* HEADER */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>
          My clients
        </Text>
      </View>

      {/* CLIENT LIST */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 250,
        }}
      >
        {clients.length === 0 ? (
          <Text style={{ color: "#666" }}>
            No clients yet. Add one below.
          </Text>
        ) : (
          clients.map((client) => (
            <View
              key={client.id}
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 12,
                marginBottom: 10,
                backgroundColor: "#fafafa",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {client.firstName} {client.lastName}
              </Text>

              <Text style={{ fontSize: 12, color: "#666" }}>
                {client.email}
              </Text>

              <Text style={{ fontSize: 11, color: "#999" }}>
                ID: {client.id}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* INPUT */}
      <View
        style={{
          position: "absolute",
          bottom: 80,
          left: 16,
          right: 16,
        }}
      >
        <Text style={{ fontWeight: "600", marginBottom: 6 }}>
          Add client by ID
        </Text>

        <TextInput
          value={clientId}
          onChangeText={setClientId}
          placeholder="Enter client ID"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            padding: 12,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* BUTTON */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 16,
        }}
      >
        <Pressable
          onPress={addClient}
          style={{
            backgroundColor: "#5c6ebe",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Add client
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}