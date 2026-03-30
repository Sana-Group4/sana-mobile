import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "pending" | "accepted" | "rejected";

interface Booking {
  id: number;
  client_id: number;
  coach_id: number;
  session_title: string;
  session_desc: string;
  date_time: string;
  session_duration: number;
  status?: BookingStatus;

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const statusColour: Record<BookingStatus, string> = {
  pending: "#f59e0b",
  accepted: "#22c55e",
  rejected: "#ef4444",
};

const statusLabel: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const router = useRouter();

  // ── Load clients ────────────────────────────────────────────────────────────
  const loadClients = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/coach/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClients(data);
      return data;
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  // ── Load bookings for all clients ───────────────────────────────────────────
  const loadBookings = async (clientList: any[]) => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const results = await Promise.all(
        clientList.map((client) =>
          fetch(`${API_URL}/api/coach-get-sessions?client_id=${client.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json())
        )
      );

      // Flatten; filter out error/empty responses
      const all: Booking[] = results
        .flat()
        .filter((item): item is Booking => item && typeof item.id === "number");

      // Sort newest first
      all.sort(
        (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      );

      setBookings(all);
    } catch (err) {
      console.log(err);
    }
  };

  const loadAll = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    const clientList = await loadClients();
    await loadBookings(clientList);
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll(false);
    setRefreshing(false);
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ── Add client ──────────────────────────────────────────────────────────────
  const addClient = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const cleanId = parseInt(clientId, 10);

      if (isNaN(cleanId)) {
        Alert.alert("Error", "Invalid client ID");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/client-invite?client_id=${cleanId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const data = await res.json();
        Alert.alert("Error", data.detail);
        return;
      }

      setClientId("");
      loadAll();
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ── Remove client ───────────────────────────────────────────────────────────
  const removeClient = (id: number) => {
    Alert.alert("Remove Client", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");
            await fetch(`${API_URL}/api/coach/remove-client?client_id=${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            loadAll();
          } catch {
            Alert.alert("Error", "Failed to remove client");
          }
        },
      },
    ]);
  };

  // ── View client ─────────────────────────────────────────────────────────────
  const viewClient = (client: any) => {
    router.push({
      pathname: "/tabs/coach/client-info/client-details",
      params: { client: JSON.stringify(client) },
    });
  };

  // ── Accept / Reject booking ─────────────────────────────────────────────────
  // NOTE: You will need to add two backend endpoints:
  //   PATCH /api/coach/sessions/{session_id}/accept  → sets status = "accepted"
  //   PATCH /api/coach/sessions/{session_id}/reject  → sets status = "rejected"
  // Then the client's /client-get-sessions should filter to only return accepted sessions.
  const handleBookingAction = async (
    booking: Booking,
    action: "accept" | "reject"
  ) => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(
        `${API_URL}/api/coach/sessions/${booking.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        Alert.alert("Error", `Failed to ${action} booking`);
        return;
      }

      // Optimistically update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: action === "accept" ? "accepted" : "rejected" }
            : b
        )
      );
      setSelectedBooking(null);
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 180 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {/* ── My Clients ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700" }}>My Clients</Text>
          <Pressable
            onPress={() => void onRefresh()}
            style={{
              backgroundColor: "#e5e7eb",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#111827", fontWeight: "600", fontSize: 13 }}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={clients}
          numColumns={3}
          scrollEnabled={false}
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
              <Text style={{ fontWeight: "600", fontSize: 13 }}>
                {item.firstName}
              </Text>
              <Text style={{ fontSize: 10, color: "#666" }}>ID: {item.id}</Text>
            </Pressable>
          )}
        />

        {/* ── My Bookings ── */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            padding: 16,
            paddingTop: 20,
          }}
        >
          My Bookings
        </Text>

        {bookings.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#888",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            No bookings yet
          </Text>
        ) : (
          <FlatList
            data={bookings}
            numColumns={3}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => {
              const status: BookingStatus = item.status ?? "pending";
              return (
                <Pressable
                  onPress={() => setSelectedBooking(item)}
                  style={{
                    width: "31%",
                    margin: "1%",
                    aspectRatio: 1,
                    backgroundColor: "#f0fdf4",
                    borderRadius: 12,
                    padding: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#bbf7d0",
                  }}
                >
                  {/* Status dot */}
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: statusColour[status],
                    }}
                  />

                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#dcfce7",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>📅</Text>
                  </View>

                  <Text
                    style={{ fontWeight: "600", fontSize: 12, textAlign: "center" }}
                    numberOfLines={1}
                  >
                    {item.session_title}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                    {formatDate(item.date_time)}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </ScrollView>

      {/* ── Add Client Input ── */}
      <View style={{ position: "absolute", bottom: 80, left: 16, right: 16 }}>
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

      <View style={{ position: "absolute", bottom: 20, left: 16, right: 16 }}>
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

      {/* ── Booking Detail Modal ── */}
      <Modal
        visible={!!selectedBooking}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBooking(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={() => setSelectedBooking(null)}
        >
          {/* Stop touch propagation so tapping inside doesn't close */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedBooking && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                {/* Handle bar */}
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: "#e5e7eb",
                    borderRadius: 2,
                    alignSelf: "center",
                    marginBottom: 20,
                  }}
                />

                {/* Status badge */}
                <View style={{ flexDirection: "row", marginBottom: 16 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor:
                        statusColour[selectedBooking.status ?? "pending"] + "22",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color:
                          statusColour[selectedBooking.status ?? "pending"],
                      }}
                    >
                      {statusLabel[selectedBooking.status ?? "pending"]}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#111",
                    marginBottom: 8,
                  }}
                >
                  {selectedBooking.session_title}
                </Text>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 14,
                    color: "#555",
                    marginBottom: 20,
                    lineHeight: 20,
                  }}
                >
                  {selectedBooking.session_desc || "No description provided."}
                </Text>

                {/* Info rows */}
                {[
                  {
                    icon: "📅",
                    label: "Date",
                    value: formatDate(selectedBooking.date_time),
                  },
                  {
                    icon: "🕐",
                    label: "Time",
                    value: formatTime(selectedBooking.date_time),
                  },
                  {
                    icon: "⏱️",
                    label: "Duration",
                    value: selectedBooking.session_duration
                      ? `${selectedBooking.session_duration} min`
                      : "Not set",
                  },
                  {
                    icon: "👤",
                    label: "Client ID",
                    value: `#${selectedBooking.client_id}`,
                  },
                ].map((row) => (
                  <View
                    key={row.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>
                      {row.icon}
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: "#888", width: 70 }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#222",
                      }}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}

                {/* Accept / Reject — only show if pending */}
                {(selectedBooking.status ?? "pending") === "pending" && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        handleBookingAction(selectedBooking, "reject")
                      }
                      style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: "#fef2f2",
                        borderWidth: 1,
                        borderColor: "#fca5a5",
                      }}
                    >
                      <Text
                        style={{ color: "#ef4444", fontWeight: "600" }}
                      >
                        Reject
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        handleBookingAction(selectedBooking, "accept")
                      }
                      style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: "#f0fdf4",
                        borderWidth: 1,
                        borderColor: "#86efac",
                      }}
                    >
                      <Text
                        style={{ color: "#22c55e", fontWeight: "600" }}
                      >
                        Accept
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Close */}
                <Pressable
                  onPress={() => setSelectedBooking(null)}
                  style={{ marginTop: 16, alignItems: "center" }}
                >
                  <Text style={{ color: "#aaa", fontSize: 13 }}>Close</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}