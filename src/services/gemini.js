const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config.js");
const { createLogger } = require("../utils/logger.js");
const { getPinnedMessages } = require("./database.js");

const log = createLogger("gemini");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * System instruction defining the bot's personality and capabilities.
 * Instructs the AI to strictly rely on pinned messages for group-specific context.
 */
const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI thân thiện và hài hước trong nhóm chat Messenger của một nhóm bạn Việt Nam.

Quy tắc:
- Trả lời bằng tiếng Việt (trừ khi người dùng hỏi bằng tiếng Anh).
- Nói chuyện tự nhiên, thân thiện, như một người bạn trong nhóm.
- Mọi câu trả lời của bạn liên quan đến các thông tin quan trọng, lịch trình, quy định, hoặc thông báo đặc biệt của nhóm phải dựa trên nội dung các tin nhắn đã ghim được cung cấp trong phần ngữ cảnh.
- Trả lời ngắn gọn, súc tích (dưới 500 từ) trừ khi được yêu cầu giải thích chi tiết.
- Không sử dụng markdown phức tạp vì Messenger không hiển thị được. Không dùng # hoặc dấu sao quá nhiều.
- Nếu người dùng hỏi về tin nhắn ghim hoặc hỏi các câu hỏi liên quan đến lịch trình/nội dung nhóm, hãy đọc phần ngữ cảnh ghim và trả lời chính xác dựa trên đó.
- Nếu thông tin không có trong tin nhắn ghim và bạn không biết, hãy nói rõ là thông tin này chưa được ghim hoặc chia sẻ với bạn.`;

/**
 * Per-thread chat session store.
 * Each entry: { session: ChatSession, lastActive: timestamp, modelName: string }
 * @type {Map<string, { session: any, lastActive: number, modelName: string }>}
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
async function chat(threadId, userMessage, senderName = "User") {
  // Build context-enriched prompt with pinned messages
  const entry = getSession(threadId, config.geminiModel);
  let prompt = `[${senderName}]: ${userMessage}`;

  const pins = getPinnedMessages(threadId);
  if (pins.length > 0) {
    const pinsCtx = pins
      .map((p, i) => `${i + 1}. [Người ghim: ${p.senderName}]: ${p.content}`)
      .join("\n");
    prompt = `[Ngữ cảnh từ tin nhắn ghim của nhóm:\n${pinsCtx}]\n\n${prompt}`;
  }

  try {
    const result = await entry.session.sendMessage(prompt);
    const responseText = result.response.text();

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
      let fallbackPrompt = `[${senderName}]: ${userMessage}`;
      if (pins.length > 0) {
        const pinsCtx = pins
          .map((p, i) => `${i + 1}. [Người ghim: ${p.senderName}]: ${p.content}`)
          .join("\n");
        fallbackPrompt = `[Ngữ cảnh từ tin nhắn ghim của nhóm:\n${pinsCtx}]\n\n${fallbackPrompt}`;
      }

      const result = await fallbackChat.sendMessage(fallbackPrompt);
      const responseText = result.response.text();

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
 * Cleanup expired sessions to prevent memory leaks.
 * Called periodically from the main loop.
 */
function cleanupSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [threadId, entry] of threadSessions) {
    if (now - entry.lastActive > MEMORY_EXPIRY_MS) {
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
function getActiveSessionCount() {
  return threadSessions.size;
}

module.exports = { chat, cleanupSessions, getActiveSessionCount };
