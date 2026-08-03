import { Alert, Platform } from "react-native";

/**
 * Cross-platform dialogs.
 *
 * `Alert.alert` is a no-op on React Native Web, so any action gated behind a
 * confirmation — deleting a post, cancelling a request — silently did nothing
 * in the web app. These helpers fall back to the browser dialogs.
 */
export function notify(title: string, message?: string, onDismiss?: () => void) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }
  Alert.alert(title, message, onDismiss ? [{ text: "OK", onPress: onDismiss }] : undefined);
}

export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  if (Platform.OS === "web") {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
