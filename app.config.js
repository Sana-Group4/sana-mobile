import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "sana-mobile",
  slug: "sana-mobile",
  version: "1.0.0",
  extra: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_API_URL: process.env.GROQ_API_URL,
    API_URL: process.env.API_URL,
  },
});