import { supabase } from "./supabase";
import { GeminiProvider } from "./llm";
import type { ChatMessage, LLMProvider } from "./llm";

// ─── Pluggable LLM Provider ────────────────────────────────
// Swap this to change the AI backend. Only this line needs to change.
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const llm: LLMProvider = new GeminiProvider(apiKey);

// ─── System Prompt ──────────────────────────────────────────
const SYSTEM_PROMPT = `You are a friendly and knowledgeable plant care assistant for "Exotic Nursery", a shop specializing in rare and exotic plants.

Your responsibilities:
- Answer questions about plant care, growing conditions, and maintenance
- Provide specific advice about exotic plants (Monstera, Philodendron, Alocasia, Calathea, Hoya, succulents, etc.)
- Give tips on watering frequency, sunlight needs, soil mix, humidity, fertilizing, and pest control
- Help diagnose plant problems from descriptions (yellowing leaves, drooping, spots, etc.)
- Suggest plants based on the user's environment (low light, bright indirect, outdoor, etc.)
- Be enthusiastic about plants! Use relevant emojis 🌿🪴🌱

Rules:
- Keep responses concise (2-4 paragraphs max unless the user asks for detail)
- If you don't know something, say so honestly
- Don't provide medical advice about plant toxicity beyond general "keep away from pets/children" warnings
- Always relate answers back to practical, actionable advice
- If asked about ordering or prices, mention they can browse the Exotic Nursery catalog in the app

You are NOT a general-purpose AI. If asked non-plant questions, politely redirect: "I'm your plant care assistant! I can help with anything related to plants and gardening. 🌿"`;

// ─── Chat History (Supabase) ────────────────────────────────

export interface ChatHistoryItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getChatHistory(limit = 50): Promise<ChatHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_history")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ChatHistoryItem[];
}

export async function saveChatMessage(
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("chat_history")
    .insert({ user_id: user.id, role, content });

  if (error) console.error("Failed to save chat message:", error);
}

export async function clearChatHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("chat_history")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}

// ─── Send Message to LLM ───────────────────────────────────

export async function sendChatMessage(
  userMessage: string,
  history: ChatHistoryItem[]
): Promise<string> {
  // Build message context from recent history (last 10 messages for context window)
  const recentHistory = history.slice(-10);
  const messages: ChatMessage[] = recentHistory.map((h) => ({
    role: h.role,
    content: h.content,
  }));

  // Add the new user message
  messages.push({ role: "user", content: userMessage });

  // Call the LLM
  const response = await llm.sendMessage(messages, SYSTEM_PROMPT);
  return response;
}

// ─── Predefined Questions ───────────────────────────────────

export const SUGGESTED_QUESTIONS = [
  "How often should I water my Monstera? 💧",
  "Best indoor plants for low light rooms?",
  "My plant leaves are turning yellow — why?",
  "How to repot a plant safely? 🪴",
  "What soil mix is best for succulents?",
  "How to increase humidity for tropical plants?",
];
