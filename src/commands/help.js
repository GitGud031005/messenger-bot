import { getUniqueCommands } from "./index.js";

export default {
  name: "help",
  aliases: ["menu", "lệnh"],
  description: "Xem danh sách các lệnh có sẵn",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   */
  async execute(api, event) {
    const commands = getUniqueCommands();

    const lines = [
      "📋 DANH SÁCH LỆNH",
      "━━━━━━━━━━━━━━━━━━━",
      "",
    ];

    for (const cmd of commands) {
      const aliases = cmd.aliases?.length
        ? ` (${cmd.aliases.map((a) => `/${a}`).join(", ")})`
        : "";
      lines.push(`➤ /${cmd.name}${aliases}`);
      lines.push(`   ${cmd.description}`);
      lines.push("");
    }

    lines.push("━━━━━━━━━━━━━━━━━━━");
    lines.push("💡 Hoặc tag bot và hỏi trực tiếp!");

    api.sendMessage(lines.join("\n"), event.threadID, event.messageID);
  },
};
