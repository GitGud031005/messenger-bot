const fs = require("fs");
const path = require("path");
const login = require("@dongdev/fca-unofficial");
const { createLogger } = require("../utils/logger.js");

const log = createLogger("facebook");
const APPSTATE_PATH = path.resolve("appstate.json");

/** @type {import("@dongdev/fca-unofficial").IFCAU_API | null} */
let api = null;

/** @type {string | null} */
let botUserId = null;

/**
 * Login to Facebook using saved appstate.json or APPSTATE_BASE64 env var.
 * Returns the FCA API instance.
 */
function loginFacebook() {
  return new Promise((resolve, reject) => {
    let appState;

    // Priority 1: Load from appstate.json file (local development)
    if (fs.existsSync(APPSTATE_PATH)) {
      try {
        appState = JSON.parse(fs.readFileSync(APPSTATE_PATH, "utf8"));
        log.info("Loaded appstate from file");
      } catch (err) {
        log.error("Failed to parse appstate.json: %s", err.message);
        reject(new Error("Invalid appstate.json"));
        return;
      }
    }
    // Priority 2: Load from APPSTATE_BASE64 env var (cloud deployment)
    else if (process.env.APPSTATE_BASE64) {
      try {
        const decoded = Buffer.from(process.env.APPSTATE_BASE64, "base64").toString("utf8");
        appState = JSON.parse(decoded);
        log.info("Loaded appstate from APPSTATE_BASE64 env var");
      } catch (err) {
        log.error("Failed to decode APPSTATE_BASE64: %s", err.message);
        reject(new Error("Invalid APPSTATE_BASE64"));
        return;
      }
    }
    // Priority 3: Load from APPSTATE_JSON env var (plain JSON, alternative)
    else if (process.env.APPSTATE_JSON) {
      try {
        appState = JSON.parse(process.env.APPSTATE_JSON);
        log.info("Loaded appstate from APPSTATE_JSON env var");
      } catch (err) {
        log.error("Failed to parse APPSTATE_JSON: %s", err.message);
        reject(new Error("Invalid APPSTATE_JSON"));
        return;
      }
    }
    // No appstate found anywhere
    else {
      log.error(
        "No appstate found! Provide one of:\n" +
        "  A) appstate.json file in project root (local dev)\n" +
        "  B) APPSTATE_BASE64 env var (cloud deploy — base64 encoded)\n" +
        "  C) APPSTATE_JSON env var (cloud deploy — raw JSON)\n\n" +
        "To get appstate:\n" +
        "  1. Install the 'C3C UFC Utility' browser extension\n" +
        "  2. Log into Facebook with your bot account\n" +
        "  3. Click the extension → Export\n" +
        "  4. Save as appstate.json or encode to base64"
      );
      reject(new Error("No appstate found"));
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
function getApi() {
  if (!api) {
    throw new Error("Facebook API not initialized. Call loginFacebook() first.");
  }
  return api;
}

/**
 * Get the bot's own Facebook user ID.
 * @returns {string}
 */
function getBotUserId() {
  return botUserId;
}

module.exports = { loginFacebook, getApi, getBotUserId };
