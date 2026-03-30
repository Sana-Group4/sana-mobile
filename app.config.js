import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "sana-mobile",
  slug: "sana-mobile",
  version: "1.0.0",
  android: {
    ...(config?.android ?? {}),
    package: "com.anonymous.sanamobile",
    usesCleartextTraffic: true,
  },
  extra: {
    ...(config?.extra ?? {}),
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_API_URL: process.env.GROQ_API_URL,
    API_URL: process.env.API_URL || config?.extra?.API_URL,
    MOCK_ANALYTICS:
      process.env.MOCK_ANALYTICS || config?.extra?.MOCK_ANALYTICS || "false",
    eas: {
      projectId: "e68e0817-42d7-4997-9329-802a41fde144",
    },
  },
});