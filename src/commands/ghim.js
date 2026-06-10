const { addPinnedMessage } = require("../services/database.js");
const { formatReply, formatError } = require("../utils/formatter.js");
const { createLogger } = require("../utils/logger.js");

const log = createLogger("cmd:ghim");

module.exports = {
  name: "ghim",
  aliases: ["pin"],
  description: "Ghim tin nhắn làm ngữ cảnh cho AI — Trả lời tin nhắn và gõ /ghim, hoặc nhập: /ghim <nội dung>",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   * @param {string[]} args - Command arguments
   */
  async execute(api, event, args) {
    let content = "";
    let targetSenderId = "";
    let targetMessageId = null;

    // Check if this is a reply to another message
    if (event.type === "message_reply" && event.messageReply) {
      content = event.messageReply.body;
      targetSenderId = event.messageReply.senderID;
      targetMessageId = event.messageReply.messageID;
    } else {
      content = args.join(" ").trim();
      targetSenderId = event.senderID;
      targetMessageId = event.messageID;
    }

    if (!content) {
      api.sendMessage(
        "💬 Vui lòng trả lời (reply) một tin nhắn kèm lệnh /ghim, hoặc tự nhập nội dung sau lệnh.\nVí dụ: /ghim Lịch học nhóm là thứ 7",
        event.threadID,
        event.messageID
      );
      return;
    }

    // Try to get sender's name
    let senderName = "Thành viên";
    if (targetSenderId) {
      try {
        const userInfo = await new Promise((resolve, reject) => {
          api.getUserInfo([targetSenderId], (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        senderName = userInfo[targetSenderId]?.name || "Thành viên";
      } catch (err) {
        log.warn("Could not fetch user name for ID %s: %s", targetSenderId, err.message);
      }
    }

    const success = addPinnedMessage(event.threadID, targetMessageId, content, senderName);

    if (success) {
      const truncated = content.length > 60 ? `${content.slice(0, 60)}...` : content;
      api.sendMessage(
        `📌 Đã ghim tin nhắn của *${senderName}* vào bộ nhớ AI:\n"${truncated}"`,
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        formatError("Tin nhắn này đã được ghim từ trước rồi."),
        event.threadID,
        event.messageID
      );
    }
  },
};
