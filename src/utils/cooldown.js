const config = require("../config.js");

/**
 * Per-user cooldown tracker to prevent spam and protect API quota.
 * Uses a Map of userID → last command timestamp.
 */
class CooldownManager {
  constructor(cooldownMs = config.cooldownSeconds * 1000) {
    /** @type {Map<string, number>} */
    this.cooldowns = new Map();
    this.cooldownMs = cooldownMs;
  }

  /**
   * Check if a user is on cooldown.
   * @param {string} userId
   * @returns {{ onCooldown: boolean, remainingSeconds: number }}
   */
  check(userId) {
    const now = Date.now();
    const lastUsed = this.cooldowns.get(userId);

    if (lastUsed && now - lastUsed < this.cooldownMs) {
      const remainingMs = this.cooldownMs - (now - lastUsed);
      return {
        onCooldown: true,
        remainingSeconds: Math.ceil(remainingMs / 1000),
      };
    }

    return { onCooldown: false, remainingSeconds: 0 };
  }

  /**
   * Record that a user just used a command.
   * @param {string} userId
   */
  set(userId) {
    this.cooldowns.set(userId, Date.now());
  }

  /**
   * Periodically clean up expired entries to prevent memory leaks.
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, timestamp] of this.cooldowns) {
      if (now - timestamp > this.cooldownMs * 10) {
        this.cooldowns.delete(userId);
      }
    }
  }
}

const cooldownManager = new CooldownManager();

// Cleanup every 10 minutes
setInterval(() => cooldownManager.cleanup(), 10 * 60 * 1000);

module.exports = cooldownManager;
