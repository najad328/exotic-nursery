import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  getChatHistory,
  sendChatMessage,
  saveChatMessage,
  clearChatHistory,
  SUGGESTED_QUESTIONS,
} from "../../services/chat";
import type { ChatHistoryItem } from "../../services/chat";

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    try {
      setLoading(true);
      const history = await getChatHistory();
      setMessages(history);
    } catch {
      // Start with empty chat
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || sending) return;

    setInput("");
    setError("");

    // Optimistically add user message
    const userMsg: ChatHistoryItem = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setSending(true);
    try {
      // Save user message to DB
      await saveChatMessage("user", messageText);

      // Get AI response
      const response = await sendChatMessage(messageText, messages);

      // Add assistant message
      const assistantMsg: ChatHistoryItem = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to DB
      await saveChatMessage("assistant", response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);

      // Remove the optimistic user message on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMsg.id)
      );
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    try {
      await clearChatHistory();
      setMessages([]);
    } catch {
      // silently fail
    }
  }

  function scrollToEnd() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages.length]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header with clear button */}
      {messages.length > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>
            🌿 Plant Care Assistant
          </Text>
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Chat</Text>
          </Pressable>
        </View>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>Plant Care Assistant</Text>
          <Text style={styles.emptySubtitle}>
            Ask me anything about plant care, growing tips, or diagnosing plant problems!
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <Pressable
                key={q}
                style={styles.suggestionChip}
                onPress={() => handleSend(q)}
              >
                <Text style={styles.suggestionText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToEnd}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {item.role === "assistant" && (
                <Text style={styles.bubbleLabel}>🌿 Plant Assistant</Text>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user"
                    ? styles.userBubbleText
                    : styles.assistantBubbleText,
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            sending ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#1B5E20" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Error */}
      {error !== "" && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about plant care..."
          placeholderTextColor="#AAA"
          multiline
          maxLength={500}
          editable={!sending}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerText: { fontSize: 14, fontWeight: "600", color: "#1B5E20" },
  clearButton: { paddingHorizontal: 10, paddingVertical: 4 },
  clearButtonText: { fontSize: 13, color: "#999" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: "#1B5E20" },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  suggestions: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    maxWidth: 360,
  },
  suggestionChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  suggestionText: { fontSize: 13, color: "#1B5E20" },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: "#1B5E20",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleLabel: {
    fontSize: 11,
    color: "#1B5E20",
    fontWeight: "600",
    marginBottom: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: "#fff" },
  assistantBubbleText: { color: "#333" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 13, color: "#888" },
  errorBar: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#EF9A9A",
  },
  errorText: { color: "#C62828", fontSize: 12, textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendIcon: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
