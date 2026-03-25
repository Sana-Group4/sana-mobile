import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
const API_URL = Constants.expoConfig?.extra?.API_URL || "http://192.168.1.119:8000";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function ClientHome() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const token = await AsyncStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/api/client/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setTodos(data);
        } else {
          setTodos([]);
        }
      } catch (err) {
        setTodos([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const refuseTask = (id: string) => {
    // in the future this will send a refusal to the API
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 100 }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e9edf4",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827" }}>
            Current Tasks
          </Text>
          <Text style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
            Stay on track with what your coach assigned today.
          </Text>

          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <View
              style={{
                backgroundColor: "#eef2ff",
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 999,
                marginRight: 8,
              }}
            >
              <Text style={{ color: "#3730a3", fontWeight: "600", fontSize: 12 }}>
                Pending: {pendingCount}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#ecfdf5",
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "#166534", fontWeight: "600", fontSize: 12 }}>
                Completed: {completedCount}
              </Text>
            </View>
          </View>
        </View>

        {loadingTasks ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ textAlign: "center", color: "#6b7280" }}>Loading tasks...</Text>
          </View>
        ) : todos.length === 0 ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              padding: 24,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 15 }}>
              No tasks assigned yet. Your coach will assign tasks for you.
            </Text>
          </View>
        ) : (
          todos.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Pressable
                  onPress={() => toggleTodo(item.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: item.completed ? "#15803d" : "#4b5563",
                    borderRadius: 7,
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.completed ? "#15803d" : "#ffffff",
                  }}
                >
                  {item.completed && (
                    <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>✓</Text>
                  )}
                </Pressable>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 22,
                      color: item.completed ? "#6b7280" : "#111827",
                      textDecorationLine: item.completed ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      color: item.completed ? "#15803d" : "#4338ca",
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {item.completed ? "Completed" : "In progress"}
                  </Text>
                </View>
              </View>

              {!item.completed && (
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                  <Pressable
                    onPress={() => refuseTask(item.id)}
                    style={{
                      backgroundColor: "#fef2f2",
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontSize: 13, fontWeight: "600" }}>
                      Refuse
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}