import { View, Text, Pressable, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Keyboard, TouchableWithoutFeedback, ScrollView } from "react-native";

export default function ClientDetails() {
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Your inputs go here */}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  const { client } = useLocalSearchParams();

  const parsed = JSON.parse(client as string);

  const addActivity = () => {
    Alert.alert("Add Activity", "This will be your next step 👀");
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20 }}>
        Client Details
      </Text>

      <Text>
        Name: {parsed.firstName} {parsed.lastName}
      </Text>

      <Text>Email: {parsed.email}</Text>
      <Text>ID: {parsed.id}</Text>

      <Pressable
        onPress={addActivity}
        style={{
          marginTop: 30,
          backgroundColor: "#5c6ebe",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff" }}>Add Activity</Text>
      </Pressable>
    </View>
  );
}