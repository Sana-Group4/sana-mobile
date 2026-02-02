import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from "react-native";

import { styles } from "./coachStyle";
import { router } from "expo-router";
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';


export default function CoachLogin() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Shadow wrapper */}
      <View style={styles.shadowWrapper}>
        {/* Inner login panel */}
        <View style={styles.container}>
          {/* Top image */}
          <View style={styles.imgBox}>
            <Image
              source={require("../../assets/images/athlete-resting.png")}
              style={styles.image}
            />
          </View>

          {/* Login content */}
          <View style={styles.contentBox}>
            <Text style={styles.title}>Login</Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            {/* Social login buttons */}
            <View style={styles.socialContainer}>
              <Pressable style={styles.socialButton}>
                <FontAwesome5 name="google" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton}>
                <FontAwesome name="phone" size={24} color="#5c6ebe" />
              </Pressable>

              <Pressable style={styles.socialButton}>
                <FontAwesome name="envelope" size={24} color="#5c6ebe" />
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/register/coach")}>
              <Text style={styles.register}>
                Not with us?{" "}
                <Text style={styles.registerLink}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
