import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ebeef1",
    justifyContent: "center",
    alignItems: "center",
  },

  // Shadow wrapper
  shadowWrapper: {
    borderRadius: 24,
    backgroundColor: "transparent",
    shadowColor: "rgba(92,110,190,0.5)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 10,
    shadowRadius: 20,
    elevation: 10,
    width: "90%",
  },

  container: {
    borderRadius: 24,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  imgBox: {
    width: "100%",
    height: 250,
    backgroundColor: "#fff",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  contentBox: {
    padding: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "rgba(0,0,0,0.8)",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
    borderBottomWidth: 3,
    borderBottomColor: "rgb(92,110,190)",
    alignSelf: "flex-start",
    paddingBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: "rgba(0,0,0,0.6)",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
  },

  inputBox: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 6,
    color: "rgba(0,0,0,0.8)",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
    paddingTop: 10,
  },

  input: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: "#f0f4f8",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
    shadowColor: "#5c6ebe",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  button: {
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
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },

  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ebeef1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5c6ebe",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  socialText: {
    fontSize: 24,
  },

  register: {
    marginTop: 20,
    textAlign: "center",
    color: "rgba(0,0,0,0.6)",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
  },

  registerLink: {
    color: "rgb(92,110,190)",
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Verdana" : "sans-serif",
  },
});