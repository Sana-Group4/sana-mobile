import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

const API_URL = Constants.expoConfig?.extra?.API_URL;

// Predefined activity templates
const ACTIVITY_TEMPLATES = [
  { label: "Running", unit: "km" },
  { label: "Push Ups", unit: "reps" },
  { label: "Cycling", unit: "km" },
  { label: "Plank", unit: "seconds" },
  { label: "Walking", unit: "steps" },
];

export default function AddActivity() {
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Your inputs go here */}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  const { clientId } = useLocalSearchParams();
  const router = useRouter();

  const [selected, setSelected] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [loading, setLoading] = useState(false);

  const createActivity = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");

      const body = {
        name: selected.label,
        description,
        target_value: targetValue ? parseFloat(targetValue) : null,
        unit: selected.unit,
        activity_type: "custom",
        progress_value: 0,
        status: "pending",
        assigned_at: new Date().toISOString(),
      };

      const res = await fetch(
        `${API_URL}/api/activities?assigned_to=${clientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.detail || "Failed to create activity");
        return;
      }

      Alert.alert("Success", "Activity created!");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f4f6", padding: 16 }}>

      {/* HEADER */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          Create Activity
        </Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          Choose a template or customize below
        </Text>
      </View>

      {/* TEMPLATE SELECT */}
      <Text style={{ fontWeight: "700", marginBottom: 8 }}>
        Activity Type
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {ACTIVITY_TEMPLATES.map((item) => {
          const isSelected = selected?.label === item.label;

          return (
            <Pressable
              key={item.label}
              onPress={() => setSelected(item)}
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: isSelected ? "#5c6ebe" : "#fff",
                borderWidth: 1,
                borderColor: "#ddd",
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#fff" : "#111",
                  fontWeight: "600",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* DETAILS CARD */}
      {selected && (
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>
            Details
          </Text>

          <Text style={{ marginBottom: 6 }}>
            Unit: {selected.unit}
          </Text>

        <TextInput
        placeholder="Target value"
        placeholderTextColor="#9ca3af"
        value={targetValue}
        onChangeText={setTargetValue}
        keyboardType="numeric"
        style={input}
        />

        <TextInput
        placeholder="Description (optional)"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        style={input}
        />
        </View>
      )}

      {/* BUTTON */}
      <Pressable
        onPress={createActivity}
        disabled={!selected || loading}
        style={{
          marginTop: 20,
          backgroundColor: "#5c6ebe",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          opacity: !selected || loading ? 0.5 : 1,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {loading ? "Creating..." : "Create Activity"}
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const input = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
  marginTop: 10,
};