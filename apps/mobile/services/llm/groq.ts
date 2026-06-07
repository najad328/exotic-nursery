import type { LLMProvider, ChatMessage } from "./interface";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq free tier: 30 RPM, 14,400 req/day, 500K tokens/day (llama-3.3-70b)
const MODEL = "llama-3.3-70b-versatile";

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
    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Groq");
    }

    return content;
  }
}
