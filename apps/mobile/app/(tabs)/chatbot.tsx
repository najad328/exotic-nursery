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
import { colors, radius, shadows, spacing } from "../../theme";
import { AloeAvatar, AloeBadge, AloeIcon } from "../../components/AloeIcon";
import type { ChatHistoryItem } from "../../services/chat";

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef<ChatHistoryItem[]>([]);

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

  // Keep ref in sync with state so we always have latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

      // Use ref to get latest messages (avoids stale closure)
      const currentHistory = messagesRef.current;
      const response = await sendChatMessage(messageText, currentHistory);

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
        <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={styles.headerLeft}>
            <AloeIcon size={24} />
            <Text style={styles.headerText}>Aloe AI</Text>
          </View>
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <AloeAvatar size={88} />
          <Text style={styles.emptyTitle}>Aloe AI</Text>
          <Text style={styles.emptyGreeting}>Aloe there! 🌿</Text>
          <Text style={styles.emptySubtitle}>
            I'm your plant care assistant. Ask me about watering, sunlight, repotting, or diagnosing plant problems!
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
              {item.role === "assistant" && <AloeBadge />}
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
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { opacity: 0.4 }]} />
                    <View style={[styles.typingDot, { opacity: 0.6 }]} />
                    <View style={[styles.typingDot, { opacity: 0.8 }]} />
                  </View>
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
          placeholderTextColor={colors.textTertiary}
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
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.sendIcon}>&#8593;</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onBackground,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.3,
    marginTop: spacing.lg,
  },
  emptyGreeting: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onBackground,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: 300,
  },

  // Suggested questions
  suggestions: {
    marginTop: spacing.xxl,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    maxWidth: 360,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },

  // Messages
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userBubbleText: {
    color: colors.white,
  },
  assistantBubbleText: {
    color: colors.onSurface,
  },

  // Typing indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  typingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Error
  errorBar: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: "center",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 28 : spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.onSurface,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
});
