import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "rgb(92,110,190)", // purple when active
        tabBarInactiveTintColor: "#000", // black when inactive
        // animationEnabled and tabBarStyle are not supported in expo-router Tabs
      }}
    >
      <Tabs.Screen
        name="client-home"
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
        name="coach"
        options={{
          title: "Coach",
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
      <Tabs.Screen
        name="account/change-password"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account/edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account/add-device"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account/notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account/bio-data-manual-input"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account/invites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics-metric"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="coach-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="manual-input"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}