import type { LLMProvider, ChatMessage } from "./interface";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GroqProvider implements LLMProvider {
  name = "groq-llama";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "Groq API key is not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file."
      );
    }

    // Build OpenAI-compatible messages array
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const body = {
      model: MODEL,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("No response from AI assistant");
        }

        return content;
      }

      if (response.status === 429) {
        lastError = new Error(
          "The AI assistant is temporarily busy. Please try again in a moment."
        );
        if (attempt < MAX_RETRIES) continue;
      } else if (response.status === 401) {
        throw new Error(
          "Groq API key is invalid. Please check your API key at https://console.groq.com/keys"
        );
      } else if (response.status === 400) {
        throw new Error(
          "Sorry, I couldn't process that request. Please try rephrasing your question."
        );
      } else {
        throw new Error(
          `Sorry, something went wrong (error ${response.status}). Please try again.`
        );
      }
    }

    throw lastError ?? new Error("Failed to get a response. Please try again.");
  }
}
