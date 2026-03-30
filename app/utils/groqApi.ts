import Constants from "expo-constants";

const GROQ_API_KEY = (Constants.expoConfig?.extra as { GROQ_API_KEY: string }).GROQ_API_KEY;

export async function askGroq(question: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant", // test model
      messages: [
        {
          role: "system",
          content: `
            You are Sana, a fitness and wellbeing assistant.
            You only answer questions related to fitness, health, and motivation.
            If a user asks about politics, illegal topics, or unrelated subjects,
            politely refuse and redirect to fitness topics.
            Keep responses under 125 words. Your purpose is to give a response to
            one message, and not to continue a conversation, as the user won't be able
            to respond to your prompt. Do not end your prompt with a question; aim
            to end the conversation.
          `,
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Groq request failed");
  }

  return data.choices[0].message.content;
}