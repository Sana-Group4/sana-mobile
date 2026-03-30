import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Activity {
  id: number;
  name: string;
  description: string;
  status: "PENDING" | "COMPLETED";
  activity_type: string;
  target_value: number | null;
  progress_value: number;
  unit: string | null;
  assigned_at: string;
  due_at: string | null;
  user_id: number;
  assigned_by_id: number;
  assigned_by_coach: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoachHome() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Add task modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Load clients ────────────────────────────────────────────────────────────
  const loadClients = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/coach/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Failed to load clients:", err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // ── Load activities ─────────────────────────────────────────────────────────
  const loadActivities = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const selfAssigned = Array.isArray(data)
        ? data.filter((a: Activity) => !a.assigned_by_coach)
        : [];
      setActivities(selfAssigned);
    } catch (err) {
      console.log("Failed to load activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadClients();
    loadActivities();
  }, []);

  // ── Create activity (self-assign) ───────────────────────────────────────────
  const createActivity = async () => {
    if (!newTaskName.trim()) return;
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(`${API_URL}/api/activities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTaskName.trim(),
          description: newTaskDesc.trim() || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Error", err.detail ?? "Failed to create task");
        return;
      }

      setNewTaskName("");
      setNewTaskDesc("");
      setModalVisible(false);
      loadActivities();
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Complete (delete) activity ──────────────────────────────────────────────
  const completeActivity = async (activity: Activity) => {
    setDeletingIds((prev) => new Set(prev).add(activity.id));

    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/activities/${activity.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(activity.id);
          return next;
        });
        Alert.alert("Error", "Failed to remove task");
        return;
      }

      setTimeout(() => {
        setActivities((prev) => prev.filter((a) => a.id !== activity.id));
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(activity.id);
          return next;
        });
      }, 600);
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(activity.id);
        return next;
      });
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView
          style={{ flex: 1, paddingTop: 50 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* ── My Clients ── */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                marginBottom: 16,
                paddingHorizontal: 16,
              }}
            >
              My Clients
            </Text>
            {loadingClients ? (
              <Text style={{ paddingHorizontal: 16 }}>Loading clients...</Text>
            ) : clients.length === 0 ? (
              <Text style={{ paddingHorizontal: 16, color: "#9ca3af" }}>
                No clients yet
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {clients.map((client) => (
                  <View
                    key={client.id}
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: 16,
                      padding: 16,
                      width: 160,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: "#dbeafe",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>👤</Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {client.firstName} {client.lastName}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      ID: {client.id}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── My Tasks ── */}
          <View style={{ paddingHorizontal: 16, marginBottom: 40 }}>
            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "600" }}>My Tasks</Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={{
                  backgroundColor: "#3b82f6",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                  + Add Task
                </Text>
              </Pressable>
            </View>

            {loadingActivities ? (
              <Text style={{ color: "#9ca3af" }}>Loading tasks...</Text>
            ) : activities.length === 0 ? (
              <View
                style={{
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 12,
                  borderStyle: "dashed",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                  No tasks yet — add one above
                </Text>
              </View>
            ) : (
              <FlatList
                data={activities}
                scrollEnabled={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isDeleting = deletingIds.has(item.id);
                  return (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        borderWidth: 1,
                        borderColor: isDeleting ? "#bbf7d0" : "#e5e7eb",
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundColor: isDeleting ? "#f0fdf4" : "#fff",
                      }}
                    >
                      {/* Checkbox */}
                      <Pressable
                        onPress={() => !isDeleting && completeActivity(item)}
                        style={{
                          width: 22,
                          height: 22,
                          borderWidth: 2,
                          borderColor: isDeleting ? "#22c55e" : "#3b82f6",
                          borderRadius: 4,
                          marginRight: 12,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: isDeleting ? "#22c55e" : "#fff",
                        }}
                      >
                        {isDeleting && (
                          <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>
                        )}
                      </Pressable>

                      {/* Text */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: isDeleting ? "#9ca3af" : "#111",
                            textDecorationLine: isDeleting ? "line-through" : "none",
                          }}
                        >
                          {item.name}
                        </Text>
                        {!!item.description && item.description.trim() && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              marginTop: 2,
                              textDecorationLine: isDeleting ? "line-through" : "none",
                            }}
                          >
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </ScrollView>

        {/* ── Add Task Modal ── */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
            }}
            onPress={() => setModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%" }}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: 24,
                    paddingBottom: 40,
                    maxHeight: "90%",
                  }}
                >
                  {/* Handle */}
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

                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      marginBottom: 16,
                      color: "#111",
                    }}
                  >
                    New Task
                  </Text>

                  {/* Name */}
                  <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                    Task name *
                  </Text>
                  <TextInput
                    value={newTaskName}
                    onChangeText={setNewTaskName}
                    placeholder="e.g. Review client programme"
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 14,
                    }}
                  />

                  {/* Description */}
                  <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                    Description (optional)
                  </Text>
                  <TextInput
                    value={newTaskDesc}
                    onChangeText={setNewTaskDesc}
                    placeholder="Any extra details..."
                    multiline
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 20,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                  />

                  {/* Button */}
                  <Pressable
                    onPress={createActivity}
                    disabled={submitting || !newTaskName.trim()}
                    style={{
                      backgroundColor:
                        submitting || !newTaskName.trim()
                          ? "rgba(92,110,190,0.7)"
                          : "rgba(92,110,190,0.7)",
                      padding: 14,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {submitting ? "Saving..." : "Add Task"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}