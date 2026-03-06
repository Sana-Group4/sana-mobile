import { router } from "expo-router"; //test
import { askGroq } from "../../utils/groqApi";
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

  const handleSubmit = async () => {
  if (!query.trim()) return;

  setSubmittedQuery(query);
  setAiResponse("Thinking...");

  try {
    const response = await askGroq(query);
    setAiResponse(response);
  } catch (error) {
    setAiResponse("Something went wrong. Please try again.");
    console.error(error);
  }

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
              Ask Sana about fitness & heatlh
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
                marginTop: 12,
                height: 50,
                borderRadius: 25,
                backgroundColor: "rgb(92,110,190)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#5c6ebe",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
                fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
              }}>
                Ask
              </Text>
            </Pressable>
          </View>
        )}

        {/* CHAT VIEW */}
        {submittedQuery && aiResponse && (
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            
            <View>
              {/* USER MESSAGE */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 }}>
                
                <View
                  style={{
                    alignSelf: "flex-end",
                    backgroundColor: "rgb(92,110,190)",
                    padding: 14,
                    borderRadius: 16,
                    borderTopRightRadius: 4,
                    maxWidth: "75%",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#fff" }}>
                    {submittedQuery}
                  </Text>
                </View>

                <Text style={{ fontSize: 22, marginLeft: 6 }}>👤</Text>
              </View>

              {/* AI MESSAGE */}
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 22, marginRight: 6 }}>🤖</Text>

                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#f1f5f9",
                    padding: 14,
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    maxWidth: "75%",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{aiResponse}</Text>
                </View>
              </View>
            </View>

            {/* Ask Again Button */}
            <Pressable
              onPress={handleReset}
              style={{
                marginBottom: 30,
                marginTop: 20,
                height: 50,
                borderRadius: 25,
                backgroundColor: "rgb(92,110,190)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#5c6ebe",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
                }}
              >
                Ask Again
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}