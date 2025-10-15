import 'dotenv/config';

export default {
  expo: {
    name: "FobsSMS Teachers",
    slug: "FOBS_SMS_TEACHER_MOBILE", // ✅ Slug must match EAS config
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2f373f"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fobssms.teachers"
    },
    android: {
      package: "com.fobssms.teachers", // ✅ Use a unique Android package ID
      versionCode: 1,
      permissions: [],
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#2f373f"
      },
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#2f373f"
      },
      statusBar: {
        translucent: true,
        barStyle: "dark-content"
      }
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      // Use EXPO_PUBLIC_ prefix for public environment variables
      // These will be embedded at build time
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fobssms.com/api',
      webBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://fobssms.com',
      eas: {
        projectId: "43fa6ebf-40dc-45ff-a417-749fe024cd11" // ✅ Project ID linked to EAS
      }
    }
  }
};
