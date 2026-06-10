const fs = require("fs");
const path = require("path");
const { createLogger } = require("../utils/logger.js");

const log = createLogger("database");
const DB_DIR = path.resolve("Fca_Database");
const DB_PATH = path.join(DB_DIR, "bot_data.json");

// Default database structure
let db = {
  threads: {}
};

/**
 * Ensure database directory exists.
 */
function ensureDirectoryExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    log.info("Created database directory: %s", DB_DIR);
  }
}

/**
 * Load database from JSON file.
 */
function loadDb() {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(DB_PATH)) {
      const rawData = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(rawData);
      log.info("Database loaded successfully from %s", DB_PATH);
    } else {
      saveDb();
      log.info("Database file not found. Created a new one.");
    }
  } catch (err) {
    log.error("Failed to load database: %s", err.message);
  }
}

/**
 * Save database to JSON file.
 */
function saveDb() {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    log.debug("Database saved to file");
  } catch (err) {
    log.error("Failed to save database: %s", err.message);
  }
}

// Load database immediately on module import
loadDb();

/**
 * Get the thread configuration and data object.
 * Creates it if it doesn't exist.
 */
function getThreadData(threadId) {
  if (!db.threads) {
    db.threads = {};
  }
  if (!db.threads[threadId]) {
    db.threads[threadId] = {
      pinnedMessages: []
    };
  }
  return db.threads[threadId];
}

/**
 * Get all pinned messages for a thread.
 * @param {string} threadId
 * @returns {Array} List of pinned messages
 */
function getPinnedMessages(threadId) {
  const data = getThreadData(threadId);
  return data.pinnedMessages || [];
}

/**
 * Add a pinned message to a thread.
 * @param {string} threadId
 * @param {string} messageId
 * @param {string} content
 * @param {string} senderName
 */
function addPinnedMessage(threadId, messageId, content, senderName) {
  const data = getThreadData(threadId);
  if (!data.pinnedMessages) {
    data.pinnedMessages = [];
  }

  // Avoid duplicates
  const exists = data.pinnedMessages.some((m) => m.id === messageId && messageId !== null);
  if (exists) {
    return false;
  }

  data.pinnedMessages.push({
    id: messageId,
    content: content.trim(),
    senderName: senderName || "User",
    timestamp: Date.now()
  });

  saveDb();
  log.info("Pinned message added to thread %s: %s", threadId, content.slice(0, 50));
  return true;
}

/**
 * Remove a pinned message by its 0-based index.
 * @param {string} threadId
 * @param {number} index
 * @returns {boolean} True if successfully removed
 */
function removePinnedMessage(threadId, index) {
  const data = getThreadData(threadId);
  if (!data.pinnedMessages || index < 0 || index >= data.pinnedMessages.length) {
    return false;
  }

  const removed = data.pinnedMessages.splice(index, 1);
  saveDb();
  log.info("Unpinned message from thread %s at index %d: %s", threadId, index, removed[0]?.content.slice(0, 50));
  return true;
}

module.exports = {
  getPinnedMessages,
  addPinnedMessage,
  removePinnedMessage
};
