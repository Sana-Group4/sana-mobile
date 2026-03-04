import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
      }}
    >
      <Tabs.Screen
        name="client_home"
        options={{
          title: "Home",
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Sana",
          tabBarIcon: () => <Text>✨</Text>,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: () => <Text>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}