import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.62:8000";

export default function ClientInvites() {
  const [invites, setInvites] = useState<any[]>([]);

  const loadInvites = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(`${API_URL}/api/client-invites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setInvites(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load invites");
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // ✅ ACCEPT
  const acceptInvite = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(
        `${API_URL}/api/client-invite/accept?invite_id=${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        Alert.alert("Error", "Failed to accept invite");
        return;
      }

      Alert.alert("Success", "Invite accepted!");
      loadInvites();
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ❌ REJECT (optional but good)
  const rejectInvite = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      await fetch(
        `${API_URL}/api/client-invite/reject?invite_id=${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadInvites();
    } catch {
      Alert.alert("Error", "Failed to reject invite");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
        Invites
      </Text>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>No invites</Text>}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              Coach: {item.coach_name || item.coach_id}
            </Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Pressable
                onPress={() => acceptInvite(item.id)}
                style={{
                  backgroundColor: "#5c6ebe",
                  padding: 10,
                  borderRadius: 8,
                  marginRight: 10,
                }}
              >
                <Text style={{ color: "#fff" }}>Accept</Text>
              </Pressable>

              <Pressable
                onPress={() => rejectInvite(item.id)}
                style={{
                  backgroundColor: "#ccc",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text>Reject</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}