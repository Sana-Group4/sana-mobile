import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function ClientHome() {
  // dummy data, in the future this will be fetched from the API
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", text: "Complete 30-minute cardio session", completed: false },
    { id: "2", text: "Log today's meals in nutrition tracker", completed: true },
    { id: "3", text: "Attend yoga class at 6 PM", completed: false },
    { id: "4", text: "Drink 8 glasses of water", completed: false },
    { id: "5", text: "Review coach's workout plan", completed: true },
  ]);

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

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, paddingTop: 50 }}>
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16, color: "#1a1a1a" }}>
            Today's Overview
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: 16,
                padding: 16,
                width: (screenWidth - 44) / 2,
                borderWidth: 1,
                borderColor: "#dbeafe",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>👟</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#1e40af", marginBottom: 4 }}>
                8,234
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Steps</Text>
            </View>

            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 16,
                padding: 16,
                width: (screenWidth - 44) / 2,
                borderWidth: 1,
                borderColor: "#dcfce7",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>💪</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#15803d", marginBottom: 4 }}>
                45 min
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Exercise</Text>
            </View>

            <View
              style={{
                backgroundColor: "#fff7ed",
                borderRadius: 16,
                padding: 16,
                width: (screenWidth - 44) / 2,
                borderWidth: 1,
                borderColor: "#fed7aa",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>🔥</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#c2410c", marginBottom: 4 }}>
                1,842
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Calories</Text>
            </View>

            <View
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: 16,
                padding: 16,
                width: (screenWidth - 44) / 2,
                borderWidth: 1,
                borderColor: "#bae6fd",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>💧</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#0369a1", marginBottom: 4 }}>
                6/8
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Glasses</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16, color: "#1a1a1a" }}>
            Weekly Progress
          </Text>
          <View
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <LineChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                datasets: [
                  {
                    data: [12, 18, 10, 22, 16],
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                backgroundColor: "#f8f9fa",
                backgroundGradientFrom: "#f8f9fa",
                backgroundGradientTo: "#f8f9fa",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#3b82f6",
                  fill: "#ffffff",
                },
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: "#e5e7eb",
                  strokeDasharray: "0",
                },
              }}
              bezier
              style={{
                borderRadius: 16,
              }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withShadow={false}
            />
          </View>
        </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 100 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 16, marginBottom: 16 }}>
          My Tasks
        </Text>

        {todos.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
            No tasks assigned yet. Your coach will assign tasks for you.
          </Text>
        ) : (
          todos.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <Pressable
                onPress={() => toggleTodo(item.id)}
                style={{
                  width: 24,
                  height: 24,
                  borderWidth: 2,
                  borderColor: "#000",
                  borderRadius: 4,
                  marginRight: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: item.completed ? "#000" : "#fff",
                }}
              >
                {item.completed && (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>
                )}
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  textDecorationLine: item.completed ? "line-through" : "none",
                  color: item.completed ? "#888" : "#000",
                }}
              >
                {item.text}
              </Text>
              <Pressable
                onPress={() => refuseTask(item.id)}
                style={{
                  backgroundColor: "#fee",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#fcc",
                }}
              >
                <Text style={{ color: "#c00", fontSize: 14, fontWeight: "600" }}>
                  Refuse
                </Text>
              </Pressable>
            </View>
          ))
        )}
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
          onPress={() => router.push("/settings")}
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