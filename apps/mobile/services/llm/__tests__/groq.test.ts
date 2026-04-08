import { describe, it, expect, vi, beforeEach } from "vitest";
import { GroqProvider } from "../groq";
import type { ChatMessage } from "../interface";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

const testMessages: ChatMessage[] = [
  { role: "user", content: "How do I water a Monstera?" },
];

describe("GroqProvider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("throws if API key is empty", async () => {
    const provider = new GroqProvider("");
    await expect(
      provider.sendMessage(testMessages, "You are helpful.")
    ).rejects.toThrow("API key is not configured");
  });

  it("returns content on successful response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { content: "Water weekly, let soil dry." } }],
      })
    );

    const provider = new GroqProvider("gsk_test_key");
    const result = await provider.sendMessage(testMessages, "System prompt");

    expect(result).toBe("Water weekly, let soil dry.");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify request body
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.model).toBe("llama-3.3-70b-versatile");
    expect(callBody.messages[0].role).toBe("system");
    expect(callBody.messages[1].role).toBe("user");
  });

  it("throws on empty content in response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: "" } }] })
    );

    const provider = new GroqProvider("gsk_test_key");
    await expect(
      provider.sendMessage(testMessages, "System prompt")
    ).rejects.toThrow("No response from AI assistant");
  });

  it("retries on 429 and succeeds on retry", async () => {
    vi.useFakeTimers();
    // First call: 429, second call: success
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429))
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { content: "Success after retry" } }],
        })
      );

    const provider = new GroqProvider("gsk_test_key");
    const promise = provider.sendMessage(testMessages, "System prompt");

    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result).toBe("Success after retry");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws after exhausting retries on 429", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValue(jsonResponse({ error: "rate limited" }, 429));

    const provider = new GroqProvider("gsk_test_key");
    // Catch the promise immediately so the rejection is handled
    let caughtError: Error | undefined;
    const promise = provider.sendMessage(testMessages, "System prompt").catch((e: Error) => {
      caughtError = e;
    });

    // Advance through retry delays
    await vi.advanceTimersByTimeAsync(10000);
    await promise;

    expect(caughtError?.message).toContain("temporarily busy");
    // 1 initial + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("throws immediately on 401 (invalid key)", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "unauthorized" }, 401)
    );

    const provider = new GroqProvider("gsk_bad_key");
    await expect(
      provider.sendMessage(testMessages, "System prompt")
    ).rejects.toThrow("API key is invalid");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws immediately on 400 (bad request)", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "bad request" }, 400)
    );

    const provider = new GroqProvider("gsk_test_key");
    await expect(
      provider.sendMessage(testMessages, "System prompt")
    ).rejects.toThrow("couldn't process that request");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws on unexpected status codes", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "server error" }, 500)
    );

    const provider = new GroqProvider("gsk_test_key");
    await expect(
      provider.sendMessage(testMessages, "System prompt")
    ).rejects.toThrow("error 500");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sends system prompt and conversation history", async () => {
    const history: ChatMessage[] = [
      { role: "user", content: "What is a Monstera?" },
      { role: "assistant", content: "It's a tropical plant." },
      { role: "user", content: "How do I care for it?" },
    ];

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { content: "Bright indirect light." } }],
      })
    );

    const provider = new GroqProvider("gsk_test_key");
    await provider.sendMessage(history, "You are Aloe AI.");

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages).toHaveLength(4); // 1 system + 3 history
    expect(callBody.messages[0].content).toBe("You are Aloe AI.");
    expect(callBody.messages[3].content).toBe("How do I care for it?");
  });
});
