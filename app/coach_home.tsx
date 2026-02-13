import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

interface Client {
  id: string;
  name: string;
  status: string;
  progress: number;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function CoachHome() {
  // dummy client data
  const clients: Client[] = [
    { id: "1", name: "Sarah Johnson", status: "Active", progress: 78 },
    { id: "2", name: "Mike Chen", status: "Active", progress: 92 },
    { id: "3", name: "Emma Davis", status: "Inactive", progress: 45 },
    { id: "4", name: "Alex Rivera", status: "Active", progress: 88 },
    { id: "5", name: "Lisa Brown", status: "Active", progress: 67 },
  ];

  // dummy todo data for coach
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", text: "Review Sarah's workout plan", completed: false },
    { id: "2", text: "Call Mike about nutrition goals", completed: true },
    { id: "3", text: "Prepare weekly training schedule", completed: false },
    { id: "4", text: "Update client progress reports", completed: false },
  ]);

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, paddingTop: 50 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16, paddingHorizontal: 16, color: "#1a1a1a" }}>
            My Clients
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {clients.map((client) => (
              <Pressable
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
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#dbeafe",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>👤</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#1a1a1a" }}>
                  {client.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: client.status === "Active" ? "#10b981" : "#9ca3af",
                      marginRight: 6,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{client.status}</Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>Progress</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#3b82f6" }}>
                      {client.progress}%
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${client.progress}%`,
                        backgroundColor: "#3b82f6",
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16, color: "#1a1a1a" }}>
            My Tasks
          </Text>
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
                  backgroundColor: "#fff",
                }}
              >
                <Pressable
                  onPress={() => toggleTodo(item.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: "#3b82f6",
                    borderRadius: 6,
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.completed ? "#3b82f6" : "#fff",
                  }}
                >
                  {item.completed && (
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>✓</Text>
                  )}
                </Pressable>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    textDecorationLine: item.completed ? "line-through" : "none",
                    color: item.completed ? "#9ca3af" : "#1a1a1a",
                  }}
                >
                  {item.text}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 20 }}>
                No tasks yet. You're all caught up!
              </Text>
            }
          />
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: "#ddd",
          backgroundColor: "#fff",
          paddingVertical: 12,
          paddingBottom: 20,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>🏠</Text>
          <Text style={{ fontSize: 12, fontWeight: "600" }}>Home</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>✨</Text>
          <Text style={{ fontSize: 12 }}>Sana</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
          <Text style={{ fontSize: 12 }}>Analytics</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>👤</Text>
          <Text style={{ fontSize: 12 }}>Coach</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>⚙️</Text>
          <Text style={{ fontSize: 12 }}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}