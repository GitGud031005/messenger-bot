import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createLogger } from "../utils/logger.js";

const log = createLogger("commands");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Command registry.
 * @type {Map<string, { name: string, aliases: string[], description: string, execute: Function }>}
 */
const commands = new Map();

/**
 * Load all command files from the commands directory.
 * Each command file must export: { name, aliases, description, execute }
 */
export async function loadCommands() {
  const commandFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of commandFiles) {
    try {
      const filePath = pathToFileURL(path.join(__dirname, file)).href;
      const command = await import(filePath);
      const cmd = command.default;

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
export function getCommand(name) {
  return commands.get(name.toLowerCase());
}

/**
 * Get all unique commands (no duplicates from aliases).
 * @returns {object[]}
 */
export function getUniqueCommands() {
  const unique = new Map();
  for (const cmd of commands.values()) {
    unique.set(cmd.name, cmd);
  }
  return Array.from(unique.values());
}
