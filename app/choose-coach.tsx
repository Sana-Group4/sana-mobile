import { SafeAreaView, View, Text, Pressable, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { styles } from "./loginStyle";

const API_URL = "http://192.168.0.62:8000";

export default function ChooseCoach() {
  const [loading, setLoading] = useState(false);

  const becomeCoach = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/become-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        router.replace("/tabs/coach/coach_home");
      } else {
        const text = await res.text();
        Alert.alert("Error", text);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const continueAsClient = () => {
    router.replace("/tabs/client/client_home");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shadowWrapper}>
        <View style={styles.container}>
          <View style={styles.contentBox}>
            <Text style={styles.title}>Become a Coach?</Text>

            <Text style={{ textAlign: "center", marginBottom: 25 }}>
              Would you like to register as a coach?  
              This cannot be changed later.
            </Text>

            <Pressable
              onPress={becomeCoach}
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Updating..." : "Yes, Become a Coach"}
              </Text>
            </Pressable>

            <Pressable
              onPress={continueAsClient}
              style={[styles.button, { marginTop: 15 }]}
            >
              <Text style={styles.buttonText}>No, Continue as Client</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}