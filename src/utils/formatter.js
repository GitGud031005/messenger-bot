/**
 * Maximum characters Facebook Messenger allows in a single message.
 */
const MAX_MESSAGE_LENGTH = 20000;

/**
 * Truncate a message to fit within Messenger's character limit.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = MAX_MESSAGE_LENGTH) {
  if (!text || text.length <= maxLength) return text;
  const suffix = "\n\n…(tin nhắn đã bị cắt bớt)";
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Strip markdown syntax that Messenger can't render nicely.
 * Keeps basic formatting (bold, italic via unicode is fine).
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text) {
  if (!text) return text;
  return text
    // Remove headers (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers but keep text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Remove inline code backticks
    .replace(/`(.+?)`/g, "$1")
    // Remove link syntax [text](url) → text (url)
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    // Remove images ![alt](url) → [Image: alt]
    .replace(/!\[(.+?)\]\(.+?\)/g, "[Hình: $1]")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Format a consistent error message for the user.
 * @param {string} message
 * @returns {string}
 */
export function formatError(message) {
  return `⚠️ Lỗi: ${message}`;
}

/**
 * Format a bot reply with optional sender attribution.
 * @param {string} text
 * @returns {string}
 */
export function formatReply(text) {
  return truncate(stripMarkdown(text));
}
