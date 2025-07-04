import 'dotenv/config';

export default {
  expo: {
    name: 'fobssms',
    slug: 'your-app',
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};
