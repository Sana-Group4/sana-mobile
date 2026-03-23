import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { styles } from "./loginStyle";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ChooseCoach() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Error", "Access token missing. Please log in again.");
        router.replace("/"); // send back to login
        return;
      }
      setAccessToken(token);
    };
    loadToken();
  }, []);

  const becomeCoach = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/update_account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_coach: true }),
      });

      if (res.ok) {
        router.replace("/tabs/coach/coach-home");
      } else {
        const errorData = await res.json();
        Alert.alert("Error", errorData.detail || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const continueAsClient = () => {
    router.replace("/tabs/client/client-home");
  };

  if (!accessToken) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shadowWrapper}>
        <View style={styles.container}>
          <View style={styles.contentBox}>
            <Text style={styles.title}>Become a Coach?</Text>
            <Text style={{ textAlign: "center", marginBottom: 25 }}>
              Would you like to register as a coach? This cannot be changed later.
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