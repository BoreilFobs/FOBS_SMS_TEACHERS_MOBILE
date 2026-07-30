import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radii, typography } from "@/constants/theme";

export function Avatar({
  name,
  uri,
  size = 46,
}: {
  name: string;
  uri?: string;
  size?: number;
}) {
  const { colors } = useAppTheme();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={name}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
        },
      ]}
    >
      <Text style={[typography.label, { color: colors.primary }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
