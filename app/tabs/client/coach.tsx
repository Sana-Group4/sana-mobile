import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, ScrollView, Text, View } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ClientCoachPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/api/get-coach-invites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setInvites(data);
        } else {
          setInvites([]);
        }
      } catch (err) {
        setInvites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvites();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
            My Coaches
          </Text>
          <Text style={{ color: "#888", marginBottom: 32 }}>
            (Your coaches will appear here.)
          </Text>

          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
            My Invites
          </Text>
          {loading ? (
            <Text>Loading invites...</Text>
          ) : invites.length === 0 ? (
            <Text style={{ color: "#888" }}>No invites</Text>
          ) : (
            <FlatList
              data={invites}
              keyExtractor={(item, idx) => `${item.coach_id}-${item.client_id}-${idx}`}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "#f0f6ff",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#b3d1ff",
                  }}
                >
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>
                    Coach ID: {item.coach_id}
                  </Text>
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    Expires: {new Date(item.expires).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}