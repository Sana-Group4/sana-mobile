import { SafeAreaView, View, Text, Image, Pressable, Dimensions } from "react-native";
import { router } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      {/* Athlete Image*/}
      <View
        style={{
            width: screenWidth,
            height: 600,        // visible height
            overflow: "hidden", // crop anything outside
        }}
        >
        <Image
            source={require("../assets/images/athlete-resting.png")}
            style={{
            width: screenWidth,
            height: 600,       // original image height
            resizeMode: "cover", // fill container and crop
            }}
        />
        </View>


      {/* Content container with padding */}
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "flex-start" }}>
        
        {/* Title */}
        <Text style={{ fontSize: 28, fontWeight: "450", marginBottom: 8, marginTop: 8, textAlign: "center" }}>
          Welcome to Sana Sports
        </Text>

        <Text style={{ fontSize: 16, color: "#000", marginBottom: 20, textAlign: "center" }}>
          Log in to continue
        </Text>

        {/* Login Button */}
        <Pressable
          onPress={() => router.push("/login")}
          style={{
            backgroundColor: "#000",
            padding: 16,
            width: 300,
            alignSelf: "center",
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Login
          </Text>
        </Pressable>

        {/* Register Option */}
        <Pressable onPress={() => router.push("/register")}>
        <Text style={{ textAlign: "center", color: "#000" }}>
            Don’t have an account?{" "}
            <Text style={{ color: "blue" }}>Register</Text>
        </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
