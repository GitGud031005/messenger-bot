import { getActiveSessionCount } from "../services/gemini.js";

export default {
  name: "ping",
  aliases: ["p"],
  description: "Kiểm tra bot có đang hoạt động không",

  /**
   * @param {object} api - FCA API instance
   * @param {object} event - Message event
   */
  async execute(api, event) {
    const start = Date.now();
    const sessions = getActiveSessionCount();
    const uptime = formatUptime(process.uptime());

    // Small delay to measure responsiveness
    const latency = Date.now() - start;

    const msg = [
      `🏓 Pong!`,
      `⚡ Độ trễ: ${latency}ms`,
      `⏱️ Uptime: ${uptime}`,
      `💬 Phiên chat đang hoạt động: ${sessions}`,
    ].join("\n");

    api.sendMessage(msg, event.threadID, event.messageID);
  },
};

/**
 * Format seconds into a human-readable uptime string.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d} ngày`);
  if (h > 0) parts.push(`${h} giờ`);
  if (m > 0) parts.push(`${m} phút`);
  parts.push(`${s} giây`);

  return parts.join(" ");
}
