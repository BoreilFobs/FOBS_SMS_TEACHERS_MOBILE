import { Redirect } from "expo-router";

// Authentication/setup wrappers live at the primary tab boundary. The social
// network is now the main authenticated entry; My Schools remains available
// from the Home header and preserves the last selected school.
export default function EntryScreen() {
  return <Redirect href="/(tabs)/home" />;
}
