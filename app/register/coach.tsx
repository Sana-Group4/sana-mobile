import { SafeAreaView, View, Text } from "react-native";

export default function CoachRegister() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "600" }}>Coach Register page</Text>
      </View>
    </SafeAreaView>
  );
}
