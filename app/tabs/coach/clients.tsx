import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    View,
} from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");

  const router = useRouter(); // ✅ FIX

  // ---------------- LOAD CLIENTS ----------------
  const loadClients = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(`${API_URL}/api/coach/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ---------------- ADD CLIENT ----------------
  const addClient = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

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

      if (!res.ok) {
        const data = await res.json();
        Alert.alert("Error", data.detail);
        return;
      }

      setClientId("");
      loadClients();
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ---------------- REMOVE CLIENT ----------------
  const removeClient = (id: number) => {
    Alert.alert(
      "Remove Client",
      "Are you sure you want to remove this client?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("access_token");

              await fetch(
                `${API_URL}/api/coach/remove-client?client_id=${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              loadClients();
            } catch (err) {
              Alert.alert("Error", "Failed to remove client");
            }
          },
        },
      ]
    );
  };

  // ---------------- VIEW CLIENT ----------------
  const viewClient = (client: any) => {
    router.push({
      pathname: "/tabs/coach/client-info/client-details",
      params: { client: JSON.stringify(client) },
    });
  };

  // ---------------- UI ----------------
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      <Text style={{ fontSize: 22, fontWeight: "700", padding: 16 }}>
        My Clients
      </Text>

      {/* GRID */}
      <FlatList
        data={clients}
        numColumns={3}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => viewClient(item)}
            style={{
              width: "31%",
              margin: "1%",
              aspectRatio: 1,
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              padding: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            {/* PROFILE ICON */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#efe6ff",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>

            {/* NAME */}
            <Text style={{ fontWeight: "600", fontSize: 13 }}>
              {item.firstName}
            </Text>

            {/* ID */}
            <Text style={{ fontSize: 10, color: "#666" }}>
              ID: {item.id}
            </Text>
          </Pressable>
        )}
      />

      {/* INPUT */}
      <View
        style={{
          position: "absolute",
          bottom: 80,
          left: 16,
          right: 16,
        }}
      >
        <Text>Add client by ID</Text>
        <TextInput
          value={clientId}
          onChangeText={setClientId}
          placeholder="Client ID"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            padding: 12,
            marginTop: 6,
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
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Add Client</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}