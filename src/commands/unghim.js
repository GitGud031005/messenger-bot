const { removePinnedMessage, getPinnedMessages } = require("../services/database.js");
const { formatError } = require("../utils/formatter.js");

module.exports = {
  name: "unghim",
  aliases: ["unpin"],
  description: "Gỡ ghim một tin nhắn khỏi bộ nhớ AI theo số thứ tự",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   * @param {string[]} args - Command arguments
   */
  async execute(api, event, args) {
    if (args.length === 0) {
      api.sendMessage(
        "⚠️ Vui lòng nhập số thứ tự tin nhắn muốn gỡ ghim.\nVí dụ: /unghim 1\n👉 Gõ /dsghim để xem danh sách.",
        event.threadID,
        event.messageID
      );
      return;
    }

    const index = parseInt(args[0], 10) - 1;

    if (isNaN(index)) {
      api.sendMessage(
        formatError("Vui lòng nhập một số hợp lệ.\nVí dụ: /unghim 1"),
        event.threadID,
        event.messageID
      );
      return;
    }

    const pins = getPinnedMessages(event.threadID);
    if (index < 0 || index >= pins.length) {
      api.sendMessage(
        formatError("Số thứ tự không tồn tại. Gõ /dsghim để xem lại danh sách."),
        event.threadID,
        event.messageID
      );
      return;
    }

    const targetContent = pins[index].content;
    const truncated = targetContent.length > 40 ? `${targetContent.slice(0, 40)}...` : targetContent;

    const success = removePinnedMessage(event.threadID, index);

    if (success) {
      api.sendMessage(
        `✅ Đã gỡ ghim tin nhắn thành công:\n"${truncated}"`,
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        formatError("Có lỗi xảy ra khi gỡ ghim tin nhắn."),
        event.threadID,
        event.messageID
      );
    }
  },
};
