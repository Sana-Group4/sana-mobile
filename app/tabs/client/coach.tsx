import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, SectionList, Text, View } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

export default function ClientCoachPage() {
  const router = useRouter();
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
      <SectionList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        sections={[
          {
            title: "My Coaches",
            data: loading ? [{ loading: true }] : coaches.length === 0 ? [{ empty: true }] : coaches,
            renderItem: ({ item }) => {
              if (item.loading) return <Text>Loading coaches...</Text>;
              if (item.empty) return <Text style={{ color: "#888", marginBottom: 32 }}>(You have no coaches yet.)</Text>;
              return (
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
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/tabs/client/coach-settings",
                        params: {
                          coachId: String(item.id),
                          firstName: item.firstName ?? "",
                          lastName: item.lastName ?? "",
                          username: item.username ?? "",
                          email: item.email ?? "",
                          phone: item.phone ?? "",
                        },
                      })
                    }
                    style={{
                      marginTop: 12,
                      alignSelf: "flex-start",
                      backgroundColor: "#5c6ebe",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                      Coach Settings
                    </Text>
                  </Pressable>
                </View>
              );
            },
          },
          {
            title: "My Invites",
            data: loading ? [{ loading: true }] : invites.length === 0 ? [{ empty: true }] : invites,
            renderItem: ({ item }) => {
              if (item.loading) return <Text>Loading invites...</Text>;
              if (item.empty) return <Text style={{ color: "#888" }}>No invites</Text>;
              return (
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
              );
            },
          },
        ]}
        keyExtractor={(item, index) => {
          if (item.id) return `coach-${item.id}`;
          if (item.coach_id && item.client_id) return `invite-${item.coach_id}-${item.client_id}`;
          return String(index);
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>{title}</Text>
        )}
        renderItem={({ item, section, index, separators }) => {
          if (section && typeof section.renderItem === 'function') {
            return section.renderItem({ item, section, index, separators });
          }
          return null;
        }}
      />
    </SafeAreaView>
  );
}