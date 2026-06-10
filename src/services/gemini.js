import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("gemini");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * System instruction defining the bot's personality and capabilities.
 */
const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI thân thiện và hài hước trong nhóm chat Messenger của một nhóm bạn Việt Nam.

Quy tắc:
- Trả lời bằng tiếng Việt (trừ khi người dùng hỏi bằng tiếng Anh).
- Nói chuyện tự nhiên, thân thiện, như một người bạn trong nhóm.
- Khi được nhờ ghi nhớ điều gì đó, hãy xác nhận và ghi nhớ rõ ràng.
- Khi được hỏi lại về điều đã ghi nhớ, hãy nhắc lại chính xác.
- Trả lời ngắn gọn, súc tích (dưới 500 từ) trừ khi được yêu cầu giải thích chi tiết.
- Không sử dụng markdown phức tạp vì Messenger không hiển thị được.
- Khi đọc tin nhắn ghim (pinned messages), hãy tóm tắt nội dung rõ ràng.
- Nếu không biết câu trả lời, hãy thành thật nói không biết thay vì bịa.

Khả năng đặc biệt:
- Ghi nhớ các thông tin quan trọng mà nhóm nhờ nhớ (lịch hẹn, deadline, v.v.)
- Nhắc nhở khi được hỏi lại
- Đọc và tóm tắt tin nhắn ghim
- Trả lời câu hỏi dựa trên ngữ cảnh cuộc hội thoại`;

/**
 * Per-thread chat session store.
 * Each entry: { session: ChatSession, lastActive: timestamp, memories: string[] }
 * @type {Map<string, { session: any, lastActive: number, memories: string[] }>}
 */
const threadSessions = new Map();

/**
 * Memory expiry interval in ms.
 */
const MEMORY_EXPIRY_MS = config.memoryExpiryMinutes * 60 * 1000;

/**
 * Get or create a Gemini chat session for a thread.
 * @param {string} threadId
 * @param {string} modelName
 * @returns {any} ChatSession
 */
function getSession(threadId, modelName) {
  const existing = threadSessions.get(threadId);

  if (existing) {
    existing.lastActive = Date.now();
    return existing;
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const session = model.startChat({
    history: [],
  });

  const entry = {
    session,
    lastActive: Date.now(),
    memories: [],
    modelName,
  };

  threadSessions.set(threadId, entry);
  return entry;
}

/**
 * Send a message to Gemini and get a response.
 * Uses primary model, falls back to secondary on failure.
 *
 * @param {string} threadId - Facebook thread ID
 * @param {string} userMessage - The user's message text
 * @param {string} [senderName] - Name of the sender for context
 * @returns {Promise<string>} Gemini's response text
 */
export async function chat(threadId, userMessage, senderName = "User") {
  // Build context-enriched prompt
  const entry = getSession(threadId, config.geminiModel);
  let prompt = `[${senderName}]: ${userMessage}`;

  // Include memories if any
  if (entry.memories.length > 0) {
    prompt = `[Những điều cần nhớ: ${entry.memories.join("; ")}]\n\n${prompt}`;
  }

  try {
    const result = await entry.session.sendMessage(prompt);
    const responseText = result.response.text();

    // Check if the bot acknowledged a memory request
    detectAndStoreMemory(threadId, userMessage, responseText);

    log.info(
      "Gemini [%s] responded to thread %s (%d chars)",
      config.geminiModel,
      threadId,
      responseText.length
    );

    return responseText;
  } catch (err) {
    log.warn(
      "Primary model (%s) failed: %s. Trying fallback (%s)...",
      config.geminiModel,
      err.message,
      config.geminiFallbackModel
    );

    // Fallback: create a new session with the fallback model
    try {
      const fallbackModel = genAI.getGenerativeModel({
        model: config.geminiFallbackModel,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const fallbackChat = fallbackModel.startChat({ history: [] });
      const result = await fallbackChat.sendMessage(prompt);
      const responseText = result.response.text();

      detectAndStoreMemory(threadId, userMessage, responseText);

      log.info(
        "Gemini [%s FALLBACK] responded to thread %s (%d chars)",
        config.geminiFallbackModel,
        threadId,
        responseText.length
      );

      return responseText;
    } catch (fallbackErr) {
      log.error("Both models failed. Primary: %s | Fallback: %s", err.message, fallbackErr.message);
      throw new Error("Cả hai model AI đều gặp lỗi. Vui lòng thử lại sau.");
    }
  }
}

/**
 * Detect if the user asked the bot to remember something,
 * and store it in thread memory.
 * @param {string} threadId
 * @param {string} userMsg
 * @param {string} botResponse
 */
function detectAndStoreMemory(threadId, userMsg, botResponse) {
  const memoryKeywords = [
    "nhớ giùm", "nhớ dùm", "nhớ giúp", "ghi nhớ", "nhớ là", "nhớ rằng",
    "remember", "remind me", "note that", "đừng quên", "nhắc nhở",
    "lưu ý", "ghi lại", "nhớ cho"
  ];

  const lowerMsg = userMsg.toLowerCase();
  const isMemoryRequest = memoryKeywords.some((kw) => lowerMsg.includes(kw));

  if (isMemoryRequest) {
    const entry = threadSessions.get(threadId);
    if (entry) {
      // Store the user's message as a memory item
      const memoryItem = `${new Date().toLocaleDateString("vi-VN")}: ${userMsg}`;
      entry.memories.push(memoryItem);
      log.info("Stored memory for thread %s: %s", threadId, memoryItem);

      // Cap memories at 50 to prevent unbounded growth
      if (entry.memories.length > 50) {
        entry.memories.shift();
      }
    }
  }
}

/**
 * Cleanup expired sessions to prevent memory leaks.
 * Called periodically from the main loop.
 */
export function cleanupSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [threadId, entry] of threadSessions) {
    // Only expire sessions with NO memories
    // Sessions with memories persist longer (10x expiry)
    const expiry = entry.memories.length > 0 ? MEMORY_EXPIRY_MS * 10 : MEMORY_EXPIRY_MS;

    if (now - entry.lastActive > expiry) {
      threadSessions.delete(threadId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.debug("Cleaned up %d expired Gemini sessions", cleaned);
  }
}

/**
 * Get the number of active chat sessions (for monitoring).
 * @returns {number}
 */
export function getActiveSessionCount() {
  return threadSessions.size;
}
