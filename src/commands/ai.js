import { chat } from "../services/gemini.js";
import { formatReply, formatError } from "../utils/formatter.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("cmd:ai");

export default {
  name: "ai",
  aliases: ["hỏi", "ask"],
  description: "Hỏi AI bất cứ điều gì — Ví dụ: /ai hôm nay trời thế nào?",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   * @param {string[]} args - Command arguments
   */
  async execute(api, event, args) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      api.sendMessage(
        "💬 Bạn muốn hỏi gì? Hãy nhập nội dung sau lệnh.\nVí dụ: /ai kể một câu chuyện cười",
        event.threadID,
        event.messageID
      );
      return;
    }

    // Show typing indicator
    api.sendTypingIndicator(event.threadID, () => {});

    try {
      // Get sender name for context
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
        // Ignore — use default name
      }

      const response = await chat(event.threadID, prompt, senderName);
      const formatted = formatReply(response);

      api.sendMessage(formatted, event.threadID, event.messageID);

      log.info("Replied to %s in thread %s", senderName, event.threadID);
    } catch (err) {
      log.error("AI command error: %s", err.message);
      api.sendMessage(
        formatError("Không thể xử lý câu hỏi. Vui lòng thử lại sau."),
        event.threadID,
        event.messageID
      );
    }
  },
};
