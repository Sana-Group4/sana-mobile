import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "rgb(92,110,190)",
        tabBarInactiveTintColor: "#000",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          transitionDuration: "120ms",
        },
      }}
    >
      <Tabs.Screen
        name="coach-home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Sana",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* hidden routes */}
      <Tabs.Screen name="account/edit-profile" options={{ href: null }} />
      <Tabs.Screen name="account/add-device" options={{ href: null }} />
      <Tabs.Screen name="client-info/client-screen" options={{ href: null }} />
      <Tabs.Screen name="client-info/client-details" options={{ href: null }} />
      <Tabs.Screen name="client-info/add-activity" options={{ href: null }} />
    </Tabs>
  );
}