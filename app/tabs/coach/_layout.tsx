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
        name="coach_home"
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
        name="client"
        options={{
          title: "Client",
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