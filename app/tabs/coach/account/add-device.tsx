import { Text, View } from "react-native";
import { Keyboard, TouchableWithoutFeedback, ScrollView} from "react-native";

export default function AddDevice() {
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Your inputs go here */}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Add Device Screen</Text>
    </View>
  );
}