import { router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function Chatbot() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!query.trim()) return;

    // store user query
    setSubmittedQuery(query);

    // fake AI response (placeholder)
    setAiResponse(
      "This is a placeholder response. AI integration will be added later."
    );

    setQuery("");
  };

  const handleReset = () => {
    setSubmittedQuery(null);
    setAiResponse(null);
    setQuery("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, padding: 20 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* INITIAL STATE */}
        {!submittedQuery && (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Ask Sana
            </Text>

            <TextInput
              placeholder="Type your question..."
              value={query}
              onChangeText={setQuery}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                marginBottom: 16,
              }}
            />

            <Pressable
              onPress={handleSubmit}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Ask
              </Text>
            </Pressable>
          </View>
        )}

        {/* CHAT VIEW */}
        {submittedQuery && aiResponse && (
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View>
              {/* AI Bubble (Left) */}
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#f1f5f9",
                  padding: 14,
                  borderRadius: 16,
                  borderTopLeftRadius: 4,
                  marginBottom: 12,
                  maxWidth: "80%",
                }}
              >
                <Text style={{ fontSize: 16 }}>{aiResponse}</Text>
              </View>

              {/* User Bubble (Right) */}
              <View
                style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#3b82f6",
                  padding: 14,
                  borderRadius: 16,
                  borderTopRightRadius: 4,
                  marginBottom: 12,
                  maxWidth: "80%",
                }}
              >
                <Text style={{ fontSize: 16, color: "#fff" }}>
                  {submittedQuery}
                </Text>
              </View>
            </View>

            {/* Ask Again Button */}
            <Pressable
              onPress={handleReset}
              style={{
                backgroundColor: "#111",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Ask Again
              </Text>
            </Pressable>
            
          </View>
          
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}