import { Alert, Platform } from "react-native";

/**
 * Makes `Alert.alert` work in the web app.
 *
 * React Native Web ships `class Alert { static alert() {} }` — an empty
 * function. Every action gated behind a confirmation therefore did nothing at
 * all in the browser: applying to a job, deleting a post, logging out,
 * blocking a teacher, discarding a marks draft, approving a school request.
 * The button looked live and the handler ran, but the dialog never appeared so
 * `onPress` was never reached.
 *
 * `utils/dialog.ts` is the explicit way to ask for a cross-platform dialog and
 * remains the right choice in new code. This shim exists because the call sites
 * predate it and are spread across seventeen screens: patching the platform gap
 * once fixes them together, and keeps a future `Alert.alert` from being dead on
 * arrival.
 *
 * Every call site in the app is either a single acknowledgement or a
 * cancel/confirm pair, which `window.alert` and `window.confirm` express
 * exactly. Three or more buttons cannot be represented by a native browser
 * dialog; such a call falls back to treating the last button as the confirming
 * one, so add those through a real in-app sheet instead.
 */

type AlertButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: (value?: string) => void;
};

export function installWebAlertShim(): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined") return;

  (Alert as unknown as { alert: (...args: unknown[]) => void }).alert = (
    ...args: unknown[]
  ) => {
    const title = (args[0] as string | undefined) ?? "";
    const message = args[1] as string | undefined;
    const buttons = (args[2] as AlertButton[] | undefined) ?? [];

    const body = message ? `${title}\n\n${message}` : title;

    // No buttons means a plain notice; RN itself renders a lone "OK".
    if (buttons.length <= 1) {
      window.alert(body);
      buttons[0]?.onPress?.();
      return;
    }

    // `style: "cancel"` marks the dismissing choice. When it is absent RN treats
    // the first button as the dismissing one, so mirror that rather than guess.
    const cancel = buttons.find((button) => button.style === "cancel") ?? buttons[0];
    const confirm = buttons.filter((button) => button !== cancel).pop();

    if (window.confirm(body)) confirm?.onPress?.();
    else cancel?.onPress?.();
  };
}
