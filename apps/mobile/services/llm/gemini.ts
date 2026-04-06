import type { LLMProvider, ChatMessage } from "./interface";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiProvider implements LLMProvider {
  name = "gemini-flash";
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
        "Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file."
      );
    }

    // Convert to Gemini format
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate?.content?.parts?.[0]?.text) {
          throw new Error("No response from Gemini");
        }

        return candidate.content.parts[0].text;
      }

      // Handle specific error codes
      if (response.status === 429) {
        lastError = new Error(
          "The AI assistant is temporarily busy. Please try again in a moment."
        );
        // Retry on rate limit
        if (attempt < MAX_RETRIES) continue;
      } else if (response.status === 403) {
        throw new Error(
          "Gemini API key is invalid or disabled. Please check your API key at https://aistudio.google.com/apikey"
        );
      } else if (response.status === 400) {
        const errorData = await response.text();
        if (errorData.includes("API_KEY_INVALID")) {
          throw new Error(
            "Gemini API key is invalid. Please generate a new key at https://aistudio.google.com/apikey"
          );
        }
        throw new Error("Sorry, I couldn't process that request. Please try rephrasing your question.");
      } else {
        throw new Error(
          `Sorry, something went wrong (error ${response.status}). Please try again.`
        );
      }
    }

    throw lastError ?? new Error("Failed to get a response. Please try again.");
  }
}
