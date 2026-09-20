import { StyleSheet, Text, View } from "react-native";
import { Colors, FontFamily, Space } from "@/constants/theme";

export default function Home() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Word Rogue</Text>
      <Text style={styles.subtitle}>M0 scaffold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    paddingHorizontal: Space.xl,
  },
  title: {
    color: Colors.accent,
    fontFamily: FontFamily.base,
    fontSize: 32,
  },
  subtitle: {
    color: Colors.inkDim,
    fontFamily: FontFamily.base,
    fontSize: 15,
    marginTop: Space.sm,
  },
});
