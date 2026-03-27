import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1B5E20" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#F5F5F5" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
    </Stack>
  );
}
