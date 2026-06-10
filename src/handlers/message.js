const { getCommand } = require("../commands/index.js");
const { chat } = require("../services/gemini.js");
const { getBotUserId } = require("../services/facebook.js");
const cooldownManager = require("../utils/cooldown.js");
const { formatReply, formatError } = require("../utils/formatter.js");
const { createLogger } = require("../utils/logger.js");
const config = require("../config.js");

const log = createLogger("handler:message");

/**
 * Handle incoming message events.
 * Supports two trigger modes:
 *   1. Prefix command: /ai <prompt>, /help, /ping, etc.
 *   2. Mention trigger: @BotName <prompt> (tags the bot user in a message)
 *
 * @param {object} api - FCA API instance
 * @param {object} event - Message event from FCA
 */
async function handleMessage(api, event) {
  const { body, senderID, threadID, messageID, mentions } = event;

  // Ignore if no message body
  if (!body || typeof body !== "string") return;

  // Ignore messages from the bot itself
  if (senderID === getBotUserId()) return;

  const trimmedBody = body.trim();

  // ─── Mode 1: Prefix command (e.g., /ai, /help, /ping) ───
  if (trimmedBody.startsWith("/")) {
    await handlePrefixCommand(api, event, trimmedBody);
    return;
  }

  // ─── Mode 2: Mention trigger (@BotName ...) ───
  const botUserId = getBotUserId();
  if (mentions && botUserId && mentions[botUserId]) {
    await handleMentionTrigger(api, event, botUserId);
    return;
  }
}

/**
 * Handle a /prefix command.
 */
async function handlePrefixCommand(api, event, body) {
  const args = body.slice(1).split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = getCommand(commandName);
  if (!command) {
    // Unknown command — don't respond (avoid noise)
    return;
  }

  // Check cooldown
  const { onCooldown, remainingSeconds } = cooldownManager.check(event.senderID);
  if (onCooldown) {
    api.sendMessage(
      `⏳ Vui lòng chờ ${remainingSeconds} giây trước khi dùng lệnh tiếp.`,
      event.threadID,
      event.messageID
    );
    return;
  }

  // Set cooldown
  cooldownManager.set(event.senderID);

  try {
    log.info(
      "Command /%s from %s in thread %s",
      commandName,
      event.senderID,
      event.threadID
    );
    await command.execute(api, event, args);
  } catch (err) {
    log.error("Command /%s failed: %s", commandName, err.message);
    api.sendMessage(
      formatError("Đã xảy ra lỗi khi xử lý lệnh."),
      event.threadID,
      event.messageID
    );
  }
}

/**
 * Handle a mention-triggered message (@BotName ...).
 * Strips the mention tag and sends the remaining text to Gemini.
 */
async function handleMentionTrigger(api, event, botUserId) {
  // Check cooldown
  const { onCooldown, remainingSeconds } = cooldownManager.check(event.senderID);
  if (onCooldown) {
    api.sendMessage(
      `⏳ Vui lòng chờ ${remainingSeconds} giây trước khi hỏi tiếp.`,
      event.threadID,
      event.messageID
    );
    return;
  }

  cooldownManager.set(event.senderID);

  // Remove the @mention tag from the message to get the actual prompt
  let prompt = event.body;
  const mentionTag = event.mentions[botUserId];

  if (mentionTag) {
    // The mention tag is the display text (e.g., "@Bot Name")
    prompt = prompt.replace(mentionTag, "").trim();
  }

  if (!prompt) {
    api.sendMessage(
      "💬 Bạn muốn hỏi gì? Hãy nhắn thêm nội dung sau khi tag mình nhé!",
      event.threadID,
      event.messageID
    );
    return;
  }

  // Show typing indicator
  api.sendTypingIndicator(event.threadID, () => {});

  try {
    // Get sender name
    let senderName = "User";
    try {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo([event.senderID], (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      senderName = userInfo[event.senderID]?.name || "User";
    } catch {
      // Ignore — use default
    }

    log.info("Mention trigger from %s in thread %s: %s", senderName, event.threadID, prompt.slice(0, 80));

    const response = await chat(event.threadID, prompt, senderName);
    const formatted = formatReply(response);

    api.sendMessage(formatted, event.threadID, event.messageID);
  } catch (err) {
    log.error("Mention handler error: %s", err.message);
    api.sendMessage(
      formatError("Không thể xử lý tin nhắn. Vui lòng thử lại sau."),
      event.threadID,
      event.messageID
    );
  }
}

module.exports = { handleMessage };
