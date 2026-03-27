/** Pluggable LLM provider interface.
 * Swap providers by changing the import in chat.ts.
 * Currently: Gemini Flash (free tier).
 * Future: OpenAI, Anthropic, etc.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMProvider {
  name: string;
  sendMessage(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string>;
}
