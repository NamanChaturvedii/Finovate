import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "finance platform-ai", // Unique app ID
  name: "Finance Platform-ai",
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxAttempts: 2,
  }),
});