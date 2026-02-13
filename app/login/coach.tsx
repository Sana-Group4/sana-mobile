import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function CoachLogin() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      {/* Image Stack */}
      <View style={{ position: "relative" }}>
        
       <View
        style={{
            alignItems: "center",
        }}
        >
        <View
            style={{
            width: 300,
            height: 240,
            overflow: "hidden",
            borderRadius: 16,
            }}
        >
            <Image
            source={require("../../assets/images/gym.png")}
            style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
            }}
            />
        </View>
        </View>


        {/* Coach Image (overlapping) */}
        <Image
          source={require("../../assets/images/coach.png")}
          style={{
            width: 180,
            height: 180,
            resizeMode: "contain",
            position: "absolute",
            bottom: -50,
            alignSelf: "center",
            zIndex: 10,
          }}
        />
      </View>

      {/* Content */}
      <View style={{ padding: 24, marginTop: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 8, alignSelf: "center"}}>
          Coach Login
        </Text>

        <Text style={{ fontSize: 16, marginBottom: 24, alignSelf: "center" }}>
          Log in to manage your athletes
        </Text>

        <View style={{ marginBottom: 16, width: "85%", alignSelf: "center" }}>

        <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            }}
        />
        </View>

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={{
            width: "85%",
            alignSelf: "center",
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        />

        <Pressable
          onPress={() => console.log("Coach login")}
          style={{
            width: "85%",
            alignSelf: "center",
            backgroundColor: "#000",
            padding: 16,
            borderRadius: 22,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Login
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/register/coach")}>
          <Text style={{ textAlign: "center" }}>
            Don’t have an account?{" "}
            <Text style={{ color: "blue" }}>Register</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
