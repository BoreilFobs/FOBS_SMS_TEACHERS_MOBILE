export default {
  expo: {
    name: "FobsSMS Teachers",
    slug: "FOBS_SMS_TEACHER_MOBILE",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic", // This follows the system theme
    // SDK 57 removed the top-level `splash` key; it is configured via the plugin below.
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          resizeMode: "contain",
          backgroundColor: "#2f373f"
        }
      ]
    ],
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fobssms.teachers"
    },
    android: {
      package: "com.fobssms.teachers",
      versionCode: 1,
      permissions: [],
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#2f373f"
      },
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fobssms.com/api',
      webBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://fobssms.com',
      eas: {
        projectId: "43fa6ebf-40dc-45ff-a417-749fe024cd11"
      }
    }
  }
};
