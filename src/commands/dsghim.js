const { getPinnedMessages } = require("../services/database.js");

module.exports = {
  name: "dsghim",
  aliases: ["pinned", "listpin"],
  description: "Xem danh sách các tin nhắn đã ghim trong bộ nhớ AI",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   */
  async execute(api, event) {
    const pins = getPinnedMessages(event.threadID);

    if (pins.length === 0) {
      api.sendMessage(
        "📭 Hiện tại chưa có tin nhắn ghim nào trong bộ nhớ AI của nhóm.\n👉 Trả lời một tin nhắn bất kỳ và gõ /ghim để thêm.",
        event.threadID,
        event.messageID
      );
      return;
    }

    const lines = [
      "📋 TIN NHẮN GHIM TRONG BỘ NHỚ AI",
      "━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
    ];

    pins.forEach((pin, index) => {
      const dateStr = new Date(pin.timestamp).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      lines.push(`${index + 1}. [${pin.senderName} - ${dateStr}]:`);
      lines.push(`   ${pin.content}`);
      lines.push("");
    });

    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("💡 Gõ /unghim <số thứ tự> để gỡ ghim.");

    api.sendMessage(lines.join("\n"), event.threadID, event.messageID);
  },
};
