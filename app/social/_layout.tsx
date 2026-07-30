import { Stack } from "expo-router";

export default function SocialRoutesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="compose" options={{ presentation: "fullScreenModal" }} />
    </Stack>
  );
}
