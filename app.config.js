export default {
  expo: {
    name: "FobsSMS Teachers",
    slug: "FOBS_SMS_TEACHER_MOBILE",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "fobssmsteachermobile",
    newArchEnabled: true,
    userInterfaceStyle: "automatic", // This follows the system theme
    // SDK 57 removed the top-level `splash` key; it is configured via the plugin below.
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          resizeMode: "contain",
          backgroundColor: "#2f373f"
        }
      ],
      [
        // Required for profile photo upload: iOS refuses library access without
        // a usage description, and Android needs the media permissions.
        "expo-image-picker",
        {
          photosPermission:
            "Allow FobsSMS to access your photos so you can set a profile picture.",
          cameraPermission:
            "Allow FobsSMS to use the camera so you can take a profile picture."
        }
      ],
      [
        // Saving a received chat image into the device gallery.
        "expo-media-library",
        {
          photosPermission:
            "Allow FobsSMS to access your photos so you can save images from your chats.",
          savePhotosPermission:
            "Allow FobsSMS to save images from your chats to your photos.",
          isAccessMediaLocationEnabled: false
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
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    experiments: {
      typedRoutes: true
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
