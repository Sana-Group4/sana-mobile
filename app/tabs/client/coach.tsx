import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { FlatList, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ClientCoachPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  const fetchInvitesAndCoaches = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      // fetch invites
      const resInvites = await fetch(`${API_URL}/api/get-coach-invites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (resInvites.ok) {
        const data = await resInvites.json();
        setInvites(data);
      } else {
        setInvites([]);
      }

      // fetch coaches
      const resCoaches = await fetch(`${API_URL}/api/client/coaches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (resCoaches.ok) {
        const data = await resCoaches.json();
        setCoaches(data);
      } else {
        setCoaches([]);
      }
    } catch (err) {
      setInvites([]);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitesAndCoaches();
  }, []);

  const handleInviteAction = async (coach_id: number, action: "accept" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [coach_id]: true }));
    try {
      const token = await AsyncStorage.getItem("access_token");
      const endpoint = action === "accept" ? "/api/accept-invite" : "/api/reject-invite";
      await fetch(`${API_URL}${endpoint}?coach=${coach_id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchInvitesAndCoaches();
    } catch (err) {
    } finally {
      setActionLoading((prev) => ({ ...prev, [coach_id]: false }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
            My Coaches
          </Text>
          {loading ? (
            <Text>Loading coaches...</Text>
          ) : coaches.length === 0 ? (
            <Text style={{ color: "#888", marginBottom: 32 }}>
              (You have no coaches yet.)
            </Text>
          ) : (
            <FlatList
              data={coaches}
              keyExtractor={(item) => item.id.toString()}
              style={{ marginBottom: 32 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>
                    {item.firstName} {item.lastName} (@{item.username})
                  </Text>
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    Email: {item.email}
                  </Text>
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    Phone: {item.phone}
                  </Text>
                </View>
              )}
            />
          )}

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
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    <Pressable
                      onPress={() => handleInviteAction(item.coach_id, "accept")}
                      style={{
                        backgroundColor: "#4ade80",
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginRight: 10,
                        opacity: actionLoading[item.coach_id] ? 0.6 : 1,
                      }}
                      disabled={actionLoading[item.coach_id]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Accept
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleInviteAction(item.coach_id, "reject")}
                      style={{
                        backgroundColor: "#f87171",
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        opacity: actionLoading[item.coach_id] ? 0.6 : 1,
                      }}
                      disabled={actionLoading[item.coach_id]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Reject
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}