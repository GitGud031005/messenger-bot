const dotenv = require("dotenv");
dotenv.config();

/**
 * Validate that a required env var exists, throw if missing.
 */
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}. Check your .env file.`);
  }
  return value;
}

/**
 * Read an optional env var with a default value.
 */
function optional(key, fallback) {
  return process.env[key] || fallback;
}

const config = Object.freeze({
  // Gemini
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: optional("GEMINI_MODEL", "gemini-3.1-flash-lite"),
  geminiFallbackModel: optional("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite"),

  // Bot
  botName: optional("BOT_NAME", "GeminiBot"),
  cooldownSeconds: parseInt(optional("COOLDOWN_SECONDS", "5"), 10),
  memoryExpiryMinutes: parseInt(optional("MEMORY_EXPIRY_MINUTES", "30"), 10),

  // Server (for cloud keep-alive)
  port: parseInt(optional("PORT", "3000"), 10),

  // Logging
  logLevel: optional("LOG_LEVEL", "info"),
});

module.exports = config;
