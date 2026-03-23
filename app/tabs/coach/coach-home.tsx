import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL;

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function CoachHome() {
  // ---------------- CLIENTS ----------------
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // ---------------- TODOS ----------------
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", text: "Review Sarah's workout plan", completed: false },
    { id: "2", text: "Call Mike about nutrition goals", completed: true },
  ]);

  const [newTask, setNewTask] = useState("");

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
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.warn("Expected array for clients, got:", data);
        setClients([]);
      }
    } catch (err) {
      console.log("Failed to load clients:", err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ---------------- TASKS ----------------
  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const addTask = () => {
    if (!newTask.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setNewTask("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, paddingTop: 50 }}>
        
        {/* ---------------- CLIENTS ---------------- */}
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
                {/* ICON + NAME ROW */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  
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

                {/* ID */}
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  ID: {client.id}
                </Text>

                {/* progress placeholder */}
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    Progress
                  </Text>

                  <Text style={{ fontSize: 12, fontWeight: "600" }}>
                    100%
                  </Text>

                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 3,
                      marginTop: 4,
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: "100%",
                        backgroundColor: "#3b82f6",
                      }}
                    />
                  </View>
                </View>
              </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ---------------- TASKS ---------------- */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16 }}>
            My Tasks
          </Text>

          {/* ADD TASK */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <TextInput
              value={newTask}
              onChangeText={setNewTask}
              placeholder="Add new task..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                padding: 10,
                marginRight: 8,
              }}
            />

            <Pressable
              onPress={addTask}
              style={{
                backgroundColor: "#3b82f6",
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Add
              </Text>
            </Pressable>
          </View>

          {/* TASK LIST */}
          <FlatList
            data={todos}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Pressable
                  onPress={() => toggleTodo(item.id)}
                  style={{
                    width: 22,
                    height: 22,
                    borderWidth: 2,
                    borderColor: "#3b82f6",
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.completed ? "#3b82f6" : "#fff",
                  }}
                >
                  {item.completed && (
                    <Text style={{ color: "#fff" }}>✓</Text>
                  )}
                </Pressable>

                <Text
                  style={{
                    flex: 1,
                    textDecorationLine: item.completed
                      ? "line-through"
                      : "none",
                  }}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}