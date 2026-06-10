const fs = require("fs");
const path = require("path");
const { createLogger } = require("../utils/logger.js");

const log = createLogger("commands");

/**
 * Command registry.
 * @type {Map<string, { name: string, aliases: string[], description: string, execute: Function }>}
 */
const commands = new Map();

/**
 * Load all command files from the commands directory.
 * Each command file must export: { name, aliases, description, execute }
 */
async function loadCommands() {
  const commandFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(__dirname, file));

      if (!cmd?.name || !cmd?.execute) {
        log.warn("Skipping invalid command file: %s (missing name or execute)", file);
        continue;
      }

      // Register by name
      commands.set(cmd.name, cmd);

      // Register aliases
      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          commands.set(alias, cmd);
        }
      }

      log.info("Loaded command: /%s", cmd.name);
    } catch (err) {
      log.error("Failed to load command %s: %s", file, err.message);
    }
  }

  log.info("Total commands loaded: %d", getUniqueCommands().length);
}

/**
 * Get a command by name or alias.
 * @param {string} name
 * @returns {object|undefined}
 */
function getCommand(name) {
  return commands.get(name.toLowerCase());
}

/**
 * Get all unique commands (no duplicates from aliases).
 * @returns {object[]}
 */
function getUniqueCommands() {
  const unique = new Map();
  for (const cmd of commands.values()) {
    unique.set(cmd.name, cmd);
  }
  return Array.from(unique.values());
}

module.exports = { loadCommands, getCommand, getUniqueCommands };
