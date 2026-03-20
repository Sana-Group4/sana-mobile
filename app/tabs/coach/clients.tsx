import { ReactNode } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function clients({ children, title }: LayoutProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      {title && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "600" }}>{title}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}