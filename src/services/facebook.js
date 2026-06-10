import fs from "fs";
import path from "path";
import login from "@dongdev/fca-unofficial";
import { createLogger } from "../utils/logger.js";

const log = createLogger("facebook");
const APPSTATE_PATH = path.resolve("appstate.json");

/** @type {import("@dongdev/fca-unofficial").IFCAU_API | null} */
let api = null;

/** @type {string | null} */
let botUserId = null;

/**
 * Login to Facebook using saved appstate.json.
 * Returns the FCA API instance.
 */
export function loginFacebook() {
  return new Promise((resolve, reject) => {
    // Check appstate.json exists
    if (!fs.existsSync(APPSTATE_PATH)) {
      log.error(
        "appstate.json not found! Follow these steps:\n" +
        "  1. Install the 'C3C UFC Utility' browser extension\n" +
        "  2. Log into Facebook with your bot account\n" +
        "  3. Click the extension → Export\n" +
        "  4. Save the file as 'appstate.json' in the project root"
      );
      reject(new Error("appstate.json not found"));
      return;
    }

    let appState;
    try {
      appState = JSON.parse(fs.readFileSync(APPSTATE_PATH, "utf8"));
    } catch (err) {
      log.error("Failed to parse appstate.json: %s", err.message);
      reject(new Error("Invalid appstate.json"));
      return;
    }

    log.info("Logging into Facebook...");

    login({ appState }, (err, fbApi) => {
      if (err) {
        log.error("Facebook login failed: %s", err.error || err.message || err);

        // If the error suggests the session is expired
        if (err.error === "login-approval" || err.error === "Not logged in") {
          log.warn(
            "Session expired! Please re-export appstate.json using the C3C UFC Utility extension."
          );
        }

        reject(err);
        return;
      }

      api = fbApi;

      // Save refreshed appstate to keep session alive longer
      try {
        const newAppState = api.getAppState();
        fs.writeFileSync(APPSTATE_PATH, JSON.stringify(newAppState, null, 2));
        log.info("Updated appstate.json with refreshed session");
      } catch (writeErr) {
        log.warn("Could not update appstate.json: %s", writeErr.message);
      }

      // Get the bot's own user ID to filter self-messages
      botUserId = api.getCurrentUserID();
      log.info("✅ Logged in successfully! Bot user ID: %s", botUserId);

      // Set some sensible options
      api.setOptions({
        listenEvents: true,
        selfListen: false, // Don't process our own messages
        updatePresence: false, // Don't broadcast online status
        autoMarkRead: false, // Don't mark messages as read automatically
      });

      resolve(api);
    });
  });
}

/**
 * Get the FCA API instance. Throws if not logged in yet.
 * @returns {import("@dongdev/fca-unofficial").IFCAU_API}
 */
export function getApi() {
  if (!api) {
    throw new Error("Facebook API not initialized. Call loginFacebook() first.");
  }
  return api;
}

/**
 * Get the bot's own Facebook user ID.
 * @returns {string}
 */
export function getBotUserId() {
  return botUserId;
}
